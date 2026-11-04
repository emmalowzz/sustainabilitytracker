# Sustainability Tracker

A regulatory tracker for sustainability / ESG developments across ten priority markets —
**Singapore, Japan, South Korea, Australia, India, China, the US, Brazil, the UK and the EU** — plus
international standard-setters for context.

## Topics (all filterable)

1. Sustainability-related disclosures
2. Workplace operations
3. ESG litigation trends
4. ESG enforcement trends
5. Sustainable finance — taxonomies, green deals & landscape
6. Sustainable finance — ESG benchmarks, capital & loan frameworks
7. Corporate governance & stewardship codes

## Pages

| Route | What it shows |
| --- | --- |
| `/x/overview` | KPI tiles, market × topic heatmap (posture + counts), latest developments, upcoming deadlines |
| `/x/developments` | Full explorer: search + filters (topic, market, impact, status, applies-to, instrument type), sort, CSV export. Filters live in the URL. |
| `/x/developments/[id]` | Single development with comparable developments in other markets |
| `/x/timeline` | Upcoming / past key dates, filterable by market and topic |
| `/x/jurisdictions/[code]` | Market profile: posture by topic, developments grouped by topic, upcoming dates |
| `/x/topics/[id]` | Cross-market comparison for one topic + filtered explorer |
| `/x/briefing` | **Briefing pack builder**: pick markets, topics, period, impact and items; generates a cover, executive summary, heatmap, deadlines, detailed developments and sources. Print/Save as PDF (A4), download for Word, export Markdown, or share the configuration as a link. Also reachable from the explorer ("Build briefing from view"). |
| `/x/about` | Methodology, definitions and how to maintain the data |

## Theme

Navy and crimson corporate palette, with a green scale for sustainability signals (posture heatmap, progress, sustainability topics). The brand values are approximations: replace the four `BRAND` tokens at the top of `src/app/globals.css` with the official hex codes. Light and dark mode are both supported. The briefing pack always prints on white.

## Running locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (also type-checks all data)
```

Deploys to Vercel with zero configuration.

## Regulator updates

Regulators' RSS feeds and official registers feed a *Regulator updates* panel on the Overview and on each market page, and an optional section in briefing packs. Feed coverage per regulator is on the Methodology page. **RSS feeds — and website scans for regulators without a usable feed — refresh on the first Friday of each month** through a scheduled job (`vercel.json` → `/api/cron/refresh-rss`; set `CRON_SECRET` in production). API sources refresh hourly. See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md#refresh-schedule).

## Live data sources

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for the full catalogue. Quick start:

```bash
cp .env.example .env.local   # set FEED_CONTACT_EMAIL (and optionally COURTLISTENER_TOKEN, RSS_FEEDS)
npm run feeds:check          # live health check of every source
npm run test:feeds           # offline pipeline tests
```

## Maintaining the data

All content is in `src/data/` (`apac.ts`, `americas.ts`, `europe.ts`, `international.ts`), with
per-market posture in `profiles.ts`. Each entry is type-checked against `src/lib/types.ts`.
After a review, bump `LAST_REVIEWED` in `src/data/index.ts`.

> Seeded content reflects developments known as of mid-2026. It is a monitoring aid, not legal
> advice — verify each item against its linked primary source before relying on it.
