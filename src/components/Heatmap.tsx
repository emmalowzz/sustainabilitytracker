import Link from "next/link";
import { DEVELOPMENTS, PROFILES } from "@/data";
import { JURISDICTIONS, PRIORITY_CODES, TOPICS } from "@/lib/taxonomy";
import type { PostureLevel } from "@/lib/types";

export const LEVEL_CLASS: Record<PostureLevel, string> = {
  Mandatory: "lvl-Mandatory",
  "Phasing in": "lvl-Phasing",
  Active: "lvl-Active",
  "Voluntary / Comply-or-explain": "lvl-Voluntary",
  Proposed: "lvl-Proposed",
  Limited: "lvl-Limited",
  Retreating: "lvl-Retreating",
};

export function Legend() {
  return (
    <div className="legend">
      {(Object.keys(LEVEL_CLASS) as PostureLevel[]).map((l) => (
        <span key={l}>
          <i className={LEVEL_CLASS[l]} />
          {l}
        </span>
      ))}
    </div>
  );
}

/** Market × topic matrix: colour = regulatory posture, number = tracked developments. */
export default function Heatmap() {
  const markets = JURISDICTIONS.filter((j) => PRIORITY_CODES.includes(j.code));
  return (
    <>
      <div className="heat-wrap">
        <table className="heat">
          <thead>
            <tr>
              <th />
              {TOPICS.map((t) => (
                <th key={t.id}>
                  <Link href={`/x/topics/${t.id}`}>{t.short}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.map((j) => {
              const prof = PROFILES.find((p) => p.code === j.code);
              return (
                <tr key={j.code}>
                  <th className="rowh" scope="row">
                    <Link href={`/x/jurisdictions/${j.code}`}>
                      {j.flag} {j.name}
                    </Link>
                  </th>
                  {TOPICS.map((t) => {
                    const n = DEVELOPMENTS.filter((d) => d.jurisdiction === j.code && d.topics.includes(t.id)).length;
                    const p = prof?.posture[t.id];
                    const cls = p ? LEVEL_CLASS[p.level] : "lvl-Limited";
                    return (
                      <td key={t.id}>
                        <Link
                          href={`/x/developments?j=${j.code}&t=${t.id}`}
                          className={`cell ${cls}`}
                          title={`${j.name} — ${t.name}\n${p ? `${p.level}: ${p.note}` : "No posture recorded"}\n${n} tracked development(s)`}
                        >
                          <b>{n}</b>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Legend />
    </>
  );
}
