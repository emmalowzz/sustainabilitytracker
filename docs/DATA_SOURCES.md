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

## Regulator website scans (`src/feeds/connectors/scan.ts`)

Regulators without a usable RSS address get a monthly website scan on the same first-Friday schedule. The scanner:
- reads the regulator's news or press-release listing page
- keeps links that match the site's article URL pattern
- takes the date from the listing row (or from the URL)
- applies the same sustainability relevance filter as the feeds (including Portuguese terms for Brazil)

It reads one page per regulator per month, honours robots.txt, and sends the tracker's User-Agent with `FEED_CONTACT_EMAIL`. Scan configs
live on each regulator in `src/feeds/regulators.ts` (`scan: { url, include, verified }`).

| Regulator | Listing page | URL pattern |
| --- | --- | --- |
| MAS | mas.gov.sg/news | Seen in published URLs |
| SGX RegCo | sgx.com/regulation/regulatory-announcements | **Unverified** |
| FSA Japan | fsa.go.jp/en/ | **Unverified** |
| SESC | fsa.go.jp/sesc/english/ | **Unverified** |
| FSC Korea | fsc.go.kr/eng/pr020101 | Seen in published URLs |
| FSS Korea | fss.or.kr/eng/ | **Unverified** |
| ASIC | asic.gov.au/newsroom/media-releases/ | **Unverified** |
| APRA | apra.gov.au/news-and-publications | Seen in published URLs |
| CSRC | csrc.gov.cn/csrc_en/ | **Unverified** |
| PBoC | pbc.gov.cn/en/ | **Unverified** |
| CVM | gov.br/cvm/pt-br/assuntos/noticias | Seen in published URLs |
| FRC | frc.org.uk/news-and-events/news/ | **Unverified** |
| ESMA | esma.europa.eu/press-news/esma-news | **Unverified** |
| EBA | eba.europa.eu/publications-and-media/press-releases | **Unverified** |
| EIOPA | eiopa.europa.eu/media/news_en | **Unverified** |
| ECB Banking Supervision | bankingsupervision.europa.eu/press/pr/ | **Unverified** |

**Limitations:**
- **JavaScript pages:** sites that build their listing with JavaScript return no links. The source then reports "0 links matched" and
  needs a different listing page or manual monitoring.
- **Layout changes:** these can also break a scan, and the status panel shows that the same way.
- **Unverified patterns:** these were written without access to the live pages. Run `npm run feeds:check` once deployed and adjust any scan
  that matches nothing.

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

## Refresh schedule

| Source type | Refresh | How |
| --- | --- | --- |
| **RSS feeds** (all regulator feeds, plus any added via `RSS_FEEDS`) and **regulator website scans** | **First Friday of each month** | Responses are cached indefinitely under the `regulator-rss` cache tag. A daily scheduled job calls `/api/cron/refresh-rss`. On the first Friday of the month (in `FEED_TIMEZONE`, default Asia/Singapore), the job clears the tag, and the feeds are re-downloaded on the next page view. On all other days the job does nothing. |
| **APIs** (Federal Register, GOV.UK, UK Parliament Bills, EUR-Lex, Câmara, GDELT, CourtListener) | Hourly | Next.js data cache, `revalidate: 3600` |

- **Scheduler:** `vercel.json` registers a Vercel Cron job that runs daily at 01:00 UTC (09:00 Singapore) and calls
  `/api/cron/refresh-rss`. On other hosts, any scheduler that calls that address once a day works.
- **Self-healing:** each daily run checks whether the cached regulator data was collected *before* the most recent first Friday
  (in `FEED_TIMEZONE`). If it was, the run refreshes: on the first Friday itself, or on the next day after a missed or failed
  run. Once the data is current, further runs do nothing until the next first Friday.
- **Collection at job time:** after clearing the cache, the job re-collects every RSS feed and website scan as soon as its response is
  sent. Page views then reuse that data. The outcome is logged as `[refresh-rss] … collected N/M regulator sources`, so check the
  host's function logs.
- **Security:** the routine daily call does not need a secret, because it can refresh at most once a month. `CRON_SECRET` is recommended.
  When it is set, every call must send `Authorization: Bearer <CRON_SECRET>` (Vercel Cron does this automatically).
- **Manual refresh:** `GET /api/cron/refresh-rss?force=1` with the secret header refreshes everything immediately. It is refused if
  `CRON_SECRET` is not set.
- **Sidebar:** shows "Last scan <date>", or "Last scan <date> · overdue" (amber) if the most recent first-Friday scan hasn't been
  collected yet.
- **First use:** the data cache starts empty after the first deployment (or if the host clears it), so feeds are downloaded once on first
  use and then held until the next first Friday.
- **Failures:** a feed that can't be reached is not cached. It is retried on each hourly page regeneration until it succeeds, then held
  until the next first Friday.
- **Visibility:** the *Regulator updates* panel shows the last and next scheduled refresh. Its feed status list shows each source as
  "RSS, fetched <date>" or "API, hourly".

## Operating notes

- **Caching:** pages with regulator updates regenerate at most hourly. RSS responses are reused until the monthly refresh, and API responses for an hour.
- **Configuration:** see `.env.example` (`FEED_CONTACT_EMAIL`, a generic team mailbox for the User-Agent the SEC requires;
  `FEED_LOOKBACK_DAYS`; `COURTLISTENER_TOKEN`; `RSS_FEEDS` for extra feeds without code changes).
- **Relevance tuning:** keyword rules are in `src/feeds/classify.ts`.
- **Health check:** `npm run feeds:check` exits non-zero if any enabled source fails. It runs outside Next.js, so it always fetches live and ignores the monthly cache.
- **Offline test:** `npm run test:feeds`.
