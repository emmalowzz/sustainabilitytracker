import Link from "next/link";
import type { Development } from "@/lib/types";
import type { Impact, Status } from "@/lib/taxonomy";
import { jurisdiction, topic } from "@/lib/taxonomy";
import { formatDate } from "@/lib/query";

export function ImpactBadge({ impact }: { impact: Impact }) {
  const cls = impact === "High" ? "badge-high" : impact === "Medium" ? "badge-med" : "badge-low";
  return <span className={`badge ${cls}`}>{impact} impact</span>;
}

const STATUS_DOT: Record<Status, string> = {
  Proposed: "var(--t6)",
  Consultation: "var(--t6)",
  Adopted: "var(--t5)",
  "Phasing in": "var(--accent)",
  "In force": "var(--accent)",
  Ongoing: "var(--t4)",
  Decided: "var(--muted)",
  "Paused / Withdrawn": "var(--high)",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="badge badge-status">
      <span className="nav-dot" style={{ background: STATUS_DOT[status] }} />
      {status}
    </span>
  );
}

export function TopicChip({ id }: { id: string }) {
  const t = topic(id);
  if (!t) return null;
  return (
    <Link href={`/x/topics/${t.id}`} className="topic-chip">
      <span className="nav-dot" style={{ background: t.color }} />
      {t.short}
    </Link>
  );
}

export function JurTag({ code }: { code: string }) {
  const j = jurisdiction(code);
  if (!j) return null;
  return (
    <Link href={`/x/jurisdictions/${j.code}`} className="jur-tag">
      <span aria-hidden>{j.flag}</span>
      {j.name}
    </Link>
  );
}

export default function DevCard({ dev, open = false }: { dev: Development; open?: boolean }) {
  return (
    <article className="dev" id={dev.id}>
      <div className="dev-top">
        <div className="row">
          <JurTag code={dev.jurisdiction} />
          <span className="muted small">· {dev.type}</span>
          <span className="muted small">· {dev.authority}</span>
        </div>
        <span className="dev-date">{formatDate(dev.date)}</span>
      </div>
      <h3 className="dev-title">
        <Link href={`/x/developments/${dev.id}`}>{dev.title}</Link>
      </h3>
      <div className="row">
        <StatusBadge status={dev.status} />
        <ImpactBadge impact={dev.impact} />
        {dev.topics.map((t) => (
          <TopicChip key={t} id={t} />
        ))}
      </div>
      <p className="dev-summary">{dev.summary}</p>
      <details open={open}>
        <summary>Details, key dates & sources</summary>
        <div className="dev-detail">
          {dev.implications && (
            <div className="callout">
              <strong className="small">What it means for us: </strong>
              {dev.implications}
            </div>
          )}
          {dev.keyDates && dev.keyDates.length > 0 && (
            <div>
              <div className="small muted" style={{ marginBottom: 4 }}>Key dates</div>
              <ul className="kd-list">
                {dev.keyDates.map((k) => (
                  <li key={k.date + k.label}>
                    <span className="d">{formatDate(k.date)}</span>
                    <span>{k.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="small">
            <span className="muted">Applies to: </span>
            {dev.appliesTo.join(" · ")}
          </div>
          <div className="small src">
            <span className="muted">Sources: </span>
            {dev.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}
