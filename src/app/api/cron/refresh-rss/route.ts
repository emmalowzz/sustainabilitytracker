import { revalidateTag } from "next/cache";
import { feedTimezone, isFirstFriday, localDate, nextScheduledRefresh, RSS_CACHE_TAG } from "@/feeds/schedule";

/**
 * Monthly RSS refresh.
 *
 * Called once a day by the scheduler (see vercel.json). It only clears the RSS cache when today is the
 * first Friday of the month in FEED_TIMEZONE; on other days it does nothing. API sources are unaffected
 * (they refresh hourly on their own).
 *
 *   GET /api/cron/refresh-rss            → refresh if today is the first Friday
 *   GET /api/cron/refresh-rss?force=1    → refresh now (manual override)
 *
 * Auth: when CRON_SECRET is set (required in production), callers must send
 * `Authorization: Bearer <CRON_SECRET>` — Vercel Cron does this automatically.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const now = new Date();
  const tz = feedTimezone();
  const today = localDate(now, tz).iso;
  const force = new URL(req.url).searchParams.get("force") === "1";
  const due = isFirstFriday(now, tz);

  if (!due && !force) {
    return Response.json({ refreshed: false, reason: "Not the first Friday of the month", today, timezone: tz, nextRefresh: nextScheduledRefresh(today) });
  }

  // Mark every RSS response stale with no grace period: the next request re-downloads the feeds.
  revalidateTag(RSS_CACHE_TAG, { expire: 0 });
  return Response.json({ refreshed: true, forced: force && !due, at: now.toISOString(), today, timezone: tz, nextRefresh: nextScheduledRefresh(today) });
}
