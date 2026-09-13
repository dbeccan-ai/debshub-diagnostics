// Report-safety layer for the D.E.Bs TACHS Readiness Diagnostic.
// Pure (no Deno / Supabase imports) so it is unit-testable and shared by
// tachs-engine (API shaping) and send-tachs-results (email HTML).
//
// Two strictly separated surfaces:
//   * PARENT released report — exactly: six section scores + D.E.Bs Tier, overall score + Tier,
//     the consultant-reviewed interpretation, the next-step plan, the recommended program & price,
//     and a disclaimer. Built ONLY from whitelisted section accuracies plus the consultant-controlled
//     parent_report_content structure. Never item counts, timing, pacing, bands, blueprint/bank/
//     carry-over notes, workflow status, reviewer identity, internal notes or any item-level data.
//   * ADMIN/internal report — everything (item audit, keys, rationales, adaptive path, bank notes),
//     served only by admin_detail to /admin/tachs/:attemptId.
//
// Delivery: completion sends ONLY an acknowledgment. The released report is visible/emailed only
// after an admin has moved it through draft -> reviewed -> approved (-> sent).

import {
  PROGRAM_FOR_TIER, PROGRAM_KEYS, TACHS_PROGRAMS, TACHS_TIERS, tachsTierFor, usd, usd2, ENROLLMENT_CALL_URL,
  pricingBreakdown, addDaysIso, DIAGNOSTIC_CREDIT_WINDOW_DAYS, type PricingBreakdown, type TachsProgram, type TachsProgramKey, type TachsTierKey,
} from "./tachs-programs.ts";

export const APP_URL = "https://debshub-diagnostics.lovable.app";

export const SECTION_ORDER = ["reading", "written_expression", "mathematics", "figure_matrices", "paper_folding", "figure_classification"] as const;
export const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  written_expression: "Written Expression",
  mathematics: "Mathematics",
  figure_matrices: "Figure Matrices",
  paper_folding: "Paper Folding",
  figure_classification: "Figure Classification",
};

/** Human labels for skill keys; special cases first, then Title Case. (Admin surfaces only.) */
const SKILL_LABEL_OVERRIDES: Record<string, string> = {
  size_position_partwhole: "Size, Position & Part-Whole",
  partwhole: "Part-Whole",
  part_whole: "Part-Whole",
  two_rule_integration: "Two-Rule Integration",
  vocabulary_in_context: "Vocabulary in Context",
  main_idea: "Main Idea",
};
export const skillLabel = (skill: string): string => {
  if (SKILL_LABEL_OVERRIDES[skill]) return SKILL_LABEL_OVERRIDES[skill];
  return skill
    .replace(/partwhole/g, "part-whole")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bPart-whole\b/g, "Part-Whole");
};

// ---------- report status workflow ----------
export type ReportStatus = "draft" | "reviewed" | "approved" | "sent";
export const REPORT_STATUSES: ReportStatus[] = ["draft", "reviewed", "approved", "sent"];
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["reviewed"],
  reviewed: ["approved", "draft"],
  approved: ["sent", "draft"],
  sent: ["sent", "draft"], // re-send of an approved+sent report, or reopen for revision
};
export const canTransitionReport = (from: string, to: string): boolean =>
  (TRANSITIONS[from as ReportStatus] ?? []).includes(to as ReportStatus);
/** Only an approved (or previously sent) report may be emailed to / viewed by the parent. */
export const canSendParentReport = (status: string): boolean => status === "approved" || status === "sent";
export const isReportReleased = canSendParentReport;
/** Consultant content may be edited only before approval. */
export const canEditParentContent = (status: string): boolean => status === "draft" || status === "reviewed";

export const PARENT_REPORT_TITLE = "TACHS Diagnostic Results & Recommended Plan";
export const REPORT_PREPARING_MESSAGE =
  "Your reviewed report is being prepared. A D.E.Bs consultant reviews every diagnostic before results and the recommended plan are released. We will notify you as soon as it is ready.";
export const DISCLAIMER_SHORT =
  "These are D.E.Bs internal diagnostic results based on raw accuracy in our own original assessment. They are not an official TACHS scaled score, percentile, admission decision or guarantee of admission or scholarship. D.E.Bs is not affiliated with, sponsored by, or endorsed by the TACHS program.";
export const PLACEMENT_NOTE =
  "Placement is based on this diagnostic and finalized after consultant review with your family.";

// ---------- consultant-controlled content (no item-level data by construction) ----------
/**
 * At-Home Support Plan — section-level only. Generated from the consultant-approved priority
 * sections and the six section tiers; never from raw skill metrics or item data.
 */
export interface HomeSupportPlan {
  cadence: string;
  section_actions: { section_key: string; actions: string[] }[];
  weekly_routine: string[];
  guidance: string[];
  progress_check: string;
  strengths_note: string | null;
}
export interface ParentReportContent {
  interpretation: string;
  priority_sections: string[];
  recommended_program_key: TachsProgramKey;
  customized_next_steps: string[];
  price_override_cents: number | null;
  /** Consultant-editable. Defaults to approval/release time + 7 calendar days when the report is approved. */
  credit_expires_at: string | null;
  approved_for_parent_at: string | null;
  /** Consultant-editable At-Home Support Plan (defaults regenerate from the priorities + program). */
  home_support_plan: HomeSupportPlan;
}
export const defaultCreditExpiry = (approvedAtIso: string): string => addDaysIso(approvedAtIso, DIAGNOSTIC_CREDIT_WINDOW_DAYS);

export const HOME_SUPPORT_TITLE = "At-Home Support Plan";
/** Parent-friendly, section-level home activities. Deliberately free of internal vocabulary. */
const HOME_ACTIONS: Record<string, string[]> = {
  reading: [
    "Read one short article or story passage (about a page) and, without looking back, state its main idea in one sentence.",
    "Keep a vocabulary notebook: record five unfamiliar words each week from reading, guessing the meaning from context before checking.",
    "After reading, answer two 'why' questions about the author's purpose or a character's choice, pointing to a line in the text.",
    "Once a week, complete a short timed comprehension set on a fresh passage and record the finish time.",
  ],
  written_expression: [
    "Edit one paragraph a day for grammar, punctuation and capitalization, then explain each change aloud.",
    "Rewrite two awkward or run-on sentences so that each is clear and complete.",
    "Put a scrambled short paragraph back in logical order and point out the topic sentence.",
    "Keep a personal list of commonly confused words (their/there, its/it's) and check written work against it.",
  ],
  mathematics: [
    "Complete a 20-minute mixed set of grade 8 and introductory Algebra I problems (equations, ratios, percents, fractions), showing every step.",
    "Solve two multistep word problems by writing what is known, what is asked and the plan before calculating.",
    "Answer three questions from one table or graph to practice reading data accurately.",
    "Do five quick estimation problems and check each estimate against the exact result.",
  ],
  figure_matrices: [
    "Work through 8–10 figure-matrix puzzles, saying the rule (turn, flip, shading, count, size) before choosing.",
    "Sketch how a simple shape looks after a quarter turn and after a flip, then compare with the original.",
    "For any missed puzzle, describe the two changes that happen across the row and down the column.",
  ],
  paper_folding: [
    "Fold a square of paper once or twice, punch a hole, predict where the holes will be, then unfold to check.",
    "On grid paper, draw the fold line and mirror the punched hole across it before unfolding.",
    "Complete 6–8 paper-folding puzzles, always predicting first and checking second.",
  ],
  figure_classification: [
    "Sort a set of drawn shapes by one attribute (sides, shading, size), then re-sort by a second attribute.",
    "For 8–10 classification puzzles, say in words what all the given figures share before picking the one that belongs.",
    "Play 'odd one out' with household objects or drawn figures, explaining the shared rule each time.",
  ],
};
const HOME_SESSION: Record<TachsTierKey, { minutes: number; days: number }> = {
  green: { minutes: 20, days: 3 }, yellow: { minutes: 25, days: 3 }, red: { minutes: 30, days: 4 },
};

/**
 * Generated At-Home Support Plan. Inputs are limited to the program, the consultant-approved
 * priority section keys and the six whitelisted section scores/tiers.
 */
export function defaultHomeSupportPlan(programKey: TachsProgramKey, prioritySections: string[], sections: ParentSectionScore[]): HomeSupportPlan {
  const program = TACHS_PROGRAMS[programKey];
  const { minutes, days } = HOME_SESSION[program.tier];
  const ordered = [...sections].sort((a, b) => a.accuracy - b.accuracy);
  let targets = SECTION_ORDER.filter((k) => prioritySections.includes(k)) as string[];
  if (!targets.length) targets = ordered.filter((s) => s.tier !== "green").slice(0, 3).map((s) => s.section_key);
  if (!targets.length) targets = ordered.slice(0, 2).map((s) => s.section_key);
  const strong = sections.filter((s) => s.tier === "green" && !targets.includes(s.section_key)).map((s) => s.label);
  return {
    cadence: `${program.sessions_per_week} consultant-led sessions each week for ${program.duration_weeks} weeks (${program.name}), plus ${days} short independent practice blocks of about ${minutes} minutes at home.`,
    section_actions: targets.map((k) => ({ section_key: k, actions: (HOME_ACTIONS[k] ?? []).slice(0, program.tier === "green" ? 2 : 4) })),
    weekly_routine: [
      "Days 1 and 2: attend the two scheduled sessions and finish the short assignment given in each.",
      `Days 3 to ${2 + days}: one ${minutes}-minute independent practice block, rotating through the sections listed above.`,
      "Day 6: one timed mini-set (10–15 minutes) in a single section; the student works alone and records the time.",
      "Day 7: rest, or a light 10-minute vocabulary or mental-math refresher. Parent looks over the week's completed work with the student.",
    ],
    guidance: [
      "The student should complete the practice independently; the goal is confident, unassisted work.",
      "Parents encourage a steady routine, protect the practice time, and check that each block was completed.",
      "Please do not coach or prompt during timed practice — timed sets are most useful when they show what the student can do alone.",
      "If a block feels too hard, stop at the planned time and note it for the consultant rather than pushing through.",
    ],
    progress_check: `${program.progress_monitoring} Bring the completed home-practice log to each check so the consultant can adjust this plan.`,
    strengths_note: strong.length ? `Keep ${joinNames(strong)} sharp with one short practice set every other week.` : null,
  };
}

const HOME_PLAN_KEYS = new Set(["cadence", "section_actions", "weekly_routine", "guidance", "progress_check", "strengths_note"]);
const strList = (v: unknown, max: number, maxLen: number): string[] | null =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, maxLen)).filter(Boolean).slice(0, max) : null;

/** Validates a consultant-edited home plan against the typed, section-level shape. */
export function sanitizeHomeSupportPlan(input: unknown, fallback: HomeSupportPlan): { ok: true; plan: HomeSupportPlan } | { ok: false; error: string } {
  if (input == null) return { ok: true, plan: fallback };
  if (typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "home_support_plan must be an object." };
  const o = input as Record<string, unknown>;
  const extra = Object.keys(o).filter((k) => !HOME_PLAN_KEYS.has(k));
  if (extra.length) return { ok: false, error: `Unexpected home plan fields: ${extra.join(", ")}` };
  const cadence = typeof o.cadence === "string" ? o.cadence.trim().slice(0, 400) : fallback.cadence;
  if (!cadence) return { ok: false, error: "The home plan cadence cannot be empty." };
  const rawSections = Array.isArray(o.section_actions) ? o.section_actions : fallback.section_actions;
  const section_actions: HomeSupportPlan["section_actions"] = [];
  for (const s of rawSections.slice(0, 6)) {
    if (!s || typeof s !== "object" || Array.isArray(s)) return { ok: false, error: "Each home plan section must be an object." };
    const so = s as Record<string, unknown>;
    const bad = Object.keys(so).filter((k) => k !== "section_key" && k !== "actions");
    if (bad.length) return { ok: false, error: `Unexpected home plan section fields: ${bad.join(", ")}` };
    if (typeof so.section_key !== "string" || !(SECTION_ORDER as readonly string[]).includes(so.section_key)) return { ok: false, error: "Home plan sections must be TACHS section keys." };
    const actions = strList(so.actions, 4, 300) ?? [];
    if (!actions.length) return { ok: false, error: `Add at least one at-home action for ${SECTION_LABELS[so.section_key]}.` };
    section_actions.push({ section_key: so.section_key, actions });
  }
  if (!section_actions.length) return { ok: false, error: "The home plan needs at least one section." };
  const weekly_routine = strList(o.weekly_routine, 7, 300) ?? fallback.weekly_routine;
  const guidance = strList(o.guidance, 6, 300) ?? fallback.guidance;
  if (!weekly_routine.length || !guidance.length) return { ok: false, error: "The weekly routine and guidance cannot be empty." };
  const progress_check = typeof o.progress_check === "string" ? o.progress_check.trim().slice(0, 500) : fallback.progress_check;
  if (!progress_check) return { ok: false, error: "The progress-check reminder cannot be empty." };
  const strengths_note = o.strengths_note == null || o.strengths_note === "" ? null : typeof o.strengths_note === "string" ? o.strengths_note.trim().slice(0, 300) : fallback.strengths_note;
  return { ok: true, plan: { cadence, section_actions, weekly_routine, guidance, progress_check, strengths_note } };
}

// ---------- released parent report ----------
export interface ParentSectionScore { section_key: string; label: string; accuracy: number; tier: TachsTierKey; tier_badge: string; tier_label: string }
export interface ParentProgramView {
  key: TachsProgramKey; name: string; duration_weeks: number; sessions_per_week: number; total_cents: number; price_label: string;
  installments_label: string; focus: string[]; included: string[]; progress_monitoring: string; honesty_note: string | null;
  payment_url: string | null; enrollment_call_url: string;
  /** Receipt-style pricing with the conditional credit applied; live checkout links stay null. */
  pricing: PricingBreakdown;
}
export interface HomeSupportView {
  title: string; cadence: string; sections: { label: string; actions: string[] }[];
  weekly_routine: string[]; guidance: string[]; progress_check: string; strengths_note: string | null;
}
export interface ParentReport {
  kind: "parent_released";
  title: string;
  assessment_date: string | null;
  overall: { accuracy: number; tier: TachsTierKey; tier_badge: string; tier_label: string };
  sections: ParentSectionScore[]; // exactly six, fixed order
  interpretation: string;
  priority_sections: string[];
  plan: string[];
  placement_note: string;
  home_support: HomeSupportView;
  program: ParentProgramView;
  disclaimer: string;
}

const tierView = (accuracy: number) => {
  const t = TACHS_TIERS[tachsTierFor(accuracy)];
  return { tier: t.key, tier_badge: t.badge, tier_label: t.label };
};

/** Whitelisted section scores only: exactly six rows in fixed order, accuracy + tier. */
export function sectionScores(results: Record<string, any> | null | undefined): ParentSectionScore[] {
  const raw: any[] = Array.isArray(results?.sections) ? results!.sections : [];
  return SECTION_ORDER.map((key) => {
    const s = raw.find((x) => x?.section_key === key);
    const accuracy = Math.max(0, Math.min(100, Math.round(Number(s?.accuracy ?? 0))));
    return { section_key: key, label: SECTION_LABELS[key], accuracy, ...tierView(accuracy) };
  });
}

const joinNames = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** Parent-friendly interpretation from the overall tier and the relative section pattern only. */
export function defaultInterpretation(overall: number, sections: ParentSectionScore[]): string {
  const strong = sections.filter((s) => s.tier === "green").map((s) => s.label);
  const developing = sections.filter((s) => s.tier === "yellow").map((s) => s.label);
  const priority = sections.filter((s) => s.tier === "red").map((s) => s.label);
  const t = TACHS_TIERS[tachsTierFor(overall)];
  const lead = t.key === "green"
    ? `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). Performance is strong across the TACHS sections, and the goal now is to keep that accuracy stable under exam pacing while stretching into more demanding reasoning.`
    : t.key === "yellow"
      ? `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). The foundations are in place, and the score pattern points to specific sections where focused practice over the coming weeks would move results toward mastery.`
      : `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). The results show foundational gaps in several sections that will respond best to structured, step-by-step instruction before timed practice is added.`;
  const parts = [lead];
  if (strong.length) parts.push(`${joinNames(strong)} ${strong.length === 1 ? "is a clear strength" : "are clear strengths"} and should be maintained with regular review.`);
  if (developing.length) parts.push(`${joinNames(developing)} ${developing.length === 1 ? "is" : "are"} in the strengthening zone: accuracy is developing and would benefit from targeted, consistent practice.`);
  if (priority.length) parts.push(`${joinNames(priority)} ${priority.length === 1 ? "is a priority area" : "are priority areas"} where rebuilding core skills should come first.`);
  parts.push("This interpretation reflects the D.E.Bs consultant's review of the overall score and the pattern across sections.");
  return parts.join(" ");
}

/** Default next-step plan: priorities, cadence, duration, progress monitoring, reassessment. */
export function defaultNextSteps(program: TachsProgram, priority: string[]): string[] {
  const steps: string[] = [];
  steps.push(priority.length
    ? `Priorities: begin with ${joinNames(priority.map((k) => SECTION_LABELS[k] ?? k))}, then extend to the remaining sections.`
    : "Priorities: maintain accuracy across all six sections while increasing the level of challenge.");
  steps.push(`Instructional cadence: ${program.sessions_per_week} sessions per week with short, structured practice between sessions.`);
  steps.push(`Duration: ${program.duration_weeks} weeks (${program.name}).`);
  steps.push(`Progress monitoring: ${program.progress_monitoring}`);
  steps.push(program.tier === "green"
    ? "Reassessment: a timed full-length reassessment at the end of the program to confirm readiness."
    : "Reassessment: a full-length reassessment at the end of the program compares directly against this diagnostic.");
  return steps;
}

/** Safe generated defaults for the admin editor. Contains no item-level data. */
export function defaultParentReportContent(results: Record<string, any> | null | undefined): ParentReportContent {
  const overall = Math.max(0, Math.min(100, Math.round(Number(results?.overall_accuracy ?? 0))));
  const sections = sectionScores(results);
  const priority = sections.filter((s) => s.tier === "red").map((s) => s.section_key);
  const programKey = PROGRAM_FOR_TIER[tachsTierFor(overall)];
  return {
    interpretation: defaultInterpretation(overall, sections),
    priority_sections: priority,
    recommended_program_key: programKey,
    customized_next_steps: defaultNextSteps(TACHS_PROGRAMS[programKey], priority),
    price_override_cents: null,
    credit_expires_at: null,
    approved_for_parent_at: null,
    home_support_plan: defaultHomeSupportPlan(programKey, priority, sections),
  };
}

/** Validates/sanitizes consultant-entered content. Rejects anything outside the typed shape. */
export function sanitizeParentReportContent(input: unknown, results: Record<string, any> | null | undefined): { ok: true; content: ParentReportContent } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Content must be an object." };
  const defaults = defaultParentReportContent(results);
  const o = input as Record<string, unknown>;
  const allowed = new Set(["interpretation", "priority_sections", "recommended_program_key", "customized_next_steps", "price_override_cents", "credit_expires_at", "approved_for_parent_at", "home_support_plan"]);
  const extra = Object.keys(o).filter((k) => !allowed.has(k));
  if (extra.length) return { ok: false, error: `Unexpected fields: ${extra.join(", ")}` };
  const interpretation = typeof o.interpretation === "string" ? o.interpretation.trim().slice(0, 4000) : defaults.interpretation;
  if (!interpretation) return { ok: false, error: "The interpretation cannot be empty." };
  const ps = Array.isArray(o.priority_sections) ? o.priority_sections : defaults.priority_sections;
  if (!ps.every((k) => typeof k === "string" && (SECTION_ORDER as readonly string[]).includes(k))) return { ok: false, error: "priority_sections must be TACHS section keys." };
  const pk = typeof o.recommended_program_key === "string" ? o.recommended_program_key : defaults.recommended_program_key;
  if (!PROGRAM_KEYS.includes(pk as TachsProgramKey)) return { ok: false, error: "Unknown program." };
  const stepsIn = Array.isArray(o.customized_next_steps) ? o.customized_next_steps : defaults.customized_next_steps;
  const steps = stepsIn.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, 600)).filter(Boolean).slice(0, 12);
  if (!steps.length) return { ok: false, error: "At least one next step is required." };
  let price: number | null = null;
  if (o.price_override_cents != null && o.price_override_cents !== "") {
    const n = Number(o.price_override_cents);
    if (!Number.isInteger(n) || n < 0 || n > 5_000_000) return { ok: false, error: "price_override_cents must be a whole number of cents." };
    price = n;
  }
  let creditExpires: string | null = null;
  if (o.credit_expires_at != null && o.credit_expires_at !== "") {
    const d = new Date(String(o.credit_expires_at));
    if (Number.isNaN(d.getTime())) return { ok: false, error: "credit_expires_at must be a valid date." };
    creditExpires = d.toISOString();
  }
  const prioritySet = [...new Set(ps as string[])];
  const homePlan = sanitizeHomeSupportPlan(o.home_support_plan, defaultHomeSupportPlan(pk as TachsProgramKey, prioritySet, sectionScores(results)));
  if (!homePlan.ok) return { ok: false, error: (homePlan as { error: string }).error };
  const content: ParentReportContent = {
    interpretation, priority_sections: prioritySet, recommended_program_key: pk as TachsProgramKey,
    customized_next_steps: steps, price_override_cents: price, credit_expires_at: creditExpires, approved_for_parent_at: null, // approval stamp is set server-side only
    home_support_plan: homePlan.plan,
  };
  const leaked = findForbiddenParentKeys(content).concat(findForbiddenParentPhrases(JSON.stringify(content)));
  if (leaked.length) return { ok: false, error: `Parent content must not contain internal terms (${leaked.join(", ")}).` };
  return { ok: true, content };
}

export function programView(key: TachsProgramKey, priceOverrideCents: number | null, creditExpiresAt: string | null = null): ParentProgramView {
  const p = TACHS_PROGRAMS[key];
  const total = priceOverrideCents ?? p.total_cents;
  const pricing = pricingBreakdown({ regular_tuition_cents: total, installment_count: p.installments.count, credit_applied: true, credit_expires_at: creditExpiresAt });
  return {
    key: p.key, name: p.name, duration_weeks: p.duration_weeks, sessions_per_week: p.sessions_per_week, total_cents: total, price_label: usd(total),
    installments_label: `${pricing.installments.count} payments of ${usd2(pricing.installments.charge_each_cents)} (each includes the processing fee)`,
    focus: [...p.focus], included: [...p.included], progress_monitoring: p.progress_monitoring, honesty_note: p.honesty_note,
    payment_url: p.payment_url, enrollment_call_url: ENROLLMENT_CALL_URL, pricing,
  };
}

/**
 * Build the released parent report from stored results + consultant content. Whitelists by
 * construction: only section accuracies/tiers and the typed content structure are read.
 * When no content has been saved yet, safe generated defaults are used (admin preview only —
 * the results action never releases anything before approval).
 */
export function parentReportView(results: Record<string, any> | null | undefined, content?: ParentReportContent | null, assessmentDate?: string | null): ParentReport | null {
  if (!results) return null;
  const c = content ?? defaultParentReportContent(results);
  const overall = Math.max(0, Math.min(100, Math.round(Number(results.overall_accuracy ?? 0))));
  const sections = sectionScores(results);
  // Older saved content (before the home plan existed) gets a generated plan from its own priorities/program.
  const hp = c.home_support_plan ?? defaultHomeSupportPlan(c.recommended_program_key, c.priority_sections, sections);
  return {
    kind: "parent_released",
    title: PARENT_REPORT_TITLE,
    assessment_date: assessmentDate ?? null,
    overall: { accuracy: overall, ...tierView(overall) },
    sections,
    interpretation: c.interpretation,
    priority_sections: c.priority_sections.map((k) => SECTION_LABELS[k] ?? k),
    plan: [...c.customized_next_steps],
    placement_note: PLACEMENT_NOTE,
    home_support: {
      title: HOME_SUPPORT_TITLE, cadence: hp.cadence,
      sections: hp.section_actions.map((s) => ({ label: SECTION_LABELS[s.section_key] ?? s.section_key, actions: [...s.actions] })),
      weekly_routine: [...hp.weekly_routine], guidance: [...hp.guidance], progress_check: hp.progress_check, strengths_note: hp.strengths_note,
    },
    program: programView(c.recommended_program_key, c.price_override_cents, c.credit_expires_at ?? null),
    disclaimer: DISCLAIMER_SHORT,
  };
}

/** Keys that must never appear in any parent payload or email. */
export const FORBIDDEN_PARENT_KEYS = [
  // item-level
  "correct_key", "rationale", "selected_key", "stem", "choices", "difficulty", "difficulty_path", "review", "audit", "evidence",
  "question_id", "questions", "responses", "passage_text", "skills", "strengths", "gaps", "skill",
  // internal decisions / bank
  "carryover", "blueprint_version", "blueprint", "bank", "code", "test_mode", "report_status", "report_notes", "notes",
  "report_reviewed_by", "report_approved_by", "reviewed_by", "approved_by", "reviewer", "approver", "events", "email", "email_status",
  // bands / raw counts / timing / pacing
  "band", "working_band", "next_steps", "focus_sections", "math_readiness", "item_count", "presented", "correct", "answered",
  "total_presented", "total_correct", "total_time_seconds", "time_used_seconds", "time_limit_seconds", "pace_seconds_per_item",
  "allotted_seconds_per_item", "pacing", "ended_by", "submit_reason", "started_at", "user_id",
];
export function findForbiddenParentKeys(payload: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (FORBIDDEN_PARENT_KEYS.includes(k)) found.add(k);
        walk(val);
      }
    }
  };
  walk(payload);
  return [...found];
}

/** Internal vocabulary that must never appear in parent-facing text/HTML. */
export const FORBIDDEN_PARENT_PHRASES: RegExp[] = [
  /blueprint/i, /carry-?over/i, /test mode/i, /\bpilot\b/i, /report status/i, /\bdraft\b/i, /\bapproved\b/i, /\bapproval\b/i,
  /reviewer/i, /rationale/i, /answer key/i, /correct answer/i, /item review/i, /question bank/i, /\bbank\b/i, /\bversion\b/i,
  /adaptive/i, /difficulty/i, /\badmin/i, /internal note/i, /working band/i, /pending consultant interpretation/i,
  /\bV2-[RW]/, /\bRD2\b/, /\bWR2\b/, /\/admin\//i, new RegExp(["svg" + "Print", "svg" + "Strengths", "svg" + "Gaps", "<" + "svg"].join("|"), "i"),
];
export function findForbiddenParentPhrases(text: string): string[] {
  return FORBIDDEN_PARENT_PHRASES.filter((re) => re.test(text)).map((re) => re.source);
}

/** Flags attempts that used the earlier blueprint-v2 Reading/Written carry-over codes (V2-R / V2-W). Admin-only. */
export function carryoverSummary(codes: (string | null | undefined)[]): { v2r: number; v2w: number; flagged: boolean; note: string | null } {
  let v2r = 0, v2w = 0;
  for (const c of codes) { if (!c) continue; if (c.startsWith("V2-R")) v2r++; else if (c.startsWith("V2-W")) v2w++; }
  const flagged = v2r + v2w > 0;
  return {
    v2r, v2w, flagged,
    note: flagged
      ? `This attempt used the earlier blueprint-v2 Reading/Written carry-over item codes (V2-R ×${v2r}, V2-W ×${v2w}), not the revised RD2/WR2 pools. Do not treat it as the final revised-bank baseline without consultant review.`
      : null,
  };
}

// ---------- email HTML (print-safe: text and CSS only, no SVG / icon components) ----------
export const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const shell = (heading: string, sub: string, body: string) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:#1C2D5A;color:#ffffff;padding:22px 24px;">
      <div style="font-size:13px;letter-spacing:1.4px;color:#FFDE59;font-weight:700;">D.E.Bs DIAGNOSTIC HUB</div>
      <h1 style="margin:6px 0 0;font-size:22px;">${esc(heading)}</h1>
      <div style="margin-top:6px;font-size:13px;color:#cbd5e1;">${esc(sub)}</div>
    </div>
    <div style="padding:24px;">${body}</div>
  </div></body></html>`;

/** Completion acknowledgment: contains NO results of any kind. */
export function acknowledgmentEmailHtml(input: { firstName: string; completedOn: string }): string {
  return shell("TACHS Readiness Diagnostic — assessment received", "Your reviewed report is being prepared", `
      <p style="margin:0 0 14px;">Hello,</p>
      <p style="margin:0 0 14px;">Thank you — <strong>${esc(input.firstName)}</strong>'s D.E.Bs TACHS Readiness Diagnostic was received and saved on ${esc(input.completedOn)}.</p>
      <div style="border-left:4px solid #FFDE59;background:#fffbea;padding:12px 16px;margin:0 0 16px;">
        <strong>What happens next</strong>
        <ol style="margin:8px 0 0 18px;padding:0;color:#334155;">
          <li>A D.E.Bs consultant reviews the complete diagnostic.</li>
          <li>We prepare the results report and the recommended next-step plan.</li>
          <li>D.E.Bs follows up with you directly to share the report and plan.</li>
        </ol>
      </div>
      <p style="margin:0 0 14px;color:#334155;">No scores are included in this message. Results are released only after consultant review.</p>
      <p style="margin:0 0 14px;color:#334155;">Questions in the meantime? Reply to this email or contact <a href="mailto:info@debslearnacademy.com" style="color:#1C2D5A;">info@debslearnacademy.com</a>.</p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(DISCLAIMER_SHORT)}</p>`);
}

const tierChip = (badge: string, label: string, color: string) =>
  `<span style="display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;color:#ffffff;background:${esc(color)};">${esc(badge)} · ${esc(label)}</span>`;

export const fmtLongDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" }) : null;

/** Receipt-style pricing lines + two payment choices (no live links). Shared by the email; the page mirrors it. */
export function pricingHtml(pr: PricingBreakdown): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:5px 0;color:#334155;${strong ? "font-weight:700;" : ""}">${esc(label)}</td><td style="padding:5px 0;text-align:right;${strong ? "font-weight:700;" : ""}">${esc(value)}</td></tr>`;
  const exp = fmtLongDate(pr.credit_expires_at);
  return `
        <table role="table" style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;border-top:1px solid #e2e8f0;">
          <caption style="text-align:left;font-size:12px;color:#64748b;padding:6px 0;">Tuition, credit and processing fee are shown separately.</caption>
          <tbody>
            ${row("Regular tuition", usd2(pr.regular_tuition_cents))}
            ${row(`Diagnostic Enrollment Credit${exp ? ` (enroll by ${exp})` : ""}`, `− ${usd2(pr.credit_cents)}`)}
            ${row("Tuition balance", usd2(pr.balance_cents), true)}
            ${row("Stripe processing fee (pay in full)", usd2(pr.fee_full_cents))}
            ${row("Total checkout charge (pay in full)", usd2(pr.total_full_cents), true)}
          </tbody>
        </table>
        <div style="margin-top:10px;font-weight:600;">Payment choices</div>
        <ul style="margin:4px 0 0 18px;padding:0;color:#334155;">
          <li style="margin:0 0 6px;"><strong>Pay in full:</strong> ${esc(usd2(pr.total_full_cents))} including the processing fee (tuition balance ${esc(usd2(pr.balance_cents))}).</li>
          <li style="margin:0 0 6px;"><strong>Installments:</strong> ${esc(pr.installments.count)} payments of ${esc(usd2(pr.installments.charge_each_cents))}, each including the processing fee (each covers ${esc(usd2(pr.installments.net_each_cents))} of tuition; total charged ${esc(usd2(pr.installments.total_charged_cents))}).</li>
        </ul>
        <p style="font-size:12px;color:#475569;margin:8px 0 0;">${esc(pr.installment_fee_note)}</p>
        <p style="font-size:12px;color:#475569;margin:6px 0 0;">${esc(pr.credit_terms)}${exp ? ` Credit valid through ${esc(exp)}.` : ""}</p>
        <p style="font-size:12px;color:#475569;margin:6px 0 0;">${esc(pr.domestic_card_note)}</p>
        <p style="font-size:12px;color:#475569;margin:6px 0 0;">Enrollment and payment are completed with your consultant on the enrollment call.</p>`;
}

/** Released parent report: scores + tiers, interpretation, plan, program & price, disclaimer. Nothing else. */
export function parentReportEmailHtml(input: { firstName: string; gradeLevel: number | null; completedOn: string; attemptId: string; report: ParentReport }): string {
  const r = input.report;
  const cell = "padding:8px 10px;border-bottom:1px solid #e2e8f0;";
  const rows = r.sections.map((s) => `
        <tr>
          <th scope="row" style="${cell}text-align:left;font-weight:600;">${esc(s.label)}</th>
          <td style="${cell}text-align:center;font-weight:600;">${esc(s.accuracy)}%</td>
          <td style="${cell}text-align:center;">${tierChip(s.tier_badge, s.tier_label, TACHS_TIERS[s.tier].color)}</td>
        </tr>`).join("");
  const p = r.program;
  const li = (xs: string[]) => xs.map((x) => `<li style="margin:0 0 6px;">${esc(x)}</li>`).join("");
  return shell(PARENT_REPORT_TITLE, "Reviewed by a D.E.Bs consultant", `
      <p style="margin:0 0 6px;">Hello, here are <strong>${esc(input.firstName)}</strong>'s${input.gradeLevel ? ` (Grade ${esc(input.gradeLevel)})` : ""} TACHS diagnostic results, completed on ${esc(input.completedOn)}.</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:20px 0 8px;">1. Student summary</h2>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
        <div style="font-size:13px;color:#64748b;">Overall score</div>
        <div style="font-size:28px;font-weight:800;color:#1C2D5A;">${esc(r.overall.accuracy)}%</div>
        <div style="margin-top:6px;">${tierChip(r.overall.tier_badge, r.overall.tier_label, TACHS_TIERS[r.overall.tier].color)}</div>
      </div>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">2. Section results</h2>
      <table role="table" style="width:100%;border-collapse:collapse;font-size:14px;">
        <caption style="text-align:left;font-size:12px;color:#64748b;padding:0 0 6px;">Score and D.E.Bs Tier for each of the six TACHS sections.</caption>
        <thead><tr style="background:#f1f5f9;">
          <th scope="col" style="padding:8px 10px;text-align:left;">Section</th><th scope="col" style="padding:8px 10px;">Score</th><th scope="col" style="padding:8px 10px;">D.E.Bs Tier</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;color:#64748b;margin:8px 0 0;">Tier 1 = 85–100% Demonstrated Mastery · Tier 2 = 66–84% Strengthening Zone · Tier 3 = 0–65% Priority Intervention Required.</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">3. D.E.Bs consultant interpretation</h2>
      <p style="margin:0;color:#334155;line-height:1.55;">${esc(r.interpretation)}</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">4. Recommended next-step plan</h2>
      <ul style="margin:0 0 8px 18px;padding:0;color:#334155;">${li(r.plan)}</ul>
      <p style="font-size:13px;color:#475569;margin:0;">${esc(r.placement_note)}</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">5. ${esc(r.home_support.title)}</h2>
      ${homeSupportHtml(r.home_support)}

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">6. Recommended program &amp; pricing</h2>
      <div style="border:2px solid #1C2D5A;border-radius:10px;padding:14px 16px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Recommended service option</div>
        <div style="font-size:18px;font-weight:800;color:#1C2D5A;margin-top:2px;">${esc(p.name)}</div>
        <div style="color:#334155;margin-top:4px;">${esc(p.duration_weeks)} weeks · ${esc(p.sessions_per_week)} sessions per week</div>
        ${pricingHtml(p.pricing)}
        <div style="margin-top:10px;font-weight:600;">Focus</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(p.focus)}</ul>
        <div style="margin-top:10px;font-weight:600;">What is included</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(p.included)}</ul>
        ${p.honesty_note ? `<p style="font-size:13px;color:#475569;margin:10px 0 0;">${esc(p.honesty_note)}</p>` : ""}
        <p style="margin:16px 0 0;"><a href="${esc(p.enrollment_call_url)}" style="background:#1C2D5A;color:#FFDE59;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block;">Schedule Enrollment Call</a></p>
      </div>

      <p style="margin:22px 0;"><a href="${APP_URL}/tachs/results/${esc(input.attemptId)}" style="color:#1C2D5A;font-weight:700;">Open the report online</a></p>
      <h2 style="font-size:14px;color:#1C2D5A;margin:22px 0 6px;">7. Please note</h2>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(r.disclaimer)}</p>`);
}

/** At-Home Support Plan block (email + print). Section-level actions only. */
export function homeSupportHtml(h: HomeSupportView): string {
  const li = (xs: string[]) => xs.map((x) => `<li style="margin:0 0 6px;">${esc(x)}</li>`).join("");
  return `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
        <p style="margin:0 0 10px;color:#334155;"><strong>Weekly cadence:</strong> ${esc(h.cadence)}</p>
        ${h.sections.map((s) => `<div style="margin-top:8px;font-weight:600;">${esc(s.label)}</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(s.actions)}</ul>`).join("")}
        ${h.strengths_note ? `<p style="font-size:13px;color:#475569;margin:10px 0 0;">${esc(h.strengths_note)}</p>` : ""}
        <div style="margin-top:12px;font-weight:600;">Simple weekly routine</div><ol style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(h.weekly_routine)}</ol>
        <div style="margin-top:12px;font-weight:600;">How families can help</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(h.guidance)}</ul>
        <p style="margin:12px 0 0;color:#334155;"><strong>Progress check:</strong> ${esc(h.progress_check)}</p>
      </div>`;
}
