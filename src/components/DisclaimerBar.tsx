import Link from "next/link";

/** Site-wide disclaimer, fixed to the bottom of the screen on every page. */
export default function DisclaimerBar() {
  return (
    <footer className="disclaimer-bar" role="note" aria-label="Disclaimer">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span>
        Monitoring aid only — not legal advice. Confirm against the linked primary sources before relying on any item.{" "}
        <Link href="/x/about">Methodology</Link>
      </span>
    </footer>
  );
}
