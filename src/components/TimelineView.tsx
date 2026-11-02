"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DEVELOPMENTS } from "@/data";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { formatDate, isUpcoming, timelineItems } from "@/lib/query";
import { ImpactBadge, JurTag, TopicChip } from "./DevCard";

type Mode = "upcoming" | "past" | "all";

export default function TimelineView() {
  const [today, setToday] = useState<string>("");
  const [mode, setMode] = useState<Mode>("upcoming");
  const [j, setJ] = useState<string>("");
  const [t, setT] = useState<string>("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  const items = useMemo(() => {
    let all = timelineItems(DEVELOPMENTS);
    if (j) all = all.filter((i) => i.dev.jurisdiction === j);
    if (t) all = all.filter((i) => i.dev.topics.includes(t as never));
    if (!today) return all;
    if (mode === "upcoming") return all.filter((i) => isUpcoming(i.date, today));
    if (mode === "past") return all.filter((i) => !isUpcoming(i.date, today)).reverse();
    return all;
  }, [j, t, mode, today]);

  let lastYear = "";
  return (
    <div className="stack">
      <div className="panel toolbar" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="pill-toggle" role="group" aria-label="Period">
          {(["upcoming", "past", "all"] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
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
        </div>
      </div>

      {items.length === 0 ? (
        <div className="panel empty">No key dates for this selection.</div>
      ) : (
        <div className="tl">
          {items.map((i) => {
            const y = i.date.slice(0, 4);
            const header = y !== lastYear ? <div className="tl-year">{y}</div> : null;
            lastYear = y;
            const past = today ? !isUpcoming(i.date, today) : false;
            return (
              <div key={i.dev.id + i.date + i.label}>
                {header}
                <div className={`panel tl-item ${past ? "past" : ""}`}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="row">
                      <strong className="small">{formatDate(i.date)}</strong>
                      <JurTag code={i.dev.jurisdiction} />
                    </div>
                    <ImpactBadge impact={i.dev.impact} />
                  </div>
                  <div style={{ margin: "4px 0 6px", fontWeight: 600 }}>{i.label}</div>
                  <div className="row">
                    <Link href={`/x/developments/${i.dev.id}`} className="small muted">
                      {i.dev.title}
                    </Link>
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    {i.dev.topics.map((x) => (
                      <TopicChip key={x} id={x} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
