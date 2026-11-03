"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedResult } from "@/feeds/aggregate";
import { CLASSIFICATIONS, SECTIONS, buildPack, updatesFor, candidates, configFromParams, configToParams, packToMarkdown, type BriefConfig, type SectionId } from "@/lib/briefing";
import { JURISDICTIONS, PRIORITY_CODES, TOPICS, type Impact } from "@/lib/taxonomy";
import BriefingDocument from "./BriefingDocument";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Collect the pack's own CSS rules (all prefixed .bp) so the Word export matches the on-screen document. */
function packCss(): string {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(rules)) if (r instanceof CSSStyleRule && r.selectorText.includes(".bp")) out.push(r.cssText);
  }
  return out.join("\n");
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function BriefingBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [today, setToday] = useState<string | null>(null);
  const [cfg, setCfg] = useState<BriefConfig | null>(null);
  const [copied, setCopied] = useState("");
  const packRef = useRef<HTMLDivElement>(null);

  // Dates depend on the viewer's clock, so initialise on the client only.
  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    setToday(t);
    setCfg(configFromParams(new URLSearchParams(params.toString()), t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync (debounced) so a pack configuration can be bookmarked or shared.
  useEffect(() => {
    if (!cfg || !today) return;
    const id = setTimeout(() => router.replace(`${pathname}${configToParams(cfg, today)}`, { scroll: false }), 400);
    return () => clearTimeout(id);
  }, [cfg, today, pathname, router]);

  const pack = useMemo(() => (cfg && today ? buildPack(cfg, today) : null), [cfg, today]);
  const pool = useMemo(() => (cfg && today ? candidates(cfg, today) : []), [cfg, today]);

  // Regulator feed items for the optional "Recent regulator updates" section (fetched once, filtered per config).
  const [feed, setFeed] = useState<FeedResult | null>(null);
  const [feedError, setFeedError] = useState("");
  useEffect(() => {
    fetch("/api/feed?scope=official&days=365")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setFeed)
      .catch((e) => setFeedError(String(e.message ?? e)));
  }, []);
  const updates = useMemo(() => (feed && cfg ? updatesFor(feed.items, cfg).slice(0, 40) : []), [feed, cfg]);
  const updatesNote = feedError
    ? `Regulator feeds could not be loaded (${feedError}).`
    : !feed
      ? "Loading regulator feeds…"
      : feed.sources.every((s) => !s.ok)
        ? "Regulator feeds could not be reached when this pack was generated."
        : undefined;

  if (!cfg || !today || !pack) return <div className="panel empty">Loading builder…</div>;

  const set = <K extends keyof BriefConfig>(k: K, v: BriefConfig[K]) => setCfg({ ...cfg, [k]: v });
  const toggle = <K extends "j" | "t" | "sections" | "x">(k: K, v: string) => {
    const cur = cfg[k] as string[];
    setCfg({ ...cfg, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const fileBase = `${slug(cfg.title)}-${today}`;

  const exportWord = () => {
    const html = packRef.current?.innerHTML ?? "";
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${cfg.title}</title><style>body{font-family:Calibri,Arial,sans-serif;color:#0b1f3a}${packCss()}.bp-pagefoot{display:none}</style></head><body>${html}</body></html>`;
    download(`${fileBase}.doc`, doc, "application/msword");
  };
  const exportMd = () => download(`${fileBase}.md`, packToMarkdown(pack, updates), "text/markdown;charset=utf-8");
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("Link copied");
    } catch {
      setCopied("Copy the address bar URL");
    }
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="builder">
      <aside className="panel builder-panel" aria-label="Briefing configuration">
        <div className="builder-actions">
          <button className="btn btn-green" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button className="btn btn-primary" onClick={exportWord}>
            Download Word
          </button>
          <button className="btn" onClick={exportMd}>
            Markdown
          </button>
          <button className="btn" onClick={copyLink}>
            {copied || "Copy share link"}
          </button>
        </div>

        <div>
          <h3>Document</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <label className="field">
              <span>Title</span>
              <input className="input" value={cfg.title} onChange={(e) => set("title", e.target.value)} />
            </label>
            <label className="field">
              <span>Prepared for</span>
              <input className="input" value={cfg.audience} onChange={(e) => set("audience", e.target.value)} />
            </label>
            <label className="field">
              <span>Prepared by</span>
              <input className="input" value={cfg.author} onChange={(e) => set("author", e.target.value)} />
            </label>
            <label className="field">
              <span>Classification</span>
              <select className="select" value={cfg.cls} onChange={(e) => set("cls", e.target.value as BriefConfig["cls"])}>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div>
          <h3>Period</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label className="field">
              <span>Developments since</span>
              <input className="input" type="date" value={cfg.since} max={today} onChange={(e) => e.target.value && set("since", e.target.value)} />
            </label>
            <label className="field">
              <span>Deadlines ahead</span>
              <select className="select" value={cfg.horizon} onChange={(e) => set("horizon", Number(e.target.value))}>
                {[3, 6, 12, 18, 24].map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div>
          <h3>Markets</h3>
          <div className="chipset">
            {JURISDICTIONS.map((j) => (
              <button key={j.code} className={`chip-toggle ${cfg.j.includes(j.code) ? "on" : ""}`} onClick={() => toggle("j", j.code)} aria-pressed={cfg.j.includes(j.code)}>
                {j.flag} {j.code}
              </button>
            ))}
          </div>
          <div className="row small" style={{ marginTop: 6 }}>
            <button className="btn" style={{ padding: "3px 8px" }} onClick={() => set("j", [...PRIORITY_CODES])}>
              10 priority
            </button>
            <button className="btn" style={{ padding: "3px 8px" }} onClick={() => set("j", [])}>
              None
            </button>
          </div>
        </div>

        <div>
          <h3>Topics</h3>
          <div className="chipset">
            {TOPICS.map((t) => (
              <button key={t.id} className={`chip-toggle ${cfg.t.includes(t.id) ? "on" : ""}`} onClick={() => toggle("t", t.id)} aria-pressed={cfg.t.includes(t.id)}>
                {t.short}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label className="field">
            <span>Minimum impact</span>
            <select className="select" value={cfg.min} onChange={(e) => set("min", e.target.value as Impact)}>
              <option value="Low">All</option>
              <option value="Medium">Medium +</option>
              <option value="High">High only</option>
            </select>
          </label>
          <label className="field">
            <span>Organise by</span>
            <select className="select" value={cfg.groupBy} onChange={(e) => set("groupBy", e.target.value as BriefConfig["groupBy"])}>
              <option value="market">Market</option>
              <option value="topic">Topic</option>
            </select>
          </label>
        </div>

        <div>
          <h3>Sections</h3>
          {SECTIONS.map((s) => (
            <label key={s.id} className="check">
              <input type="checkbox" checked={cfg.sections.includes(s.id)} onChange={() => toggle("sections", s.id as SectionId)} />
              {s.label}
            </label>
          ))}
        </div>

        <label className="field">
          <span>Key messages (appear at the top of the executive summary)</span>
          <textarea className="textarea" value={cfg.notes} placeholder="e.g. Three actions for Q1: …" onChange={(e) => set("notes", e.target.value)} />
        </label>

        <div>
          <h3>
            Items ({pack.items.length} of {pool.length})
          </h3>
          <div className="item-pick">
            {pool.length === 0 && <span className="small muted">Nothing in scope — widen markets, topics or period.</span>}
            {pool.map((d) => (
              <label key={d.id} className="check">
                <input type="checkbox" checked={!cfg.x.includes(d.id)} onChange={() => toggle("x", d.id)} />
                <span>
                  <strong>{d.jurisdiction}</strong> {d.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div ref={packRef}>
        <BriefingDocument p={pack} updates={updates} updatesNote={updatesNote} />
      </div>
    </div>
  );
}
