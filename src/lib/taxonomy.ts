// Reference taxonomies used across the tracker: jurisdictions, topics,
// instrument types, statuses and audiences.

export const JURISDICTIONS = [
  { code: "SG", name: "Singapore", region: "Asia-Pacific", flag: "🇸🇬" },
  { code: "JP", name: "Japan", region: "Asia-Pacific", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", region: "Asia-Pacific", flag: "🇰🇷" },
  { code: "AU", name: "Australia", region: "Asia-Pacific", flag: "🇦🇺" },
  { code: "IN", name: "India", region: "Asia-Pacific", flag: "🇮🇳" },
  { code: "CN", name: "China (Mainland)", region: "Asia-Pacific", flag: "🇨🇳" },
  { code: "US", name: "United States", region: "Americas", flag: "🇺🇸" },
  { code: "BR", name: "Brazil", region: "Americas", flag: "🇧🇷" },
  { code: "UK", name: "United Kingdom", region: "Europe", flag: "🇬🇧" },
  { code: "EU", name: "European Union", region: "Europe", flag: "🇪🇺" },
  { code: "INTL", name: "International / Global", region: "Global", flag: "🌐" },
] as const;

export type JurisdictionCode = (typeof JURISDICTIONS)[number]["code"];

/** The ten priority markets (International standard-setters are tracked as context only). */
export const PRIORITY_CODES: JurisdictionCode[] = ["SG", "JP", "KR", "AU", "IN", "CN", "US", "BR", "UK", "EU"];

export const TOPICS = [
  {
    id: "disclosures",
    short: "Disclosures",
    name: "Sustainability-related disclosures",
    description:
      "Corporate and financial-sector sustainability reporting: ISSB adoption, climate reporting mandates, assurance, fund and product-level disclosures and labelling.",
    color: "var(--t1)",
  },
  {
    id: "workplace",
    short: "Workplace",
    name: "Workplace operations",
    description:
      "The 'S' in operations: human-capital and workforce disclosure, pay transparency and gender pay gaps, DEI, modern slavery and forced labour, health & safety and employment law reform.",
    color: "var(--t2)",
  },
  {
    id: "litigation",
    short: "Litigation",
    name: "ESG litigation trends",
    description:
      "Climate and ESG cases before courts: rights-based climate cases, corporate liability, greenwashing claims, director duties and anti-ESG litigation.",
    color: "var(--t3)",
  },
  {
    id: "enforcement",
    short: "Enforcement",
    name: "ESG enforcement trends",
    description:
      "Regulator and prosecutor action: greenwashing penalties, anti-greenwashing rules, consumer-protection regimes and supervisory priorities.",
    color: "var(--t4)",
  },
  {
    id: "sf-taxonomy",
    short: "Taxonomy & Green Deals",
    name: "Sustainable finance — taxonomies, green deals & landscape",
    description:
      "Green and transition taxonomies, national green deals and industrial policy, sovereign green/transition bonds, carbon markets and the wider sustainable-finance policy landscape.",
    color: "var(--t5)",
  },
  {
    id: "sf-benchmarks",
    short: "Benchmarks & Capital",
    name: "Sustainable finance — ESG benchmarks, capital & loan frameworks",
    description:
      "ESG ratings and data providers, climate benchmarks, prudential (capital) treatment of climate/ESG risk, bank risk-management guidance and green/sustainability-linked bond and loan frameworks.",
    color: "var(--t6)",
  },
  {
    id: "governance",
    short: "Governance & Stewardship",
    name: "Corporate governance & stewardship codes",
    description:
      "Corporate governance codes, company law reform affecting boards and shareholders, stewardship codes, proxy voting and shareholder-proposal rules.",
    color: "var(--t7)",
  },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

export const TYPES = [
  "Legislation",
  "Regulation",
  "Guidance",
  "Standard",
  "Code",
  "Consultation",
  "Court decision",
  "Litigation (pending)",
  "Enforcement action",
  "Policy / Roadmap",
] as const;
export type DevType = (typeof TYPES)[number];

export const STATUSES = [
  "Proposed",
  "Consultation",
  "Adopted",
  "Phasing in",
  "In force",
  "Ongoing",
  "Decided",
  "Paused / Withdrawn",
] as const;
export type Status = (typeof STATUSES)[number];

export const AUDIENCES = [
  "Asset managers",
  "Asset owners",
  "Banks",
  "Insurers",
  "Listed issuers",
  "Large companies",
  "All employers",
  "Funds & products",
  "Ratings & data providers",
] as const;
export type Audience = (typeof AUDIENCES)[number];

export type Impact = "High" | "Medium" | "Low";

export function jurisdiction(code: string) {
  return JURISDICTIONS.find((j) => j.code === code);
}
export function topic(id: string) {
  return TOPICS.find((t) => t.id === id);
}
