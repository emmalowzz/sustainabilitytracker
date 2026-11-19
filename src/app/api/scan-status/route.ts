import { aggregate } from "@/feeds/aggregate";
import { feedTimezone, lastScheduledRefresh, localDate, nextScheduledRefresh } from "@/feeds/schedule";

/**
 * GET /api/scan-status → when the monthly regulator scan (RSS feeds + website scans) last actually collected data.
 *
 * `lastScan` is the most recent download time recorded by any monthly source that succeeded, shown as a date in
 * FEED_TIMEZONE; null until at least one source has been collected. Reads the same monthly cache as the
 * Regulator updates panels, so it does not trigger extra downloads.
 */
export const revalidate = 3600;

export async function GET() {
  const result = await aggregate({ kinds: ["Regulator news", "Regulator website"] });
  const monthly = result.sources.filter((s) => s.refresh === "monthly");
  const collected = monthly.filter((s) => s.ok && s.fetchedAt);
  const latest = collected.map((s) => s.fetchedAt!).sort().at(-1);
  const tz = feedTimezone();
  const today = localDate(new Date(), tz).iso;
  const lastScan = latest ? localDate(new Date(latest), tz).iso : null;
  const lastScheduled = lastScheduledRefresh(today);
  return Response.json({
    lastScan,
    lastScheduled,
    // True when the most recent first-Friday scan hasn't been collected yet (the daily job will catch up).
    overdue: lastScan !== null && lastScan < lastScheduled,
    sourcesCollected: collected.length,
    sourcesTotal: monthly.length,
    nextScan: nextScheduledRefresh(today),
    timezone: tz,
  });
}
