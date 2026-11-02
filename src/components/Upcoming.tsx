"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEVELOPMENTS } from "@/data";
import { jurisdiction } from "@/lib/taxonomy";
import { formatDate, isUpcoming, timelineItems } from "@/lib/query";
import type { Development } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Upcoming key dates, computed in the browser so the list never goes stale between builds. */
export default function Upcoming({ devs = DEVELOPMENTS, limit = 8 }: { devs?: Development[]; limit?: number }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);
  if (!today) return <div className="muted small">Loading…</div>;

  const items = timelineItems(devs)
    .filter((i) => isUpcoming(i.date, today))
    .slice(0, limit);

  if (!items.length) return <div className="muted small">No upcoming key dates recorded.</div>;
  return (
    <div>
      {items.map((i) => {
        const j = jurisdiction(i.dev.jurisdiction);
        return (
          <div className="up" key={i.dev.id + i.date + i.label}>
            <div className="up-date">{formatDate(i.date)}</div>
            <div>
              <div className="up-label">
                {j?.flag} {i.label}
              </div>
              <Link href={`/x/developments/${i.dev.id}`} className="small muted">
                {i.dev.title}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
