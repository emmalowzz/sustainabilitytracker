import type { JurisdictionCode, TopicId } from "@/lib/taxonomy";
import type { RefreshCadence } from "./schedule";

/** A single item pulled from an external source, normalised for triage. */
export interface FeedItem {
  /** Stable id: `${sourceId}:${external id or url}`. */
  id: string;
  sourceId: string;
  sourceName: string;
  jurisdiction: JurisdictionCode;
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) when known. */
  date?: string;
  summary?: string;
  /** Topics inferred from keywords — a suggestion for the reviewer, not a classification. */
  topics: TopicId[];
  kind: SourceKind;
}

export type SourceKind = "Official register" | "Regulator news" | "Legislature" | "Court records" | "News monitoring";

export interface SourceStatus {
  id: string;
  name: string;
  jurisdiction: JurisdictionCode;
  kind: SourceKind;
  ok: boolean;
  /** Items returned after relevance filtering. */
  count: number;
  /** Raw items before relevance filtering. */
  fetched: number;
  error?: string;
  ms: number;
  /** Set when the connector needs configuration (e.g. an API key) that is missing. */
  skipped?: string;
  /** How often the source is re-fetched: RSS monthly (first Friday), APIs hourly. */
  refresh: RefreshCadence;
  /** When the upstream response was actually downloaded (from its Date header), if known. */
  fetchedAt?: string;
}

/** What each connector produces before classification. */
export interface RawItem {
  externalId?: string;
  title: string;
  url: string;
  date?: string;
  summary?: string;
  /** Overrides the source's jurisdiction (e.g. news items tagged with the publishing country). */
  jurisdiction?: JurisdictionCode;
}

export interface Source {
  id: string;
  name: string;
  jurisdiction: JurisdictionCode;
  kind: SourceKind;
  /** Human-readable link to the source's documentation or homepage. */
  docs: string;
  /**
   * If true, every item from the source is already on-topic (e.g. the query was keyword-filtered upstream),
   * so the local relevance filter is skipped.
   */
  prefiltered?: boolean;
  /** Return a reason string to skip (e.g. missing API key); undefined to run. */
  skip?: () => string | undefined;
  /** Refresh cadence; defaults to "hourly" (APIs). RSS sources are "monthly". */
  refresh?: RefreshCadence;
  fetch: (ctx: FetchContext) => Promise<RawItem[]>;
}

export interface FetchContext {
  /** Look-back window start, ISO date. */
  since: string;
  fetchText: (url: string, init?: RequestInit) => Promise<string>;
  fetchJSON: <T = unknown>(url: string, init?: RequestInit) => Promise<T>;
  /** Fetch an RSS/Atom feed: cached until the next first-Friday refresh. */
  fetchFeed: (url: string) => Promise<string>;
}
