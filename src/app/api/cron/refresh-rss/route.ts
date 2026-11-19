import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { aggregate } from "@/feeds/aggregate";
import type { SourceKind } from "@/feeds/types";
import { feedTimezone, isFirstFriday, lastScheduledRefresh, localDate, nextScheduledRefresh, RSS_CACHE_TAG } from "@/feeds/schedule";

/**
 * Monthly refresh of regulator RSS feeds and regulator website scans.
 *
 * Called once a day by the scheduler (see vercel.json). Self-healing: it refreshes whenever the cached
 * regulator data was collected BEFORE the most recent first Friday (in FEED_TIMEZONE). On the first Friday
 * that is always true, and if that day's run was missed or failed, the next daily run catches up. Once the
 * data is current, further calls do nothing until the next first Friday — so the routine call is safe to
 * leave unauthenticated.
 *
 * After invalidating the cache it re-runs the collection as soon as the response is sent, so the scan happens
 * on schedule (not on the next page visit); the outcome is written to the server log.
 *
 *   GET /api/cron/refresh-rss            → refresh if due (first Friday, or a missed one)
 *   GET /api/cron/refresh-rss?force=1    → refresh now; requires CRON_SECRET
 *
 * Auth: when CRON_SECRET is set, callers must send `Authorization: Bearer <CRON_SECRET>` (Vercel Cron does this
 * automatically). Without CRON_SECRET the routine call still works; only `force=1` is refused.
 */
// Note: no `dynamic = "force-dynamic"` here — that would make every fetch in this route skip the data cache,
// so the job could never see (or refresh) the cached regulator data. Reading the request already makes it dynamic.
export const maxDuration = 60;

const MONTHLY_KINDS: SourceKind[] = ["Regulator news", "Regulator website"];

type MonthlySource = { refresh: string; ok: boolean; fetchedAt?: string; id: string; error?: string; skipped?: string };

function summarise(sources: MonthlySource[]) {
  const monthly = sources.filter((s) => s.refresh === "monthly");
  const collected = monthly.filter((s) => s.ok && s.fetchedAt);
  const tz = feedTimezone();
  const dates = collected.map((s) => localDate(new Date(s.fetchedAt!), tz).iso).sort();
  return {
    total: monthly.length,
    collected: collected.length,
    oldest: dates[0] ?? null,
    newest: dates.at(-1) ?? null,
    failed: monthly.filter((s) => !s.ok).map((s) => ({ id: s.id, error: s.error ?? s.skipped })),
  };
}

async function monthlyState() {
  return summarise((await aggregate({ kinds: MONTHLY_KINDS })).sources);
}

/**
 * Re-collect through this site's own feed endpoint. Called after the response has been sent: the cache
 * invalidation only takes effect once this request completes, and data fetched in a separate request is
 * stored in the cache — so the scan runs at job time and page views reuse its results.
 */
async function recollect(origin: string) {
  const url = `${origin}/api/feed?kind=${encodeURIComponent(MONTHLY_KINDS.join(","))}&days=365`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(50_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return summarise((await res.json()).sources);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const secret = process.env.CRON_SECRET;
  const authorized = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (secret && !authorized) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (force && !authorized) return Response.json({ error: "force=1 requires CRON_SECRET to be set and sent" }, { status: 401 });

  const now = new Date();
  const tz = feedTimezone();
  const today = localDate(now, tz).iso;
  const lastDue = lastScheduledRefresh(today);
  const base = { today, timezone: tz, lastScheduled: lastDue, nextScheduled: nextScheduledRefresh(today) };

  // Is the cached data older than the most recent first Friday (or missing altogether)?
  const before = await monthlyState();
  const stale = before.collected === 0 || (before.oldest !== null && before.oldest < lastDue);
  if (!force && !stale) {
    return Response.json({ ...base, refreshed: false, reason: `Up to date: regulator data collected on or after ${lastDue}`, before });
  }

  // Mark every RSS response and website scan stale; regenerate cached pages (Regulator updates panels,
  // sidebar scan date) on their next view.
  revalidateTag(RSS_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/api/scan-status");
  const reason = force ? "Forced refresh" : isFirstFriday(now, tz) ? "First Friday of the month" : `Catch-up: data predated ${lastDue}`;

  // Collect straight away once this response is sent (see recollect), and log the outcome for the host's logs.
  after(async () => {
    try {
      const result = await recollect(url.origin);
      console.log(`[refresh-rss] ${reason}: collected ${result.collected}/${result.total} regulator sources (data dated ${result.newest ?? "n/a"})`, result.failed.length ? { failed: result.failed } : "");
    } catch (e) {
      console.warn(`[refresh-rss] ${reason}: immediate collection failed (${(e as Error).message}); sources will be collected on the next page view.`);
    }
  });

  return Response.json({ ...base, refreshed: true, reason, before, collecting: "started — results appear in the server log and on the site within a minute" });
}
