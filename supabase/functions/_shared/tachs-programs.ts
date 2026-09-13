// D.E.Bs TACHS — single editable configuration for the parent-facing tier mapping and the
// recommended service options. Pure TypeScript (no Deno/Supabase/React imports) so it is shared
// verbatim by the edge functions (email) and, via re-export, the web app (parent page, admin editor).
//
// Tier thresholds mirror the Diagnostic Hub's centralized tier config (src/lib/tierConfig.ts):
//   Tier 1 / green  = 85–100%  Demonstrated Mastery
//   Tier 2 / yellow = 66–84%   Strengthening Zone
//   Tier 3 / red    = 0–65%    Priority Intervention Required
// A regression test asserts these stay identical to tierConfig.getTierFromScore.

export type TachsTierKey = "green" | "yellow" | "red";
export const TACHS_TIER_THRESHOLDS = { GREEN: 85, YELLOW: 66 } as const;

export function tachsTierFor(accuracy: number): TachsTierKey {
  if (accuracy >= TACHS_TIER_THRESHOLDS.GREEN) return "green";
  if (accuracy >= TACHS_TIER_THRESHOLDS.YELLOW) return "yellow";
  return "red";
}

export interface TachsTierInfo { key: TachsTierKey; badge: "Tier 1" | "Tier 2" | "Tier 3"; label: string; range: string; color: string }
export const TACHS_TIERS: Record<TachsTierKey, TachsTierInfo> = {
  green: { key: "green", badge: "Tier 1", label: "Demonstrated Mastery", range: "85–100%", color: "#059669" },
  yellow: { key: "yellow", badge: "Tier 2", label: "Strengthening Zone", range: "66–84%", color: "#d97706" },
  red: { key: "red", badge: "Tier 3", label: "Priority Intervention Required", range: "0–65%", color: "#dc2626" },
};

export type TachsProgramKey = "tachs_strategy" | "tachs_skill_builder" | "tachs_intensive_phase1";

export interface TachsProgram {
  key: TachsProgramKey;
  tier: TachsTierKey;
  name: string;
  duration_weeks: number;
  sessions_per_week: number;
  total_cents: number;
  /** Suggested installment plan (count × amount). Informational until the owner approves live checkout. */
  installments: { count: number; amount_cents: number };
  focus: string[];
  included: string[];
  progress_monitoring: string;
  honesty_note: string | null;
  /** Live checkout is intentionally disabled pending owner approval — never a generic Math/ELA link. */
  payment_url: string | null;
}

/** Recommended service options — editable in one place. */
export const TACHS_PROGRAMS: Record<TachsProgramKey, TachsProgram> = {
  tachs_strategy: {
    key: "tachs_strategy", tier: "green", name: "TACHS Strategy & Acceleration",
    duration_weeks: 6, sessions_per_week: 2, total_cents: 90_000, installments: { count: 2, amount_cents: 45_000 },
    focus: ["Advanced practice across all six TACHS sections", "Pacing and time management under exam conditions", "Higher-order reasoning in reading, writing and mathematics", "Targeted refinement of any section still below mastery"],
    included: ["12 live small-group or 1:1 sessions (2 per week for 6 weeks)", "Two timed progress checks with section-level feedback", "Weekly practice sets and pacing drills", "Final readiness summary for the family"],
    progress_monitoring: "Two progress checks (week 3 and week 6) reported to the family.",
    honesty_note: null,
    payment_url: null,
  },
  tachs_skill_builder: {
    key: "tachs_skill_builder", tier: "yellow", name: "TACHS Targeted Skill Builder",
    duration_weeks: 10, sessions_per_week: 2, total_cents: 150_000, installments: { count: 3, amount_cents: 50_000 },
    focus: ["Close the specific section gaps identified in this diagnostic", "Vocabulary, reading and written-expression accuracy as indicated", "Mathematics fluency and multistep problem solving as indicated", "Ability (visual-spatial) reasoning strategies as indicated", "Pacing so accuracy holds under time"],
    included: ["20 live sessions (2 per week for 10 weeks)", "Two timed progress checks plus a final full-length reassessment", "Individualized weekly practice targeted to the developing sections", "Progress summaries shared with the family at each checkpoint"],
    progress_monitoring: "Progress checks at week 4 and week 8, then a full-length reassessment at week 10.",
    honesty_note: null,
    payment_url: null,
  },
  tachs_intensive_phase1: {
    key: "tachs_intensive_phase1", tier: "red", name: "TACHS Intensive Readiness — Phase 1",
    duration_weeks: 16, sessions_per_week: 2, total_cents: 240_000, installments: { count: 4, amount_cents: 60_000 },
    focus: ["Foundational repair in the priority sections before timed practice", "Grade 8 and introductory Algebra I readiness", "Reading comprehension, written expression and academic vocabulary", "Visual-spatial reasoning (figure matrices, paper folding, classification)", "Pacing introduced once accuracy is stable"],
    included: ["32 live sessions (2 per week for 16 weeks)", "Baseline-to-progress reviews at weeks 4, 8 and 12", "Formal full-length reassessment at week 16", "Structured home practice plan and family check-ins"],
    progress_monitoring: "Baseline-to-progress reviews at weeks 4, 8 and 12, and a formal reassessment at week 16.",
    honesty_note: "Depending on the exam date and the week-16 reassessment, further preparation (a Phase 2) may be recommended. We will say so plainly rather than over-promise.",
    payment_url: null,
  },
};

export const PROGRAM_KEYS = Object.keys(TACHS_PROGRAMS) as TachsProgramKey[];
export const PROGRAM_FOR_TIER: Record<TachsTierKey, TachsProgramKey> = { green: "tachs_strategy", yellow: "tachs_skill_builder", red: "tachs_intensive_phase1" };
export const programForAccuracy = (accuracy: number): TachsProgram => TACHS_PROGRAMS[PROGRAM_FOR_TIER[tachsTierFor(accuracy)]];

export const ENROLLMENT_CALL_URL = "https://calendar.app.google/dHKRRWnqASeUpp4cA";
export const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const installmentLabel = (p: Pick<TachsProgram, "installments">) => `${p.installments.count} payments of ${usd(p.installments.amount_cents)}`;
