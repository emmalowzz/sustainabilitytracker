/**
 * Offline test of the feed pipeline: stubs fetch() with samples shaped like each API's documented response
 * and checks parsing, relevance filtering, topic suggestion, de-duplication and per-source error isolation.
 * This does NOT prove the live endpoints are reachable — use `npm run feeds:check` for that.
 */
import assert from "node:assert/strict";
import { aggregate } from "../src/feeds/aggregate";
import { parseFeed } from "../src/feeds/connectors/rss";
import { suggestTopics, toISODate } from "../src/feeds/classify";
import { firstFridayOf, isFirstFriday, lastScheduledRefresh, nextScheduledRefresh, RSS_CACHE_TAG } from "../src/feeds/schedule";

const today = new Date().toISOString().slice(0, 10);
const rssDate = new Date().toUTCString();

const FIXTURES: [RegExp, () => unknown][] = [
  [/federalregister\.gov/, () => ({ results: [{ document_number: "2026-1", title: "Investment Company Names — ESG terms", html_url: "https://www.federalregister.gov/d/2026-1", publication_date: today, abstract: "Rule on fund names", type: "Rule", agencies: [{ name: "Securities and Exchange Commission" }] }] })],
  [/sec\.gov\/enforcement-litigation/, () => `<rss><channel><item><title>SEC v. Example Adviser — ESG misstatements</title><link>https://www.sec.gov/lit/1</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/federalreserve\.gov/, () => `<rss><channel><item><title>Agencies withdraw climate-related financial risk principles</title><link>https://www.federalreserve.gov/a</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/bcb\.gov\.br/, () => `<rss><channel><item><title>Resolução CMN sobre riscos sociais, ambientais e climáticos (climate risk)</title><link>https://www.bcb.gov.br/a</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/sec\.gov\/news\/pressreleases\.rss/, () => `<?xml version="1.0"?><rss version="2.0"><channel><title>SEC</title>
     <item><title>SEC Charges Adviser for Misleading ESG Claims</title><link>https://www.sec.gov/newsroom/press-releases/2026-99</link><pubDate>${rssDate}</pubDate><description>Greenwashing penalty of $5m</description></item>
     <item><title>SEC Announces Agenda for Small Business Forum</title><link>https://www.sec.gov/x</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/gov\.uk\/api\/search/, () => ({ results: [{ title: "UK Sustainability Reporting Standards", link: "/guidance/uk-sustainability-reporting-standards", public_timestamp: `${today}T09:00:00Z`, description: "ISSB endorsement", organisations: [{ title: "Department for Business and Trade" }] }] })],
  [/bills-api\.parliament\.uk/, () => ({ items: [{ billId: 3737, shortTitle: "Employment Rights Bill", lastUpdate: `${today}T00:00:00`, currentHouse: "Lords", isAct: true }] })],
  [/fca\.org\.uk/, () => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>FCA</title>
     <entry><id>fca-1</id><title>FCA consults on ESG ratings regime</title><link href="https://www.fca.org.uk/news/press-releases/esg-ratings"/><updated>${today}T10:00:00Z</updated><summary>Consultation</summary></entry></feed>`],
  [/bankofengland/, () => { throw new Error("HTTP 404 Not Found"); }],
  [/publications\.europa\.eu/, () => ({ results: { bindings: [{ celex: { value: "32026R0001" }, title: { value: "Regulation on ESG rating activities" }, date: { value: today } }] } })],
  [/ecb\.europa\.eu/, () => `<rss><channel><item><title>ECB climate-related risk supervisory expectations</title><link>https://www.ecb.europa.eu/a</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/sebi\.gov\.in/, () => `<rss><channel><item><title>Framework for ESG Debt Securities</title><link>https://www.sebi.gov.in/a</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/rbi\.org\.in/, () => `<rss><channel><item><title>Money Market Operations</title><link>https://www.rbi.org.in/a</link><pubDate>${rssDate}</pubDate></item></channel></rss>`],
  [/camara\.leg\.br/, () => ({ dados: [{ id: 123, siglaTipo: "PL", numero: 10, ano: 2026, ementa: "Dispõe sobre a taxonomia sustentável" }] })],
  [/gdeltproject/, () => ({ articles: [
     { url: "https://news.example.jp/a", title: "Japan FSA revises stewardship code", seendate: today.replace(/-/g, "") + "T101500Z", domain: "news.example.jp", sourcecountry: "Japan", language: "English" },
     { url: "https://news.example.de/b", title: "Greenwashing fine for asset manager", seendate: today.replace(/-/g, "") + "T101500Z", domain: "news.example.de", sourcecountry: "Germany", language: "German" },
     // duplicate of the SEC press release URL — should be removed
     { url: "https://www.sec.gov/newsroom/press-releases/2026-99", title: "SEC charges adviser over ESG claims", seendate: today.replace(/-/g, ""), sourcecountry: "United States" } ] })],
];

const seenCache = new Map<string, unknown>();
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit & { next?: unknown }) => {
  const url = String(input);
  seenCache.set(url, init?.next);
  const hit = FIXTURES.find(([re]) => re.test(url));
  if (!hit) return new Response("not stubbed", { status: 500 });
  const body = hit[1]();
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200, headers: { Date: "Fri, 06 Nov 2026 01:00:05 GMT" } });
}) as typeof fetch;

async function main() {
  // Unit checks
  assert.equal(toISODate("20251102T101500Z"), "2025-11-02");
  assert.equal(toISODate("Mon, 03 Nov 2025 14:00:00 GMT"), "2025-11-03");
  assert.deepEqual(suggestTopics("SEC fines adviser for greenwashing"), ["enforcement"]);
  assert.ok(suggestTopics("UK Stewardship Code 2026 published").includes("governance"));
  assert.equal(parseFeed(`<rss><channel><item><title>x</title><link>u</link></item></channel></rss>`).length, 1);

  // First-Friday schedule
  assert.equal(firstFridayOf(2026, 11), "2026-11-06");
  assert.equal(firstFridayOf(2026, 12), "2026-12-04");
  assert.equal(firstFridayOf(2027, 1), "2027-01-01");
  assert.equal(firstFridayOf(2027, 10), "2027-10-01");
  assert.equal(nextScheduledRefresh("2026-11-04"), "2026-11-06");
  assert.equal(nextScheduledRefresh("2026-11-06"), "2026-12-04");
  assert.equal(nextScheduledRefresh("2026-12-20"), "2027-01-01");
  assert.equal(lastScheduledRefresh("2026-11-04"), "2026-10-02");
  assert.equal(lastScheduledRefresh("2026-11-06"), "2026-11-06");
  assert.equal(lastScheduledRefresh("2027-01-01"), "2027-01-01");
  // 6 Nov 2026 is the first Friday; 13 Nov is a Friday but not the first; 7 Nov is a Saturday.
  assert.equal(isFirstFriday(new Date("2026-11-06T01:00:00Z"), "Asia/Singapore"), true);
  assert.equal(isFirstFriday(new Date("2026-11-13T01:00:00Z"), "Asia/Singapore"), false);
  assert.equal(isFirstFriday(new Date("2026-11-07T01:00:00Z"), "Asia/Singapore"), false);
  // Timezone matters: 01:00 UTC Fri 6 Nov is still Thursday 5 Nov in New York.
  assert.equal(isFirstFriday(new Date("2026-11-06T01:00:00Z"), "America/New_York"), false);
  assert.equal(isFirstFriday(new Date("2026-11-07T01:00:00Z"), "America/New_York"), true);

  const res = await aggregate({ lookbackDays: 30 });
  const by = Object.fromEntries(res.sources.map((s) => [s.id, s]));

  assert.equal(by["uk-boe-news"].ok, false, "failing source reported as failed");
  assert.match(by["uk-boe-news"].error ?? "", /404/);
  assert.equal(by["us-courtlistener"].skipped !== undefined, true, "CourtListener skipped without token");
  assert.equal(by["us-sec-press"].fetched, 2);
  assert.equal(by["us-sec-press"].count, 1, "irrelevant SEC item filtered out");
  assert.equal(by["in-rbi-press"].count, 0, "irrelevant RBI item filtered out");
  assert.equal(by["in-sebi"].count, 1, "SEBI ESG item kept");
  assert.equal(by["us-fed-bcreg"].count, 1);
  assert.equal(by["uk-pra-publications"].ok, false, "second BoE feed also reported failed");

  // Cache policy: RSS kept until the first-Friday refresh; APIs hourly.
  const rssPolicy = seenCache.get("https://www.sebi.gov.in/sebirss.xml") as { revalidate: unknown; tags?: string[] };
  assert.equal(rssPolicy.revalidate, false, "RSS cached indefinitely");
  assert.deepEqual(rssPolicy.tags, [RSS_CACHE_TAG], "RSS tagged for the monthly refresh");
  const apiUrl = [...seenCache.keys()].find((u) => u.includes("federalregister.gov"))!;
  assert.deepEqual(seenCache.get(apiUrl), { revalidate: 3600 }, "APIs refresh hourly");
  assert.equal(by["in-sebi"].refresh, "monthly");
  assert.equal(by["in-sebi"].fetchedAt, "2026-11-06T01:00:05.000Z", "fetch time taken from the Date header");
  assert.equal(by["us-federal-register"].refresh, "hourly");

  // Scope filters used by the Overview / market pages / briefing pack
  const uk = await aggregate({ jurisdictions: ["UK"], kinds: ["Regulator news"] });
  assert.ok(uk.sources.length > 0 && uk.sources.every((s) => s.jurisdiction === "UK" && s.kind === "Regulator news"));
  assert.ok(uk.items.every((i) => i.jurisdiction === "UK"));

  const titles = res.items.map((i) => i.title);
  assert.ok(titles.includes("Regulation on ESG rating activities"));
  assert.ok(titles.some((t) => t.startsWith("PL 10/2026")));
  assert.equal(res.items.filter((i) => i.url.includes("press-releases/2026-99")).length, 1, "duplicate URL removed");

  const jp = res.items.find((i) => i.title.includes("Japan FSA"));
  assert.equal(jp?.jurisdiction, "JP", "GDELT country mapped to jurisdiction");
  const de = res.items.find((i) => i.title.includes("Greenwashing fine"));
  assert.equal(de?.jurisdiction, "EU", "EU member mapped to EU");
  assert.ok(de?.topics.includes("enforcement"));

  console.log(`All feed pipeline tests passed (${res.items.length} items, ${res.sources.filter((s) => s.ok).length}/${res.sources.length} sources OK).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
