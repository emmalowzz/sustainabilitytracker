import Link from "next/link";
import { notFound } from "next/navigation";
import { DEVELOPMENTS, PROFILES } from "@/data";
import DevCard from "@/components/DevCard";
import Upcoming from "@/components/Upcoming";
import { LEVEL_CLASS } from "@/components/Heatmap";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { sortDevs } from "@/lib/query";

export function generateStaticParams() {
  return JURISDICTIONS.map((j) => ({ code: j.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const j = JURISDICTIONS.find((x) => x.code === code);
  return { title: `${j?.name ?? "Jurisdiction"} · Sustainability Tracker` };
}

export default async function JurisdictionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const j = JURISDICTIONS.find((x) => x.code === code);
  if (!j) notFound();
  const prof = PROFILES.find((p) => p.code === j.code);
  const devs = sortDevs(DEVELOPMENTS.filter((d) => d.jurisdiction === j.code), "latest");

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Link href="/x/jurisdictions">Jurisdictions</Link> / {j.region}
          </div>
          <h1>
            {j.flag} {j.name}
          </h1>
          {prof && <p>{prof.headline}</p>}
          {prof && <p className="small">Key authorities: {prof.keyAuthorities.join(" · ")}</p>}
        </div>
        <Link href={`/x/developments?j=${j.code}`} className="btn">
          Filter in explorer →
        </Link>
      </div>

      <div className="split">
        <div className="stack">
          {prof && (
            <section className="panel">
              <div className="panel-head">
                <h2>Posture by topic</h2>
              </div>
              <div className="panel-body posture-list">
                {TOPICS.map((t) => {
                  const p = prof.posture[t.id];
                  const n = devs.filter((d) => d.topics.includes(t.id)).length;
                  return (
                    <div key={t.id} className="posture">
                      <Link href={`/x/developments?j=${j.code}&t=${t.id}`} className="row">
                        <span className="nav-dot" style={{ background: t.color }} />
                        {t.short} <span className="muted small">({n})</span>
                      </Link>
                      <span>
                        <span className={`cell ${p ? LEVEL_CLASS[p.level] : "lvl-Limited"}`} style={{ display: "inline-flex" }}>
                          {p?.level ?? "—"}
                        </span>
                      </span>
                      <span className="small muted">{p?.note ?? "No posture recorded"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {TOPICS.map((t) => {
            const list = devs.filter((d) => d.topics[0] === t.id);
            if (!list.length) return null;
            return (
              <section key={t.id} className="panel">
                <div className="panel-head">
                  <h2>
                    <span className="nav-dot" style={{ background: t.color, display: "inline-block", marginRight: 8 }} />
                    {t.name}
                  </h2>
                </div>
                {list.map((d) => (
                  <DevCard key={d.id} dev={d} />
                ))}
              </section>
            );
          })}
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Upcoming in {j.name}</h2>
            </div>
            <div className="panel-body">
              <Upcoming devs={devs} limit={10} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
