"use client";

import { useMemo, useState } from "react";
import type { FeedResult } from "@/feeds/aggregate";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/query";
import { JurTag, TopicChip } from "./DevCard";

export default function FeedView({ result }: { result: FeedResult }) {
  const [j, setJ] = useState("");
  const [t, setT] = useState("");
  const [src, setSrc] = useState("");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return result.items.filter(
      (i) =>
        (!j || i.jurisdiction === j) &&
        (!t || i.topics.includes(t as never)) &&
        (!src || i.sourceId === src) &&
        (!words.length || words.every((w) => `${i.title} ${i.summary ?? ""}`.toLowerCase().includes(w))),
    );
  }, [result.items, j, t, src, q]);

  const okCount = result.sources.filter((s) => s.ok).length;

  return (
    <div className="split">
      <section className="panel">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 260 }} type="search" placeholder="Search feed…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="row">
            <select className="select" style={{ width: "auto" }} value={j} onChange={(e) => setJ(e.target.value)} aria-label="Market">
              <option value="">All markets</option>
              {JURISDICTIONS.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.flag} {x.name}
                </option>
              ))}
            </select>
            <select className="select" style={{ width: "auto" }} value={t} onChange={(e) => setT(e.target.value)} aria-label="Topic">
              <option value="">All topics</option>
              {TOPICS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.short}
                </option>
              ))}
            </select>
            <select className="select" style={{ width: "auto" }} value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source">
              <option value="">All sources</option>
              {result.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="toolbar small muted" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {items.length} of {result.items.length} items since {formatDate(result.since)} · refreshed {new Date(result.generatedAt).toUTCString()}
        </div>
        {items.length === 0 ? (
          <div className="empty">
            {result.items.length === 0 ? "No items were retrieved — check the source status panel." : "No items match these filters."}
          </div>
        ) : (
          items.map((i) => (
            <article className="dev" key={i.id}>
              <div className="dev-top">
                <div className="row">
                  <JurTag code={i.jurisdiction} />
                  <span className="muted small">· {i.kind}</span>
                  <span className="muted small">· {i.sourceName}</span>
                </div>
                {i.date && <span className="dev-date">{formatDate(i.date)}</span>}
              </div>
              <h3 className="dev-title">
                <a href={i.url} target="_blank" rel="noopener noreferrer">
                  {i.title} ↗
                </a>
              </h3>
              {i.topics.length > 0 && (
                <div className="row">
                  {i.topics.map((x) => (
                    <TopicChip key={x} id={x} />
                  ))}
                </div>
              )}
              {i.summary && <p className="dev-summary small muted">{i.summary}</p>}
            </article>
          ))
        )}
      </section>

      <aside className="stack">
        <section className="panel">
          <div className="panel-head">
            <h2>Source status</h2>
            <span className="small muted">
              {okCount}/{result.sources.length} responding
            </span>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 10 }}>
            {result.sources.map((s) => (
              <div key={s.id} className="small" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="row">
                    <span className="nav-dot" style={{ background: s.ok ? "var(--accent)" : s.skipped ? "var(--muted)" : "var(--high)" }} />
                    <a href={s.docs} target="_blank" rel="noopener noreferrer">
                      {s.name}
                    </a>
                  </span>
                  <span className="muted">{s.ok ? `${s.count} / ${s.fetched}` : s.skipped ? "off" : "error"}</span>
                </div>
                {s.confidence === "likely" && <div className="muted">Feed URL to confirm</div>}
                {s.skipped && <div className="muted">{s.skipped}</div>}
                {s.error && <div style={{ color: "var(--high)" }}>{s.error}</div>}
              </div>
            ))}
            <div className="small muted">Counts show relevant / fetched items.</div>
          </div>
        </section>
      </aside>
    </div>
  );
}
