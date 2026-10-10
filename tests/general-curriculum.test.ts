// General K-12 Tier 3 intensive curriculum — synthetic fixtures only (no real student attempts).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  TIER3_PLAN, GENERAL_TIER_THRESHOLDS, tierFromScore, detectSubject, resolveGrades, buildStrandPlans, buildWeekSpecs,
  sessionInfo, finalizeWeek, validatePlan, progressionStatus, gradeLabel, buildBatchPrompt, type WeekSpec, type IntensiveCurriculum,
} from "../supabase/functions/_shared/general-curriculum.ts";
import { TIER_THRESHOLDS } from "../src/lib/tierConfig";
import { TACHS_PROGRAMS } from "../supabase/functions/_shared/tachs-programs.ts";

const stats = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, p]) => [k, { correct: p, total: 100, percentage: p }]));

function synthWeek(spec: WeekSpec, subject: "math" | "ela", n = 12, tweak?: (w: any) => void) {
  const roles = ["guided", "guided", "guided", "independent", "independent", "independent", "review", "review", "checkpoint", "checkpoint", "checkpoint", "retention"];
  const items = Array.from({ length: n }, (_, i) => subject === "math"
    ? { role: roles[i % roles.length], type: "multiple_choice", skill: spec.priority_skills[0].skill, prompt: `W${spec.week} Q${i + 1}: What is ${spec.week * 10 + i} + ${i + 2}?`, options: [`${spec.week * 10 + 2 * i + 2}`, `${spec.week * 10 + 2 * i + 3}`, `${spec.week * 10 + 2 * i + 1}`, `${spec.week * 10 + 2 * i}`], correct_answer: "A", explanation: "Add the ones then the tens.", hint: "Line up place values." }
    : i === 0 ? { role: "independent", type: "writing", skill: "Writing", prompt: `W${spec.week}: Write a paragraph about the main idea of the passage.`, exemplar: "The passage shows that ...", rubric: [{ criterion: "Claim", levels: "0-2" }, { criterion: "Evidence", levels: "0-2" }, { criterion: "Conventions", levels: "0-2" }], explanation: "Use the rubric.", hint: "Start with a topic sentence." }
    : { role: roles[i % roles.length], type: "short_answer", skill: "Main idea", prompt: `W${spec.week} Q${i + 1}: Which sentence in paragraph ${i} best states the author's point?`, correct_answer: "Sentence two", explanation: "It states the claim.", hint: "Look for the summary sentence." });
  const w: any = {
    week: spec.week, instructional_grade: spec.instructional_grade, focus: `Focus for week ${spec.week}`, prerequisite_connection: "Builds toward the next level.",
    objectives: ["Solve with 85% accuracy"], prerequisite_check: ["Quick check"], teaching_explanation: "Explain the idea clearly.",
    worked_example: { problem: "Model problem", steps: ["Step one"], answer: "42" }, guided_practice_notes: "Use a place value chart.", independent_practice_notes: "Remove the chart.",
    cumulative_review: ["Previous skill"], home_practice: { minutes: 15, directions: "Do three problems together.", activities: ["Card game"] },
    checkpoint: { description: "Five-item check", assessment_goal: "85% independent" }, retention_check: "Two items from last week.", reteaching_directions: "Reteach with base-ten blocks.",
    extension_selection: spec.is_extension ? "Choose targets the Week 12 reassessment shows below target." : undefined, items,
  };
  tweak?.(w);
  return w;
}

function synthPlan(anchor: number, subject: "math" | "ela", strandStats: Record<string, number>) {
  const strands = buildStrandPlans(anchor, { skillStats: stats(strandStats) });
  const specs = buildWeekSpecs(anchor, strands);
  const weeks = specs.map((s) => finalizeWeek(synthWeek(s, subject), s, subject, null));
  weeks.forEach((w) => expect(w.errors).toEqual([]));
  const plan = { schemaVersion: 2, plan_type: "tier3_intensive", plan_label: TIER3_PLAN.label, subject, core_weeks: 12, extension_weeks: 3, grades: resolveGrades({ testedGrade: anchor }), sessions: sessionInfo(null), progression_target: { accuracy_pct: 85, distinct_checks: 2, requires_retention_check: true }, strands, overview: "", weeks: weeks.map((w) => w.week!), formal_retests_note: "", limitations: [] } as IntensiveCurriculum;
  return { plan, specs, strands };
}

describe("tier thresholds preserved", () => {
  it("mirror tierConfig 85/66", () => {
    expect(GENERAL_TIER_THRESHOLDS.GREEN).toBe(TIER_THRESHOLDS.GREEN);
    expect(GENERAL_TIER_THRESHOLDS.YELLOW).toBe(TIER_THRESHOLDS.YELLOW);
    expect([tierFromScore(85), tierFromScore(66), tierFromScore(65)]).toEqual(["Tier 1", "Tier 2", "Tier 3"]);
  });
});

describe("Tier 3 Grade 6", () => {
  const { plan, specs } = synthPlan(6, "math", { Fractions: 20, "Place value": 10 });
  it("has 15 weeks: core 1-12, optional 13-15", () => {
    expect(plan.weeks).toHaveLength(15);
    expect(plan.weeks.filter((w) => !w.is_extension).map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(plan.weeks.filter((w) => w.is_extension).map((w) => w.week)).toEqual([13, 14, 15]);
    expect(validatePlan(plan, specs)).toEqual([]);
  });
  it("progresses Grade 3 → 4 → 5 → 6", () => {
    expect([1, 4, 7, 10, 13].map((w) => specs[w - 1].instructional_grade)).toEqual([3, 4, 5, 6, 6]);
    expect(specs[2].checkpoint_kind).toBe("phase_check");
    expect(specs[11].checkpoint_kind).toBe("reassessment");
    expect(specs[14].checkpoint_kind).toBe("final_review");
  });
  it("has ≥10 per-week items with keys matching options", () => {
    for (const w of plan.weeks) {
      expect(w.items.length).toBeGreaterThanOrEqual(10);
      for (const it of w.items) if (it.type === "multiple_choice") expect(["A", "B", "C", "D"].slice(0, it.options!.length)).toContain(it.correct_answer);
    }
  });
});

describe("Tier 3 Grade 9 (age-respectful)", () => {
  it("progresses 6 → 7 → 8 → 9 and prompt requires mature contexts", () => {
    const strands = buildStrandPlans(9, { skillStats: stats({ "Linear equations": 15 }) });
    const specs = buildWeekSpecs(9, strands);
    expect([1, 4, 7, 10].map((w) => specs[w - 1].instructional_grade)).toEqual([6, 7, 8, 9]);
    const { system } = buildBatchPrompt({ subject: "math", studentFirstName: "Sam", anchorLabel: gradeLabel(9), testedLabel: null, strands, specs: specs.slice(0, 3), avoidPrompts: [], sessionsPerWeek: null });
    expect(system).toMatch(/age-respectful/);
  });
});

describe("K / early primary", () => {
  it.each([0, 1, 2])("grade %i never goes below Pre-K", (g) => {
    const specs = buildWeekSpecs(g, buildStrandPlans(g, { skillStats: stats({ Counting: 10 }) }));
    for (const s of specs) { expect(s.instructional_grade).toBeGreaterThanOrEqual(-1); expect(s.instructional_label).not.toMatch(/Grade -|Grade 0/); }
    expect(gradeLabel(-5)).toBe("Pre-K foundations");
  });
});

describe("enrolled vs tested grade", () => {
  it("uses confirmed enrolled grade as G without subtracting from the tested grade", () => {
    const r = resolveGrades({ testedGrade: 3, confirmedEnrolledGrade: 6 });
    expect(r).toMatchObject({ anchor_grade: 6, tested_grade: 3, enrolled_verified: true, notice: null });
    const specs = buildWeekSpecs(r.anchor_grade!, buildStrandPlans(6, { skillStats: stats({ Fractions: 10 }) }));
    expect(specs[0].instructional_grade).toBe(3); // not 0
  });
  it("flags unverified enrolled grade", () => {
    const r = resolveGrades({ testedGrade: 5 });
    expect(r.enrolled_verified).toBe(false);
    expect(r.notice).toMatch(/not verified/);
    expect(resolveGrades({ testedGrade: null }).anchor_grade).toBeNull();
  });
});

describe("individual strand starting levels", () => {
  it("different starts per strand; mastered prerequisites are review-only", () => {
    const strands = buildStrandPlans(6, { skillStats: stats({ Fractions: 10, Decimals: 40, Ratios: 60, Geometry: 90 }) });
    const by = Object.fromEntries(strands.map((s) => [s.skill, s]));
    expect([by.Fractions.start_grade, by.Decimals.start_grade, by.Ratios.start_grade]).toEqual([3, 4, 5]);
    expect(by.Geometry.status).toBe("mastered");
    const specs = buildWeekSpecs(6, strands);
    expect(specs.slice(0, 3).flatMap((s) => s.priority_skills.map((p) => p.skill))).not.toContain("Decimals");
    expect(specs.slice(0, 12).flatMap((s) => s.priority_skills.map((p) => p.skill))).not.toContain("Geometry");
    expect(specs[3].priority_skills.map((p) => p.skill)).toContain("Decimals");
  });
  it("adjusts the phase when nothing is due at G−3", () => {
    const specs = buildWeekSpecs(6, buildStrandPlans(6, { skillStats: stats({ Ratios: 60 }) }));
    expect(specs[0].instructional_grade).toBe(5);
    expect(specs[0].adjusted).toBe(true);
  });
});

describe("mastery evidence", () => {
  it("no evidence / viewing gives awaiting evidence", () => {
    expect(progressionStatus([])).toBe("awaiting_evidence");
    expect(progressionStatus(null)).toBe("awaiting_evidence");
  });
  it("needs two passing checks including retention", () => {
    const t = "2026-10-10";
    expect(progressionStatus([{ kind: "checkpoint", accuracy_pct: 90, recorded_at: t }, { kind: "retention", accuracy_pct: 88, recorded_at: t }])).toBe("ready_to_progress");
    expect(progressionStatus([{ kind: "checkpoint", accuracy_pct: 90, recorded_at: t }, { kind: "checkpoint", accuracy_pct: 92, recorded_at: t }])).toBe("awaiting_evidence");
    expect(progressionStatus([{ kind: "checkpoint", accuracy_pct: 60, recorded_at: t }, { kind: "retention", accuracy_pct: 88, recorded_at: t }])).toBe("needs_reteaching");
  });
});

describe("validation rejects bad output", () => {
  const spec = buildWeekSpecs(6, buildStrandPlans(6, { skillStats: stats({ Fractions: 10 }) }))[0];
  it("rejects too few items, mismatched keys, missing roles, links, wrong grade, subject mismatch", () => {
    expect(finalizeWeek(synthWeek(spec, "math", 6), spec, "math", null).errors.join()).toMatch(/at least 10/);
    expect(finalizeWeek(synthWeek(spec, "math", 12, (w) => { w.items[0].correct_answer = "E"; }), spec, "math", null).errors.join()).toMatch(/answer key/);
    expect(finalizeWeek(synthWeek(spec, "math", 12, (w) => { w.items.forEach((i: any) => { if (i.role === "review") i.role = "guided"; }); }), spec, "math", null).errors.join()).toMatch(/missing review/);
    expect(finalizeWeek(synthWeek(spec, "math", 12, (w) => { w.teaching_explanation = "See https://example.com"; }), spec, "math", null).errors.join()).toMatch(/links/);
    expect(finalizeWeek(synthWeek(spec, "math", 12, (w) => { w.instructional_grade = 6; }), spec, "math", null).errors.join()).toMatch(/grade mismatch/);
    expect(finalizeWeek(synthWeek(spec, "math", 12), spec, "ela", null).errors.join()).toMatch(/math content in an ELA/);
    expect(finalizeWeek(null, spec, "math", null).week).toBeNull();
  });
  it("rejects writing without rubric and an incomplete plan", () => {
    expect(finalizeWeek(synthWeek(spec, "ela", 12, (w) => { delete w.items[0].rubric; }), spec, "ela", null).errors.join()).toMatch(/rubric/);
    const { plan, specs } = synthPlan(6, "math", { Fractions: 10 });
    expect(validatePlan({ ...plan, weeks: plan.weeks.slice(0, 9) }, specs).join()).toMatch(/9 weeks/);
    const dup = { ...plan, weeks: plan.weeks.map((w, i) => (i === 1 ? { ...w, items: [...w.items.slice(1), plan.weeks[0].items[0]] } : w)) };
    expect(validatePlan(dup, specs).join()).toMatch(/repeats/);
  });
});

describe("weeks vs sessions", () => {
  it("unconfirmed schedule stays unconfirmed; configured schedule multiplies", () => {
    expect(sessionInfo(null)).toMatchObject({ sessions_per_week: null, total_sessions: null, frequency_label: "To be confirmed" });
    expect(sessionInfo(2)).toMatchObject({ total_sessions: 24 });
    const spec = buildWeekSpecs(6, buildStrandPlans(6, { skillStats: stats({ Fractions: 10 }) }))[0];
    expect(finalizeWeek(synthWeek(spec, "math"), spec, "math", 3).week!.sessions).toHaveLength(3);
    expect(TIER3_PLAN.label).toMatch(/12-Week/);
  });
});

describe("subject taxonomy", () => {
  it("detects math/ela, refuses unknown", () => {
    expect(detectSubject("ela", "Grade 4 ELA")).toBe("ela");
    expect(detectSubject("math", "Grade 6 Math Diagnostic")).toBe("math");
    expect(detectSubject("science", "Science")).toBeNull();
  });
});

describe("unchanged pathways", () => {
  const fn = readFileSync("supabase/functions/generate-curriculum/index.ts", "utf8");
  const page = readFileSync("src/pages/Curriculum.tsx", "utf8");
  it("Tier 1/2 legacy 4-week path and ownership check remain", () => {
    expect(fn).toMatch(/Generate 4 weeks of curriculum/);
    expect(fn).toMatch(/tierFromScore\(attempt\.score\) === "Tier 3"/);
    expect(fn).toMatch(/You do not have permission to access this attempt/);
    expect(fn).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });
  it("old schema still renders; no hardcoded 4-week heading", () => {
    expect(page).not.toMatch(/>\s*4-Week Learning Plan/);
    expect(page).toMatch(/curriculum\.weeks\.length\}-Week Learning Plan/);
    expect(page).toMatch(/schemaVersion === 2/);
  });
  it("TACHS 8-week program unchanged", () => {
    expect(TACHS_PROGRAMS.tachs_8_week_intensive.duration_weeks).toBe(8);
  });
});
