import { CONTENT_AS_OF, LAST_REVIEWED } from "@/data";
import { Legend } from "@/components/Heatmap";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { REGULATOR_FEEDS, STATUS_LABEL } from "@/feeds/regulators";
import { formatDate } from "@/lib/query";

export const metadata = { title: "Methodology · Sustainability Tracker" };

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Methodology</div>
          <h1>Scope, definitions & maintenance</h1>
        </div>
      </div>
      <div className="panel panel-body prose">
        <h2>Scope</h2>
        <p>
          Priority markets: Singapore, Japan, South Korea, Australia, India, China (Mainland), the United States, Brazil, the United Kingdom and the
          European Union. International standard-setters (ISSB, Basel Committee, IOSCO, ICJ) are tracked separately for context and excluded from the
          headline counts.
        </p>
        <p>
          Content was seeded from developments known as of {CONTENT_AS_OF} and last reviewed on {formatDate(LAST_REVIEWED)}. Anything after that
          date must be added by the team. Every item links to a primary or authoritative source; always confirm the current position there before
          relying on it. This tracker is a monitoring aid and does not constitute legal advice.
        </p>

        <h2>Topics</h2>
        <ul>
          {TOPICS.map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong> — {t.description}
            </li>
          ))}
        </ul>

        <h2>Impact rating</h2>
        <p>
          Impact reflects relevance to a large, multi-jurisdictional asset manager — directly (obligations on the firm, its funds or marketing) or
          indirectly (portfolio-company data, stewardship, litigation exposure). Where an obligation depends on holding a licence or authorisation in
          that market (e.g., MAS-licensed fund managers, FCA-authorised firms), the &ldquo;What it means for us&rdquo; note flags it. As the firm is
          not financially licensed in its operating jurisdictions, treat such items as best-practice benchmarks or client-driven expectations unless
          a group entity, fund or distribution activity brings it into scope — confirm entity scoping with Legal.
        </p>

        <h2>Posture levels (heatmap)</h2>
        <Legend />
        <ul>
          <li><strong>Mandatory</strong> — binding requirements broadly in force.</li>
          <li><strong>Phasing in</strong> — adopted with staggered application dates.</li>
          <li><strong>Active</strong> — significant, ongoing litigation, enforcement or policy activity.</li>
          <li><strong>Voluntary / Comply-or-explain</strong> — codes, guidelines or voluntary frameworks.</li>
          <li><strong>Proposed</strong> — drafts and consultations without a confirmed start date.</li>
          <li><strong>Limited</strong> — little activity tracked.</li>
          <li><strong>Retreating</strong> — rules withdrawn, rolled back or no longer pursued.</li>
        </ul>

        <h2 id="regulator-feeds">Regulator feeds</h2>
        <p>
          Regulator updates on the Overview, market pages and briefing packs come from the RSS feeds below, plus official registers (US Federal
          Register, GOV.UK, UK Parliament Bills, EUR-Lex, Brazil&rsquo;s Câmara). Items are kept only if they match sustainability keywords. <strong>Refresh schedule:</strong> RSS feeds are re-downloaded on the <strong>first Friday of each month</strong> (Singapore time by default); the official register APIs refresh hourly.
          Many regulators in Asia-Pacific publish email alerts instead of RSS; their pages are linked so the team can subscribe directly.
        </p>
        <ul>
          <li><strong>Confirmed</strong> — feed address shown on the regulator&rsquo;s own site.</li>
          <li><strong>To confirm</strong> — address from feed directories or common use; check with <code>npm run feeds:check</code>.</li>
          <li><strong>Add address</strong> — the regulator offers RSS; copy the address from its page into <code>src/feeds/regulators.ts</code>.</li>
          <li><strong>No RSS</strong> — no public feed found; use the regulator&rsquo;s email alerts or web listing.</li>
        </ul>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Market</th>
                <th>Regulator</th>
                <th>Feed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {REGULATOR_FEEDS.map((f) => (
                <tr key={f.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {JURISDICTIONS.find((j) => j.code === f.jurisdiction)?.flag} {f.jurisdiction}
                  </td>
                  <td>
                    <a href={f.page} target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)", textDecoration: "underline" }}>
                      {f.regulator}
                    </a>
                  </td>
                  <td>
                    {f.feed}
                    {f.note && <div className="small muted">{f.note}</div>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{STATUS_LABEL[f.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Adding or updating a development</h2>
        <p>
          Developments live in <code>src/data/</code> (one file per region). Add an object to the relevant market array with an <code>id</code>,
          <code>title</code>, <code>jurisdiction</code>, one or more <code>topics</code> (the first is the primary topic), <code>type</code>,
          <code>status</code>, <code>authority</code>, <code>date</code> (latest milestone, <code>YYYY-MM</code> or <code>YYYY-MM-DD</code>),
          <code>summary</code>, optional <code>implications</code> and <code>keyDates</code>, <code>appliesTo</code>, <code>impact</code> and
          <code>sources</code>. Update the market&rsquo;s posture in <code>src/data/profiles.ts</code> and bump <code>LAST_REVIEWED</code> in
          <code>src/data/index.ts</code>. TypeScript validates every field at build time.
        </p>
      </div>
    </>
  );
}
