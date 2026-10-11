// Authoritative evidence/scoring contract for GENERAL K-12 Math & ELA diagnostic reports.
// Shared by grade-test, finalize-grading, regrade-test, generate-result-download (Deno) and the web app (via
// src/lib/diagnosticReport.ts). TACHS and SHSAT have their own report contracts and are NOT handled here.
// Pure functions only: nothing here reads or writes the database.

import { GENERAL_TIER_THRESHOLDS, TIER3_PLAN, detectSubject, tierFromScore, type GeneralTier } from "./general-curriculum.ts";
import { readCanonicalTags } from "./general-item-tags.ts";

export const REPORT_VERSION = "general-report-v2";
export const BRAND_NAME = "D.E.Bs LEARNING ACADEMY LLC";
export const BRAND_TAGLINE = "Unlocking Brilliance Through Learning";
/** Local reports display dates in the Academy's home time zone. */
export const REPORT_TIME_ZONE = "America/New_York";
export function formatReportDate(d: string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: REPORT_TIME_ZONE, ...(withTime ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}) });
}
export const SKILL_ANALYSIS_VERSION = 2;
/** Per-skill status uses the same authoritative 85/66 boundaries as the overall tier (tierConfig.ts). */
export const SKILL_STATUS_THRESHOLDS = { STRENGTH: GENERAL_TIER_THRESHOLDS.GREEN, DEVELOPING: GENERAL_TIER_THRESHOLDS.YELLOW } as const;
/** Fewer scored items than this for a skill = limited evidence (labelled, never presented as broad mastery). */
export const LOW_EVIDENCE_ITEMS = 3;

export type ReportSubject = "math" | "ela" | "unknown";
export function detectReportSubject(testType?: string | null, testName?: string | null): ReportSubject {
  // Explicit test_type wins; the name is only consulted when test_type is absent/ambiguous. Unknown stays unknown.
  return detectSubject(testType, null) ?? detectSubject(null, testName) ?? "unknown";
}

/* ───────────── Item normalisation ───────────── */

export type SkillSource = "tag" | "inferred" | "unmapped";
export interface NormalizedItem {
  id: string;
  idSource: "explicit" | "derived";
  position: number;
  rawType: string;
  scoring: "auto" | "manual";
  section: string | null;
  subsection: string | null;
  domain: string;
  skill: string;
  skillSource: SkillSource;
  secondarySkills?: string[];
  question: string;
  options: string[];
  correct_answer: string;
  /** "Choose N of M" group membership, read from explicit item/section metadata or the section title. */
  choiceGroup: ChoiceGroup | null;
}
export interface ItemIssues { duplicateIds: string[]; missingIds: number; }

export interface ChoiceGroup { key: string; required: number; size: number | null; source: "metadata" | "title" }
const CHOOSE_RE = /choose\s+(?:any\s+)?(\d+)\s*(?:out\s+of|of|from)\s*(?:the\s+)?(\d+)/i;
/** Reads a "choose N of M" requirement from explicit item metadata, else from the section/subsection title. Never guessed. */
export function parseChoiceGroup(q: any, section: string | null, subsection: string | null): ChoiceGroup | null {
  const req = Number(q?.required_count ?? q?.choose ?? q?.choice_group?.required);
  const key = q?.choice_group?.key ?? q?.choice_group_id ?? (typeof q?.choice_group === "string" ? q.choice_group : null);
  if (Number.isFinite(req) && req > 0) return { key: String(key ?? subsection ?? section ?? "group"), required: req, size: Number(q?.choice_group?.size) || null, source: "metadata" };
  for (const t of [subsection, section]) {
    const m = t ? CHOOSE_RE.exec(t) : null;
    if (m) return { key: t!, required: Number(m[1]), size: Number(m[2]), source: "title" };
  }
  return null;
}

export interface ChoiceGroupCoverage { key: string; required: number; size: number; answered: number; missingRequired: number; optionalNotSelected: number; status: "complete" | "under_selected"; questionIds: string[] }
export interface Coverage {
  state: "complete" | "incomplete";
  requiredItems: number; answeredRequired: number; missingRequired: number;
  missingMandatoryIds: string[]; optionalNotSelected: number; optionalNotSelectedIds: string[];
  choiceGroups: ChoiceGroupCoverage[]; statement: string;
}
/**
 * Completion check. Ordinary items are mandatory. In a "choose N" group, answering N satisfies it and the rest are
 * optional; answering fewer than N means (N - answered) required responses are missing. A saved response counts as
 * answered (pending/partial included). Arithmetic agreement of the score is never treated as proof of completion.
 */
export function assessCoverage(items: { id: string; outcome: string; choiceGroup: ChoiceGroup | null }[]): Coverage {
  const groups = new Map<string, typeof items>();
  const mandatory: typeof items = [];
  for (const i of items) i.choiceGroup ? groups.set(i.choiceGroup.key, [...(groups.get(i.choiceGroup.key) ?? []), i]) : mandatory.push(i);
  const missingMandatoryIds = mandatory.filter((i) => i.outcome === "unanswered").map((i) => i.id);
  const choiceGroups: ChoiceGroupCoverage[] = [...groups].map(([key, g]) => {
    const required = Math.min(g[0].choiceGroup!.required, g.length);
    const answered = g.filter((i) => i.outcome !== "unanswered").length;
    const missingRequired = Math.max(0, required - answered);
    const unanswered = g.filter((i) => i.outcome === "unanswered");
    return { key, required, size: g.length, answered, missingRequired, optionalNotSelected: missingRequired ? 0 : unanswered.length,
      status: missingRequired ? "under_selected" : "complete", questionIds: g.map((i) => i.id) };
  });
  const optionalNotSelectedIds = [...groups].flatMap(([key, g]) => (choiceGroups.find((c) => c.key === key)!.missingRequired ? [] : g.filter((i) => i.outcome === "unanswered").map((i) => i.id)));
  const missingRequired = missingMandatoryIds.length + choiceGroups.reduce((a, c) => a + c.missingRequired, 0);
  const requiredItems = mandatory.length + choiceGroups.reduce((a, c) => a + c.required, 0);
  const parts: string[] = [];
  if (missingMandatoryIds.length) parts.push(`${missingMandatoryIds.length} required question(s) have no saved response (${missingMandatoryIds.slice(0, 8).join(", ")}${missingMandatoryIds.length > 8 ? ", …" : ""}).`);
  for (const c of choiceGroups.filter((c) => c.missingRequired)) parts.push(`"${c.key}" requires ${c.required} of ${c.size} responses but only ${c.answered} ${c.answered === 1 ? "was" : "were"} saved (${c.missingRequired} required response${c.missingRequired === 1 ? "" : "s"} missing).`);
  return { state: missingRequired ? "incomplete" : "complete", requiredItems, answeredRequired: requiredItems - missingRequired, missingRequired,
    missingMandatoryIds, optionalNotSelected: optionalNotSelectedIds.length, optionalNotSelectedIds, choiceGroups,
    statement: parts.length ? parts.join(" ") : "All required questions have a saved response." };
}

export const ELA_DOMAINS = ["Reading Comprehension", "Vocabulary", "Grammar & Conventions", "Spelling", "Writing", "Foundational Skills"] as const;
export const UNMAPPED_DOMAIN = "Unmapped";
export const UNMAPPED_SKILL = "Unmapped item";

// Word-level rules applied ONLY to an item's explicit skill tag (never to question text, never to math).
const ELA_DOMAIN_RULES: [RegExp, (typeof ELA_DOMAINS)[number]][] = [
  [/\bspell/i, "Spelling"],
  [/\bwrit|essay|\bparagraph|composition|\bnarrative\b|\bopinion writing|argument writing|informative writing/i, "Writing"],
  [/phonic|phonem|rhym|vowel|consonant|syllab|\bblend|digraph|sight word|letter|decod|fluency/i, "Foundational Skills"],
  [/vocab|synonym|antonym|prefix|suffix|\broot|context clue|word meaning|multiple.meaning|homophone|homograph|connotation|denotation|idiom|word choice|word relationship|affix/i, "Vocabulary"],
  [/grammar|punctuat|capitaliz|sentence|conjunction|\bnoun|\bverb|pronoun|adjective|adverb|preposition|tense|agreement|fragment|run.on|comma|apostrophe|possessive|parts of speech|modifier|contraction|plural|convention|usage/i, "Grammar & Conventions"],
  [/reading|comprehension|main idea|central idea|detail|inferen|author|purpose|theme|tone|mood|evidence|story element|character|setting|plot|genre|fact (vs|and|or) opinion|figurative|point of view|sequence|summar|text (structure|feature)|compare|contrast|cause|predict|literary|poetry|craft|claim/i, "Reading Comprehension"],
];
export function elaDomainForTag(tag: string): (typeof ELA_DOMAINS)[number] | null {
  for (const [re, d] of ELA_DOMAIN_RULES) if (re.test(tag)) return d;
  return null;
}

// Math text inference — clearly flagged as "inferred" (non-canonical); only used when a math item has no tag.
const MATH_TEXT_PATTERNS: [RegExp, string][] = [
  [/order\s+of\s+operation|pemdas/i, "Order of Operations"],
  [/place\s+value|digit.*place|\bvalue of the digit/i, "Place Value"],
  [/\bround(ed|ing)?\b/i, "Rounding"],
  [/perimeter/i, "Perimeter"],
  [/volume|cm³|cubic/i, "Volume"],
  [/\barea\b|cm²|square\s+(cm|meters?|inch|inches|feet|units)/i, "Area"],
  [/angle|°|degree/i, "Angles"],
  [/fraction|\b\d+\/\d+\b/i, "Fractions"],
  [/decimal|hundredths?|tenths?|\b\d+\.\d+\b/i, "Decimals"],
  [/graph|bar chart|line plot|frequency|table shows/i, "Data & Graphs"],
  [/pattern|sequence|next\s+number|rule/i, "Patterns"],
  [/\bclock|hours?\b|minutes?\b|elapsed/i, "Time"],
  [/\$|cents?\b|dollars?\b|money/i, "Money"],
  [/divid|÷|quotient/i, "Division"],
  [/multipli|×|\btimes\b|product/i, "Multiplication"],
  [/greater than|less than|compar/i, "Comparing Numbers"],
  [/convert|centimet|meters?\b|inch|feet|foot|yard|grams?|liters?|measure/i, "Measurement"],
];

export function formatSkillName(s: string): string {
  return s.replace(/[_]/g, " ").replace(/\s+/g, " ").trim().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/'S\b/g, "'s");
}

function explicitTag(q: any): string | null {
  for (const k of ["skill", "skill_tag", "topic"]) {
    const v = q?.[k];
    if (typeof v === "string" && v.trim() && !/^general( math| ela)?$/i.test(v.trim())) return v.trim();
  }
  return null;
}

export function resolveItemSkill(q: any, subject: ReportSubject, section: string | null): { skill: string; skillSource: SkillSource; domain: string } {
  const canonical = readCanonicalTags(q?.canonical_tags);
  if (canonical && canonical.subject === subject)
    return { skill: canonical.primary_skill, skillSource: "tag", domain: canonical.domain };
  const tag = explicitTag(q);
  if (subject === "ela") {
    if (tag) return { skill: formatSkillName(tag), skillSource: "tag", domain: elaDomainForTag(tag) ?? UNMAPPED_DOMAIN };
    return { skill: UNMAPPED_SKILL, skillSource: "unmapped", domain: UNMAPPED_DOMAIN };
  }
  if (subject === "math") {
    const domain = section ? cleanSection(section) : UNMAPPED_DOMAIN;
    if (tag) return { skill: formatSkillName(tag), skillSource: "tag", domain };
    const text = `${q?.question ?? q?.question_text ?? q?.text ?? ""}`;
    for (const [re, s] of MATH_TEXT_PATTERNS) if (re.test(text)) return { skill: s, skillSource: "inferred", domain };
    return { skill: UNMAPPED_SKILL, skillSource: "unmapped", domain };
  }
  return { skill: tag ? formatSkillName(tag) : UNMAPPED_SKILL, skillSource: tag ? "tag" : "unmapped", domain: section ? cleanSection(section) : UNMAPPED_DOMAIN };
}

function cleanSection(s: string) { return s.replace(/\s*\((no )?calculator[^)]*\)\s*/gi, " ").replace(/\s+/g, " ").trim(); }

export function isAutoScoredType(type: string | undefined, q: any): boolean {
  const t = String(type || "").toLowerCase().replace(/[_\s]/g, "-");
  const hasChoices = Array.isArray(q?.options ?? q?.choices) && (q.options ?? q.choices).length > 0;
  return (t.includes("multiple") || t.includes("choice") || t === "true-false" || (t === "" && hasChoices)) && hasChoices;
}

/**
 * Flattens every supported question shape (flat array, array of sections, {sections}, {questions}, nested
 * subsections, array of tests with sections) into ordered items. IDs: explicit `id` when present, else a
 * deterministic positional id (`s{section}-q{n}`) — never random. Duplicate and missing IDs are reported.
 */
export function flattenTestItems(raw: any, subject: ReportSubject): { items: NormalizedItem[]; issues: ItemIssues } {
  const out: NormalizedItem[] = [];
  let missing = 0;
  const push = (q: any, section: string | null, subsection: string | null, path: string) => {
    const explicit = typeof q?.id === "string" || typeof q?.id === "number" ? String(q.id) : null;
    if (!explicit) missing++;
    const sec = q?.section || section || null;
    const r = resolveItemSkill(q, subject, sec);
    out.push({
      id: explicit ?? path, idSource: explicit ? "explicit" : "derived", position: out.length + 1,
      rawType: String(q?.type ?? ""), scoring: isAutoScoredType(q?.type, q) ? "auto" : "manual",
      section: sec, subsection, ...r, choiceGroup: parseChoiceGroup(q, sec, subsection),
      secondarySkills: readCanonicalTags(q?.canonical_tags)?.subject === subject ? readCanonicalTags(q?.canonical_tags)?.secondary_skills ?? [] : [],
      question: q?.question ?? q?.question_text ?? q?.text ?? "", options: q?.options ?? q?.choices ?? [],
      correct_answer: q?.correct_answer ?? q?.correctAnswer ?? "",
    });
  };
  const walkSection = (s: any, si: number) => {
    const title = s?.section_title ?? s?.title ?? null;
    (s?.questions ?? []).forEach((q: any, qi: number) => push(q, title, null, `s${si + 1}-q${qi + 1}`));
    (s?.subsections ?? []).forEach((sub: any, ui: number) =>
      (sub?.questions ?? []).forEach((q: any, qi: number) => push(q, title, sub?.title ?? null, `s${si + 1}-u${ui + 1}-q${qi + 1}`)));
  };
  const isSection = (x: any) => Array.isArray(x?.questions) || Array.isArray(x?.subsections);
  if (Array.isArray(raw)) {
    if (raw.length && Array.isArray(raw[0]?.sections)) raw.forEach((t: any, ti: number) => (t.sections ?? []).forEach((s: any, si: number) => walkSection(s, ti * 100 + si)));
    else raw.forEach((x: any, i: number) => (isSection(x) ? walkSection(x, i) : push(x, null, null, `q${i + 1}`)));
  } else if (Array.isArray(raw?.sections)) raw.sections.forEach(walkSection);
  else if (Array.isArray(raw?.questions)) raw.questions.forEach((q: any, i: number) => push(q, null, null, `q${i + 1}`));
  const seen = new Map<string, number>();
  out.forEach((i) => seen.set(i.id, (seen.get(i.id) ?? 0) + 1));
  return { items: out, issues: { duplicateIds: [...seen].filter(([, n]) => n > 1).map(([id]) => id), missingIds: missing } };
}

/* ───────────── Item outcomes ───────────── */

export interface ResponseRow { question_id: string; answer?: string | null; is_correct: boolean | null; points_awarded?: number | null; max_points?: number | null }
export type ItemOutcome = "correct" | "partial" | "incorrect" | "pending" | "unanswered";
export interface ScoredItem extends NormalizedItem { outcome: ItemOutcome; earned: number | null; possible: number | null; blank?: boolean }

export function scoreItem(item: NormalizedItem, r: ResponseRow | undefined): ScoredItem {
  if (!r) return { ...item, outcome: "unanswered", earned: null, possible: null };
  if (r.is_correct === null || r.is_correct === undefined) return { ...item, outcome: "pending", earned: null, possible: null };
  const possible = typeof r.max_points === "number" && r.max_points > 0 ? r.max_points : 1;
  const raw = typeof r.points_awarded === "number" ? r.points_awarded : r.is_correct ? possible : 0;
  const earned = Math.max(0, Math.min(possible, raw));
  const outcome: ItemOutcome = earned >= possible ? "correct" : earned > 0 ? "partial" : "incorrect";
  return { ...item, outcome, earned, possible, blank: r.answer === "" };
}

/* ───────────── Classification ───────────── */

export type SkillStatus = "strength" | "developing" | "priority" | "not_scored";
export function classifySkill(pct: number | null): SkillStatus {
  if (pct === null || !Number.isFinite(pct)) return "not_scored";
  if (pct >= SKILL_STATUS_THRESHOLDS.STRENGTH) return "strength";
  if (pct >= SKILL_STATUS_THRESHOLDS.DEVELOPING) return "developing";
  return "priority";
}
export const STATUS_LABEL: Record<SkillStatus, string> = {
  strength: `Strength (${SKILL_STATUS_THRESHOLDS.STRENGTH}%+)`,
  developing: `Developing (${SKILL_STATUS_THRESHOLDS.DEVELOPING}–${SKILL_STATUS_THRESHOLDS.STRENGTH - 1}%)`,
  priority: `Priority support (below ${SKILL_STATUS_THRESHOLDS.DEVELOPING}%)`,
  not_scored: "Not yet scored",
};
export function evidenceLabel(scoredItems: number, pct: number | null): string | null {
  if (scoredItems === 0) return "No scored items yet";
  if (scoredItems < LOW_EVIDENCE_ITEMS) return `Limited evidence: ${pct ?? 0}% on ${scoredItems} assessed item${scoredItems === 1 ? "" : "s"} — not proof of broad ${pct !== null && pct >= SKILL_STATUS_THRESHOLDS.STRENGTH ? "mastery" : "difficulty"}`;
  return null;
}

/* ───────────── Aggregation ───────────── */

export interface SkillSummary {
  skill: string; domain: string; skillSource: SkillSource;
  items: number; scoredItems: number; correctItems: number; partialItems: number; pendingItems: number; unansweredItems: number;
  earned: number; possible: number; pct: number | null; usesPoints: boolean;
  status: SkillStatus; lowEvidence: boolean; evidenceNote: string | null; nextStep: string; questionIds: string[];
}
const round2 = (n: number) => Math.round(n * 100) / 100;

function summarize(group: ScoredItem[], skill: string, domain: string, src: SkillSource, subject: ReportSubject): SkillSummary {
  const scored = group.filter((i) => i.possible !== null);
  const earned = round2(scored.reduce((a, i) => a + (i.earned ?? 0), 0));
  const possible = round2(scored.reduce((a, i) => a + (i.possible ?? 0), 0));
  const pct = possible > 0 ? Math.round((earned / possible) * 100) : null;
  const status = classifySkill(pct);
  const lowEvidence = scored.length > 0 && scored.length < LOW_EVIDENCE_ITEMS;
  return {
    skill, domain, skillSource: src, items: group.length, scoredItems: scored.length,
    correctItems: scored.filter((i) => i.outcome === "correct").length, partialItems: scored.filter((i) => i.outcome === "partial").length,
    pendingItems: group.filter((i) => i.outcome === "pending").length, unansweredItems: group.filter((i) => i.outcome === "unanswered").length,
    earned, possible, pct, usesPoints: scored.some((i) => i.possible !== 1 || i.outcome === "partial"),
    status, lowEvidence, evidenceNote: evidenceLabel(scored.length, pct), nextStep: nextStepFor(skill, status, lowEvidence, subject),
    questionIds: group.map((i) => i.id),
  };
}

export function nextStepFor(skill: string, status: SkillStatus, _low: boolean, subject: ReportSubject): string {
  const s = skill === UNMAPPED_SKILL ? "these items" : skill.toLowerCase();
  const confirm = ""; // Sparse sampling is a staff audit note, not a parent teaching recommendation.
  if (status === "priority") return `Reteach ${s} with modeled examples, then guided and independent practice${subject === "ela" ? " using short texts" : ""}.${confirm}`;
  if (status === "developing") return `Reinforce ${s} with targeted practice 2–3 times weekly.${confirm}`;
  if (status === "strength") return `Maintain ${s} with brief spiral review.${confirm}`;
  return "Awaiting scoring of submitted responses.";
}

/* ───────────── Programme / retests ───────────── */

/** Mirrors src/lib/followUps.ts (asserted by tests). Formal retests are the existing follow_up_assessments weeks. */
export function programForTier(tier: GeneralTier): { weeks: number; label: string; retestWeeks: number[] } {
  if (tier === "Tier 1") return { weeks: 5, label: "5-week enrichment program", retestWeeks: [5] };
  if (tier === "Tier 2") return { weeks: 10, label: "10-week skill-building program", retestWeeks: [5, 10] };
  return { weeks: TIER3_PLAN.total_weeks, label: "15-week intensive program: afterschool support and separate Saturday intensive sessions; attendance is individualized", retestWeeks: [5, 10, 15] };
}
export interface RetestRow { week_number: number | null; status: string; unlock_date: string | null }
export function retestSchedule(tier: GeneralTier, rows: RetestRow[] = []) {
  return programForTier(tier).retestWeeks.map((week) => {
    const row = rows.find((r) => r.week_number === week); // one entry per week even if duplicate rows exist
    return { week, label: `Week ${week} formal retest`, status: row?.status ?? "not_scheduled", unlock_date: row?.unlock_date ?? null };
  });
}

/* ───────────── Report model ───────────── */

export interface ReportInput {
  attempt: { id: string; score: number | null; correct_answers: number | null; total_questions: number | null; completed_at: string | null; grade_level: number | null; tier?: string | null; skill_analysis?: any };
  test: { name: string | null; test_type: string | null; questions: any; updated_at?: string | null };
  responses: ResponseRow[];
  studentName?: string | null;
  enrolledGrade?: number | null;
  followUps?: RetestRow[];
  generatedAt?: string;
}

export type VerificationState = "verified" | "requires_verification";
export interface DiagnosticReport {
  version: string; subject: ReportSubject; subjectLabel: string;
  student: { name: string }; test: { name: string; attemptId: string };
  assessedGrade: number | null; enrolledGrade: number | null; completedAt: string | null; generatedAt: string;
  verification: { state: VerificationState; issues: string[]; notes: string[] };
  auditNotes?: string[];
  counts: { totalItems: number; answered: number; unanswered: number; scored: number; pending: number; correct: number; partial: number; incorrect: number; autoScored: number; manualScored: number };
  coverage: Coverage;
  points: { earned: number; possible: number };
  score: { pct: number | null; stored: number | null; basis: string; tier: GeneralTier | null };
  domains: (Omit<SkillSummary, "skill" | "nextStep" | "skillSource" | "questionIds"> & { notAssessed?: boolean })[];
  skills: SkillSummary[];
  strengths: SkillSummary[]; developing: SkillSummary[]; priority: SkillSummary[];
  unmapped: { count: number; questionIds: string[] };
  priorityFocus: SkillSummary[];
  tierExplanation: string;
  program: { weeks: number; label: string; retests: ReturnType<typeof retestSchedule> };
  items: ScoredItem[];
}

export function buildDiagnosticReport(input: ReportInput): DiagnosticReport {
  const subject = detectReportSubject(input.test.test_type, input.test.name);
  const { items, issues } = flattenTestItems(input.test.questions, subject);
  const issuesOut: string[] = [];
  const notes: string[] = [];
  const auditNotes: string[] = [];
  for (const i of items) {
    // Invalid metadata never changes score arithmetic, but staff must see the bank-quality issue.
    if (i.secondarySkills?.length) auditNotes.push(`${i.id}: secondary skills retained for instruction only: ${i.secondarySkills.join(", ")}; scored once under the primary skill.`);
  }
  if (subject === "unknown") issuesOut.push("Test subject could not be determined from the test record; subject-specific skill analysis is unavailable.");
  if (items.length === 0) issuesOut.push("The test's question bank is missing, so responses cannot be mapped to questions.");
  if (issues.duplicateIds.length) issuesOut.push(`Duplicate question IDs in the bank: ${issues.duplicateIds.join(", ")}.`);
  if (issues.missingIds) auditNotes.push(`${issues.missingIds} question(s) have no explicit ID; deterministic positional IDs were used.`);
  if (input.test.updated_at && input.attempt.completed_at && new Date(input.test.updated_at) > new Date(input.attempt.completed_at))
    issuesOut.push("The question bank was edited after this assessment was completed; the version used at assessment cannot be confirmed.");

  const byId = new Map<string, ResponseRow>();
  const dupResp: string[] = [];
  for (const r of input.responses) { if (byId.has(r.question_id)) dupResp.push(r.question_id); byId.set(r.question_id, r); }
  if (dupResp.length) issuesOut.push(`Multiple saved responses for question(s): ${dupResp.join(", ")}.`);
  const itemIds = new Set(items.map((i) => i.id));
  const unmatched = input.responses.filter((r) => !itemIds.has(r.question_id)).map((r) => r.question_id);
  if (unmatched.length) issuesOut.push(`${unmatched.length} saved response(s) do not match any question in the bank (${unmatched.slice(0, 5).join(", ")}).`);

  const scoredItems = items.map((i) => scoreItem(i, byId.get(i.id)));
  const scored = scoredItems.filter((i) => i.possible !== null);
  const earned = round2(scored.reduce((a, i) => a + (i.earned ?? 0), 0));
  const possible = round2(scored.reduce((a, i) => a + (i.possible ?? 0), 0));
  const counts = {
    totalItems: items.length,
    answered: scoredItems.filter((i) => i.outcome !== "unanswered").length,
    unanswered: scoredItems.filter((i) => i.outcome === "unanswered").length,
    scored: scored.length,
    pending: scoredItems.filter((i) => i.outcome === "pending").length,
    correct: scored.filter((i) => i.outcome === "correct").length,
    partial: scored.filter((i) => i.outcome === "partial").length,
    incorrect: scored.filter((i) => i.outcome === "incorrect").length,
    autoScored: scored.filter((i) => i.scoring === "auto").length,
    manualScored: scored.filter((i) => i.scoring === "manual").length,
  };
  // Invariants
  if (counts.correct + counts.partial + counts.incorrect !== counts.scored || counts.scored + counts.pending + counts.unanswered !== counts.totalItems)
    issuesOut.push("Item counts do not reconcile.");

  const pct = possible > 0 ? round2((earned / possible) * 100) : null;
  const stored = input.attempt.score === null || input.attempt.score === undefined ? null : Number(input.attempt.score);
  const autoItems = scoredItems.filter((i) => i.scoring === "auto");
  const autoPct = autoItems.length ? round2((autoItems.filter((i) => i.outcome === "correct").length / autoItems.length) * 100) : null;
  const storedMatchesInitialBasis = counts.pending > 0 && autoPct !== null && stored !== null && Math.abs(autoPct - stored) <= 0.05;
  if (storedMatchesInitialBasis)
    notes.push(`Stored score ${stored}% is the initial automatic score on multiple-choice items only; written responses are still awaiting review, so the report shows the evidence-based score from scored items.`);
  const blanks = scored.filter((i) => i.blank).length;
  if (blanks) notes.push(`${blanks} multiple-choice question(s) were left blank and are scored as incorrect.`);
  if (pct !== null && stored !== null && Math.abs(pct - stored) > 0.05 && !storedMatchesInitialBasis)
    issuesOut.push(`Stored score ${stored}% does not match the saved item evidence (${earned}/${possible} points = ${pct}%).`);
  if (input.attempt.correct_answers !== null && input.attempt.correct_answers !== undefined && input.attempt.correct_answers !== counts.correct)
    notes.push(`Stored "correct answers" (${input.attempt.correct_answers}) differs from fully-correct scored items (${counts.correct}); counts below are recomputed from saved responses.`);
  const coverage = assessCoverage(scoredItems);
  if (coverage.optionalNotSelected) notes.push(`${coverage.optionalNotSelected} question(s) in "choose" groups were not selected after the required number was answered; they are optional and not part of the score.`);
  if (counts.pending) notes.push(`${counts.pending} response(s) await teacher review and are excluded from all percentages until scored.`);

  const usesPoints = scored.some((i) => i.possible !== 1 || i.outcome === "partial");
  const coverageSuffix = coverage.state === "incomplete" ? " Score reflects recorded scored items only; required work is incomplete (see coverage)." : "";
  const basis = (usesPoints
    ? `Points earned ÷ points possible on recorded scored items: ${earned} of ${possible} points across ${counts.scored} scored question(s) (${counts.correct} fully correct, ${counts.partial} partial credit, ${counts.incorrect} incorrect).`
    : `Correct ÷ recorded scored questions: ${counts.correct} of ${counts.scored}.`) + coverageSuffix;

  // Skills
  const groups = new Map<string, ScoredItem[]>();
  for (const i of scoredItems) { const k = `${i.domain}\u0000${i.skill}`; groups.set(k, [...(groups.get(k) ?? []), i]); }
  const skills = [...groups.entries()].map(([k, g]) => { const [d, s] = k.split("\u0000"); return summarize(g, s, d, g[0].skillSource, subject); })
    .sort((a, b) => (a.domain === b.domain ? (a.pct ?? 101) - (b.pct ?? 101) : a.domain.localeCompare(b.domain)));
  const domainNames = subject === "ela" ? [...ELA_DOMAINS, UNMAPPED_DOMAIN] : [...new Set(scoredItems.map((i) => i.domain))];
  const domains = domainNames.map((d) => {
    const g = scoredItems.filter((i) => i.domain === d);
    if (!g.length) return d === UNMAPPED_DOMAIN ? null : { ...emptyDomain(d), notAssessed: true };
    const { skill: _s, nextStep: _n, skillSource: _x, questionIds: _q, ...rest } = summarize(g, d, d, "tag", subject);
    return rest;
  }).filter(Boolean) as DiagnosticReport["domains"];
  const unmappedItems = scoredItems.filter((i) => i.skillSource === "unmapped" || i.domain === UNMAPPED_DOMAIN);
  if (unmappedItems.length) auditNotes.push(`${unmappedItems.length} question(s) have no recognised skill tag and are shown as unmapped rather than assigned a guessed skill.`);
  if (skills.some((s) => s.skillSource === "inferred")) auditNotes.push("Some skill names were inferred from wording because the bank has no canonical skill tags.");

  // Summary lists aggregate each skill across sections so one skill never appears as both strength and priority.
  const bySkill = new Map<string, ScoredItem[]>();
  for (const i of scoredItems) if (i.skill !== UNMAPPED_SKILL) bySkill.set(i.skill, [...(bySkill.get(i.skill) ?? []), i]);
  const mappedSkills = [...bySkill.entries()].map(([sk, g]) => summarize(g, sk, [...new Set(g.map((i) => i.domain))].join(" / "), g[0].skillSource, subject)).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  const strengths = mappedSkills.filter((s) => s.status === "strength");
  const developing = mappedSkills.filter((s) => s.status === "developing");
  const priority = mappedSkills.filter((s) => s.status === "priority");
  const priorityFocus = [...priority].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0) || b.scoredItems - a.scoredItems).slice(0, 3);

  const tier = pct === null ? null : tierFromScore(pct);
  const prog = programForTier(tier ?? "Tier 3");
  return {
    version: REPORT_VERSION, subject, subjectLabel: subject === "ela" ? "English Language Arts" : subject === "math" ? "Mathematics" : "Subject unknown",
    student: { name: input.studentName || "Student" }, test: { name: input.test.name || "Diagnostic", attemptId: input.attempt.id },
    assessedGrade: input.attempt.grade_level ?? null, enrolledGrade: input.enrolledGrade ?? null, completedAt: input.attempt.completed_at,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    verification: { state: issuesOut.length ? "requires_verification" : "verified", issues: issuesOut, notes }, auditNotes,
    coverage,
    counts, points: { earned, possible }, score: { pct, stored, basis, tier },
    domains, skills, strengths, developing, priority, unmapped: { count: unmappedItems.length, questionIds: unmappedItems.map((i) => i.id) },
    priorityFocus, tierExplanation: tierExplanation(tier) + (coverage.state === "incomplete" && tier ? " This tier reflects recorded scored items only, because some required work has no saved response." : ""),
    program: { weeks: prog.weeks, label: prog.label, retests: retestSchedule(tier ?? "Tier 3", input.followUps) },
    items: scoredItems,
  };
}
function emptyDomain(d: string) {
  return { domain: d, items: 0, scoredItems: 0, correctItems: 0, partialItems: 0, pendingItems: 0, unansweredItems: 0, earned: 0, possible: 0, pct: null, usesPoints: false, status: "not_scored" as SkillStatus, lowEvidence: false, evidenceNote: "Not assessed by this diagnostic" };
}

export function tierExplanation(tier: GeneralTier | null): string {
  const caveat = " A diagnostic score shows performance on the skills tested; on its own it does not establish an exact grade-level equivalent.";
  if (tier === "Tier 1") return "Your student answered most assessed items correctly (85% or higher) and is ready for enrichment and extension work." + caveat;
  if (tier === "Tier 2") return "Your student shows a solid base (66–84%) with specific skills that would benefit from targeted practice." + caveat;
  if (tier === "Tier 3") return "Performance on the assessed skills calls for focused, consistent support (below 66%). Instruction will target the support needs identified in this report, using modeled examples and guided practice." + caveat;
  return "An overall tier cannot be assigned until responses are scored.";
}

/* ───────────── Legacy skill_analysis (stored on test_attempts) ───────────── */

/** Backward-compatible skill_analysis written by grading paths. Points-based; pending/unanswered excluded. */
export function buildSkillAnalysis(items: NormalizedItem[], responses: ResponseRow[], subject: ReportSubject) {
  const byId = new Map(responses.map((r) => [r.question_id, r]));
  const scored = items.map((i) => scoreItem(i, byId.get(i.id))).filter((i) => i.outcome !== "unanswered");
  const groups = new Map<string, ScoredItem[]>();
  for (const i of scored) groups.set(i.skill, [...(groups.get(i.skill) ?? []), i]);
  const skillStats: Record<string, any> = {};
  const mastered: string[] = [], developing: string[] = [], needsSupport: string[] = [];
  for (const [skill, g] of groups) {
    const s = summarize(g, skill, g[0].domain, g[0].skillSource, subject);
    skillStats[skill] = { total: s.possible, correct: s.earned, percentage: s.pct ?? 0, questionIds: s.questionIds, domain: s.domain, source: s.skillSource, scored_items: s.scoredItems, pending_items: s.pendingItems };
    if (skill === UNMAPPED_SKILL || s.status === "not_scored") continue;
    (s.status === "strength" ? mastered : s.status === "developing" ? developing : needsSupport).push(skill);
  }
  return { version: SKILL_ANALYSIS_VERSION, subject, mastered: mastered.sort(), developing: developing.sort(), needsSupport: needsSupport.sort(), skillStats };
}

/** Parent-only presentation, preserving all material scoring/coverage notices. Internal flags stay on staff model. */
export function parentReportNotes(r: DiagnosticReport): string[] {
  return r.verification.notes.filter((n) => !/skill tag|canonical|inferred|unmapped|positional IDs/i.test(n));
}
export function parentSkillName(skill: string): string { return skill === UNMAPPED_SKILL ? "Other assessed questions" : skill; }
export function parentDomainName(domain: string): string { return domain === UNMAPPED_DOMAIN ? "Other assessed questions" : domain; }
export function parentNextStep(s: SkillSummary, subject: ReportSubject): string {
  return nextStepFor(s.skill, s.status, false, subject);
}
export function parentTierLabel(tier: GeneralTier | null): string {
  return tier === "Tier 1" ? "Strengths — enrichment" : tier === "Tier 2" ? "Developing skills — targeted practice" : "Support needed — targeted instruction";
}
