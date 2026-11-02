import Link from "next/link";
import { DEVELOPMENTS, PROFILES } from "@/data";
import { JURISDICTIONS } from "@/lib/taxonomy";

export const metadata = { title: "Jurisdictions · Sustainability Tracker" };

export default function JurisdictionsPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Jurisdictions</div>
          <h1>Markets</h1>
          <p>Regulatory posture and tracked developments for each priority market, plus international standard-setters for context.</p>
        </div>
      </div>
      <div className="grid grid-3">
        {JURISDICTIONS.map((j) => {
          const prof = PROFILES.find((p) => p.code === j.code);
          const devs = DEVELOPMENTS.filter((d) => d.jurisdiction === j.code);
          const high = devs.filter((d) => d.impact === "High").length;
          return (
            <Link key={j.code} href={`/x/jurisdictions/${j.code}`} className="panel jcard">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <span className="jflag" aria-hidden>{j.flag}</span>
                  <h2>{j.name}</h2>
                </div>
                <span className="muted small">{j.region}</span>
              </div>
              <p className="small">{prof?.headline ?? "Global standard-setters and cross-border developments relevant to all markets."}</p>
              <div className="row small muted" style={{ marginTop: "auto" }}>
                <span>{devs.length} developments</span>·<span>{high} high impact</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
