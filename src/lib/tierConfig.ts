/* ══════════════════════════════════════════════════════════
   D.E.Bs LEARNING ACADEMY — Centralized Tier Configuration
   ══════════════════════════════════════════════════════════ */

/* ── Thresholds ── */
export const TIER_THRESHOLDS = {
  GREEN: 85,   // 85%+ = Mastery (Tier 1)
  YELLOW: 66,  // 66–84% = Developing (Tier 2)
  RED: 0,      // ≤65% = Immediate Support (Tier 3)
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
    helper: "Without targeted intervention now, these gaps will compound next grade — making recovery significantly harder.",
    badge: "Tier 3",
    badgeClass: "bg-red-600 text-white",
    borderClass: "border-red-300",
    bgClass: "bg-red-50",
    textClass: "text-red-800",
    lightBg: "bg-red-100",
  },
  yellow: {
    label: "🟡 Strengthening Zone",
    helper: "This is the critical window for reinforcement — skills at this stage respond quickly to targeted practice before gaps widen.",
    badge: "Tier 2",
    badgeClass: "bg-amber-500 text-white",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
    textClass: "text-amber-800",
    lightBg: "bg-amber-100",
  },
  green: {
    label: "🟢 Demonstrated Mastery",
    helper: "Excellent performance — now is the time to accelerate and ensure mastery remains stable as content becomes more complex.",
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
    title: "⚠️ Act Now — This Is Time-Sensitive",
    body: "Foundational skill gaps at this level don't resolve on their own. Without structured intervention, they compound each year — affecting reading, writing, and math confidence well into secondary school. Early action is the highest-ROI move a parent can make.",
    borderClass: "border-red-300",
    bgClass: "bg-red-50",
    titleClass: "text-red-800",
    bodyClass: "text-red-700",
  },
  yellow: {
    title: "🎯 The Reinforcement Window Is Open",
    body: "Skills at this level are within reach of mastery — but only with consistent, targeted practice. This is the ideal moment to intervene before gaps solidify. Students who receive support now consistently outperform peers by next term.",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
    titleClass: "text-amber-800",
    bodyClass: "text-amber-700",
  },
  green: {
    title: "🏆 Strong Foundation — Keep the Momentum",
    body: "Mastery at this level is a real achievement. To maintain and extend it, enrichment challenges and acceleration activities are the smartest next step. Don't let strong results plateau — build on them.",
    borderClass: "border-emerald-300",
    bgClass: "bg-emerald-50",
    titleClass: "text-emerald-800",
    bodyClass: "text-emerald-700",
  },
} as const;

/* ── Skill-Row Action Recommendations ── */
export const SKILL_ACTION = {
  red: "Immediate reteach + guided practice required. Do not wait.",
  yellow: "Reinforce 2–3 times weekly with targeted practice until stable.",
  green: "Spiral review weekly to retain mastery as content advances.",
} as const;

/* ── CTA System ── */
export interface TierCTA {
  primary: { label: string; variant: "red" | "yellow" | "green"; paymentUrl: string };
  secondary: { label: string };
  tertiary: { label: string };
}

export const TIER_CTAS: Record<"red" | "yellow" | "green", TierCTA> = {
  red: {
    primary: {
      label: "Book Tier 3 Intensive Intervention Plan",
      variant: "red",
      paymentUrl: "https://buy.stripe.com/cNicMXfTqd5C2LVfUO4wM00",
    },
    secondary: { label: "Schedule a Strategy Call" },
    tertiary: { label: "Download Home Support Plan" },
  },
  yellow: {
    primary: {
      label: "Enroll in the Skill Builder Program",
      variant: "yellow",
      paymentUrl: "https://buy.stripe.com/14AbITePm3v286f3824wM01",
    },
    secondary: { label: "Schedule a Strategy Call" },
    tertiary: { label: "Download Home Support Plan" },
  },
  green: {
    primary: {
      label: "Join the Enrichment Pod",
      variant: "green",
      paymentUrl: "https://buy.stripe.com/eVq8wH4aI2qYfyHaAu4wM02",
    },
    secondary: { label: "Download Home Support Plan" },
    tertiary: { label: "Schedule a Strategy Call" },
  },
};

/* ── Placement Pathway ── */
export const PLACEMENT_PATHWAY = [
  { tier: "Tier 1 (85%+)", label: "Enrichment Pod", price: "$597", color: "green" as const, paymentUrl: "https://buy.stripe.com/eVq8wH4aI2qYfyHaAu4wM02" },
  { tier: "Tier 2 (66–84%)", label: "Skill Builder Program", price: "$1,097", color: "yellow" as const, paymentUrl: "https://buy.stripe.com/14AbITePm3v286f3824wM01" },
  { tier: "Tier 3 (≤65%)", label: "Intensive Intervention Plan", price: "$1,997", color: "red" as const, paymentUrl: "https://buy.stripe.com/cNicMXfTqd5C2LVfUO4wM00" },
];

/* ── CTA Button Styles ── */
export const CTA_STYLES = {
  red: "bg-red-600 hover:bg-red-700 text-white",
  yellow: "bg-amber-500 hover:bg-amber-600 text-white",
  green: "bg-emerald-600 hover:bg-emerald-700 text-white",
} as const;
