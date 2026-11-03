# Data sources

The tracker has two layers:

1. **Curated dataset** (`src/data/`): reviewed, summarised developments. This powers the overview, explorer, timeline, market pages and the main
   sections of briefing packs.
2. **Regulator updates** (`src/feeds/`): automatic pulls from regulators' RSS feeds and official registers, filtered for sustainability
   relevance. They appear in the *Regulator updates* panel on the Overview and on each market page, and in the optional *Recent regulator
   updates* section of a briefing pack. They are unreviewed. Promote anything material into the curated dataset.
   They are also available as JSON at `/api/feed` (e.g. `/api/feed?scope=official&jur=UK,EU`).

## Regulator RSS feeds (`src/feeds/regulators.ts`)

Researched November 2026 using web search. The feed addresses could not be fetched from the build environment, so run
`npm run feeds:check` from a networked machine to confirm them.

| Market | Regulator | Feed | Status | Evidence |
| --- | --- | --- | --- | --- |
| SG | MAS | Media releases, consultations | **No RSS** | MAS offers "Subscribe to Updates" notifications on [mas.gov.sg/news](https://www.mas.gov.sg/news) |
| SG | SGX RegCo | Regulatory announcements | **No RSS** | None found |
| JP | FSA | What's New (English) | **No RSS** | Weekly "What's New on the FSA Website" newsletter pages only |
| JP | SESC | Press releases (English) | **Add address** | SESC English page lists RSS 2.0 feeds: [fsa.go.jp/sesc/english](https://www.fsa.go.jp/sesc/english/index.html) |
| KR | FSC | Press releases (English) | **No RSS** | Paginated listing at [fsc.go.kr/eng/pr020101](https://www.fsc.go.kr/eng/pr020101) |
| KR | FSS | Press releases (English) | **No RSS** | None found |
| AU | ASIC | Media releases | **No RSS** | Email alerts: [asic.gov.au/newsroom/subscribe](https://asic.gov.au/newsroom/subscribe) |
| AU | APRA | Media releases | **No RSS** | None found |
| IN | SEBI | Press releases, circulars, orders | **Confirmed** | `https://www.sebi.gov.in/sebirss.xml`, given on [sebi.gov.in/rss.html](https://www.sebi.gov.in/rss.html) |
| IN | RBI | Press releases | To confirm | `https://rbi.org.in/pressreleases_rss.xml` (feed directories) |
| IN | RBI | Notifications | To confirm | `https://rbi.org.in/notifications_rss.xml` (feed directories) |
| CN | CSRC | News releases | **No RSS** | None found |
| CN | PBoC | News releases | **No RSS** | None found |
| US | SEC | Press releases | To confirm | `https://www.sec.gov/news/pressreleases.rss`; SEC lists its feeds at [sec.gov/about/secrss.shtml](https://www.sec.gov/about/secrss.shtml) |
| US | SEC | Litigation releases | To confirm | `https://www.sec.gov/enforcement-litigation/litigation-releases/rss` (feed directories) |
| US | Federal Reserve | Banking & consumer regulatory policy | **Confirmed** | `https://www.federalreserve.gov/feeds/press_bcreg.xml`, listed at [federalreserve.gov/feeds](https://www.federalreserve.gov/feeds/) |
| BR | Banco Central do Brasil | Normativos | To confirm | `https://www.bcb.gov.br/api/feed/app/normativos/normativos` (feed directories; some copies add `?ano=YYYY`) |
| BR | Banco Central do Brasil | Notas à imprensa | To confirm | `https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/notasImprensa` (feed directories) |
| BR | CVM | Notícias | **No RSS** | Paginated listing only |
| UK | FCA | News | To confirm | `https://www.fca.org.uk/news/rss.xml`. Sources conflict, and one directory says the FCA has no native feed. Fallback: FCA email alerts |
| UK | Bank of England / PRA | News | **Confirmed** | `https://www.bankofengland.co.uk/rss/news` (hosted on bankofengland.co.uk) |
| UK | Bank of England / PRA | Prudential regulation publications | To confirm | `https://www.bankofengland.co.uk/rss/prudential-regulation-publications` (feed directories) |
| UK | FRC | News | **No RSS** | None found |
| EU | ECB | Press releases | To confirm | `https://www.ecb.europa.eu/rss/press.html`; the ECB's RSS page confirms press feeds exist |
| EU | ECB Banking Supervision | Press releases & publications | **Add address** | RSS page at [bankingsupervision.europa.eu/home/rss](https://www.bankingsupervision.europa.eu/home/rss/html/index.en.html) |
| EU | ESMA | News | **Add address** | Feed directories carry an ESMA feed; official address not confirmed |
| EU | EBA | News & press | **Add address** | The EBA site footer offers a "News & press RSS feed" |
| EU | EIOPA | News | **Add address** | The EIOPA news listing shows an RSS link |

**Status key:**
- **Confirmed:** the address is shown on the regulator's own site.
- **To confirm:** the address comes from directories or common use.
- **Add address:** the regulator offers RSS, but the exact link wasn't captured. Copy it from the linked page into `url`.
- **No RSS:** the regulator has no public feed. Subscribe to its email alerts instead.

**To enable an "Add address" feed:** open the regulator's page, copy the feed link, set `url` and `status` in `src/feeds/regulators.ts`, and run
`npm run feeds:check -- <id>`.

## Official registers (also shown as regulator updates)

| Id | Source | Market | Key needed |
| --- | --- | --- | --- |
| `us-federal-register` | [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1): SEC, DOL, EEOC, Treasury, FTC rules | US | No |
| `uk-govuk` | [GOV.UK Search API](https://docs.publishing.service.gov.uk/repos/search-api/): HMT, DBT, CMA, DESNZ | UK | No |
| `uk-parliament-bills` | [UK Parliament Bills API](https://bills-api.parliament.uk/index.html) | UK | No |
| `eu-eurlex` | [EUR-Lex via Publications Office SPARQL](https://op.europa.eu/en/advanced-sparql-query-editor) | EU | No |
| `br-camara` | [Câmara dos Deputados open data API](https://dadosabertos.camara.leg.br/swagger/api.html) | BR | No |

## Other connectors (API only, not shown on pages)

GDELT news monitoring (`news-apac-br`, `news-litigation-enforcement`) and CourtListener court opinions (`us-courtlistener`, needs a free
token) are still in `src/feeds/sources.ts`. They are only available through `/api/feed`, because they are news and court data, not
regulator publications.

## Operating notes

- **Caching:** pages with regulator updates regenerate at most hourly, and each upstream response is cached for an hour.
- **Configuration:** see `.env.example` (`FEED_CONTACT_EMAIL`, a generic team mailbox for the User-Agent the SEC requires;
  `FEED_LOOKBACK_DAYS`; `COURTLISTENER_TOKEN`; `RSS_FEEDS` for extra feeds without code changes).
- **Relevance tuning:** keyword rules are in `src/feeds/classify.ts`.
- **Health check:** `npm run feeds:check` exits non-zero if any enabled source fails.
- **Offline test:** `npm run test:feeds`.
