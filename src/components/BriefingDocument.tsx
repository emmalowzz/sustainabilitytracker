import type { Pack, SectionId } from "@/lib/briefing";
import { addMonths, postureFor } from "@/lib/briefing";
import { jurisdiction, topic } from "@/lib/taxonomy";
import { formatDate } from "@/lib/query";
import type { Development, PostureLevel } from "@/lib/types";
import type { FeedItem } from "@/feeds/types";

const LEVEL: Record<PostureLevel, string> = {
  Mandatory: "bp-lvl-Mandatory",
  "Phasing in": "bp-lvl-Phasing",
  "Voluntary / Comply-or-explain": "bp-lvl-Voluntary",
  Active: "bp-lvl-Active",
  Proposed: "bp-lvl-Proposed",
  Limited: "bp-lvl-Limited",
  Retreating: "bp-lvl-Retreating",
};

function Leaf() {
  return (
    <svg className="bp-leaf" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2>{children}</h2>
      <div className="bp-h2-rule" />
    </>
  );
}

function Foot({ p, label }: { p: Pack; label: string }) {
  return (
    <div className="bp-pagefoot">
      <span>
        {p.config.title} · {p.config.cls}
      </span>
      <span>{label}</span>
    </div>
  );
}

function ImpactTag({ d }: { d: Development }) {
  const cls = d.impact === "High" ? "high" : d.impact === "Medium" ? "med" : "low";
  return <span className={`bp-tag ${cls}`}>{d.impact} impact</span>;
}

function Item({ d }: { d: Development }) {
  return (
    <div className="bp-item">
      <div className="bp-item-meta">
        {jurisdiction(d.jurisdiction)?.flag} {jurisdiction(d.jurisdiction)?.name} · {d.authority} · {d.type} · {formatDate(d.date)}
      </div>
      <h4>{d.title}</h4>
      <div style={{ margin: "4px 0" }}>
        <ImpactTag d={d} />
        <span className="bp-tag st">{d.status}</span>
        {d.topics.map((t) => (
          <span key={t} className="bp-tag" style={{ background: "#edf1f6", color: "#0b1f3a" }}>
            {topic(t)?.short}
          </span>
        ))}
      </div>
      <p>{d.summary}</p>
      {d.implications && (
        <div className="bp-impl">
          <strong>What it means for us: </strong>
          {d.implications}
        </div>
      )}
      {d.keyDates && d.keyDates.length > 0 && (
        <p className="bp-small" style={{ marginTop: 6 }}>
          <strong>Key dates: </strong>
          {d.keyDates.map((k) => `${formatDate(k.date)} — ${k.label}`).join("; ")}
        </p>
      )}
      <p className="bp-small bp-muted" style={{ marginTop: 4 }}>
        Sources:{" "}
        {d.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a href={s.url}>{s.label}</a>
          </span>
        ))}
      </p>
    </div>
  );
}

export default function BriefingDocument({ p, updates = [], updatesNote }: { p: Pack; updates?: FeedItem[]; updatesNote?: string }) {
  const c = p.config;
  const has = (s: SectionId) => c.sections.includes(s);
  const sources = [...new Map(p.items.flatMap((d) => d.sources).map((s) => [s.url, s])).values()];
  const toc = [
    has("summary") && "Executive summary",
    has("heatmap") && "Regulatory heatmap",
    has("deadlines") && "Upcoming deadlines",
    has("detail") && `Detailed developments (by ${c.groupBy})`,
    has("updates") && "Recent regulator updates",
    has("sources") && "Sources appendix",
  ].filter(Boolean) as string[];

  return (
    <div className="bp" id="briefing-pack">
      {/* Cover */}
      <section className="bp-page bp-cover">
        <div className="bp-cover-band">
          <div className="bp-cover-kicker">Sustainability · ESG regulatory briefing</div>
          <h1>{c.title}</h1>
          <div className="bp-cover-sub">
            {p.markets.length === 10 ? "Ten priority markets" : p.markets.map((m) => m.name).join(", ")} · {formatDate(p.today)}
          </div>
        </div>
        <div className="bp-cover-body">
          <dl className="bp-meta">
            <dt>Prepared for</dt>
            <dd>{c.audience}</dd>
            <dt>Prepared by</dt>
            <dd>{c.author}</dd>
            <dt>Date</dt>
            <dd>{formatDate(p.today)}</dd>
            <dt>Period covered</dt>
            <dd>
              Developments since {formatDate(c.since)}; deadlines to {formatDate(addMonths(p.today, c.horizon))}
            </dd>
            <dt>Markets</dt>
            <dd>{p.markets.map((m) => m.name).join(", ")}</dd>
            <dt>Topics</dt>
            <dd>{p.topics.map((t) => t.short).join(", ")}</dd>
            <dt>Minimum impact</dt>
            <dd>{c.min === "Low" ? "All items" : `${c.min} and above`}</dd>
          </dl>
          <div className="bp-kpis">
            <div className="bp-kpi">
              <b>{p.stats.total}</b>
              <span>developments</span>
            </div>
            <div className="bp-kpi red">
              <b>{p.stats.high}</b>
              <span>high impact</span>
            </div>
            <div className="bp-kpi">
              <b>{p.stats.live}</b>
              <span>in force / phasing in</span>
            </div>
            <div className="bp-kpi navy">
              <b>{p.stats.deadlines}</b>
              <span>deadlines ahead</span>
            </div>
          </div>
          {toc.length > 0 && (
            <div>
              <h3 style={{ marginTop: 0 }}>Contents</h3>
              <ol className="bp-toc">
                {toc.map((t, i) => (
                  <li key={t}>
                    <span>
                      {i + 1}. {t}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div className="bp-cover-foot">
          <span className="bp-class">{c.cls}</span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <Leaf /> Monitoring aid — not legal advice. Verify against primary sources.
          </span>
        </div>
      </section>

      {/* Executive summary */}
      {has("summary") && (
        <section className="bp-page flow">
          <H2>Executive summary</H2>
          {c.notes && <div className="bp-notes">{c.notes}</div>}
          {p.summary.length ? (
            <ul>
              {p.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="bp-muted">No developments match the selected scope.</p>
          )}
          {p.priority.length > 0 && (
            <>
              <h3>Priority items for the firm</h3>
              <table className="bp-table">
                <thead>
                  <tr>
                    <th style={{ width: 72, whiteSpace: "nowrap" }}>Market</th>
                    <th style={{ width: "36%" }}>Development</th>
                    <th>What it means for us</th>
                  </tr>
                </thead>
                <tbody>
                  {p.priority.map((d) => (
                    <tr key={d.id}>
                      <td>
                        {jurisdiction(d.jurisdiction)?.flag} {d.jurisdiction}
                      </td>
                      <td>
                        <strong>{d.title}</strong>
                        <div className="bp-muted bp-small">{d.status}</div>
                      </td>
                      <td>{d.implications ?? d.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <Foot p={p} label="Executive summary" />
        </section>
      )}

      {/* Heatmap */}
      {has("heatmap") && (
        <section className="bp-page flow">
          <H2>Regulatory heatmap</H2>
          <p className="bp-muted" style={{ marginBottom: 10 }}>
            Colour shows each market&rsquo;s regulatory posture on the topic (greener = more established sustainability regime); the number is the developments in this pack.
          </p>
          <div className="bp-heat-wrap">
            <table className="bp-heat">
              <thead>
                <tr>
                  <th />
                  {p.topics.map((t) => (
                    <th key={t.id}>{t.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.markets.map((m) => (
                  <tr key={m.code}>
                    <th className="rowh">
                      {m.flag} {m.name}
                    </th>
                    {p.topics.map((t) => {
                      const pos = postureFor(m.code, t.id);
                      const n = p.items.filter((d) => d.jurisdiction === m.code && d.topics.includes(t.id)).length;
                      return (
                        <td key={t.id} className={pos ? LEVEL[pos.level] : "bp-lvl-Limited"} title={pos ? `${pos.level}: ${pos.note}` : ""}>
                          {n || "·"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bp-legend">
            {(Object.keys(LEVEL) as PostureLevel[]).map((l) => (
              <span key={l}>
                <i className={LEVEL[l]} />
                {l}
              </span>
            ))}
          </div>
          <Foot p={p} label="Regulatory heatmap" />
        </section>
      )}

      {/* Deadlines */}
      {has("deadlines") && (
        <section className="bp-page flow">
          <H2>Upcoming deadlines — next {c.horizon} months</H2>
          {p.deadlines.length ? (
            <table className="bp-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 72, whiteSpace: "nowrap" }}>Market</th>
                  <th>Milestone</th>
                  <th style={{ width: "34%" }}>Development</th>
                </tr>
              </thead>
              <tbody>
                {p.deadlines.map((k) => (
                  <tr key={k.dev.id + k.date + k.label}>
                    <td>
                      <strong>{formatDate(k.date)}</strong>
                    </td>
                    <td>
                      {jurisdiction(k.dev.jurisdiction)?.flag} {k.dev.jurisdiction}
                    </td>
                    <td>{k.label}</td>
                    <td className="bp-muted">{k.dev.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="bp-muted">No key dates in this window.</p>
          )}
          <Foot p={p} label="Upcoming deadlines" />
        </section>
      )}

      {/* Detail */}
      {has("detail") && (
        <section className="bp-page flow">
          <H2>Detailed developments</H2>
          {p.groups.map((g) => (
            <div key={g.key}>
              <h3>{g.title}</h3>
              {g.intro && <div className="bp-section-intro bp-small">{g.intro}</div>}
              {g.items.map((d) => (
                <Item key={d.id} d={d} />
              ))}
            </div>
          ))}
          {!p.groups.length && <p className="bp-muted">No developments in scope.</p>}
          <Foot p={p} label="Detailed developments" />
        </section>
      )}

      {/* Regulator updates */}
      {has("updates") && (
        <section className="bp-page flow">
          <H2>Recent regulator updates</H2>
          <p className="bp-muted bp-small" style={{ marginBottom: 8 }}>
            Items published by regulators in the selected markets since {formatDate(c.since)}, filtered automatically for sustainability relevance.
            These have not been reviewed; they are included for awareness.
          </p>
          {updates.length ? (
            <table className="bp-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Date</th>
                  <th style={{ width: 72, whiteSpace: "nowrap" }}>Market</th>
                  <th>Update</th>
                  <th style={{ width: "26%" }}>Regulator</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((u) => (
                  <tr key={u.id}>
                    <td>{u.date ? formatDate(u.date) : "—"}</td>
                    <td>
                      {jurisdiction(u.jurisdiction)?.flag} {u.jurisdiction}
                    </td>
                    <td>
                      <a href={u.url}>{u.title}</a>
                      {u.topics.length > 0 && <div className="bp-muted bp-small">{u.topics.map((t) => topic(t)?.short).join(" · ")}</div>}
                    </td>
                    <td className="bp-muted">{u.sourceName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="bp-muted">{updatesNote ?? "No regulator updates were retrieved for the selected markets and period."}</p>
          )}
          <Foot p={p} label="Regulator updates" />
        </section>
      )}

      {/* Sources */}
      {has("sources") && (
        <section className="bp-page flow">
          <H2>Sources appendix</H2>
          <ol className="bp-small">
            {sources.map((s) => (
              <li key={s.url}>
                {s.label} — <a href={s.url}>{s.url}</a>
              </li>
            ))}
          </ol>
          <p className="bp-small bp-muted" style={{ marginTop: 16 }}>
            Compiled from the Sustainability Tracker curated dataset. Content reflects developments recorded at the last dataset review and is a
            monitoring aid, not legal advice. Confirm the current position with the primary source before relying on any item.
          </p>
          <Foot p={p} label="Sources" />
        </section>
      )}
    </div>
  );
}
