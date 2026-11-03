"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DEVELOPMENTS } from "@/data";
import { AUDIENCES, JURISDICTIONS, STATUSES, TOPICS, TYPES } from "@/lib/taxonomy";
import type { Development } from "@/lib/types";
import { EMPTY_FILTERS, applyFilters, filtersFromParams, filtersToParams, toCSV, type Filters } from "@/lib/query";
import DevCard from "./DevCard";

type ListKey = "j" | "t" | "s" | "ty" | "a" | "i";

function CheckGroup({
  title,
  k,
  options,
  filters,
  counts,
  toggle,
}: {
  title: string;
  k: ListKey;
  options: { value: string; label: string; dot?: string }[];
  filters: Filters;
  counts: Record<string, number>;
  toggle: (k: ListKey, v: string) => void;
}) {
  const selected = filters[k] as string[];
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      {options.map((o) => (
        <label key={o.value} className="check">
          <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(k, o.value)} />
          {o.dot && <span className="nav-dot" style={{ background: o.dot }} />}
          <span>{o.label}</span>
          <span className="cnt">{counts[o.value] ?? 0}</span>
        </label>
      ))}
    </div>
  );
}

function countBy(devs: Development[], fn: (d: Development) => string[]) {
  const c: Record<string, number> = {};
  for (const d of devs) for (const v of fn(d)) c[v] = (c[v] ?? 0) + 1;
  return c;
}

export default function Explorer({ base = DEVELOPMENTS, hide = [] }: { base?: Development[]; hide?: ListKey[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const results = useMemo(() => applyFilters(base, filters), [base, filters]);

  const update = (f: Filters) => router.replace(`${pathname}${filtersToParams(f)}`, { scroll: false });

  // Keep the search box responsive: local state, pushed to the URL after a short pause.
  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    if (q === filters.q) return;
    const id = setTimeout(() => update({ ...filters, q }), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const toggle = (k: ListKey, v: string) => {
    const cur = filters[k] as string[];
    update({ ...filters, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };

  // Facet counts reflect all other active filters (so users see how many results each option would yield).
  const facet = (k: ListKey, fn: (d: Development) => string[]) => countBy(applyFilters(base, { ...filters, [k]: [] }), fn);

  const download = () => {
    const blob = new Blob([toCSV(results)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sustainability-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = (["j", "t", "s", "ty", "a", "i"] as ListKey[]).reduce((n, k) => n + filters[k].length, 0) + (filters.q ? 1 : 0);

  return (
    <div className="explorer">
      <aside className="panel filters" aria-label="Filters">
        <input
          className="input"
          type="search"
          placeholder="Search title, summary, authority…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {!hide.includes("t") && (
          <CheckGroup
            title="Topic"
            k="t"
            options={TOPICS.map((t) => ({ value: t.id, label: t.short, dot: t.color }))}
            filters={filters}
            counts={facet("t", (d) => d.topics)}
            toggle={toggle}
          />
        )}
        {!hide.includes("j") && (
          <CheckGroup
            title="Market"
            k="j"
            options={JURISDICTIONS.map((j) => ({ value: j.code, label: `${j.flag} ${j.name}` }))}
            filters={filters}
            counts={facet("j", (d) => [d.jurisdiction])}
            toggle={toggle}
          />
        )}
        <CheckGroup
          title="Impact"
          k="i"
          options={["High", "Medium", "Low"].map((v) => ({ value: v, label: v }))}
          filters={filters}
          counts={facet("i", (d) => [d.impact])}
          toggle={toggle}
        />
        <CheckGroup
          title="Status"
          k="s"
          options={STATUSES.map((v) => ({ value: v, label: v }))}
          filters={filters}
          counts={facet("s", (d) => [d.status])}
          toggle={toggle}
        />
        <CheckGroup
          title="Applies to"
          k="a"
          options={AUDIENCES.map((v) => ({ value: v, label: v }))}
          filters={filters}
          counts={facet("a", (d) => d.appliesTo)}
          toggle={toggle}
        />
        <CheckGroup
          title="Instrument type"
          k="ty"
          options={TYPES.map((v) => ({ value: v, label: v }))}
          filters={filters}
          counts={facet("ty", (d) => [d.type])}
          toggle={toggle}
        />
      </aside>

      <section className="panel">
        <div className="toolbar">
          <div className="row">
            <strong>{results.length}</strong>
            <span className="muted">of {base.length} developments</span>
            {activeCount > 0 && (
              <button className="btn" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}>
                Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="row">
            <select
              className="select"
              style={{ width: "auto" }}
              value={filters.sort}
              onChange={(e) => update({ ...filters, sort: e.target.value as Filters["sort"] })}
              aria-label="Sort"
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="impact">Highest impact</option>
              <option value="jurisdiction">By market</option>
            </select>
            <a className="btn btn-green" href={`/x/briefing${filtersToParams({ ...EMPTY_FILTERS, j: filters.j, t: filters.t, i: filters.i })}`}>
              Build briefing from view
            </a>
            <button className="btn btn-primary" onClick={download}>
              Export CSV
            </button>
          </div>
        </div>
        {results.length ? results.map((d) => <DevCard key={d.id} dev={d} />) : <div className="empty">No developments match these filters.</div>}
      </section>
    </div>
  );
}
