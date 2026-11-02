import type { Audience, DevType, Impact, JurisdictionCode, Status, TopicId } from "./taxonomy";

/** ISO date "YYYY-MM-DD", or "YYYY-MM" when only the month is known. */
export type PartialDate = string;

export interface KeyDate {
  date: PartialDate;
  label: string;
}

export interface Source {
  label: string;
  url: string;
}

export interface Development {
  id: string;
  title: string;
  jurisdiction: JurisdictionCode;
  topics: TopicId[];
  type: DevType;
  status: Status;
  /** Issuing regulator, legislature or court. */
  authority: string;
  /** Date of the most recent milestone (used for "latest" sorting). */
  date: PartialDate;
  summary: string;
  /** Practical implications for an asset manager's compliance function. */
  implications?: string;
  keyDates?: KeyDate[];
  appliesTo: Audience[];
  impact: Impact;
  sources: Source[];
}

export interface JurisdictionProfile {
  code: JurisdictionCode;
  headline: string;
  keyAuthorities: string[];
  /** One-line posture per topic. */
  posture: Partial<Record<TopicId, { level: PostureLevel; note: string }>>;
}

export type PostureLevel = "Mandatory" | "Phasing in" | "Voluntary / Comply-or-explain" | "Proposed" | "Active" | "Limited" | "Retreating";
