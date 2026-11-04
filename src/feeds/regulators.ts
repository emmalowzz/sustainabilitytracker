/**
 * RSS feeds published by regulators in the ten priority markets.
 *
 * status:
 *   "official"  — feed address shown on the regulator's own website.
 *   "reported"  — address listed by third-party feed directories or widely used; run `npm run feeds:check` to confirm.
 *   "available" — the regulator offers RSS, but the exact address wasn't captured: copy it from `page` into `url`.
 *   "none"      — no public RSS feed found; the regulator offers email alerts or web listings instead (see `page`).
 *
 * `evidence` records where the address or status was found, so it can be re-checked.
 * Last researched: Nov 2026.
 */
import type { JurisdictionCode } from "@/lib/taxonomy";
import type { ScanConfig } from "./connectors/scan";

export type FeedStatus = "official" | "reported" | "available" | "none";

export interface RegulatorFeed {
  id: string;
  jurisdiction: JurisdictionCode;
  regulator: string;
  /** What the feed carries, e.g. "Press releases". */
  feed: string;
  url?: string;
  status: FeedStatus;
  /** Regulator page to subscribe / copy the feed address / read updates. */
  page: string;
  evidence?: string;
  note?: string;
  /**
   * Website scan used when there is no usable RSS address: the listing page is read on the same
   * first-Friday schedule. `verified` = the article URL pattern was seen in published URLs for that site.
   */
  scan?: ScanConfig & { verified: boolean };
}

export const REGULATOR_FEEDS: RegulatorFeed[] = [
  // ── Singapore
  {
    id: "sg-mas",
    jurisdiction: "SG",
    regulator: "Monetary Authority of Singapore (MAS)",
    feed: "Media releases, consultations, circulars",
    status: "none",
    page: "https://www.mas.gov.sg/news",
    note: "MAS offers 'Subscribe to Updates' notifications on its news pages rather than a public RSS feed.",
    scan: { url: "https://www.mas.gov.sg/news", include: /^\/(news|publications)\/[a-z-]+\/20\d{2}\/[^/?#]+$/, verified: true },
  },
  {
    id: "sg-sgx-regco",
    jurisdiction: "SG",
    regulator: "SGX RegCo",
    feed: "Regulatory announcements",
    status: "none",
    page: "https://www.sgx.com/regulation",
    note: "No public RSS feed found.",
    scan: { url: "https://www.sgx.com/regulation/regulatory-announcements", include: /^\/regulation\/[a-z0-9-]+\/[a-z0-9-]{12,}$/, verified: false },
  },

  // ── Japan
  {
    id: "jp-fsa",
    jurisdiction: "JP",
    regulator: "Financial Services Agency (FSA)",
    feed: "What's New (English)",
    status: "none",
    page: "https://www.fsa.go.jp/en/newsletter/index.html",
    note: "No English RSS feed found; the FSA publishes a weekly 'What's New on the FSA Website' newsletter page.",
    scan: { url: "https://www.fsa.go.jp/en/index.html", include: /^\/en\/(news|refer|policy)\/.+\.html$/, verified: false },
  },
  {
    id: "jp-sesc",
    jurisdiction: "JP",
    regulator: "Securities and Exchange Surveillance Commission (SESC)",
    feed: "Press releases (English)",
    status: "available",
    page: "https://www.fsa.go.jp/sesc/english/index.html",
    evidence: "SESC English 'What's New' page lists RSS 2.0 feeds for press releases and publications.",
    scan: { url: "https://www.fsa.go.jp/sesc/english/index.html", include: /^\/sesc\/english\/(news|reports|aboutsesc)\/.+\.(html?|pdf)$/, verified: false },
  },

  // ── South Korea
  {
    id: "kr-fsc",
    jurisdiction: "KR",
    regulator: "Financial Services Commission (FSC)",
    feed: "Press releases (English)",
    status: "none",
    page: "https://www.fsc.go.kr/eng/pr020101",
    note: "No RSS feed found; English press releases are a paginated web listing.",
    scan: { url: "https://www.fsc.go.kr/eng/pr020101", include: /^\/eng\/pr020101\/\d+/, verified: true },
  },
  {
    id: "kr-fss",
    jurisdiction: "KR",
    regulator: "Financial Supervisory Service (FSS)",
    feed: "Press releases (English)",
    status: "none",
    page: "https://www.fss.or.kr/eng/main/main.do",
    note: "No public RSS feed found.",
    scan: { url: "https://www.fss.or.kr/eng/main/main.do", include: /^\/eng\/bbs\/B\d+\/view\.do/, verified: false },
  },

  // ── Australia
  {
    id: "au-asic",
    jurisdiction: "AU",
    regulator: "Australian Securities and Investments Commission (ASIC)",
    feed: "Media releases",
    status: "none",
    page: "https://asic.gov.au/newsroom/subscribe",
    note: "ASIC offers email news alerts (enforcement outcomes, policy updates) rather than an RSS feed.",
    scan: { url: "https://asic.gov.au/newsroom/media-releases/", include: /media-releases?\/.*\d{2}-\d{2,3}mr/i, verified: false },
  },
  {
    id: "au-apra",
    jurisdiction: "AU",
    regulator: "Australian Prudential Regulation Authority (APRA)",
    feed: "Media releases",
    status: "none",
    page: "https://www.apra.gov.au/news-and-publications",
    note: "No public RSS feed found.",
    scan: { url: "https://www.apra.gov.au/news-and-publications", include: /^\/news-and-publications\/[a-z0-9-]{15,}$/, verified: true },
  },

  // ── India
  {
    id: "in-sebi",
    jurisdiction: "IN",
    regulator: "Securities and Exchange Board of India (SEBI)",
    feed: "Press releases, circulars, orders",
    url: "https://www.sebi.gov.in/sebirss.xml",
    status: "official",
    page: "https://www.sebi.gov.in/rss.html",
    evidence: "SEBI's RSS page gives this address.",
  },
  {
    id: "in-rbi-press",
    jurisdiction: "IN",
    regulator: "Reserve Bank of India (RBI)",
    feed: "Press releases",
    url: "https://rbi.org.in/pressreleases_rss.xml",
    status: "reported",
    page: "https://www.rbi.org.in/",
    evidence: "Listed by feed directories (feeder.co).",
  },
  {
    id: "in-rbi-notifications",
    jurisdiction: "IN",
    regulator: "Reserve Bank of India (RBI)",
    feed: "Notifications (circulars & directions)",
    url: "https://rbi.org.in/notifications_rss.xml",
    status: "reported",
    page: "https://www.rbi.org.in/",
    evidence: "Listed by feed directories (feeder.co).",
  },

  // ── China (Mainland)
  {
    id: "cn-csrc",
    jurisdiction: "CN",
    regulator: "China Securities Regulatory Commission (CSRC)",
    feed: "News releases",
    status: "none",
    page: "http://www.csrc.gov.cn/csrc_en/",
    note: "No public RSS feed found.",
    scan: { url: "http://www.csrc.gov.cn/csrc_en/", include: /^\/csrc_en\/c\d+\/c\d+\/content\.shtml$/, verified: false },
  },
  {
    id: "cn-pboc",
    jurisdiction: "CN",
    regulator: "People's Bank of China (PBoC)",
    feed: "News releases",
    status: "none",
    page: "http://www.pbc.gov.cn/en/",
    note: "No public RSS feed found.",
    scan: { url: "http://www.pbc.gov.cn/en/3688110/index.html", include: /^\/en\/3688110\/\d+\/\d+\/index\.html$/, verified: false },
  },

  // ── United States
  {
    id: "us-sec-press",
    jurisdiction: "US",
    regulator: "Securities and Exchange Commission (SEC)",
    feed: "Press releases",
    url: "https://www.sec.gov/news/pressreleases.rss",
    status: "reported",
    page: "https://www.sec.gov/about/secrss.shtml",
    evidence: "SEC's RSS page lists a press-release feed; address widely used.",
    note: "SEC requires a descriptive User-Agent (set FEED_CONTACT_EMAIL).",
  },
  {
    id: "us-sec-litigation",
    jurisdiction: "US",
    regulator: "Securities and Exchange Commission (SEC)",
    feed: "Litigation releases (enforcement)",
    url: "https://www.sec.gov/enforcement-litigation/litigation-releases/rss",
    status: "reported",
    page: "https://www.sec.gov/about/secrss.shtml",
    evidence: "Listed by feed directories (feeder.co).",
  },
  {
    id: "us-fed-bcreg",
    jurisdiction: "US",
    regulator: "Federal Reserve Board",
    feed: "Banking & consumer regulatory policy press releases",
    url: "https://www.federalreserve.gov/feeds/press_bcreg.xml",
    status: "official",
    page: "https://www.federalreserve.gov/feeds/",
    evidence: "Feed hosted on federalreserve.gov and listed on its feeds page.",
  },

  // ── Brazil
  {
    id: "br-bcb-normativos",
    jurisdiction: "BR",
    regulator: "Banco Central do Brasil (BCB)",
    feed: "Normativos (CMN/BCB regulations)",
    url: "https://www.bcb.gov.br/api/feed/app/normativos/normativos",
    status: "reported",
    page: "https://www.bcb.gov.br/estabilidadefinanceira/buscanormas",
    evidence: "Listed by feed directories (feeder.co); directory copies include an ?ano= year parameter.",
  },
  {
    id: "br-bcb-imprensa",
    jurisdiction: "BR",
    regulator: "Banco Central do Brasil (BCB)",
    feed: "Notas à imprensa (press releases)",
    url: "https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/notasImprensa",
    status: "reported",
    page: "https://www.bcb.gov.br/",
    evidence: "Listed by feed directories (feeder.co).",
  },
  {
    id: "br-cvm",
    jurisdiction: "BR",
    regulator: "Comissão de Valores Mobiliários (CVM)",
    feed: "Notícias",
    status: "none",
    page: "https://www.gov.br/cvm/pt-br/assuntos/noticias",
    note: "No RSS feed found; news is a paginated web listing.",
    scan: { url: "https://www.gov.br/cvm/pt-br/assuntos/noticias", include: /^\/cvm\/pt-br\/assuntos\/noticias\/20\d{2}\/[^/?#]+\/?$/, verified: true },
  },

  // ── United Kingdom
  {
    id: "uk-fca",
    jurisdiction: "UK",
    regulator: "Financial Conduct Authority (FCA)",
    feed: "News (press releases, statements, publications)",
    url: "https://www.fca.org.uk/news/rss.xml",
    status: "reported",
    page: "https://www.fca.org.uk/news",
    evidence: "Listed by third-party digests; one directory says the FCA has no native feed — confirm with feeds:check.",
    note: "Fallback: FCA daily/weekly email alerts.",
  },
  {
    id: "uk-boe-news",
    jurisdiction: "UK",
    regulator: "Bank of England / PRA",
    feed: "News",
    url: "https://www.bankofengland.co.uk/rss/news",
    status: "official",
    page: "https://www.bankofengland.co.uk/rss",
    evidence: "Feed hosted on bankofengland.co.uk.",
  },
  {
    id: "uk-pra-publications",
    jurisdiction: "UK",
    regulator: "Bank of England / PRA",
    feed: "Prudential regulation publications",
    url: "https://www.bankofengland.co.uk/rss/prudential-regulation-publications",
    status: "reported",
    page: "https://www.bankofengland.co.uk/rss",
    evidence: "Listed by feed directories (feeder.co).",
  },
  {
    id: "uk-frc",
    jurisdiction: "UK",
    regulator: "Financial Reporting Council (FRC)",
    feed: "News",
    status: "none",
    page: "https://www.frc.org.uk/news-and-events/news/",
    note: "No public RSS feed found.",
    scan: { url: "https://www.frc.org.uk/news-and-events/news/", include: /^\/news-and-events\/news\/20\d{2}\/\d{2}\/[^/?#]+\/?$/, verified: false },
  },

  // ── European Union
  {
    id: "eu-ecb-press",
    jurisdiction: "EU",
    regulator: "European Central Bank (ECB)",
    feed: "Press releases",
    url: "https://www.ecb.europa.eu/rss/press.html",
    status: "reported",
    page: "https://www.ecb.europa.eu/home/html/rss.en.html",
    evidence: "ECB RSS page confirms press-release feeds; exact address not confirmed.",
  },
  {
    id: "eu-ecb-supervision",
    jurisdiction: "EU",
    regulator: "ECB Banking Supervision",
    feed: "Supervision press releases & publications",
    status: "available",
    page: "https://www.bankingsupervision.europa.eu/home/rss/html/index.en.html",
    evidence: "ECB Banking Supervision publishes an RSS page.",
    scan: { url: "https://www.bankingsupervision.europa.eu/press/pr/html/index.en.html", include: /^\/press\/pr\/date\/20\d{2}\/html\/[^/]+\.en\.html$/, verified: false },
  },
  {
    id: "eu-esma",
    jurisdiction: "EU",
    regulator: "European Securities and Markets Authority (ESMA)",
    feed: "News & press releases",
    status: "available",
    page: "https://www.esma.europa.eu/press-news/esma-news",
    evidence: "Feed directories carry an ESMA feed; official address not confirmed.",
    scan: { url: "https://www.esma.europa.eu/press-news/esma-news", include: /^\/press-news\/esma-news\/[^/?#]+$/, verified: false },
  },
  {
    id: "eu-eba",
    jurisdiction: "EU",
    regulator: "European Banking Authority (EBA)",
    feed: "News & press",
    status: "available",
    page: "https://www.eba.europa.eu/publications-and-media",
    evidence: "EBA site footer offers a 'News & press RSS feed'.",
    scan: { url: "https://www.eba.europa.eu/publications-and-media/press-releases", include: /^\/publications-and-media\/press-releases\/[^/?#]+$/, verified: false },
  },
  {
    id: "eu-eiopa",
    jurisdiction: "EU",
    regulator: "European Insurance and Occupational Pensions Authority (EIOPA)",
    feed: "News",
    status: "available",
    page: "https://www.eiopa.europa.eu/media/news_en",
    evidence: "EIOPA news listing shows an RSS link.",
    scan: { url: "https://www.eiopa.europa.eu/media/news_en", include: /^\/[a-z0-9-]{15,}_en$/, verified: false },
  },
];

/** Feeds that can be polled (have an address). */
export const POLLABLE_FEEDS = REGULATOR_FEEDS.filter((f) => f.url);

/** Regulators covered by a monthly website scan instead of RSS. */
export const SCANNED_SITES = REGULATOR_FEEDS.filter((f) => !f.url && f.scan);

/** How a regulator is collected each month, in plain language (used on Methodology and in panels). */
export function collectionMethod(f: RegulatorFeed): string {
  if (f.url) return f.status === "official" ? "RSS feed" : "RSS feed (being verified)";
  if (f.scan) return "Website scan";
  return "Manual monitoring";
}
