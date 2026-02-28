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
      label: "Book a Consultation",
      variant: "red",
      paymentUrl: "https://calendar.app.google/dHKRRWnqASeUpp4cA",
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

/* ── Payment Plans ── */
export const PAYMENT_PLANS = {
  green: {
    fullPrice: 597,
    installments: [
      { label: "Deposit (50%)", amount: 299, paymentUrl: "https://buy.stripe.com/bJe9AL0Yw7Li86f7oi4wM05" },
      { label: "Final Payment (50%)", amount: 298, paymentUrl: "https://buy.stripe.com/aFaeV55eMe9Gaen6ke4wM06" },
    ],
  },
  yellow: {
    fullPrice: 1097,
    installments: [
      { label: "Deposit (50%)", amount: 549, paymentUrl: "https://buy.stripe.com/3cI7sD6iQ8Pm4U38sm4wM07" },
      { label: "Final Payment (50%)", amount: 548, paymentUrl: "https://buy.stripe.com/5kQ14fcHe3v2fyH4c64wM08" },
    ],
  },
  red_single: {
    fullPrice: 2497,
    fullPricePaymentUrl: "https://buy.stripe.com/9B6cMXgXughOeuD8sm4wM0j",
    installments: [
      { label: "Deposit (50%)", amount: 1249, paymentUrl: "https://buy.stripe.com/5kQ3cn7mU3v286f23Y4wM0k" },
      { label: "Before Retest 1 (25%)", amount: 624, paymentUrl: "https://buy.stripe.com/dRm00b36Ee9G5Y75ga4wM0l" },
      { label: "Before Retest 2 (25%)", amount: 624, paymentUrl: "https://buy.stripe.com/dRm00b36Ee9G5Y75ga4wM0l" },
    ],
  },
  red_dual: {
    fullPrice: 3997,
    fullPricePaymentUrl: "https://buy.stripe.com/aFacMX5eM3v25Y7eQK4wM0m",
    installments: [
      { label: "Deposit (50%)", amount: 1999, paymentUrl: "https://buy.stripe.com/28EbIT0Yw9Tq5Y76ke4wM0n" },
      { label: "Before Retest 1 (25%)", amount: 999, paymentUrl: "https://buy.stripe.com/aFa8wH36E2qY3PZ6ke4wM0o" },
      { label: "Before Retest 2 (25%)", amount: 999, paymentUrl: "https://buy.stripe.com/aFa8wH36E2qY3PZ6ke4wM0o" },
    ],
  },
  red_single_upper: {
    fullPrice: 2997,
    fullPricePaymentUrl: "https://buy.stripe.com/eVq9AL6iQ8Pm9ajcIC4wM0p",
    installments: [
      { label: "Deposit (50%)", amount: 1499, paymentUrl: "https://buy.stripe.com/6oUbITdLi0iQbir0ZU4wM0q" },
      { label: "Before Retest 1 (25%)", amount: 749, paymentUrl: "https://buy.stripe.com/eVqfZ9dLighOfyHdMG4wM0r" },
      { label: "Before Retest 2 (25%)", amount: 749, paymentUrl: "https://buy.stripe.com/eVqfZ9dLighOfyHdMG4wM0r" },
    ],
  },
  red_dual_upper: {
    fullPrice: 4997,
    fullPricePaymentUrl: "https://buy.stripe.com/4gM5kv9v27Li86f7oi4wM0s",
    installments: [
      { label: "Deposit (50%)", amount: 2499, paymentUrl: "https://buy.stripe.com/5kQ5kv22A0iQ4U3fUO4wM0t" },
      { label: "Before Retest 1 (25%)", amount: 1249, paymentUrl: "https://buy.stripe.com/aFabITcHe9Tqdqz9wq4wM0u" },
      { label: "Before Retest 2 (25%)", amount: 1249, paymentUrl: "https://buy.stripe.com/aFabITcHe9Tqdqz9wq4wM0u" },
    ],
  },
} as const;

/* ── Placement Pathway ── */
export const PLACEMENT_PATHWAY = [
  { tier: "Tier 1 (85%+)", label: "Enrichment Pod", price: "$597", color: "green" as const, paymentUrl: "https://buy.stripe.com/eVq8wH4aI2qYfyHaAu4wM02", planAvailable: true },
  { tier: "Tier 2 (66–84%)", label: "Skill Builder Program", price: "$1,097", color: "yellow" as const, paymentUrl: "https://buy.stripe.com/14AbITePm3v286f3824wM01", planAvailable: true },
  { tier: "Tier 3 (≤65%)", label: "Intensive Intervention Plan", price: "$2,497–$4,997", color: "red" as const, paymentUrl: "https://calendar.app.google/dHKRRWnqASeUpp4cA", planAvailable: false },
];

/* ── CTA Button Styles ── */
export const CTA_STYLES = {
  red: "bg-red-600 hover:bg-red-700 text-white",
  yellow: "bg-amber-500 hover:bg-amber-600 text-white",
  green: "bg-emerald-600 hover:bg-emerald-700 text-white",
} as const;
