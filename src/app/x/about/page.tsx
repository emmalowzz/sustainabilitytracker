import { Legend } from "@/components/Heatmap";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { REGULATOR_FEEDS, collectionMethod } from "@/feeds/regulators";

export const metadata = { title: "Methodology · Sustainability Tracker" };

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Methodology</div>
          <h1>Scope & definitions</h1>
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
          Every item links to a primary or authoritative source; always confirm the current position there before relying on it. This tracker is a
          monitoring aid and does not constitute legal advice.
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
          a group entity, fund or distribution activity brings it into scope.
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

        <h2 id="regulator-feeds">Regulator monitoring</h2>
        <p>
          The <strong>Regulator updates</strong> shown on the Overview, on each market page and in briefing packs are collected automatically and
          kept only if they relate to sustainability. They have not been reviewed; material items are added to the tracked developments after
          review.
        </p>
        <ul>
          <li>
            <strong>RSS feed</strong> — the regulator&rsquo;s own news feed. &ldquo;Being verified&rdquo; means the feed address is still being
            confirmed.
          </li>
          <li>
            <strong>Website scan</strong> — where a regulator publishes no usable feed, its news or press-release page is read and new
            announcements are picked up. Each site&rsquo;s published crawling rules are respected.
          </li>
          <li>
            <strong>Official registers</strong> — the US Federal Register, GOV.UK, UK Parliament Bills, EUR-Lex and Brazil&rsquo;s Chamber of
            Deputies.
          </li>
        </ul>
        <p>
          <strong>Schedule:</strong> RSS feeds and website scans are checked on the <strong>first Friday of each month</strong> (Singapore time).
          Official registers are checked hourly.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Market</th>
                <th>Regulator</th>
                <th>Coverage</th>
                <th>Collection</th>
              </tr>
            </thead>
            <tbody>
              {REGULATOR_FEEDS.map((f) => (
                <tr key={f.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {JURISDICTIONS.find((j) => j.code === f.jurisdiction)?.flag} {f.jurisdiction}
                  </td>
                  <td>
                    <a href={f.scan?.url ?? f.page} target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)", textDecoration: "underline" }}>
                      {f.regulator}
                    </a>
                  </td>
                  <td>{f.feed}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{collectionMethod(f)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
