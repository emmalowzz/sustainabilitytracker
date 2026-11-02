import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEVELOPMENTS, PROFILES } from "@/data";
import Explorer from "@/components/Explorer";
import { LEVEL_CLASS } from "@/components/Heatmap";
import { JURISDICTIONS, PRIORITY_CODES, TOPICS } from "@/lib/taxonomy";

export function generateStaticParams() {
  return TOPICS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TOPICS.find((x) => x.id === id);
  return { title: `${t?.short ?? "Topic"} · Sustainability Tracker` };
}

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TOPICS.find((x) => x.id === id);
  if (!t) notFound();
  const devs = DEVELOPMENTS.filter((d) => d.topics.includes(t.id));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Topic</div>
          <h1>
            <span className="nav-dot" style={{ background: t.color, display: "inline-block", width: 12, height: 12, marginRight: 10 }} />
            {t.name}
          </h1>
          <p>{t.description}</p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <h2>Cross-market comparison</h2>
        </div>
        <div className="panel-body grid grid-2" style={{ gap: 8 }}>
          {JURISDICTIONS.filter((j) => PRIORITY_CODES.includes(j.code)).map((j) => {
            const p = PROFILES.find((x) => x.code === j.code)?.posture[t.id];
            return (
              <Link key={j.code} href={`/x/jurisdictions/${j.code}`} className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span>
                  {j.flag} {j.name}
                </span>
                <span className="row">
                  <span className="small muted">{p?.note}</span>
                  <span className={`cell ${p ? LEVEL_CLASS[p.level] : "lvl-Limited"}`} style={{ display: "inline-flex", height: "auto", padding: "2px 8px", fontWeight: 600 }}>
                    {p?.level ?? "—"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Suspense fallback={<div className="panel empty">Loading…</div>}>
        <Explorer base={devs} hide={["t"]} />
      </Suspense>
    </>
  );
}
