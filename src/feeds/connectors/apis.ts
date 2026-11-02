/**
 * Clients for structured (JSON / SPARQL) public APIs.
 * Each returns RawItem[]; errors propagate and are reported per-source by the aggregator.
 */
import type { FetchContext, RawItem } from "../types";
import { stripHtml, toISODate } from "../classify";

// ───────── US: Federal Register API (no key) — https://www.federalregister.gov/developers/documentation/api/v1
interface FRDoc {
  document_number: string;
  title: string;
  html_url: string;
  publication_date: string;
  abstract?: string;
  type?: string;
  agencies?: { name?: string }[];
}
export async function federalRegister(ctx: FetchContext, terms: string[], agencies: string[] = []): Promise<RawItem[]> {
  const p = new URLSearchParams();
  p.set("per_page", "50");
  p.set("order", "newest");
  p.set("conditions[term]", terms.map((t) => (t.includes(" ") ? `"${t}"` : t)).join(" | "));
  p.set("conditions[publication_date][gte]", ctx.since);
  for (const a of agencies) p.append("conditions[agencies][]", a);
  for (const f of ["document_number", "title", "html_url", "publication_date", "abstract", "type", "agencies"]) p.append("fields[]", f);
  const data = await ctx.fetchJSON<{ results?: FRDoc[] }>(`https://www.federalregister.gov/api/v1/documents.json?${p}`);
  return (data.results ?? []).map((d) => ({
    externalId: d.document_number,
    title: d.title,
    url: d.html_url,
    date: d.publication_date,
    summary: [d.type, d.agencies?.map((a) => a.name).filter(Boolean).join(", "), stripHtml(d.abstract)].filter(Boolean).join(" — "),
  }));
}

// ───────── UK: GOV.UK Search API (no key) — https://docs.publishing.service.gov.uk/repos/search-api/
interface GovukResult {
  title: string;
  link: string;
  public_timestamp?: string;
  description?: string;
  organisations?: { title?: string }[];
}
export async function govukSearch(ctx: FetchContext, query: string, organisations: string[] = []): Promise<RawItem[]> {
  const p = new URLSearchParams({
    q: query,
    count: "50",
    order: "-public_timestamp",
    fields: "title,link,public_timestamp,description,organisations",
  });
  p.set("filter_public_timestamp", `from:${ctx.since}`);
  for (const o of organisations) p.append("filter_organisations[]", o);
  const data = await ctx.fetchJSON<{ results?: GovukResult[] }>(`https://www.gov.uk/api/search.json?${p}`);
  return (data.results ?? []).map((r) => ({
    externalId: r.link,
    title: r.title,
    url: r.link.startsWith("http") ? r.link : `https://www.gov.uk${r.link}`,
    date: toISODate(r.public_timestamp),
    summary: [r.organisations?.map((o) => o.title).join(", "), r.description].filter(Boolean).join(" — "),
  }));
}

// ───────── UK: Parliament Bills API (no key) — https://bills-api.parliament.uk/index.html
interface UKBill {
  billId: number;
  shortTitle: string;
  lastUpdate?: string;
  currentHouse?: string;
  currentStage?: { description?: string };
  isAct?: boolean;
}
export async function ukBills(ctx: FetchContext, terms: string[]): Promise<RawItem[]> {
  const out: RawItem[] = [];
  for (const t of terms) {
    const p = new URLSearchParams({ SearchTerm: t, SortOrder: "DateUpdatedDescending", Take: "20" });
    const data = await ctx.fetchJSON<{ items?: UKBill[] }>(`https://bills-api.parliament.uk/api/v1/Bills?${p}`);
    for (const b of data.items ?? []) {
      const date = toISODate(b.lastUpdate);
      if (date && date < ctx.since) continue;
      out.push({
        externalId: String(b.billId),
        title: b.shortTitle,
        url: `https://bills.parliament.uk/bills/${b.billId}`,
        date,
        summary: [b.isAct ? "Act" : "Bill", b.currentHouse, b.currentStage?.description].filter(Boolean).join(" · "),
      });
    }
  }
  return out;
}

// ───────── EU: Publications Office (Cellar) SPARQL endpoint for EUR-Lex (no key)
// https://op.europa.eu/en/advanced-sparql-query-editor
export async function eurlexSparql(ctx: FetchContext): Promise<RawItem[]> {
  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?celex ?title ?date WHERE {
  ?work cdm:resource_legal_id_celex ?celex ;
        cdm:work_date_document ?date .
  ?expr cdm:expression_belongs_to_work ?work ;
        cdm:expression_title ?title ;
        cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
  FILTER(?date >= "${ctx.since}"^^xsd:date)
  FILTER(REGEX(STR(?title), "sustainab|climate|taxonomy|due diligence|pay transparency|greenhouse|ESG|green bond|forced labour|benchmark|green claims|emission", "i"))
} ORDER BY DESC(?date) LIMIT 100`;
  const url = `https://publications.europa.eu/webapi/rdf/sparql?query=${encodeURIComponent(query)}&format=${encodeURIComponent("application/sparql-results+json")}`;
  type B = { value: string };
  const data = await ctx.fetchJSON<{ results?: { bindings?: { celex: B; title: B; date: B }[] } }>(url, {
    headers: { Accept: "application/sparql-results+json" },
  });
  return (data.results?.bindings ?? []).map((b) => ({
    externalId: b.celex.value,
    title: b.title.value.replace(/\s+/g, " ").trim(),
    url: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${encodeURIComponent(b.celex.value)}`,
    date: toISODate(b.date.value),
    summary: `CELEX ${b.celex.value}`,
  }));
}

// ───────── Brazil: Câmara dos Deputados open data API (no key) — https://dadosabertos.camara.leg.br/swagger/api.html
interface CamaraProp {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
}
export async function camaraBills(ctx: FetchContext, keywords: string[]): Promise<RawItem[]> {
  const out: RawItem[] = [];
  for (const k of keywords) {
    const p = new URLSearchParams({ keywords: k, dataApresentacaoInicio: ctx.since, ordem: "DESC", ordenarPor: "id", itens: "30" });
    const data = await ctx.fetchJSON<{ dados?: CamaraProp[] }>(`https://dadosabertos.camara.leg.br/api/v2/proposicoes?${p}`, {
      headers: { Accept: "application/json" },
    });
    for (const d of data.dados ?? []) {
      out.push({
        externalId: String(d.id),
        title: `${d.siglaTipo} ${d.numero}/${d.ano} — ${d.ementa}`,
        url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${d.id}`,
        summary: d.ementa,
      });
    }
  }
  return out;
}

// ───────── US courts: CourtListener search API (free token) — https://www.courtlistener.com/help/api/rest/
interface CLResult {
  cluster_id?: number;
  caseName?: string;
  absolute_url?: string;
  dateFiled?: string;
  court?: string;
  snippet?: string;
}
export async function courtListener(ctx: FetchContext, query: string, token: string): Promise<RawItem[]> {
  const p = new URLSearchParams({ q: query, type: "o", order_by: "dateFiled desc", filed_after: ctx.since });
  const data = await ctx.fetchJSON<{ results?: CLResult[] }>(`https://www.courtlistener.com/api/rest/v4/search/?${p}`, {
    headers: { Authorization: `Token ${token}` },
  });
  return (data.results ?? []).map((r) => ({
    externalId: r.cluster_id ? String(r.cluster_id) : r.absolute_url,
    title: r.caseName ?? "Untitled case",
    url: `https://www.courtlistener.com${r.absolute_url ?? ""}`,
    date: toISODate(r.dateFiled),
    summary: [r.court, stripHtml(r.snippet)].filter(Boolean).join(" — "),
  }));
}

// ───────── Global news: GDELT DOC 2.0 API (no key) — https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
// Used for markets/topics with no official API (China, Korea, litigation & enforcement news).
interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain?: string;
  sourcecountry?: string;
  language?: string;
}
// GDELT asks clients to make no more than one request every 5 seconds: serialise calls.
let gdeltQueue: Promise<unknown> = Promise.resolve();
const GDELT_SPACING_MS = 5500;

export function gdelt(ctx: FetchContext, query: string, days = 14): Promise<RawItem[]> {
  const run = gdeltQueue.then(() => gdeltOnce(ctx, query, days));
  gdeltQueue = run.catch(() => undefined).then(() => new Promise((r) => setTimeout(r, GDELT_SPACING_MS)));
  return run;
}

async function gdeltOnce(ctx: FetchContext, query: string, days: number): Promise<RawItem[]> {
  const p = new URLSearchParams({ query, mode: "artlist", format: "json", maxrecords: "75", sort: "datedesc", timespan: `${days}d` });
  const data = await ctx.fetchJSON<{ articles?: GdeltArticle[] }>(`https://api.gdeltproject.org/api/v2/doc/doc?${p}`);
  return (data.articles ?? []).map((a) => ({
    externalId: a.url,
    title: a.title,
    url: a.url,
    date: toISODate(a.seendate),
    summary: [a.domain, a.sourcecountry, a.language].filter(Boolean).join(" · "),
  }));
}
