// Authoritative configuration + pure logic for the GENERAL K-12 Math/ELA diagnostic curriculum.
// Shared by the generate-curriculum edge function (prompting + validation) and the web app (rendering).
// TACHS (tachs-curriculum.ts) and SHSAT (shsatConfig.ts) are separate programs and are NOT affected.

export const CURRICULUM_SCHEMA_VERSION = 2;

/** Mirrors src/lib/tierConfig.ts TIER_THRESHOLDS (a test asserts they stay identical). */
export const GENERAL_TIER_THRESHOLDS = { GREEN: 85, YELLOW: 66 } as const;
export type GeneralTier = "Tier 1" | "Tier 2" | "Tier 3";
export function tierFromScore(score: number | null | undefined): GeneralTier {
  const s = Number(score ?? 0);
  if (s >= GENERAL_TIER_THRESHOLDS.GREEN) return "Tier 1";
  if (s >= GENERAL_TIER_THRESHOLDS.YELLOW) return "Tier 2";
  return "Tier 3";
}

/** Tier 1/2 keep the legacy 4-week plan; only Tier 3 uses the intensive plan. */
export const LEGACY_PLAN_WEEKS = 4;
export const TIER3_PLAN = {
  core_weeks: 12,
  extension_weeks: 3,
  total_weeks: 15,
  label: "12-Week Intensive Plan + Up to 3 Extension Weeks",
  min_items_per_week: 10,
  batch_size_weeks: 3,
} as const;

/** Instructional progression target (NOT a diagnostic tier cutoff). Instructor-adjustable. */
export const DEFAULT_PROGRESSION_TARGET = { accuracy_pct: 85, distinct_checks: 2, requires_retention_check: true } as const;
export type ProgressionTarget = { accuracy_pct: number; distinct_checks: number; requires_retention_check: boolean };

export const MIN_SUPPORTED_GRADE = -1; // -1 = Pre-K foundations, 0 = Kindergarten
export const MAX_SUPPORTED_GRADE = 12;
export function clampGrade(g: number) { return Math.max(MIN_SUPPORTED_GRADE, Math.min(MAX_SUPPORTED_GRADE, Math.round(g))); }
export function gradeLabel(g: number): string {
  const c = clampGrade(g);
  if (c === -1) return "Pre-K foundations";
  if (c === 0) return "Kindergarten";
  return `Grade ${c}`;
}

export type PhaseKey = "foundation" | "related" | "bridge" | "application" | "extension";
export const PHASES: { key: PhaseKey; weeks: [number, number]; offset: number; label: string; check: string }[] = [
  { key: "foundation", weeks: [1, 3], offset: 3, label: "Phase 1 — Prerequisite foundations (G−3)", check: "Phase check after Week 3" },
  { key: "related", weeks: [4, 6], offset: 2, label: "Phase 2 — Related skills (G−2)", check: "Phase check after Week 6" },
  { key: "bridge", weeks: [7, 9], offset: 1, label: "Phase 3 — Bridge skills (G−1)", check: "Phase check after Week 9" },
  { key: "application", weeks: [10, 12], offset: 0, label: "Phase 4 — Grade-level application (G)", check: "Instructional reassessment after Week 12" },
  { key: "extension", weeks: [13, 15], offset: 0, label: "Optional Extension — Differentiated reteaching, retention & transfer", check: "Final review after Week 15 (if extended)" },
];

export type Subject = "math" | "ela";
/** Uses the test taxonomy (test_type / name). Returns null when the subject cannot be determined. */
export function detectSubject(testType?: string | null, testName?: string | null): Subject | null {
  const t = `${testType ?? ""} ${testName ?? ""}`.toLowerCase();
  const ela = /\b(ela|english|reading|literacy|language arts|writing)\b/.test(t);
  const math = /\b(math|mathematics|algebra|geometry|arithmetic)\b/.test(t);
  if (ela && !math) return "ela";
  if (math && !ela) return "math";
  return null;
}

export interface GradeResolution {
  tested_grade: number | null;
  enrolled_grade: number | null;
  enrolled_verified: boolean;
  anchor_grade: number | null; // G used for the phase map
  notice: string | null;
}
/**
 * test_attempts.grade_level is the grade of the ASSESSMENT the family selected (tested grade), not a verified
 * enrolled grade. A staff-confirmed enrolled grade (admin/teacher) is used as G when supplied. Otherwise the plan
 * is anchored provisionally to the tested grade and the limitation is flagged. Never subtracts from both.
 */
export function resolveGrades(input: { testedGrade: number | null | undefined; confirmedEnrolledGrade?: number | null }): GradeResolution {
  const tested = Number.isFinite(input.testedGrade as number) ? clampGrade(input.testedGrade as number) : null;
  const enrolledRaw = input.confirmedEnrolledGrade;
  const enrolled = enrolledRaw !== null && enrolledRaw !== undefined && Number.isFinite(enrolledRaw) && enrolledRaw >= 0 && enrolledRaw <= 12 ? Math.round(enrolledRaw) : null;
  if (enrolled !== null) return { tested_grade: tested, enrolled_grade: enrolled, enrolled_verified: true, anchor_grade: enrolled, notice: null };
  if (tested === null) return { tested_grade: null, enrolled_grade: null, enrolled_verified: false, anchor_grade: null, notice: "Enrolled grade could not be verified and no assessment grade is recorded. A teacher or admin must confirm the enrolled grade before a plan can be generated." };
  return {
    tested_grade: tested, enrolled_grade: null, enrolled_verified: false, anchor_grade: tested,
    notice: `Enrolled grade not verified. This plan is provisionally anchored to the assessed level (${gradeLabel(tested)}). If the student is enrolled in a different grade, a teacher or admin must confirm it and regenerate.`,
  };
}

export interface SkillStat { correct: number; total: number; percentage: number }
export interface StrandPlan {
  skill: string;
  evidence_pct: number | null;
  status: "deficit" | "developing" | "mastered";
  start_offset: number; // grades below G where instruction starts (3, 2, 1) — mastered strands are review-only
  start_grade: number;
  evidence_note: string;
}
/** Individualized starting level per strand from diagnostic evidence. Mastered prerequisites are skipped. */
export function buildStrandPlans(anchor: number, a: { skillStats?: Record<string, SkillStat>; needsSupport?: string[]; developing?: string[]; mastered?: string[] }): StrandPlan[] {
  const out = new Map<string, StrandPlan>();
  const stats = a.skillStats ?? {};
  const add = (skill: string, pct: number | null, fallback: StrandPlan["status"]) => {
    if (!skill || out.has(skill)) return;
    let status = fallback, offset = 3;
    if (pct !== null) {
      if (pct >= 70) status = "mastered";
      else if (pct >= 50) status = "developing";
      else status = "deficit";
    }
    if (status === "deficit") offset = pct !== null && pct > 30 ? 2 : 3;
    if (status === "developing") offset = 1;
    if (status === "mastered") offset = 0;
    out.set(skill, {
      skill, evidence_pct: pct, status, start_offset: offset, start_grade: clampGrade(anchor - offset),
      evidence_note: pct === null ? "Limited item evidence for this skill; starting at the earliest prerequisite level until checks confirm otherwise." : `${pct}% on diagnostic items for this skill.`,
    });
  };
  for (const [k, v] of Object.entries(stats)) add(k, Number.isFinite(v?.percentage) ? Math.round(v.percentage) : null, "deficit");
  for (const s of a.needsSupport ?? []) add(s, null, "deficit");
  for (const s of a.developing ?? []) add(s, null, "developing");
  for (const s of a.mastered ?? []) add(s, null, "mastered");
  return [...out.values()].sort((x, y) => (x.evidence_pct ?? -1) - (y.evidence_pct ?? -1));
}

export interface WeekSpec {
  week: number;
  is_extension: boolean;
  phase: PhaseKey;
  phase_label: string;
  phase_grade: number;           // default pacing grade for the phase
  instructional_grade: number;   // after individualization (never below supported range)
  instructional_label: string;
  enrolled_or_anchor_label: string;
  adjusted: boolean;
  priority_skills: { skill: string; grade: number; grade_label: string }[];
  review_skills: string[];
  checkpoint_kind: "weekly" | "phase_check" | "reassessment" | "final_review";
  checkpoint_label: string;
}

export function buildWeekSpecs(anchor: number, strands: StrandPlan[]): WeekSpec[] {
  const G = clampGrade(anchor);
  const teach = strands.filter((s) => s.status !== "mastered");
  const mastered = strands.filter((s) => s.status === "mastered").map((s) => s.skill);
  const specs: WeekSpec[] = [];
  for (let w = 1; w <= TIER3_PLAN.total_weeks; w++) {
    const phase = PHASES.find((p) => w >= p.weeks[0] && w <= p.weeks[1])!;
    const phaseGrade = clampGrade(G - phase.offset);
    const idx = w - phase.weeks[0];
    let active: { skill: string; grade: number }[];
    if (phase.key === "extension") {
      active = (teach.length ? teach : strands).map((s) => ({ skill: s.skill, grade: G }));
    } else {
      // A strand is taught at max(phase level, its own start level); strands not yet due (start above phase) wait.
      active = teach.filter((s) => s.start_grade <= phaseGrade).map((s) => ({ skill: s.skill, grade: phaseGrade }));
      if (!active.length && teach.length) {
        const minStart = Math.min(...teach.map((s) => Math.max(phaseGrade, s.start_grade)));
        active = teach.filter((s) => Math.max(phaseGrade, s.start_grade) === minStart).map((s) => ({ skill: s.skill, grade: minStart }));
      }
      if (!active.length) active = strands.map((s) => ({ skill: s.skill, grade: phaseGrade }));
    }
    // Rotate up to 3 priority skills so the three weeks of a phase target different combinations.
    const rot = active.length > 3 ? [...active.slice(idx % active.length), ...active.slice(0, idx % active.length)].slice(0, 3) : active;
    const instructional = rot.length ? Math.min(...rot.map((r) => r.grade)) : phaseGrade;
    const earlier = specs.flatMap((s) => s.priority_skills.map((p) => p.skill));
    const review = [...new Set([...earlier.slice(-4), ...mastered.slice(0, 2)])].filter((s) => !rot.some((r) => r.skill === s)).slice(0, 4);
    const kind: WeekSpec["checkpoint_kind"] = w === 15 ? "final_review" : w === 12 ? "reassessment" : w === 3 || w === 6 || w === 9 ? "phase_check" : "weekly";
    specs.push({
      week: w, is_extension: w > TIER3_PLAN.core_weeks, phase: phase.key, phase_label: phase.label,
      phase_grade: phaseGrade, instructional_grade: instructional, instructional_label: gradeLabel(instructional),
      enrolled_or_anchor_label: gradeLabel(G), adjusted: instructional !== phaseGrade,
      priority_skills: rot.map((r) => ({ skill: r.skill, grade: r.grade, grade_label: gradeLabel(r.grade) })),
      review_skills: review, checkpoint_kind: kind,
      checkpoint_label: kind === "weekly" ? `Week ${w} checkpoint` : phase.check,
    });
  }
  return specs;
}

export interface SessionInfo { sessions_per_week: number | null; total_sessions: number | null; frequency_label: string; total_label: string }
export function sessionInfo(sessionsPerWeek: number | null | undefined): SessionInfo {
  const n = Number.isInteger(sessionsPerWeek) && (sessionsPerWeek as number) > 0 && (sessionsPerWeek as number) <= 7 ? (sessionsPerWeek as number) : null;
  if (n === null) return { sessions_per_week: null, total_sessions: null, frequency_label: "To be confirmed", total_label: "Total sessions unconfirmed (depends on the confirmed weekly schedule)" };
  return { sessions_per_week: n, total_sessions: n * TIER3_PLAN.core_weeks, frequency_label: `${n} session${n > 1 ? "s" : ""} per week`, total_label: `${n * TIER3_PLAN.core_weeks} core sessions (12 weeks) + up to ${n * TIER3_PLAN.extension_weeks} extension sessions` };
}

/* ── Generated content shape ── */
export type ItemRole = "guided" | "independent" | "review" | "checkpoint" | "retention";
export interface PracticeItem {
  id: string; role: ItemRole; type: "multiple_choice" | "short_answer" | "writing"; skill: string;
  prompt: string; passage?: string | null; options?: string[]; correct_answer: string; explanation: string; hint: string;
  exemplar?: string; rubric?: { criterion: string; levels: string }[];
}
export interface IntensiveWeek {
  week: number; is_extension: boolean; phase: PhaseKey; phase_label: string; instructional_grade: number; instructional_label: string;
  enrolled_or_anchor_label: string; priority_skills: { skill: string; grade: number; grade_label: string }[];
  focus: string; prerequisite_connection: string; objectives: string[]; prerequisite_check: string[];
  teaching_explanation: string; worked_example: { problem: string; steps: string[]; answer: string };
  guided_practice_notes: string; independent_practice_notes: string; cumulative_review: string[];
  reading_passage?: { title: string; text: string } | null;
  home_practice: { minutes: number; directions: string; activities: string[] };
  checkpoint: { label: string; kind: WeekSpec["checkpoint_kind"]; description: string; assessment_goal: string };
  retention_check: string; reteaching_directions: string; extension_selection?: string | null;
  sessions?: { session: number; focus: string }[] | null;
  items: PracticeItem[];
  mastery_status: "awaiting_evidence";
}

export interface IntensiveCurriculum {
  schemaVersion: 2; plan_type: "tier3_intensive"; plan_label: string; subject: Subject;
  core_weeks: number; extension_weeks: number; grades: GradeResolution; sessions: SessionInfo;
  progression_target: ProgressionTarget; strands: StrandPlan[]; overview: string; weeks: IntensiveWeek[];
  formal_retests_note: string; limitations: string[];
}

const LETTERS = ["A", "B", "C", "D", "E"];
const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const nonEmpty = (s: unknown) => typeof s === "string" && s.trim().length >= 3;

/** Merges authoritative spec fields over model output and returns validation errors (empty = valid). */
export function finalizeWeek(raw: any, spec: WeekSpec, subject: Subject, sessionsPerWeek: number | null): { week: IntensiveWeek | null; errors: string[] } {
  const e: string[] = [];
  const W = `Week ${spec.week}`;
  if (!raw || typeof raw !== "object") return { week: null, errors: [`${W}: missing`] };
  if (Number(raw.week) !== spec.week) e.push(`${W}: week number mismatch`);
  if (raw.instructional_grade !== undefined && clampGrade(Number(raw.instructional_grade)) !== spec.instructional_grade) e.push(`${W}: instructional grade mismatch`);
  for (const k of ["focus", "prerequisite_connection", "teaching_explanation", "guided_practice_notes", "independent_practice_notes", "retention_check", "reteaching_directions"]) if (!nonEmpty(raw[k])) e.push(`${W}: missing ${k}`);
  for (const k of ["objectives", "prerequisite_check", "cumulative_review"]) if (!Array.isArray(raw[k]) || !raw[k].filter(nonEmpty).length) e.push(`${W}: missing ${k}`);
  const we = raw.worked_example;
  if (!we || !nonEmpty(we.problem) || !Array.isArray(we.steps) || !we.steps.length || String(we.answer ?? "").trim() === "") e.push(`${W}: missing worked example`);
  const hp = raw.home_practice;
  if (!hp || !nonEmpty(hp.directions) || !Array.isArray(hp.activities) || !hp.activities.length) e.push(`${W}: missing home practice`);
  const cp = raw.checkpoint;
  if (!cp || !nonEmpty(cp.description) || !nonEmpty(cp.assessment_goal)) e.push(`${W}: missing checkpoint`);
  if (spec.is_extension && !nonEmpty(raw.extension_selection)) e.push(`${W}: extension week must explain how targets are selected from reassessment`);
  const blob = JSON.stringify(raw);
  if (/https?:\/\/|www\./i.test(blob)) e.push(`${W}: contains external links (not allowed)`);
  if (/\\frac|\\times|\$\$/.test(blob)) e.push(`${W}: contains LaTeX`);

  const items: PracticeItem[] = [];
  const seen = new Set<string>();
  const roles = new Set<string>();
  for (const [i, it] of (Array.isArray(raw.items) ? raw.items : []).entries()) {
    const tag = `${W} item ${i + 1}`;
    if (!it || !nonEmpty(it.prompt)) { e.push(`${tag}: missing prompt`); continue; }
    const key = norm(it.prompt + (it.options ?? []).join("|"));
    if (seen.has(key)) { e.push(`${tag}: duplicate prompt`); continue; }
    seen.add(key);
    const role = ["guided", "independent", "review", "checkpoint", "retention"].includes(it.role) ? it.role : null;
    if (!role) e.push(`${tag}: invalid role`); else roles.add(role);
    const type = it.type;
    if (type === "multiple_choice") {
      const opts = Array.isArray(it.options) ? it.options.map((o: unknown) => String(o).replace(/^\s*[A-E][).:]\s*/, "").trim()) : [];
      if (opts.length < 3 || opts.length > 5 || opts.some((o: string) => !o)) e.push(`${tag}: needs 3–5 options`);
      if (new Set(opts.map(norm)).size !== opts.length) e.push(`${tag}: duplicate options`);
      const ans = String(it.correct_answer ?? "").trim().toUpperCase().charAt(0);
      if (!LETTERS.slice(0, opts.length).includes(ans)) e.push(`${tag}: answer key does not match an option`);
      items.push({ ...base(it, role, type), options: opts, correct_answer: ans });
    } else if (type === "short_answer") {
      if (String(it.correct_answer ?? "").trim() === "") e.push(`${tag}: missing answer`);
      items.push({ ...base(it, role, type), correct_answer: String(it.correct_answer ?? "").trim() });
    } else if (type === "writing") {
      if (!nonEmpty(it.exemplar)) e.push(`${tag}: writing task needs an exemplar`);
      if (!Array.isArray(it.rubric) || it.rubric.length < 2) e.push(`${tag}: writing task needs a rubric (2+ criteria)`);
      items.push({ ...base(it, role, type), correct_answer: "See exemplar and rubric", exemplar: it.exemplar, rubric: (it.rubric ?? []).map((r: any) => ({ criterion: String(r.criterion ?? ""), levels: String(r.levels ?? "") })) });
    } else e.push(`${tag}: invalid type`);
    if (!nonEmpty(it.explanation)) e.push(`${tag}: missing explanation`);
    if (!nonEmpty(it.hint)) e.push(`${tag}: missing hint`);
  }
  if (items.length < TIER3_PLAN.min_items_per_week) e.push(`${W}: needs at least ${TIER3_PLAN.min_items_per_week} distinct items (got ${items.length})`);
  for (const r of ["guided", "independent", "review", "checkpoint"]) if (!roles.has(r)) e.push(`${W}: missing ${r} items`);
  // Subject guard
  if (subject === "ela" && items.some((it) => /\d+\s*[+×÷*]\s*\d+|\d+\s*[−-]\s*\d+\s*=|\bsolve for\b|\bequation\b/i.test(it.prompt))) e.push(`${W}: math content in an ELA plan`);
  if (subject === "math" && items.filter((it) => /\d/.test(it.prompt + (it.passage ?? ""))).length < Math.ceil(items.length / 2)) e.push(`${W}: Math plan items lack mathematical content`);

  if (e.length) return { week: null, errors: e };
  const sessions = sessionsPerWeek ? (Array.isArray(raw.sessions) && raw.sessions.length === sessionsPerWeek
    ? raw.sessions.map((s: any, i: number) => ({ session: i + 1, focus: String(s.focus ?? s) }))
    : Array.from({ length: sessionsPerWeek }, (_, i) => ({ session: i + 1, focus: i === 0 ? "Prerequisite check, explicit teaching and worked example; begin guided practice" : i === sessionsPerWeek - 1 ? "Independent practice, cumulative review and weekly checkpoint" : "Guided to independent practice with reduced scaffolds" }))) : null;
  return {
    errors: [],
    week: {
      week: spec.week, is_extension: spec.is_extension, phase: spec.phase, phase_label: spec.phase_label,
      instructional_grade: spec.instructional_grade, instructional_label: spec.instructional_label,
      enrolled_or_anchor_label: spec.enrolled_or_anchor_label, priority_skills: spec.priority_skills,
      focus: raw.focus, prerequisite_connection: raw.prerequisite_connection, objectives: raw.objectives.filter(nonEmpty),
      prerequisite_check: raw.prerequisite_check.filter(nonEmpty), teaching_explanation: raw.teaching_explanation,
      worked_example: { problem: we.problem, steps: we.steps.map(String), answer: String(we.answer) },
      guided_practice_notes: raw.guided_practice_notes, independent_practice_notes: raw.independent_practice_notes,
      cumulative_review: raw.cumulative_review.filter(nonEmpty),
      reading_passage: raw.reading_passage && nonEmpty(raw.reading_passage.text) ? { title: String(raw.reading_passage.title ?? "Passage"), text: raw.reading_passage.text } : null,
      home_practice: { minutes: Number(hp.minutes) > 0 ? Number(hp.minutes) : 15, directions: hp.directions, activities: hp.activities.map(String) },
      checkpoint: { label: spec.checkpoint_label, kind: spec.checkpoint_kind, description: cp.description, assessment_goal: cp.assessment_goal },
      retention_check: raw.retention_check, reteaching_directions: raw.reteaching_directions,
      extension_selection: spec.is_extension ? raw.extension_selection : null, sessions, items, mastery_status: "awaiting_evidence",
    },
  };
  function base(it: any, role: any, type: any) {
    return { id: `w${spec.week}-${items.length + 1}`, role, type, skill: String(it.skill ?? spec.priority_skills[0]?.skill ?? ""), prompt: String(it.prompt), passage: it.passage ? String(it.passage) : null, correct_answer: "", explanation: String(it.explanation ?? ""), hint: String(it.hint ?? "") };
  }
}

/** Cross-week checks for an assembled plan. Incomplete plans are rejected, never returned as complete. */
export function validatePlan(p: IntensiveCurriculum, specs: WeekSpec[]): string[] {
  const e: string[] = [];
  if (p.weeks.length !== TIER3_PLAN.total_weeks) e.push(`Plan has ${p.weeks.length} weeks; ${TIER3_PLAN.total_weeks} required`);
  p.weeks.forEach((w, i) => {
    if (w.week !== i + 1) e.push(`Weeks not sequential at position ${i + 1}`);
    const s = specs[i];
    if (s && (w.instructional_grade !== s.instructional_grade || w.phase !== s.phase)) e.push(`Week ${w.week}: phase/grade mapping mismatch`);
    if (w.instructional_grade < MIN_SUPPORTED_GRADE || w.instructional_grade > MAX_SUPPORTED_GRADE) e.push(`Week ${w.week}: unsupported grade`);
    if (w.is_extension !== (w.week > TIER3_PLAN.core_weeks)) e.push(`Week ${w.week}: core/extension flag wrong`);
  });
  const prompts = new Map<string, number>();
  for (const w of p.weeks) for (const it of w.items) {
    const k = norm(it.prompt);
    if (prompts.has(k) && prompts.get(k) !== w.week) e.push(`Week ${w.week}: item repeats a Week ${prompts.get(k)} prompt`);
    prompts.set(k, w.week);
  }
  const foci = new Set(p.weeks.map((w) => norm(w.focus)));
  if (foci.size !== p.weeks.length) e.push("Weekly focus statements are not distinct");
  return e;
}

/** Instructional progression status from recorded evidence only. Viewing activities is never evidence. */
export interface CheckEvidence { kind: "checkpoint" | "retention" | "rubric"; accuracy_pct: number; recorded_at: string }
export function progressionStatus(evidence: CheckEvidence[] | null | undefined, target: ProgressionTarget = DEFAULT_PROGRESSION_TARGET): "ready_to_progress" | "needs_reteaching" | "awaiting_evidence" {
  const ev = (evidence ?? []).filter((x) => x && Number.isFinite(x.accuracy_pct) && x.recorded_at);
  if (ev.length < target.distinct_checks) return "awaiting_evidence";
  if (target.requires_retention_check && !ev.some((x) => x.kind === "retention")) return ev.some((x) => x.accuracy_pct < target.accuracy_pct) ? "needs_reteaching" : "awaiting_evidence";
  const passing = ev.filter((x) => x.accuracy_pct >= target.accuracy_pct);
  if (passing.length >= target.distinct_checks && (!target.requires_retention_check || passing.some((x) => x.kind === "retention"))) return "ready_to_progress";
  return "needs_reteaching";
}

export function buildBatchPrompt(ctx: { subject: Subject; studentFirstName: string; anchorLabel: string; testedLabel: string | null; strands: StrandPlan[]; specs: WeekSpec[]; avoidPrompts: string[]; sessionsPerWeek: number | null }) {
  const subj = ctx.subject === "ela" ? "ELA (reading: word reading/phonics, fluency, comprehension, vocabulary; grammar; writing)" : "Mathematics";
  const system = `You are an expert K-12 ${subj} intervention specialist writing a Tier 3 intensive intervention curriculum. Output ONLY valid JSON: {"weeks":[...]}.
Rules:
- ${ctx.subject === "ela" ? "ELA ONLY. No math content of any kind." : "Mathematics ONLY. Move concrete → representational → abstract as appropriate."}
- Plain text/Unicode math only (×, ÷, 3/4). NO LaTeX. NO URLs, links, videos, or named external resources.
- Content must be age-respectful for a student enrolled at ${ctx.anchorLabel}: when teaching earlier-grade prerequisite skills, use mature contexts (no babyish themes) for older students.
- Each item must be distinct and new; do not repeat prompts across weeks. No generic "practice this skill" filler.
- Each week MUST include at least 12 items: ≥3 "guided", ≥3 "independent", ≥2 "review" (earlier weeks' skills), ≥3 "checkpoint", ≥1 "retention".
- Item types: "multiple_choice" (4 options as plain strings without letter prefixes; correct_answer is the letter A-D), "short_answer" (exact answer), or "writing" (include "exemplar" and "rubric":[{"criterion","levels"}] with ≥3 criteria). ${ctx.subject === "ela" ? "Comprehension items must include the text they refer to in \"passage\" or use the week's reading_passage. Include at least one writing task per week." : ""}
- Every item needs "explanation" and "hint" and "skill".`;
  const weekSchema = `{"week":n,"instructional_grade":n,"focus":"","prerequisite_connection":"how this skill connects to the next prerequisite toward grade level","objectives":["measurable"],"prerequisite_check":["quick check prompts"],"teaching_explanation":"explicit teacher explanation","worked_example":{"problem":"","steps":[""],"answer":""},"guided_practice_notes":"scaffolds","independent_practice_notes":"how support is reduced","cumulative_review":["earlier skills reviewed"],"reading_passage":${ctx.subject === "ela" ? '{"title":"","text":"120-450 words at the instructional level"}' : "null"},"home_practice":{"minutes":15,"directions":"usable parent directions","activities":[""]},"checkpoint":{"description":"","assessment_goal":"measurable, e.g. 85% independent accuracy"},"retention_check":"","reteaching_directions":"specific steps if the checkpoint is missed","extension_selection":"(extension weeks only) how the teacher selects/replaces targets using the Week 12 reassessment","sessions":${ctx.sessionsPerWeek ? `[${Array.from({ length: ctx.sessionsPerWeek }, () => '{"focus":""}').join(",")}]` : "null"},"items":[{"role":"guided|independent|review|checkpoint|retention","type":"multiple_choice|short_answer|writing","skill":"","prompt":"","passage":null,"options":[],"correct_answer":"","explanation":"","hint":""}]}`;
  const strands = ctx.strands.map((s) => `- ${s.skill}: ${s.status}${s.evidence_pct !== null ? ` (${s.evidence_pct}%)` : ""}; instruction starts at ${gradeLabel(s.start_grade)}`).join("\n");
  const weeks = ctx.specs.map((s) => `Week ${s.week} [${s.is_extension ? "OPTIONAL EXTENSION" : "core"}] ${s.phase_label}; instructional_grade=${s.instructional_grade} (${s.instructional_label}); priority skills: ${s.priority_skills.map((p) => `${p.skill} @ ${p.grade_label}`).join("; ")}; cumulative review of: ${s.review_skills.join("; ") || "previous week"}; checkpoint: ${s.checkpoint_label}${s.checkpoint_kind !== "weekly" ? " (make the checkpoint a cumulative phase-level check)" : ""}.`).join("\n");
  const user = `Student: ${ctx.studentFirstName}. Enrolled/anchor level: ${ctx.anchorLabel}.${ctx.testedLabel ? ` Assessment taken at: ${ctx.testedLabel}.` : ""}
Diagnosed strands (individualized starting levels; mastered strands are review-only and must not be retaught):
${strands}

Write these weeks exactly (use the given week numbers and instructional_grade values):
${weeks}
${ctx.avoidPrompts.length ? `\nDo NOT reuse any of these existing prompts:\n${ctx.avoidPrompts.slice(0, 60).map((p) => `- ${p.slice(0, 90)}`).join("\n")}` : ""}

Each week schema: ${weekSchema}`;
  return { system, user };
}
