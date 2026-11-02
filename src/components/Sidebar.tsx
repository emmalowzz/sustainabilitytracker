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

export default function Sidebar({ lastReviewed }: { lastReviewed: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => path === href || (href !== "/x/overview" && path.startsWith(href + "/"));

  const nav = (
    <>
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-name">Sustainability Tracker</div>
          <div className="brand-sub">ESG regulatory developments</div>
        </div>
      </div>

      <nav className="nav-group" aria-label="Main">
        {MAIN.map((n) => (
          <Link key={n.href} href={n.href} className={`nav-link ${isActive(n.href) ? "active" : ""}`} onClick={() => setOpen(false)}>
            {n.label}
          </Link>
        ))}
      </nav>

      <nav className="nav-group" aria-label="Topics">
        <div className="nav-label">Topics</div>
        {TOPICS.map((t) => (
          <Link key={t.id} href={`/x/topics/${t.id}`} className={`nav-link ${path === `/x/topics/${t.id}` ? "active" : ""}`} onClick={() => setOpen(false)}>
            <span className="nav-dot" style={{ background: t.color }} />
            {t.short}
          </Link>
        ))}
      </nav>

      <nav className="nav-group" aria-label="Markets">
        <div className="nav-label">Markets</div>
        {JURISDICTIONS.map((j) => (
          <Link key={j.code} href={`/x/jurisdictions/${j.code}`} className={`nav-link ${path === `/x/jurisdictions/${j.code}` ? "active" : ""}`} onClick={() => setOpen(false)}>
            <span aria-hidden>{j.flag}</span>
            {j.name}
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">Last reviewed {lastReviewed}</div>
    </>
  );

  return (
    <>
      <div className="mobile-bar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-name">Sustainability Tracker</div>
        </div>
        <button className="btn" onClick={() => setOpen(true)} aria-label="Open menu">
          Menu
        </button>
      </div>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {open && (
          <button className="btn" style={{ alignSelf: "flex-end" }} onClick={() => setOpen(false)}>
            Close
          </button>
        )}
        {nav}
      </aside>
    </>
  );
}
