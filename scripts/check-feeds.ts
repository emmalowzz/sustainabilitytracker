/**
 * Hit every configured source once and print a status table.
 *   npm run feeds:check                 # all sources
 *   npm run feeds:check -- us-sec-press # specific source ids
 * Exits non-zero if any enabled source fails, so it can run in CI.
 * Runs outside Next.js, so it always fetches live (it ignores the monthly RSS cache).
 */
import { aggregate } from "../src/feeds/aggregate";

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const res = await aggregate({ only: only.length ? only : undefined });
  const rows = res.sources.map((s) => ({
    source: s.id,
    status: s.ok ? "OK" : s.skipped ? "SKIPPED" : "FAIL",
    refresh: s.refresh === "monthly" ? "RSS · 1st Fri" : "API · hourly",
    relevant: s.count,
    fetched: s.fetched,
    ms: s.ms,
    note: s.error ?? s.skipped ?? (s.confidence === "likely" ? "URL now confirmed — mark as documented" : ""),
  }));
  console.table(rows);
  console.log(`\n${res.items.length} relevant items since ${res.since}. Sample:`);
  for (const i of res.items.slice(0, 10)) console.log(`  [${i.jurisdiction}] ${i.date ?? "????-??-??"}  ${i.title.slice(0, 100)}`);
  if (rows.some((r) => r.status === "FAIL")) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
