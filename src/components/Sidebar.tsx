"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/query";

// ── Minimal stroke icons (24px grid), coloured with currentColor
const ICONS = {
  overview: "M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 3v8h8V3z",
  developments: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  timeline: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  markets: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  briefing: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  chevron: "M9 18l6-6-6-6",
} as const;

function Icon({ name, size = 17 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function LeafIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

const MAIN = [
  { href: "/x/overview", label: "Overview", icon: "overview" },
  { href: "/x/developments", label: "Developments", icon: "developments" },
  { href: "/x/timeline", label: "Timeline", icon: "timeline" },
  { href: "/x/jurisdictions", label: "Markets", icon: "markets" },
] as const;

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="side-section">
      <button className={`side-section-head ${open ? "open" : ""}`} onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open && <div className="side-section-body">{children}</div>}
    </div>
  );
}

interface ScanStatus {
  lastScan: string | null;
  lastScheduled: string;
  overdue: boolean;
  sourcesCollected: number;
  sourcesTotal: number;
  nextScan: string;
}

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const onTopic = path.startsWith("/x/topics/");
  const onMarket = path.startsWith("/x/jurisdictions/");
  const [topicsOpen, setTopicsOpen] = useState(onTopic);
  const [marketsOpen, setMarketsOpen] = useState(true);

  // Expand the group containing the current page when navigating into it.
  useEffect(() => {
    if (onTopic) setTopicsOpen(true);
    if (onMarket) setMarketsOpen(true);
  }, [onTopic, onMarket]);

  // Date of the last monthly regulator scan, read from the server so it stays current on every page.
  const [scan, setScan] = useState<ScanStatus | null>(null);
  useEffect(() => {
    fetch("/api/scan-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ScanStatus | null) => d && setScan(d))
      .catch(() => {});
  }, []);

  const isActive = (href: string) => path === href || (href !== "/x/overview" && path.startsWith(href + "/"));
  const close = () => setOpen(false);

  const brand = (
    <Link href="/x/overview" className="brand" onClick={close}>
      <div className="brand-mark">
        <LeafIcon />
      </div>
      <div>
        <div className="brand-name">Sustainability Tracker</div>
        <div className="brand-sub">ESG regulatory intelligence</div>
      </div>
    </Link>
  );

  return (
    <>
      <div className="mobile-bar">
        {brand}
        <button className="btn" onClick={() => setOpen(true)} aria-label="Open menu">
          Menu
        </button>
      </div>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-top">
          {brand}
          {open && (
            <button className="btn" onClick={close}>
              Close
            </button>
          )}
        </div>

        <Link href="/x/briefing" className={`side-cta ${isActive("/x/briefing") ? "active" : ""}`} onClick={close}>
          <Icon name="briefing" />
          <span>Build briefing pack</span>
        </Link>

        <nav className="side-nav" aria-label="Main">
          {MAIN.map((n) => (
            <Link key={n.href} href={n.href} className={`side-link ${isActive(n.href) && !(n.href === "/x/jurisdictions" && onMarket) ? "active" : ""}`} onClick={close}>
              <Icon name={n.icon} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="side-divider" />

        <Section title="Topics" open={topicsOpen} onToggle={() => setTopicsOpen(!topicsOpen)}>
          <nav className="side-nav" aria-label="Topics">
            {TOPICS.map((t) => (
              <Link key={t.id} href={`/x/topics/${t.id}`} className={`side-link sub ${path === `/x/topics/${t.id}` ? "active" : ""}`} onClick={close}>
                <span className="side-dot" style={{ background: t.color }} />
                {t.short}
              </Link>
            ))}
          </nav>
        </Section>

        <Section title="Markets" open={marketsOpen} onToggle={() => setMarketsOpen(!marketsOpen)}>
          <nav className="market-grid" aria-label="Markets">
            {JURISDICTIONS.map((j) => (
              <Link
                key={j.code}
                href={`/x/jurisdictions/${j.code}`}
                className={`market-tile ${path === `/x/jurisdictions/${j.code}` ? "active" : ""}`}
                title={j.name}
                onClick={close}
              >
                <span aria-hidden>{j.flag}</span>
                <span>{j.code}</span>
              </Link>
            ))}
          </nav>
        </Section>

        <div className="side-foot">
          <Link href="/x/about" className={`side-link ${isActive("/x/about") ? "active" : ""}`} onClick={close}>
            <Icon name="info" />
            Methodology
          </Link>
          <div
            className="side-meta"
            title={
              scan
                ? `Regulator RSS feeds and websites are scanned on the first Friday of each month. ${scan.sourcesCollected} of ${scan.sourcesTotal} sources collected.${scan.overdue ? ` The ${formatDate(scan.lastScheduled)} scan has not completed yet; it is retried daily.` : ""} Next scan: ${formatDate(scan.nextScan)}.`
                : undefined
            }
          >
            <span className="side-dot" style={{ background: !scan?.lastScan ? "var(--on-navy-muted)" : scan.overdue ? "#f0b35b" : "var(--green-2)" }} />
            {!scan ? "Last scan …" : scan.lastScan ? `Last scan ${formatDate(scan.lastScan)}${scan.overdue ? " · overdue" : ""}` : "Last scan pending"}
          </div>
        </div>
      </aside>
    </>
  );
}
