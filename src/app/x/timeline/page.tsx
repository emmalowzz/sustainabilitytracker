import TimelineView from "@/components/TimelineView";

export const metadata = { title: "Timeline · Sustainability Tracker" };

export default function TimelinePage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Timeline</div>
          <h1>Key dates & deadlines</h1>
          <p>Effective dates, compliance deadlines and transposition dates drawn from every tracked development.</p>
        </div>
      </div>
      <TimelineView />
    </>
  );
}
