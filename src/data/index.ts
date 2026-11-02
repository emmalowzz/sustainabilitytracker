import type { Development } from "@/lib/types";
import { SG, JP, KR, AU, IN, CN } from "./apac";
import { US, BR } from "./americas";
import { UK, EU } from "./europe";
import { INTL } from "./international";

export { PROFILES } from "./profiles";

/** Date the dataset was last reviewed by the compliance team. Update on each review. */
export const LAST_REVIEWED = "2026-11-02";

/** Knowledge horizon of the seeded content — later developments must be added manually. */
export const CONTENT_AS_OF = "mid-2026";

export const DEVELOPMENTS: Development[] = [...SG, ...JP, ...KR, ...AU, ...IN, ...CN, ...US, ...BR, ...UK, ...EU, ...INTL];
