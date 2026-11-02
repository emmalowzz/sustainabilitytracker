import { aggregate } from "@/feeds/aggregate";

/**
 * GET /api/feed                       → all sources, last FEED_LOOKBACK_DAYS days
 * GET /api/feed?source=us-sec-press   → one or more sources (comma-separated ids)
 * GET /api/feed?days=14               → custom look-back window (max 365)
 * Upstream responses are cached for an hour in the Next.js data cache.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const only = searchParams.get("source")?.split(",").filter(Boolean);
  const daysParam = Number(searchParams.get("days"));
  const lookbackDays = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : undefined;
  const result = await aggregate({ only, lookbackDays });
  return Response.json(result, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}
