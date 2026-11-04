import type { FeedItem, FetchContext, SourceKind, SourceStatus } from "./types";
import { allSources, type RegisteredSource } from "./sources";
import { isRelevant, suggestTopics } from "./classify";
import { API_REVALIDATE_SECONDS, RSS_CACHE_TAG } from "./schedule";

export interface FeedResult {
  generatedAt: string;
  since: string;
  items: FeedItem[];
  sources: (SourceStatus & { confidence: RegisteredSource["confidence"]; docs: string })[];
}

const TIMEOUT_MS = Number(process.env.FEED_TIMEOUT_MS ?? 15000);

function userAgent() {
  // Several regulators (notably the SEC) reject requests without a descriptive User-Agent including a contact.
  const contact = process.env.FEED_CONTACT_EMAIL ?? "compliance@example.com";
  return `SustainabilityTracker/1.0 (${contact})`;
}

/** Next.js data-cache policy for a request. */
type CachePolicy = { revalidate: number | false; tags?: string[] };
const API_CACHE: CachePolicy = { revalidate: API_REVALIDATE_SECONDS };
// RSS: kept indefinitely, cleared on the first Friday of each month by /api/cron/refresh-rss.
const RSS_CACHE: CachePolicy = { revalidate: false, tags: [RSS_CACHE_TAG] };

async function timedFetch(url: string, init: RequestInit = {}, cache: CachePolicy = API_CACHE): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": userAgent(), ...(init.headers ?? {}) },
      next: cache,
    } as RequestInit);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
    return res;
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error(`Timed out after ${TIMEOUT_MS / 1000}s`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function errorMessage(e: unknown): string {
  const err = e as Error & { cause?: { code?: string; message?: string } };
  const cause = err.cause?.code || err.cause?.message;
  return cause ? `${err.message} (${cause})` : err.message || String(e);
}

export interface AggregateOptions {
  lookbackDays?: number;
  /** Source ids to run. */
  only?: string[];
  /** Restrict to sources for these jurisdictions. */
  jurisdictions?: string[];
  /** Restrict to these source kinds. */
  kinds?: SourceKind[];
}

/** Official channels only: regulator feeds, official registers and legislatures (no news monitoring or court search). */
export const OFFICIAL_KINDS: SourceKind[] = ["Regulator news", "Official register", "Legislature"];

export async function aggregate(opts: AggregateOptions = {}): Promise<FeedResult> {
  const days = opts.lookbackDays ?? Number(process.env.FEED_LOOKBACK_DAYS ?? 60);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  // One context per source so we can record when its RSS feed was actually downloaded.
  const makeCtx = (meta: { fetchedAt?: string }): FetchContext => ({
    since,
    fetchText: async (u, i) => (await timedFetch(u, i)).text(),
    fetchJSON: async (u, i) => (await timedFetch(u, { ...i, headers: { Accept: "application/json", ...(i?.headers ?? {}) } })).json(),
    fetchFeed: async (u) => {
      const res = await timedFetch(u, {}, RSS_CACHE);
      // A cached response keeps the origin's Date header, i.e. the time of the last real download.
      const d = res.headers.get("date");
      const iso = d && !Number.isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined;
      if (iso && (!meta.fetchedAt || iso < meta.fetchedAt)) meta.fetchedAt = iso;
      return res.text();
    },
  });

  const sources = allSources().filter(
    (s) =>
      (!opts.only || opts.only.includes(s.id)) &&
      (!opts.jurisdictions || opts.jurisdictions.includes(s.jurisdiction)) &&
      (!opts.kinds || opts.kinds.includes(s.kind)),
  );
  const settled = await Promise.all(
    sources.map(async (src) => {
      const base = {
        id: src.id,
        name: src.name,
        jurisdiction: src.jurisdiction,
        kind: src.kind,
        confidence: src.confidence,
        docs: src.docs,
        refresh: src.refresh ?? ("hourly" as const),
      };
      const meta: { fetchedAt?: string } = {};
      const ctx = makeCtx(meta);
      const skip = src.skip?.();
      if (skip) return { status: { ...base, ok: false, count: 0, fetched: 0, ms: 0, skipped: skip }, items: [] as FeedItem[] };
      const t0 = Date.now();
      try {
        const raw = await src.fetch(ctx);
        const items: FeedItem[] = [];
        for (const r of raw) {
          if (!r.title || !r.url) continue;
          if (r.date && r.date < since) continue;
          const text = `${r.title} ${r.summary ?? ""}`;
          if (!src.prefiltered && !isRelevant(text)) continue;
          items.push({
            id: `${src.id}:${r.externalId ?? r.url}`,
            sourceId: src.id,
            sourceName: src.name,
            jurisdiction: r.jurisdiction ?? src.jurisdiction,
            title: r.title,
            url: r.url,
            date: r.date,
            summary: r.summary,
            topics: suggestTopics(text),
            kind: src.kind,
          });
        }
        return { status: { ...base, ok: true, count: items.length, fetched: raw.length, ms: Date.now() - t0, fetchedAt: meta.fetchedAt }, items };
      } catch (e) {
        return { status: { ...base, ok: false, count: 0, fetched: 0, ms: Date.now() - t0, error: errorMessage(e) }, items: [] as FeedItem[] };
      }
    }),
  );

  // De-duplicate by URL (the same story often appears in several feeds), newest first.
  const seen = new Set<string>();
  const items = settled
    .flatMap((s) => s.items)
    .filter((i) => {
      const key = i.url.replace(/[?#].*$/, "").replace(/\/$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return { generatedAt: new Date().toISOString(), since, items, sources: settled.map((s) => s.status) };
}
