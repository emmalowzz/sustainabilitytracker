import Link from "next/link";
import { CONTENT_AS_OF, DEVELOPMENTS } from "@/data";
import DevCard from "@/components/DevCard";
import Heatmap from "@/components/Heatmap";
import Upcoming from "@/components/Upcoming";
import RegulatorUpdates from "@/components/RegulatorUpdates";

// Regulator feeds are refreshed at most hourly.
export const revalidate = 3600;
import { PRIORITY_CODES, TOPICS } from "@/lib/taxonomy";
import { sortDevs } from "@/lib/query";

export default function OverviewPage() {
  const priority = DEVELOPMENTS.filter((d) => PRIORITY_CODES.includes(d.jurisdiction));
  const high = priority.filter((d) => d.impact === "High").length;
  const live = priority.filter((d) => d.status === "Phasing in" || d.status === "In force").length;
  const pipeline = priority.filter((d) => d.status === "Proposed" || d.status === "Consultation").length;
  const latest = sortDevs(DEVELOPMENTS, "latest").slice(0, 6);
  const maxTopic = Math.max(...TOPICS.map((t) => priority.filter((d) => d.topics.includes(t.id)).length));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Sustainability regulatory tracker</h1>
          <p>
            Disclosure, workplace, litigation, enforcement, sustainable finance and governance developments across ten priority markets —
            Singapore, Japan, Korea, Australia, India, China, the US, Brazil, the UK and the EU.
          </p>
        </div>
        <div className="row">
          <Link href="/x/developments" className="btn">
            Explore developments
          </Link>
          <Link href="/x/briefing" className="btn btn-green">
            Build briefing pack →
          </Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="panel stat">
          <div className="stat-label">Tracked developments</div>
          <div className="stat-value">{priority.length}</div>
          <div className="stat-note">across 10 priority markets</div>
        </div>
        <div className="panel stat red">
          <div className="stat-label">High impact</div>
          <div className="stat-value">{high}</div>
          <div className="stat-note">flagged for asset managers</div>
        </div>
        <div className="panel stat">
          <div className="stat-label">In force / phasing in</div>
          <div className="stat-value">{live}</div>
          <div className="stat-note">live obligations or regimes</div>
        </div>
        <div className="panel stat navy">
          <div className="stat-label">In the pipeline</div>
          <div className="stat-value">{pipeline}</div>
          <div className="stat-note">proposals & consultations</div>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div>
            <h2>Market × topic heatmap</h2>
            <div className="small muted">Colour = regulatory posture · number = tracked developments · click a cell to filter</div>
          </div>
          <Link href="/x/jurisdictions">Compare markets →</Link>
        </div>
        <div className="panel-body">
          <Heatmap />
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Latest developments</h2>
            <Link href="/x/developments">View all →</Link>
          </div>
          {latest.map((d) => (
            <DevCard key={d.id} dev={d} />
          ))}
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Upcoming deadlines</h2>
              <Link href="/x/timeline">Timeline →</Link>
            </div>
            <div className="panel-body">
              <Upcoming limit={8} />
            </div>
          </section>

          <RegulatorUpdates limit={6} />

          <section className="panel">
            <div className="panel-head">
              <h2>By topic</h2>
            </div>
            <div className="panel-body">
              {TOPICS.map((t) => {
                const n = priority.filter((d) => d.topics.includes(t.id)).length;
                return (
                  <Link key={t.id} href={`/x/topics/${t.id}`} className="bar-row">
                    <span>{t.short}</span>
                    <span className="bar-track">
                      <span className="bar-fill" style={{ width: `${(n / maxTopic) * 100}%`, background: t.color, display: "block" }} />
                    </span>
                    <span className="bar-n">{n}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="disclaimer">
            Seeded content reflects developments known as of {CONTENT_AS_OF}. It is a monitoring aid, not legal advice — confirm against the
            linked primary sources before relying on any item. See <Link href="/x/about" style={{ textDecoration: "underline" }}>Methodology</Link>.
          </div>
        </div>
      </div>
    </>
  );
}
