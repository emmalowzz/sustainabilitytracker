"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { JURISDICTIONS, TOPICS } from "@/lib/taxonomy";

const MAIN = [
  { href: "/x/overview", label: "Overview" },
  { href: "/x/developments", label: "Developments" },
  { href: "/x/timeline", label: "Timeline & deadlines" },
  { href: "/x/jurisdictions", label: "Jurisdictions" },
  { href: "/x/about", label: "Methodology" },
];

export function LeafIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export default function Sidebar({ lastReviewed }: { lastReviewed: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => path === href || (href !== "/x/overview" && path.startsWith(href + "/"));
  const close = () => setOpen(false);

  const brand = (
    <div className="brand">
      <div className="brand-mark">
        <LeafIcon />
      </div>
      <div>
        <div className="brand-name">Sustainability Tracker</div>
        <div className="brand-sub">ESG regulatory intelligence</div>
      </div>
    </div>
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
        {open && (
          <button className="btn" style={{ alignSelf: "flex-end" }} onClick={close}>
            Close
          </button>
        )}
        {brand}

        <Link href="/x/briefing" className={`nav-link feature ${isActive("/x/briefing") ? "active" : ""}`} onClick={close}>
          <span>Build briefing pack</span>
          <span aria-hidden>→</span>
        </Link>

        <nav className="nav-group" aria-label="Main">
          {MAIN.map((n) => (
            <Link key={n.href} href={n.href} className={`nav-link ${isActive(n.href) ? "active" : ""}`} onClick={close}>
              {n.label}
            </Link>
          ))}
        </nav>

        <nav className="nav-group" aria-label="Topics">
          <div className="nav-label">Topics</div>
          {TOPICS.map((t) => (
            <Link key={t.id} href={`/x/topics/${t.id}`} className={`nav-link ${path === `/x/topics/${t.id}` ? "active" : ""}`} onClick={close}>
              <span className="nav-dot" style={{ background: t.color }} />
              {t.short}
            </Link>
          ))}
        </nav>

        <nav className="nav-group" aria-label="Markets">
          <div className="nav-label">Markets</div>
          {JURISDICTIONS.map((j) => (
            <Link key={j.code} href={`/x/jurisdictions/${j.code}`} className={`nav-link ${path === `/x/jurisdictions/${j.code}` ? "active" : ""}`} onClick={close}>
              <span aria-hidden>{j.flag}</span>
              {j.name}
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="nav-dot" style={{ background: "var(--green-2)" }} />
          Last reviewed {lastReviewed}
        </div>
      </aside>
    </>
  );
}
