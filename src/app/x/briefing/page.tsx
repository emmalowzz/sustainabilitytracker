import { Suspense } from "react";
import BriefingBuilder from "@/components/BriefingBuilder";

export const metadata = { title: "Briefing pack · Sustainability Tracker" };

export default function BriefingPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Briefing pack</div>
          <h1>Build a briefing pack</h1>
          <p>
            Choose markets, topics and the period, then fine-tune the items. The pack builds itself from the curated dataset: cover, executive
            summary, heatmap, deadlines, detailed developments and sources. Print to PDF, download for Word, or share the configuration as a link.
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="panel empty">Loading…</div>}>
        <BriefingBuilder />
      </Suspense>
    </>
  );
}
