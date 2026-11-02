import { Suspense } from "react";
import Explorer from "@/components/Explorer";

export const metadata = { title: "Developments · Sustainability Tracker" };

export default function DevelopmentsPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Developments</div>
          <h1>All developments</h1>
          <p>Filter by topic, market, impact, status, audience and instrument type. Filters are saved in the URL so views can be bookmarked and shared.</p>
        </div>
      </div>
      <Suspense fallback={<div className="panel empty">Loading…</div>}>
        <Explorer />
      </Suspense>
    </>
  );
}
