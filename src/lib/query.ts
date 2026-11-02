import type { Development, KeyDate, PartialDate } from "./types";
import type { Audience, DevType, Impact, JurisdictionCode, Status, TopicId } from "./taxonomy";

export interface Filters {
  q: string;
  j: JurisdictionCode[];
  t: TopicId[];
  s: Status[];
  ty: DevType[];
  a: Audience[];
  i: Impact[];
  sort: "latest" | "oldest" | "impact" | "jurisdiction";
}

export const EMPTY_FILTERS: Filters = { q: "", j: [], t: [], s: [], ty: [], a: [], i: [], sort: "latest" };

/** Sortable key for "YYYY-MM" or "YYYY-MM-DD". */
export function dateKey(d: PartialDate): string {
  return d.length === 7 ? `${d}-00` : d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDate(d: PartialDate): string {
  const [y, m, day] = d.split("-");
  const mon = MONTHS[Number(m) - 1];
  return day ? `${Number(day)} ${mon} ${y}` : `${mon} ${y}`;
}

const IMPACT_RANK: Record<Impact, number> = { High: 0, Medium: 1, Low: 2 };

export function applyFilters(devs: Development[], f: Filters): Development[] {
  const q = f.q.trim().toLowerCase();
  const out = devs.filter((d) => {
    if (f.j.length && !f.j.includes(d.jurisdiction)) return false;
    if (f.t.length && !d.topics.some((t) => f.t.includes(t))) return false;
    if (f.s.length && !f.s.includes(d.status)) return false;
    if (f.ty.length && !f.ty.includes(d.type)) return false;
    if (f.a.length && !d.appliesTo.some((a) => f.a.includes(a))) return false;
    if (f.i.length && !f.i.includes(d.impact)) return false;
    if (q) {
      const hay = `${d.title} ${d.summary} ${d.authority} ${d.implications ?? ""}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  return sortDevs(out, f.sort);
}

export function sortDevs(devs: Development[], sort: Filters["sort"]): Development[] {
  const arr = [...devs];
  switch (sort) {
    case "oldest":
      return arr.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
    case "impact":
      return arr.sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || dateKey(b.date).localeCompare(dateKey(a.date)));
    case "jurisdiction":
      return arr.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || dateKey(b.date).localeCompare(dateKey(a.date)));
    default:
      return arr.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
  }
}

export interface TimelineItem extends KeyDate {
  dev: Development;
}

export function timelineItems(devs: Development[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const dev of devs) for (const kd of dev.keyDates ?? []) items.push({ ...kd, dev });
  return items.sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
}

/** Compare a partial date against today's "YYYY-MM-DD". Month-only dates count as upcoming through that month. */
export function isUpcoming(d: PartialDate, today: string): boolean {
  if (d.length === 7) return d >= today.slice(0, 7);
  return d >= today;
}

// ── URL <-> filter serialisation ──
const LIST_KEYS = ["j", "t", "s", "ty", "a", "i"] as const;

export function filtersFromParams(p: URLSearchParams): Filters {
  const f: Filters = { ...EMPTY_FILTERS, q: p.get("q") ?? "", sort: (p.get("sort") as Filters["sort"]) || "latest" };
  for (const k of LIST_KEYS) {
    const v = p.get(k);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f as any)[k] = v ? v.split(",").filter(Boolean) : [];
  }
  return f;
}

export function filtersToParams(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const k of LIST_KEYS) if (f[k].length) p.set(k, f[k].join(","));
  if (f.sort !== "latest") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s.replace(/%2C/g, ",")}` : "";
}

export function toCSV(devs: Development[]): string {
  const cols = ["Jurisdiction", "Title", "Topics", "Type", "Status", "Impact", "Authority", "Latest milestone", "Key dates", "Applies to", "Summary", "Implications", "Sources"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = devs.map((d) =>
    [
      d.jurisdiction,
      d.title,
      d.topics.join("; "),
      d.type,
      d.status,
      d.impact,
      d.authority,
      d.date,
      (d.keyDates ?? []).map((k) => `${k.date}: ${k.label}`).join("; "),
      d.appliesTo.join("; "),
      d.summary,
      d.implications ?? "",
      d.sources.map((s) => s.url).join(" "),
    ]
      .map((v) => esc(String(v)))
      .join(","),
  );
  return [cols.join(","), ...rows].join("\n");
}
