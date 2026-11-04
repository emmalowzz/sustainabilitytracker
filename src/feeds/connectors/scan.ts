/**
 * Website scanner for regulators that publish no usable RSS feed.
 *
 * Reads a regulator's news/press listing page and extracts article links that match the site's URL pattern,
 * with a date taken from the link's surroundings (or its URL) where one can be found. Dependency-free:
 * it works on the raw HTML, so pages that build their listing with JavaScript yield no links — the
 * source status then reports "0 links matched" so the pattern or page can be revisited.
 *
 * Etiquette: one listing page per regulator per month, robots.txt is honoured, and requests carry the
 * tracker's User-Agent with a contact address.
 */
import type { FetchContext, RawItem } from "../types";
import { stripHtml, toISODate } from "../classify";

export interface ScanConfig {
  /** Listing page to read (newest items first). */
  url: string;
  /** Article links must match this (tested against the path + query of the resolved URL). */
  include: RegExp;
  /** Optional links to drop even if they match `include` (e.g. pagination, category pages). */
  exclude?: RegExp;
  /** Maximum items to keep, in page order. Default 30. */
  max?: number;
}

export const SCAN_USER_AGENT_TOKEN = "SustainabilityTracker";

// ── robots.txt ────────────────────────────────────────────────────────────────

/** Disallow rules that apply to us (our own group if present, else the `*` group). */
export function robotsDisallows(robots: string, agentToken = SCAN_USER_AGENT_TOKEN): string[] {
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, keyRaw, value] = m;
    const key = keyRaw.toLowerCase();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], disallow: [], allow: [] }));
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!cur) continue;
      if (key === "disallow" && value) cur.disallow.push(value);
      if (key === "allow" && value) cur.allow.push(value);
    }
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== "*" && agentToken.toLowerCase().includes(a)));
  const star = groups.find((g) => g.agents.includes("*"));
  const g = mine ?? star;
  // Longest-match semantics are approximated by dropping Disallow rules that an Allow rule overrides exactly.
  return g ? g.disallow.filter((d) => !g.allow.includes(d)) : [];
}

export function isPathAllowed(path: string, disallows: string[]): boolean {
  return !disallows.some((rule) => {
    const anchored = rule.endsWith("$");
    const pattern = "^" + rule.replace(/\$$/, "").split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : "");
    return new RegExp(pattern).test(path);
  });
}

// ── Dates near a link ─────────────────────────────────────────────────────────

const MONTHS = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
const DATE_PATTERNS: RegExp[] = [
  /\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/, // 2026-09-22, 2026.09.22, 2026/9/22
  new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})\\.?,?\\s+(20\\d{2})\\b`, "i"), // 22 September 2026
  new RegExp(`\\b(${MONTHS})\\.?\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`, "i"), // Sep 22, 2026
  /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/, // 22/09/2026 (day first: used by most non-US regulators in scope)
  /(20\d{2})年(\d{1,2})月(\d{1,2})日/, // 2026年9月22日
];
const MONTH_INDEX = (m: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m.slice(0, 3).toLowerCase()) + 1;
const pad = (n: number) => String(n).padStart(2, "0");

export function findDate(text: string): string | undefined {
  for (const [i, re] of DATE_PATTERNS.entries()) {
    const m = re.exec(text);
    if (!m) continue;
    let y: number, mo: number, d: number;
    if (i === 0 || i === 4) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    else if (i === 1) [d, mo, y] = [Number(m[1]), MONTH_INDEX(m[2]), Number(m[3])];
    else if (i === 2) [mo, d, y] = [MONTH_INDEX(m[1]), Number(m[2]), Number(m[3])];
    else [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return undefined;
}

// ── Listing extraction ────────────────────────────────────────────────────────

const ANCHOR = /<a\b([^>]*?)href\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;
const attr = (attrs: string, name: string) => new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(attrs)?.[2];

export function extractListing(html: string, pageUrl: string, cfg: Pick<ScanConfig, "include" | "exclude" | "max">): RawItem[] {
  const base = new URL(pageUrl);
  const anchors: { index: number; end: number; href: string; text: string }[] = [];
  for (const m of html.matchAll(ANCHOR)) {
    const attrs = `${m[1]} ${m[4]}`;
    const text = stripHtml(m[5]) || attr(attrs, "title") || attr(attrs, "aria-label") || "";
    anchors.push({ index: m.index!, end: m.index! + m[0].length, href: m[3], text });
  }

  const out: RawItem[] = [];
  const seen = new Set<string>();
  anchors.forEach((a, k) => {
    let url: URL;
    try {
      url = new URL(a.href.replace(/&amp;/g, "&"), base);
    } catch {
      return;
    }
    if (url.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) return;
    const path = url.pathname + url.search;
    if (!cfg.include.test(path) || cfg.exclude?.test(path)) return;
    const key = url.origin + url.pathname;
    if (seen.has(key)) return;
    const title = a.text.replace(/\s+/g, " ").trim();
    if (title.length < 12 || /^(read more|more|details|view|download|pdf)$/i.test(title)) return;
    seen.add(key);

    // Look for a date between the neighbouring links (listing rows usually put the date beside the title).
    const from = Math.max(k > 0 ? anchors[k - 1].end : 0, a.index - 400);
    const to = Math.min(k + 1 < anchors.length ? anchors[k + 1].index : html.length, a.end + 400);
    const around = stripHtml(html.slice(from, to).replace(/<[^>]*>/g, " ")) ?? "";
    const date = findDate(around) ?? findDate(title) ?? toISODate(/\/(20\d{2})(\d{2})(\d{2})\b/.exec(url.pathname)?.slice(1).join("-"));

    out.push({ externalId: key, title, url: url.toString(), date });
  });
  return out.slice(0, cfg.max ?? 30);
}

/** Fetch robots.txt and the listing page (both on the monthly cache), then extract items. */
export async function scanSite(ctx: FetchContext, cfg: ScanConfig): Promise<RawItem[]> {
  const page = new URL(cfg.url);
  let disallows: string[] = [];
  try {
    disallows = robotsDisallows(await ctx.fetchFeed(`${page.origin}/robots.txt`));
  } catch {
    // No robots.txt (or unreachable): standard practice is to treat the site as allowing access.
  }
  if (!isPathAllowed(page.pathname + page.search, disallows)) {
    throw new Error("Listing page is disallowed by the site's robots.txt — monitor manually");
  }
  const html = await ctx.fetchFeed(cfg.url);
  const items = extractListing(html, cfg.url, cfg);
  if (!items.length) throw new Error("0 links matched — the page may load its list with JavaScript, or its layout changed");
  return items;
}
