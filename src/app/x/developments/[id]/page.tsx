import Link from "next/link";
import { notFound } from "next/navigation";
import { DEVELOPMENTS } from "@/data";
import DevCard from "@/components/DevCard";

export function generateStaticParams() {
  return DEVELOPMENTS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = DEVELOPMENTS.find((x) => x.id === id);
  return { title: d ? `${d.title} · Sustainability Tracker` : "Not found" };
}

export default async function DevelopmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dev = DEVELOPMENTS.find((d) => d.id === id);
  if (!dev) notFound();
  const related = DEVELOPMENTS.filter((d) => d.id !== dev.id && d.topics.some((t) => dev.topics.includes(t)) && d.jurisdiction !== dev.jurisdiction).slice(0, 4);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Link href="/x/developments">Developments</Link> / {dev.jurisdiction}
          </div>
        </div>
      </div>
      <section className="panel" style={{ marginBottom: 16 }}>
        <DevCard dev={dev} open />
      </section>
      {related.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Comparable developments in other markets</h2>
          </div>
          {related.map((d) => (
            <DevCard key={d.id} dev={d} />
          ))}
        </section>
      )}
    </>
  );
}
