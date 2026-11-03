/**
 * Registry of external sources feeding the "Live feed" triage page.
 *
 * confidence:
 *   "documented" — public API with official documentation; request shape follows the docs.
 *   "likely"     — RSS URL believed correct but not yet confirmed from a networked machine.
 * Run `npm run feeds:check` to see which sources respond, and fix or remove any that fail.
 * Extra RSS/Atom feeds can be added without code via the RSS_FEEDS env var (see .env.example).
 */
import type { JurisdictionCode } from "@/lib/taxonomy";
import type { RawItem, Source } from "./types";
import { parseFeed } from "./connectors/rss";
import { POLLABLE_FEEDS } from "./regulators";
import { camaraBills, courtListener, eurlexSparql, federalRegister, gdelt, govukSearch, ukBills } from "./connectors/apis";

export type Confidence = "documented" | "likely";
export type RegisteredSource = Source & { confidence: Confidence };

function rss(id: string, name: string, jurisdiction: JurisdictionCode, url: string, confidence: Confidence, kind: Source["kind"] = "Regulator news"): RegisteredSource {
  return { id, name, jurisdiction, kind, docs: url, confidence, fetch: async (ctx) => parseFeed(await ctx.fetchText(url)) };
}

// GDELT reports the publishing country by name; map it onto tracker jurisdictions.
const EU_MEMBERS = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"];
const COUNTRY_TO_JUR: Record<string, JurisdictionCode> = {
  Singapore: "SG", Japan: "JP", "South Korea": "KR", Australia: "AU", India: "IN", China: "CN",
  "United States": "US", Brazil: "BR", "United Kingdom": "UK",
  ...Object.fromEntries(EU_MEMBERS.map((c) => [c, "EU" as JurisdictionCode])),
};
export function jurisdictionFromCountry(country?: string): JurisdictionCode | undefined {
  return country ? COUNTRY_TO_JUR[country] : undefined;
}

/** GDELT items carry the country in `summary` as "domain · country · language"; lift it into the item. */
async function gdeltByCountry(ctx: Parameters<Source["fetch"]>[0], query: string, onlyPriority: boolean): Promise<RawItem[]> {
  const items = await gdelt(ctx, query);
  return items
    .map((i) => {
      const country = i.summary?.split(" · ")[1];
      return { ...i, jurisdiction: jurisdictionFromCountry(country) };
    })
    .filter((i) => !onlyPriority || i.jurisdiction);
}

const APAC_BR_COUNTRIES = "(sourcecountry:singapore OR sourcecountry:japan OR sourcecountry:southkorea OR sourcecountry:australia OR sourcecountry:india OR sourcecountry:china OR sourcecountry:brazil)";

/** Regulator RSS feeds (see regulators.ts for the full list, including regulators without feeds). */
const REGULATOR_SOURCES: RegisteredSource[] = POLLABLE_FEEDS.map((f) => ({
  ...rss(f.id, `${f.regulator} — ${f.feed}`, f.jurisdiction, f.url!, f.status === "official" ? "documented" : "likely"),
  docs: f.page,
}));

export const SOURCES: RegisteredSource[] = [
  ...REGULATOR_SOURCES,

  // ── United States
  {
    id: "us-federal-register",
    name: "Federal Register (SEC, DOL, EEOC, Treasury, FTC)",
    jurisdiction: "US",
    kind: "Official register",
    docs: "https://www.federalregister.gov/developers/documentation/api/v1",
    confidence: "documented",
    fetch: (ctx) =>
      federalRegister(
        ctx,
        ["ESG", "climate-related", "sustainability", "greenhouse gas", "proxy", "shareholder proposal", "fiduciary", "diversity", "forced labor"],
        ["securities-and-exchange-commission", "employee-benefits-security-administration", "equal-employment-opportunity-commission", "treasury-department", "federal-trade-commission"],
      ),
  },
  {
    id: "us-courtlistener",
    name: "CourtListener (US federal & state opinions)",
    jurisdiction: "US",
    kind: "Court records",
    docs: "https://www.courtlistener.com/help/api/rest/",
    confidence: "documented",
    prefiltered: true,
    skip: () => (process.env.COURTLISTENER_TOKEN ? undefined : "Set COURTLISTENER_TOKEN (free account) to enable"),
    fetch: (ctx) =>
      courtListener(ctx, '(ESG OR greenwashing OR "climate change" OR "anti-ESG") AND (securities OR ERISA OR fiduciary OR antitrust OR "consumer protection")', process.env.COURTLISTENER_TOKEN!),
  },

  // ── United Kingdom
  {
    id: "uk-govuk",
    name: "GOV.UK (HM Treasury, DBT, CMA, DESNZ)",
    jurisdiction: "UK",
    kind: "Official register",
    docs: "https://docs.publishing.service.gov.uk/repos/search-api/",
    confidence: "documented",
    fetch: (ctx) =>
      govukSearch(ctx, "sustainability OR climate OR ESG OR greenwashing OR stewardship OR \"pay gap\" OR \"modern slavery\"", [
        "hm-treasury",
        "department-for-business-and-trade",
        "competition-and-markets-authority",
        "department-for-energy-security-and-net-zero",
      ]),
  },
  {
    id: "uk-parliament-bills",
    name: "UK Parliament Bills",
    jurisdiction: "UK",
    kind: "Legislature",
    docs: "https://bills-api.parliament.uk/index.html",
    confidence: "documented",
    prefiltered: true,
    fetch: (ctx) => ukBills(ctx, ["climate", "sustainab", "employment rights", "modern slavery", "pension", "company"]),
  },

  // ── European Union
  {
    id: "eu-eurlex",
    name: "EUR-Lex via Publications Office SPARQL",
    jurisdiction: "EU",
    kind: "Official register",
    docs: "https://op.europa.eu/en/advanced-sparql-query-editor",
    confidence: "documented",
    prefiltered: true,
    fetch: eurlexSparql,
  },

  // ── Brazil
  {
    id: "br-camara",
    name: "Câmara dos Deputados — bills",
    jurisdiction: "BR",
    kind: "Legislature",
    docs: "https://dadosabertos.camara.leg.br/swagger/api.html",
    confidence: "documented",
    prefiltered: true,
    fetch: (ctx) => camaraBills(ctx, ["clima", "sustentabilidade", "ESG", "taxonomia", "carbono", "igualdade salarial", "governança corporativa"]),
  },

  // ── News monitoring (covers markets without usable official APIs: SG, JP, KR, AU, CN + litigation/enforcement globally)
  {
    id: "news-apac-br",
    name: "GDELT news — Asia-Pacific & Brazil regulation",
    jurisdiction: "INTL",
    kind: "News monitoring",
    docs: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
    confidence: "documented",
    fetch: (ctx) =>
      gdeltByCountry(
        ctx,
        `("sustainability disclosure" OR "climate disclosure" OR greenwashing OR "sustainable finance" OR "stewardship code" OR "corporate governance code" OR "green taxonomy" OR "ESG rating") ${APAC_BR_COUNTRIES}`,
        true,
      ),
  },
  {
    id: "news-litigation-enforcement",
    name: "GDELT news — ESG litigation & enforcement (global)",
    jurisdiction: "INTL",
    kind: "News monitoring",
    docs: "https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/",
    confidence: "documented",
    fetch: (ctx) =>
      gdeltByCountry(ctx, `("climate lawsuit" OR "climate litigation" OR "greenwashing fine" OR "greenwashing lawsuit" OR "anti-ESG" OR "ESG lawsuit" OR "greenwashing penalty")`, false),
  },
];

/** Additional feeds configured at deploy time: RSS_FEEDS='[{"id":"sg-mas","name":"MAS media releases","jurisdiction":"SG","url":"https://…"}]' */
export function extraSources(): RegisteredSource[] {
  const raw = process.env.RSS_FEEDS;
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as { id: string; name: string; jurisdiction: JurisdictionCode; url: string }[];
    return list.map((f) => rss(f.id, f.name, f.jurisdiction, f.url, "likely"));
  } catch {
    console.error("RSS_FEEDS is not valid JSON — ignoring");
    return [];
  }
}

export function allSources(): RegisteredSource[] {
  return [...SOURCES, ...extraSources()];
}
