import { DEVELOPMENTS, PROFILES } from "@/data";
import type { FeedItem } from "@/feeds/types";
import type { Development } from "./types";
import { JURISDICTIONS, PRIORITY_CODES, TOPICS, jurisdiction, topic, type Impact, type JurisdictionCode, type TopicId } from "./taxonomy";
import { dateKey, formatDate, isUpcoming, timelineItems, type TimelineItem } from "./query";

export const SECTIONS = [
  { id: "summary", label: "Executive summary" },
  { id: "heatmap", label: "Regulatory heatmap" },
  { id: "deadlines", label: "Upcoming deadlines" },
  { id: "detail", label: "Detailed developments" },
  { id: "updates", label: "Recent regulator updates" },
  { id: "sources", label: "Sources appendix" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];

export const CLASSIFICATIONS = ["Internal", "Confidential", "Restricted"] as const;

export interface BriefConfig {
  title: string;
  audience: string;
  author: string;
  cls: (typeof CLASSIFICATIONS)[number];
  /** Include developments whose latest milestone is on/after this date (YYYY-MM-DD). */
  since: string;
  /** Months ahead for the deadlines section (and for pulling in older items with upcoming deadlines). */
  horizon: Horizon;
  /** End date (YYYY-MM-DD) when `horizon` is "custom". */
  until?: string;
  j: JurisdictionCode[];
  t: TopicId[];
  min: Impact;
  groupBy: "market" | "topic";
  sections: SectionId[];
  /** Development ids manually removed from the pack. */
  x: string[];
  notes: string;
}

/** Deadline window: a number of months ahead, every future deadline ("all"), or up to a chosen date ("custom"). */
export type Horizon = number | "all" | "custom";
export const HORIZON_MONTHS = [3, 6, 12, 18, 24] as const;

/** Last date included in the deadline window (YYYY-MM-DD). */
export function horizonEnd(c: Pick<BriefConfig, "horizon" | "until">, today: string): string {
  if (c.horizon === "all") return "9999-12-31";
  if (c.horizon === "custom") return c.until ?? addMonths(today, 36);
  return addMonths(today, c.horizon);
}

/** Verb phrase for the summary, e.g. "fall within the next 12 months", "are scheduled (no end date)", "fall between now and 31 Dec 2031". */
export function horizonPhrase(c: Pick<BriefConfig, "horizon" | "until">, today: string): string {
  if (c.horizon === "all") return "are scheduled ahead (all dates, no end date)";
  if (c.horizon === "custom") return `fall between now and ${formatDate(horizonEnd(c, today))}`;
  return `fall within the next ${c.horizon} months`;
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function defaultConfig(today: string): BriefConfig {
  return {
    title: "Sustainability Regulatory Briefing",
    audience: "Investment & Compliance Committee",
    author: "Compliance — ESG Regulatory",
    cls: "Internal",
    since: addMonths(today, -12),
    horizon: 12,
    j: [...PRIORITY_CODES],
    t: TOPICS.map((t) => t.id),
    min: "Low",
    groupBy: "market",
    sections: SECTIONS.map((s) => s.id),
    x: [],
    notes: "",
  };
}

// ── URL (de)serialisation: keys mirror the explorer (j, t) so filtered views can be turned into packs.
export function configFromParams(p: URLSearchParams, today: string): BriefConfig {
  const d = defaultConfig(today);
  const list = (k: string) => p.get(k)?.split(",").filter(Boolean);
  const impactFromExplorer = list("i") as Impact[] | undefined; // explorer's impact filter → lowest selected
  const lowest = impactFromExplorer?.includes("Low") ? "Low" : impactFromExplorer?.includes("Medium") ? "Medium" : impactFromExplorer?.length ? "High" : undefined;
  return {
    title: p.get("title") ?? d.title,
    audience: p.get("aud") ?? d.audience,
    author: p.get("by") ?? d.author,
    cls: (p.get("cls") as BriefConfig["cls"]) ?? d.cls,
    since: p.get("since") ?? d.since,
    ...horizonFromParam(p.get("h"), d.horizon),
    j: (list("j") as JurisdictionCode[]) ?? d.j,
    t: (list("t") as TopicId[]) ?? d.t,
    min: (p.get("min") as Impact) ?? lowest ?? d.min,
    groupBy: p.get("g") === "topic" ? "topic" : "market",
    sections: (list("sec") as SectionId[]) ?? d.sections,
    x: list("x") ?? [],
    notes: p.get("notes") ?? "",
  };
}

function horizonFromParam(h: string | null, fallback: Horizon): Pick<BriefConfig, "horizon" | "until"> {
  if (h === "all") return { horizon: "all" };
  if (h && /^\d{4}-\d{2}-\d{2}$/.test(h)) return { horizon: "custom", until: h };
  return { horizon: Number(h) || fallback };
}

export function configToParams(c: BriefConfig, today: string): string {
  const d = defaultConfig(today);
  const p = new URLSearchParams();
  if (c.title !== d.title) p.set("title", c.title);
  if (c.audience !== d.audience) p.set("aud", c.audience);
  if (c.author !== d.author) p.set("by", c.author);
  if (c.cls !== d.cls) p.set("cls", c.cls);
  if (c.since !== d.since) p.set("since", c.since);
  if (c.horizon === "custom") p.set("h", horizonEnd(c, today));
  else if (c.horizon !== d.horizon) p.set("h", String(c.horizon));
  if (c.j.join() !== d.j.join()) p.set("j", c.j.join(","));
  if (c.t.join() !== d.t.join()) p.set("t", c.t.join(","));
  if (c.min !== d.min) p.set("min", c.min);
  if (c.groupBy !== d.groupBy) p.set("g", c.groupBy);
  if (c.sections.join() !== d.sections.join()) p.set("sec", c.sections.join(","));
  if (c.x.length) p.set("x", c.x.join(","));
  if (c.notes) p.set("notes", c.notes);
  const s = p.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

const IMPACT_RANK: Record<Impact, number> = { High: 0, Medium: 1, Low: 2 };

/** Developments matching the scope (before manual exclusions). */
export function candidates(c: BriefConfig, today: string): Development[] {
  const end = horizonEnd(c, today);
  return DEVELOPMENTS.filter(
    (d) =>
      c.j.includes(d.jurisdiction) &&
      d.topics.some((t) => c.t.includes(t)) &&
      IMPACT_RANK[d.impact] <= IMPACT_RANK[c.min] &&
      (dateKey(d.date) >= c.since || (d.keyDates ?? []).some((k) => isUpcoming(k.date, today) && dateKey(k.date) <= end)),
  ).sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || dateKey(b.date).localeCompare(dateKey(a.date)));
}

export interface Pack {
  config: BriefConfig;
  today: string;
  items: Development[];
  deadlines: TimelineItem[];
  markets: (typeof JURISDICTIONS)[number][];
  topics: (typeof TOPICS)[number][];
  stats: { total: number; high: number; live: number; pipeline: number; markets: number; deadlines: number };
  summary: string[];
  priority: Development[];
  groups: { key: string; title: string; intro?: string; items: Development[] }[];
}

export function buildPack(c: BriefConfig, today: string): Pack {
  const items = candidates(c, today).filter((d) => !c.x.includes(d.id));
  const end = horizonEnd(c, today);
  const deadlines = timelineItems(items).filter((k) => isUpcoming(k.date, today) && dateKey(k.date) <= end);
  const markets = JURISDICTIONS.filter((j) => c.j.includes(j.code));
  const topics = TOPICS.filter((t) => c.t.includes(t.id));
  const marketsWithItems = new Set(items.map((d) => d.jurisdiction));

  const stats = {
    total: items.length,
    high: items.filter((d) => d.impact === "High").length,
    live: items.filter((d) => d.status === "In force" || d.status === "Phasing in").length,
    pipeline: items.filter((d) => d.status === "Proposed" || d.status === "Consultation").length,
    markets: marketsWithItems.size,
    deadlines: deadlines.length,
  };

  // Auto-generated executive summary — deterministic, drawn only from the curated data.
  const summary: string[] = [];
  if (items.length) {
    summary.push(
      `${stats.total} developments across ${stats.markets} market${stats.markets === 1 ? "" : "s"} are in scope, of which ${stats.high} are rated high impact for the firm.`,
    );
    summary.push(
      `${stats.live} ${stats.live === 1 ? "is" : "are"} in force or phasing in; ${stats.pipeline} ${stats.pipeline === 1 ? "is a proposal or open consultation" : "are proposals or open consultations"} to monitor.`,
    );
    if (deadlines.length) {
      const first = deadlines[0];
      summary.push(
        `${deadlines.length} key date${deadlines.length === 1 ? "" : "s"} ${horizonPhrase(c, today)} — the first is “${first.label}” (${jurisdiction(first.dev.jurisdiction)?.name}, ${formatDate(first.date)}).`,
      );
    }
    for (const t of topics) {
      const inTopic = items.filter((d) => d.topics.includes(t.id));
      if (!inTopic.length) continue;
      const lead = inTopic[0];
      const where = [...new Set(inTopic.map((d) => d.jurisdiction))].join(", ");
      summary.push(`${t.short}: ${inTopic.length} item${inTopic.length === 1 ? "" : "s"} (${where}) — most significant: ${lead.title} (${lead.jurisdiction}).`);
    }
  }

  const priority = items.filter((d) => d.impact === "High").slice(0, 6);

  const groups =
    c.groupBy === "market"
      ? markets
          .map((j) => ({
            key: j.code,
            title: `${j.flag} ${j.name}`,
            intro: PROFILES.find((p) => p.code === j.code)?.headline,
            items: items.filter((d) => d.jurisdiction === j.code),
          }))
          .filter((g) => g.items.length)
      : topics
          .map((t) => ({
            key: t.id,
            title: t.name,
            intro: t.description,
            // each development appears once, under its primary in-scope topic
            items: items.filter((d) => d.topics.find((x) => c.t.includes(x)) === t.id),
          }))
          .filter((g) => g.items.length);

  return { config: c, today, items, deadlines, markets, topics, stats, summary, priority, groups };
}

export function postureFor(code: JurisdictionCode, t: TopicId) {
  return PROFILES.find((p) => p.code === code)?.posture[t];
}

/** Regulator feed items relevant to the pack's markets and period. */
export function updatesFor(items: FeedItem[], c: BriefConfig): FeedItem[] {
  return items.filter((i) => c.j.includes(i.jurisdiction) && (!i.date || i.date >= c.since) && (!i.topics.length || i.topics.some((t) => c.t.includes(t))));
}

export function packToMarkdown(p: Pack, updates: FeedItem[] = []): string {
  const c = p.config;
  const L: string[] = [];
  L.push(`# ${c.title}`, "", `**Prepared for:** ${c.audience}  `, `**Prepared by:** ${c.author}  `, `**Date:** ${formatDate(p.today)}  `, `**Classification:** ${c.cls}`, "");
  L.push(`Scope: ${p.markets.map((m) => m.name).join(", ")} · ${p.topics.map((t) => t.short).join(", ")} · developments since ${formatDate(c.since)}`, "");
  const has = (s: SectionId) => c.sections.includes(s);
  if (has("summary")) {
    L.push("## Executive summary", "");
    if (c.notes) L.push(...c.notes.split("\n").map((l) => `> ${l}`), "");
    p.summary.forEach((s) => L.push(`- ${s}`));
    if (p.priority.length) {
      L.push("", "### Priority items", "");
      p.priority.forEach((d) => L.push(`- **${d.title}** (${d.jurisdiction}) — ${d.implications ?? d.summary}`));
    }
    L.push("");
  }
  if (has("deadlines") && p.deadlines.length) {
    L.push("## Upcoming deadlines", "", "| Date | Market | Milestone | Development |", "| --- | --- | --- | --- |");
    p.deadlines.forEach((k) => L.push(`| ${formatDate(k.date)} | ${k.dev.jurisdiction} | ${k.label} | ${k.dev.title} |`));
    L.push("");
  }
  if (has("detail")) {
    L.push("## Detailed developments", "");
    for (const g of p.groups) {
      L.push(`### ${g.title}`, "");
      if (g.intro) L.push(`_${g.intro}_`, "");
      for (const d of g.items) {
        L.push(`#### ${d.title}`, `${jurisdiction(d.jurisdiction)?.name} · ${d.authority} · ${d.status} · ${d.impact} impact · ${formatDate(d.date)}`, "", d.summary);
        if (d.implications) L.push("", `**What it means for us:** ${d.implications}`);
        if (d.keyDates?.length) L.push("", ...d.keyDates.map((k) => `- ${formatDate(k.date)} — ${k.label}`));
        L.push("", `Sources: ${d.sources.map((s) => `[${s.label}](${s.url})`).join(", ")}`, "");
      }
    }
  }
  if (has("updates") && updates.length) {
    L.push("## Recent regulator updates", "", "_Unreviewed items from regulator feeds, filtered for sustainability relevance._", "");
    updates.forEach((u) => L.push(`- ${u.date ? formatDate(u.date) : ""} — **${u.jurisdiction}** · ${u.sourceName}: [${u.title}](${u.url})`));
    L.push("");
  }
  L.push("---", `_Monitoring aid compiled from the Sustainability Tracker; not legal advice. Verify against primary sources._`);
  return L.join("\n");
}

export function topicName(id: string) {
  return topic(id)?.short ?? id;
}
