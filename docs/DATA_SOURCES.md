# Data sources

The tracker has two layers:

1. **Curated dataset** (`src/data/`): reviewed, summarised developments. This powers the overview, explorer, timeline and market pages.
2. **Live feed** (`/x/feed`, `/api/feed`, `src/feeds/`): automatic pulls from external sources, filtered for sustainability relevance. These are
   **candidates for triage**. A reviewer decides what gets promoted into the curated dataset.

No public API gives you structured, multi-market ESG regulatory intelligence. Official sources publish documents and news, not
"developments", so a human review step is still needed.

## Connected sources

| Id | Source | Market | Type | Key needed | Status |
| --- | --- | --- | --- | --- | --- |
| `us-federal-register` | [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) | US | Proposed/final rules (SEC, DOL, EEOC, Treasury, FTC) | No | Documented API |
| `us-sec-press` | SEC press releases RSS | US | Enforcement, rulemaking news | No (needs a User-Agent with contact) | Documented feed |
| `us-courtlistener` | [CourtListener REST API v4](https://www.courtlistener.com/help/api/rest/) | US | Court opinions (anti-ESG, greenwashing, ERISA) | Free token | Documented API |
| `uk-govuk` | [GOV.UK Search API](https://docs.publishing.service.gov.uk/repos/search-api/) | UK | HMT, DBT, CMA, DESNZ publications and consultations | No | Documented API |
| `uk-parliament-bills` | [UK Parliament Bills API](https://bills-api.parliament.uk/index.html) | UK | Bill progress | No | Documented API |
| `uk-fca-news` | FCA news RSS | UK | FCA policy and enforcement | No | **URL to confirm** |
| `uk-boe-news` | Bank of England news RSS | UK | PRA climate / prudential | No | **URL to confirm** |
| `eu-eurlex` | [Publications Office SPARQL (Cellar)](https://op.europa.eu/en/advanced-sparql-query-editor) | EU | Adopted and proposed EU acts (CELEX) | No | Documented API |
| `eu-ecb-press` | ECB press RSS | EU | Climate risk supervision | No | **URL to confirm** |
| `in-sebi` | SEBI RSS | IN | Circulars, regulations (BRSR, ESG funds, ERPs) | No | **URL to confirm** |
| `in-rbi-press` | RBI press releases RSS | IN | Climate risk disclosure, banking | No | **URL to confirm** |
| `br-camara` | [Câmara dos Deputados open data API](https://dadosabertos.camara.leg.br/swagger/api.html) | BR | Bills (climate, taxonomy, equal pay) | No | Documented API |
| `news-apac-br` | [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) | SG, JP, KR, AU, IN, CN, BR | News monitoring | No (max 1 request / 5s) | Documented API |
| `news-litigation-enforcement` | GDELT DOC 2.0 API | Global | Litigation & enforcement news | No | Documented API |

"URL to confirm" means the feed address came from memory and has not been tested from a networked machine. Run `npm run feeds:check`.
When a source works, change its `confidence` to `"documented"` in `src/feeds/sources.ts`. If it fails, find the correct address on the
regulator's RSS page.

## Sources to add via `RSS_FEEDS` (no code needed)

Most of these regulators publish RSS or e-mail alerts but no API. Copy the feed URL from their website and add it to the `RSS_FEEDS` env var:

| Market | Regulator | What to subscribe to |
| --- | --- | --- |
| SG | MAS | Media releases, consultation papers |
| SG | SGX RegCo | Regulatory announcements |
| JP | FSA Japan | "What's New" (English) |
| AU | ASIC | Media releases (greenwashing enforcement) |
| AU | APRA | News & publications |
| EU | ESMA, EBA, EIOPA | News / press releases |
| EU | European Commission (FISMA) | Sustainable finance news |
| UK | FRC, TPR | News (Stewardship Code, pension schemes) |
| INTL | IFRS Foundation (ISSB), BIS, IOSCO | News / press releases |

## Official APIs reviewed but not connected

| Source | Why it isn't connected |
| --- | --- |
| Regulations.gov API (US) | Needs an api.data.gov key; the Federal Register already covers final and proposed rules |
| SEC EDGAR (US) | Company filings, not regulatory developments. Useful later for issuer-level climate disclosures |
| legislation.gov.uk Atom feeds (UK) | The "new legislation" feed is very high volume; Bills API + GOV.UK cover it with less noise |
| European Parliament Open Data API (EU) | Overlaps with EUR-Lex; consider adding for procedure tracking (e.g. Omnibus, SFDR 2.0) |
| Australian Federal Register of Legislation API | Covers all legislation, not just ESG; could be added with keyword filters |
| e-Gov Laws API (Japan) | Japanese-language statute text; consolidated law, not news of changes |
| National Law Information Center Open API (Korea) | Needs registration (OC key); Korean-language |
| Senado Federal open data (Brazil) | Can sit next to the Câmara connector for full bill coverage |
| CVM open data portal (Brazil, CKAN) | Datasets (fund registers, filings) rather than regulatory news |
| China (CSRC, MOF, PBoC, exchanges) | No public APIs or reliable feeds. Covered through GDELT news; scraping not recommended |
| Climate Policy Radar / Climate Change Laws of the World | Excellent for litigation and climate laws; check their current API/data licence before integrating |
| Sabin Center Climate Case Chart | No public API; monitor manually or via the litigation news query |

## Commercial options (for fuller coverage)

If you need full coverage of all ten markets with expert summaries, look at paid regulatory-intelligence services. These include
Thomson Reuters Regulatory Intelligence, LexisNexis Regulatory Compliance, FiscalNote, Wolters Kluwer, Cube, Responsibility/ESG Book-type
data providers, and law-firm trackers. Most of them offer APIs. Connecting one would mean adding one connector in `src/feeds/connectors/apis.ts`.

## Operating notes

- **Caching:** `/x/feed` is regenerated at most hourly, and each upstream response is cached for an hour.
- **Configuration:** see `.env.example` (`FEED_CONTACT_EMAIL`, `FEED_LOOKBACK_DAYS`, `COURTLISTENER_TOKEN`, `RSS_FEEDS`).
- **Relevance tuning:** keyword rules are in `src/feeds/classify.ts`. Change them when a source is too noisy or too quiet.
- **Health check:** `npm run feeds:check` exits non-zero if any enabled source fails, so it can run on a schedule in CI.
- **Offline test:** `npm run test:feeds` checks parsing, filtering, de-duplication and error isolation against stubbed responses.
- **Terms of use:** each source has its own terms. GDELT links to third-party news articles, so check your firm's policy on storing them.
