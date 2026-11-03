import Link from "next/link";
import { aggregate, OFFICIAL_KINDS } from "@/feeds/aggregate";
import { REGULATOR_FEEDS, STATUS_LABEL } from "@/feeds/regulators";
import { jurisdiction } from "@/lib/taxonomy";
import { formatDate } from "@/lib/query";
import { TopicChip } from "./DevCard";

/**
 * Sustainability-relevant items from regulators' RSS feeds and official registers.
 * Server component: fetched at render time and cached for an hour (pages using it set `revalidate`).
 */
export default async function RegulatorUpdates({ code, limit = 8 }: { code?: string; limit?: number }) {
  const result = await aggregate({ kinds: OFFICIAL_KINDS, jurisdictions: code ? [code] : undefined });
  const items = result.items.slice(0, limit);
  const ok = result.sources.filter((s) => s.ok).length;
  const withoutFeed = REGULATOR_FEEDS.filter((f) => (!code || f.jurisdiction === code) && !f.url);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Regulator updates</h2>
          <div className="small muted">Sustainability-related items from regulator feeds, last {Math.round((Date.parse(result.generatedAt) - Date.parse(result.since)) / 86400000)} days · unreviewed</div>
        </div>
      </div>
      <div className="panel-body">
        {items.length === 0 ? (
          <p className="small muted">
            {result.sources.length === 0
              ? "No regulator in this market publishes an RSS feed — see the regulator pages below."
              : ok === 0
                ? "Regulator feeds could not be reached when this page was generated."
                : "No sustainability-related items in the feeds for this period."}
          </p>
        ) : (
          items.map((i) => (
            <div className="up" key={i.id}>
              <div className="up-date">{i.date ? formatDate(i.date) : "—"}</div>
              <div>
                <a href={i.url} target="_blank" rel="noopener noreferrer" className="up-label" style={{ fontWeight: 600 }}>
                  {i.title} ↗
                </a>
                <div className="small muted">
                  {!code && `${jurisdiction(i.jurisdiction)?.flag ?? ""} `}
                  {i.sourceName}
                </div>
                {i.topics.length > 0 && (
                  <div className="row" style={{ marginTop: 4 }}>
                    {i.topics.map((t) => (
                      <TopicChip key={t} id={t} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <details style={{ marginTop: 12 }}>
          <summary className="small" style={{ cursor: "pointer", color: "var(--link)" }}>
            Feed status: {ok} of {result.sources.length} responding
            {withoutFeed.length > 0 && ` · ${withoutFeed.length} regulator${withoutFeed.length === 1 ? "" : "s"} without a usable feed`}
          </summary>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {result.sources.map((s) => (
              <div key={s.id} className="small" style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 8, alignItems: "baseline" }}>
                <span className="nav-dot" style={{ background: s.ok ? "var(--green)" : "var(--high)" }} />
                <a href={s.docs} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
                <span className="muted" title={s.error ?? s.skipped} style={{ whiteSpace: "nowrap" }}>
                  {s.ok ? `${s.count} relevant` : s.skipped ? "off" : "unreachable"}
                </span>
              </div>
            ))}
            {withoutFeed.map((f) => (
              <div key={f.id} className="small" style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 8, alignItems: "baseline" }}>
                <span className="nav-dot" style={{ background: "var(--muted)" }} />
                <a href={f.page} target="_blank" rel="noopener noreferrer" title={f.note ?? f.evidence}>
                  {f.regulator}
                </a>
                <span className="muted" style={{ whiteSpace: "nowrap" }}>
                  {STATUS_LABEL[f.status]}
                </span>
              </div>
            ))}
            <Link href="/x/about#regulator-feeds" className="small" style={{ color: "var(--link)" }}>
              Full regulator feed coverage →
            </Link>
          </div>
        </details>
      </div>
    </section>
  );
}
