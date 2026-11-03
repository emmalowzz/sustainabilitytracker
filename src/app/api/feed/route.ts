import { aggregate, OFFICIAL_KINDS } from "@/feeds/aggregate";
import type { SourceKind } from "@/feeds/types";

/**
 * GET /api/feed                          → all sources
 * GET /api/feed?scope=official           → regulator feeds, official registers and legislatures only
 * GET /api/feed?kind=Regulator%20news    → one or more source kinds (comma-separated)
 * GET /api/feed?jur=UK,EU                → sources for these markets
 * GET /api/feed?source=uk-fca            → specific source ids (comma-separated)
 * GET /api/feed?days=30                  → look-back window (max 365)
 * Upstream responses are cached for an hour in the Next.js data cache.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const list = (k: string) => searchParams.get(k)?.split(",").map((x) => x.trim()).filter(Boolean);
  const daysParam = Number(searchParams.get("days"));
  const result = await aggregate({
    only: list("source"),
    jurisdictions: list("jur"),
    kinds: searchParams.get("scope") === "official" ? OFFICIAL_KINDS : (list("kind") as SourceKind[] | undefined),
    lookbackDays: Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : undefined,
  });
  return Response.json(result, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}
