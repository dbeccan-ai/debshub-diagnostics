/* ══════════════════════════════════════════════════════════
   D.E.Bs LEARNING ACADEMY — Centralized Tier Configuration
   ══════════════════════════════════════════════════════════ */

/* ── Thresholds ── */
export const TIER_THRESHOLDS = {
  GREEN: 70,   // 70%+ = Mastery
  YELLOW: 50,  // 50–69% = Developing
  RED: 0,      // <50% = Immediate Support
} as const;

export function getTierFromScore(score: number): "green" | "yellow" | "red" {
  if (score >= TIER_THRESHOLDS.GREEN) return "green";
  if (score >= TIER_THRESHOLDS.YELLOW) return "yellow";
  return "red";
}

export function getTierLabel(score: number): string {
  const t = getTierFromScore(score);
  return TIER_LABELS[t].label;
}

/* ── Tier Labels & Helper Text ── */
export const TIER_LABELS = {
  red: {
    label: "🔴 Priority Intervention Required",
    helper: "These skills are below foundational mastery and require targeted support to prevent academic delay.",
    badge: "Tier 3",
    badgeClass: "bg-red-600 text-white",
    borderClass: "border-red-300",
    bgClass: "bg-red-50",
    textClass: "text-red-800",
    lightBg: "bg-red-100",
  },
  yellow: {
    label: "🟡 Strengthening Zone",
    helper: "These skills are developing but need reinforcement to reach mastery.",
    badge: "Tier 2",
    badgeClass: "bg-amber-500 text-white",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
    textClass: "text-amber-800",
    lightBg: "bg-amber-100",
  },
  green: {
    label: "🟢 Demonstrated Mastery",
    helper: "These skills meet or exceed grade-level expectations.",
    badge: "Tier 1",
    badgeClass: "bg-emerald-600 text-white",
    borderClass: "border-emerald-300",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    lightBg: "bg-emerald-100",
  },
} as const;

/* ── Emotional Insight Boxes ── */
export const INSIGHT_BOXES = {
  red: {
    title: "Why this matters now",
    body: "Without targeted intervention, these gaps can compound in the next grade and reduce confidence in core subjects.",
    borderClass: "border-red-300",
    bgClass: "bg-red-50",
    titleClass: "text-red-800",
    bodyClass: "text-red-700",
  },
  yellow: {
    title: "Reinforcement opportunity",
    body: "This is the ideal range for strategic reinforcement before the skill gap widens.",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
    titleClass: "text-amber-800",
    bodyClass: "text-amber-700",
  },
  green: {
    title: "Keep momentum",
    body: "Maintain consistency so mastery remains stable as standards become more complex.",
    borderClass: "border-emerald-300",
    bgClass: "bg-emerald-50",
    titleClass: "text-emerald-800",
    bodyClass: "text-emerald-700",
  },
} as const;

/* ── Skill-Row Action Recommendations ── */
export const SKILL_ACTION = {
  red: "Immediate reteach + guided practice required.",
  yellow: "Reinforce 2–3 times weekly until stable.",
  green: "Spiral review weekly to retain mastery.",
} as const;

/* ── CTA System ── */
export interface TierCTA {
  primary: { label: string; variant: "red" | "yellow" | "green" };
  secondary: { label: string };
  tertiary: { label: string };
}

export const TIER_CTAS: Record<"red" | "yellow" | "green", TierCTA> = {
  red: {
    primary: { label: "Book Tier 3 Intensive Plan", variant: "red" },
    secondary: { label: "Schedule Strategy Call" },
    tertiary: { label: "Download Home Support Plan" },
  },
  yellow: {
    primary: { label: "Enroll in Skill Builder Program", variant: "yellow" },
    secondary: { label: "Schedule Strategy Call" },
    tertiary: { label: "Download Home Support Plan" },
  },
  green: {
    primary: { label: "Join Enrichment Pod", variant: "green" },
    secondary: { label: "Download Home Support Plan" },
    tertiary: { label: "Schedule Strategy Call" },
  },
};

/* ── Placement Pathway ── */
export const PLACEMENT_PATHWAY = [
  { tier: "Tier 1 (70%+)", label: "Enrichment Pod", price: "$", color: "green" as const },
  { tier: "Tier 2 (50–69%)", label: "Skill Builder Program", price: "$$", color: "yellow" as const },
  { tier: "Tier 3 (<50%)", label: "Intensive Intervention Plan", price: "$$$", color: "red" as const },
];

/* ── CTA Button Styles ── */
export const CTA_STYLES = {
  red: "bg-red-600 hover:bg-red-700 text-white",
  yellow: "bg-amber-500 hover:bg-amber-600 text-white",
  green: "bg-emerald-600 hover:bg-emerald-700 text-white",
} as const;
