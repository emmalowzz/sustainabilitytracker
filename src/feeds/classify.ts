import type { TopicId } from "@/lib/taxonomy";

/**
 * Keyword rules used to (a) decide whether an item from a general-purpose feed is relevant at all,
 * and (b) suggest topics. Patterns are case-insensitive regex fragments.
 * Tune these as the team learns what's noise in each source.
 */
export const TOPIC_RULES: Record<TopicId, RegExp> = {
  disclosures:
    /\b(sustainability[- ]related disclosure|sustainability report|climate[- ]related (financial )?disclosure|ISSB|IFRS S[12]|TCFD|CSRD|ESRS|SFDR|BRSR|SSBJ|KSSB|AASB S2|UK SRS|scope [123]|greenhouse gas (reporting|emissions disclosure)|ESG disclosure|non-financial (reporting|information)|assurance of sustainability)/i,
  workplace:
    /\b(pay transparency|gender pay|equal pay|modern slavery|forced labou?r|human rights due diligence|due diligence directive|CSDDD|workplace (fairness|harassment|safety)|sexual harassment|diversity,? equity|DEI\b|occupational (health|safety)|psychosocial|labou?r code|employment rights|human capital|living wage|minimum wage|platform work)/i,
  litigation:
    /\b(climate (case|litigation|lawsuit)|greenwashing (claim|lawsuit|suit)|class action|duty of care|lawsuit|sued|court (rules|ruling|finds|dismiss)|judgment|tribunal|appeal|plaintiffs?|petitioners?|anti-ESG|antitrust .*(climate|ESG))/i,
  enforcement:
    /\b(greenwash\w*|misleading (environmental|sustainability|ESG)|penalt(y|ies)|fined?\b|settle(s|d|ment)|enforcement action|infringement notice|cease[- ]and[- ]desist|charges?\b.*(ESG|sustainab|climate)|anti-greenwashing|green claims)/i,
  "sf-taxonomy":
    /\b(taxonomy|green deal|clean industrial deal|transition finance|sustainable finance (roadmap|strategy|action plan)|green bonds? (framework|standard|principles)|sovereign (green|sustainab|transition) bond|carbon (market|tax|pricing|levy)|emissions trading|ETS\b|CBAM|net[- ]zero (target|plan)|nationally determined contribution|NDC\b)/i,
  "sf-benchmarks":
    /\b(ESG rating|ESG data provider|ESG ratings? provider|climate (transition|aligned) benchmark|Paris[- ]aligned benchmark|benchmark regulation|climate[- ]related financial risk|climate risk (management|stress test|scenario)|prudential .*climate|Basel .*climate|Pillar 3 .*ESG|ESG risk|sustainability[- ]linked (loan|bond)|green loan|fund names?|ESG funds?|sustainable investment (label|product))/i,
  governance:
    /\b(corporate governance code|stewardship code|stewardship|proxy (advis|voting)|shareholder (proposal|rights|engagement)|say on (pay|climate)|board (diversity|independence|gender)|women on boards|director(s'?)? dut(y|ies)|fiduciary dut|commercial act|company law|listing rules?)/i,
};

/** Any item must match at least one of these to be considered sustainability-relevant. */
const RELEVANCE =
  /\b(ESG|sustainab\w*|climate|green\w*|net[- ]zero|carbon|emission\w*|environmental|biodiversity|nature[- ]related|TNFD|transition plan|stewardship|corporate governance|human rights|modern slavery|forced labou?r|pay transparency|gender pay|diversity|social bond|taxonomy|greenwash\w*|ISSB|TCFD|CSRD|SFDR|sustentab\w*|clim[aá]tic\w*|ambienta\w*|ASG|governan[cç]a|taxonomia|carbono|emiss[oõ]es|igualdade salarial|direitos humanos)\b/i;

export function isRelevant(text: string): boolean {
  return RELEVANCE.test(text);
}

export function suggestTopics(text: string): TopicId[] {
  return (Object.keys(TOPIC_RULES) as TopicId[]).filter((t) => TOPIC_RULES[t].test(text));
}

/** Normalise many date formats (RFC 822, ISO, GDELT "20251102T101500Z") to YYYY-MM-DD. */
export function toISODate(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  const gdelt = /^(\d{4})(\d{2})(\d{2})T?\d*Z?$/.exec(s);
  if (gdelt) return `${gdelt[1]}-${gdelt[2]}-${gdelt[3]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

export function stripHtml(s?: string): string | undefined {
  if (!s) return undefined;
  const out = s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return out.length > 400 ? out.slice(0, 397) + "…" : out || undefined;
}
