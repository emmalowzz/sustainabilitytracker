/**
 * Refresh schedule for feed sources.
 *
 * - RSS feeds (regulator feeds and any RSS_FEEDS extras) are cached indefinitely and refreshed only on the
 *   FIRST FRIDAY OF EACH MONTH, via the scheduled job that calls /api/cron/refresh-rss.
 * - API sources (Federal Register, GOV.UK, UK Parliament Bills, EUR-Lex, Câmara, …) refresh hourly.
 *
 * "First Friday" is evaluated in FEED_TIMEZONE (default Asia/Singapore).
 */

/** Cache tag shared by every RSS fetch; clearing it forces all RSS feeds to be re-fetched. */
export const RSS_CACHE_TAG = "regulator-rss";

/** Hourly refresh for API sources. */
export const API_REVALIDATE_SECONDS = 3600;

export type RefreshCadence = "monthly" | "hourly";

export function feedTimezone(): string {
  return process.env.FEED_TIMEZONE || "Asia/Singapore";
}

/** Calendar date (YYYY-MM-DD) and weekday of an instant, in the given IANA timezone. */
export function localDate(at: Date, timeZone = feedTimezone()): { iso: string; day: number; weekday: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, day: Number(parts.day), weekday: parts.weekday };
}

/** True when `at` falls on the first Friday of its month in the given timezone. */
export function isFirstFriday(at: Date, timeZone = feedTimezone()): boolean {
  const { day, weekday } = localDate(at, timeZone);
  return weekday === "Fri" && day <= 7;
}

/** First Friday of a month, as YYYY-MM-DD (month is 1–12). */
export function firstFridayOf(year: number, month: number): string {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const day = 1 + ((5 - firstDow + 7) % 7);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The scheduled refresh on or before `today` (YYYY-MM-DD). */
export function lastScheduledRefresh(today: string): string {
  const [y, m] = today.split("-").map(Number);
  const thisMonth = firstFridayOf(y, m);
  if (thisMonth <= today) return thisMonth;
  return m === 1 ? firstFridayOf(y - 1, 12) : firstFridayOf(y, m - 1);
}

/** The next scheduled refresh strictly after `today` (YYYY-MM-DD). */
export function nextScheduledRefresh(today: string): string {
  const [y, m] = today.split("-").map(Number);
  const thisMonth = firstFridayOf(y, m);
  if (thisMonth > today) return thisMonth;
  return m === 12 ? firstFridayOf(y + 1, 1) : firstFridayOf(y, m + 1);
}
