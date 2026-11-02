import { aggregate } from "@/feeds/aggregate";
import FeedView from "@/components/FeedView";

export const metadata = { title: "Live feed · Sustainability Tracker" };
// Regenerate at most once an hour (incremental static regeneration).
export const revalidate = 3600;

export default async function FeedPage() {
  const result = await aggregate();
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Live feed</div>
          <h1>Incoming items for triage</h1>
          <p>
            Pulled automatically from official registers, regulator feeds, legislatures, court records and news monitoring, then filtered for
            sustainability relevance. Topics are keyword suggestions. Nothing here has been reviewed: promote items worth tracking into the curated
            dataset.
          </p>
        </div>
      </div>
      <FeedView result={result} />
    </>
  );
}
