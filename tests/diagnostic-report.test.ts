// General K-12 diagnostic report contract — synthetic fixtures only (no real student data).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildDiagnosticReport, buildSkillAnalysis, flattenTestItems, classifySkill, detectReportSubject, evidenceLabel,
  programForTier, retestSchedule, SKILL_STATUS_THRESHOLDS, UNMAPPED_SKILL, type ResponseRow,
} from "../supabase/functions/_shared/diagnostic-report.ts";
import { renderDiagnosticReportHtml } from "../supabase/functions/_shared/diagnostic-report-html.ts";
import { TIER_THRESHOLDS } from "../src/lib/tierConfig";
import { getCheckpointsForWeeks, getProgramWeeksForTier } from "../src/lib/followUps";

const mc = (id: string, skill: string | null, extra: any = {}) => ({ id, type: "multiple_choice", ...(skill ? { skill } : {}), question: `Q ${id}`, options: ["A", "B"], correct_answer: "A", ...extra });
const wr = (id: string, skill: string) => ({ id, type: "extended_response", skill, question: `Write ${id}` });
const ok = (id: string): ResponseRow => ({ question_id: id, is_correct: true });
const no = (id: string): ResponseRow => ({ question_id: id, is_correct: false });
const attempt = (score: number | null, extra: any = {}) => ({ id: "00000000-synthetic", score, correct_answers: null, total_questions: null, completed_at: "2026-10-01T00:00:00Z", grade_level: 5, ...extra });

const elaBank = [mc("e1", "vocabulary"), mc("e2", "punctuation"), mc("e3", "main idea"), mc("e4", "spelling"), mc("e5", "made up thing"), mc("e6", null), wr("w1", "opinion writing")];

describe("subject detection", () => {
  it("unknown subject stays unknown (never defaults to math)", () => {
    expect(detectReportSubject("science", "Grade 5 Science")).toBe("unknown");
    expect(detectReportSubject(null, null)).toBe("unknown");
    expect(detectReportSubject("ela", "Grade 5 ELA Diagnostic Test")).toBe("ela");
    expect(detectReportSubject("math", null)).toBe("math");
  });
  it("unknown subject report requires verification", () => {
    const r = buildDiagnosticReport({ attempt: attempt(100), test: { name: "X", test_type: "science", questions: [mc("a", null)] }, responses: [ok("a")] });
    expect(r.verification.state).toBe("requires_verification");
    expect(r.skills.every((s) => s.skill === UNMAPPED_SKILL)).toBe(true);
  });
});

describe("ELA skill analysis", () => {
  const r = buildDiagnosticReport({ attempt: attempt(null), test: { name: "Grade 5 ELA", test_type: "ela", questions: elaBank }, responses: elaBank.map((q) => ok(q.id)) });
  it("never contains math skills even when question text mentions numbers", () => {
    const bank = [mc("x", null, { question: "Round 7,206 to the nearest hundred and explain the fraction 3/4" })];
    const rep = buildDiagnosticReport({ attempt: attempt(null), test: { name: "ELA", test_type: "ela", questions: bank }, responses: [ok("x")] });
    expect(rep.skills.map((s) => s.skill)).toEqual([UNMAPPED_SKILL]);
    const sa = buildSkillAnalysis(flattenTestItems(bank, "ela").items, [ok("x")], "ela");
    expect(Object.keys(sa.skillStats)).not.toContain("Rounding");
    expect(Object.keys(sa.skillStats)).not.toContain("General Math");
  });
  it("maps explicit tags to domains; unknown tag and missing tag are flagged unmapped, not Grammar", () => {
    const by = Object.fromEntries(r.skills.map((s) => [s.skill, s.domain]));
    expect(by["Vocabulary"]).toBe("Vocabulary");
    expect(by["Punctuation"]).toBe("Grammar & Conventions");
    expect(by["Main Idea"]).toBe("Reading Comprehension");
    expect(by["Spelling"]).toBe("Spelling");
    expect(by["Opinion Writing"]).toBe("Writing");
    expect(by["Made Up Thing"]).toBe("Unmapped");
    expect(by[UNMAPPED_SKILL]).toBe("Unmapped");
    expect(r.unmapped.count).toBe(2);
  });
  it("domains not assessed are labelled not assessed", () => {
    const fs = r.domains.find((d) => d.domain === "Foundational Skills")!;
    expect(fs.notAssessed).toBe(true);
    expect(fs.status).toBe("not_scored");
  });
});

describe("item shapes and stable IDs", () => {
  it("flattens nested sections and subsections preserving section metadata", () => {
    const raw = { sections: [{ section_title: "Part A", questions: [mc("a1", "theme")], subsections: [{ title: "A.2", questions: [mc("a2", "tone")] }] }, { section_title: "Part B", questions: [{ type: "multiple_choice", options: ["x"], correct_answer: "x", skill: "genre" }] }] };
    const { items, issues } = flattenTestItems(raw, "ela");
    expect(items.map((i) => i.id)).toEqual(["a1", "a2", "s2-q1"]);
    expect(items.map((i) => i.section)).toEqual(["Part A", "Part A", "Part B"]);
    expect(items[1].subsection).toBe("A.2");
    expect(issues.missingIds).toBe(1);
    expect(flattenTestItems(raw, "ela").items.map((i) => i.id)).toEqual(items.map((i) => i.id)); // deterministic
  });
  it("detects duplicate IDs and unmatched responses", () => {
    const r = buildDiagnosticReport({ attempt: attempt(100), test: { name: "Math", test_type: "math", questions: [mc("d", "fractions"), mc("d", "decimals")] }, responses: [ok("d"), ok("ghost")] });
    expect(r.verification.state).toBe("requires_verification");
    expect(r.verification.issues.join(" ")).toMatch(/Duplicate question IDs/);
    expect(r.verification.issues.join(" ")).toMatch(/do not match any question/);
  });
  it("flags a bank edited after the attempt", () => {
    const r = buildDiagnosticReport({ attempt: attempt(100), test: { name: "Math", test_type: "math", questions: [mc("a", "fractions")], updated_at: "2026-12-01T00:00:00Z" }, responses: [ok("a")] });
    expect(r.verification.issues.join(" ")).toMatch(/edited after/);
  });
});

describe("scoring states and reconciliation", () => {
  const bank = [mc("m1", "fractions"), mc("m2", "fractions"), mc("m3", "decimals"), { id: "o1", type: "open-ended", topic: "word problems", question: "Explain" }, { id: "o2", type: "open-ended", topic: "word problems", question: "Explain" }, mc("m4", "decimals")];
  const responses: ResponseRow[] = [ok("m1"), no("m2"), ok("m3"), { question_id: "o1", is_correct: false, points_awarded: 1, max_points: 2 }, { question_id: "o2", is_correct: null }];
  const r = buildDiagnosticReport({ attempt: attempt(60, { correct_answers: 2 }), test: { name: "Math", test_type: "math", questions: bank }, responses });
  it("separates correct / partial / incorrect / pending / unanswered", () => {
    expect(r.counts).toMatchObject({ totalItems: 6, scored: 4, correct: 2, partial: 1, incorrect: 1, pending: 1, unanswered: 1 });
    expect(r.counts.correct + r.counts.partial + r.counts.incorrect).toBe(r.counts.scored);
    expect(r.counts.scored + r.counts.pending + r.counts.unanswered).toBe(r.counts.totalItems);
  });
  it("uses points for partial credit; pending is not scored zero", () => {
    expect(r.points).toEqual({ earned: 3, possible: 5 });
    expect(r.score.pct).toBe(60);
    expect(r.score.basis).toMatch(/3 of 5 points/);
    const wp = r.skills.find((s) => s.skill === "Word Problems")!;
    expect(wp).toMatchObject({ earned: 1, possible: 2, pct: 50, pendingItems: 1, usesPoints: true });
    expect(r.verification.state).toBe("verified");
  });
  it("all-pending skill is not scored", () => {
    const x = buildDiagnosticReport({ attempt: attempt(null), test: { name: "Math", test_type: "math", questions: [{ id: "o", type: "open-ended", topic: "area", question: "?" }] }, responses: [{ question_id: "o", is_correct: null }] });
    expect(x.skills[0].status).toBe("not_scored");
    expect(x.score.pct).toBeNull();
    expect(x.score.tier).toBeNull();
  });
  it("conflicting stored score requires verification and renders the warning, not a final report", () => {
    const bad = buildDiagnosticReport({ attempt: attempt(95), test: { name: "Math", test_type: "math", questions: bank }, responses });
    expect(bad.verification.state).toBe("requires_verification");
    const html = renderDiagnosticReportHtml(bad);
    expect(html).toContain("Scoring details require verification");
    expect(html).not.toContain("Skill-by-skill results");
  });
  it("all-graded MC uses item basis", () => {
    const x = buildDiagnosticReport({ attempt: attempt(50), test: { name: "Math", test_type: "math", questions: [mc("a", "x"), mc("b", "x")] }, responses: [ok("a"), no("b")] });
    expect(x.score.basis).toBe("Correct ÷ recorded scored questions: 1 of 2.");
  });
});

describe("thresholds and evidence", () => {
  it("uses exact 85/66 boundaries matching tierConfig", () => {
    expect(SKILL_STATUS_THRESHOLDS).toEqual({ STRENGTH: TIER_THRESHOLDS.GREEN, DEVELOPING: TIER_THRESHOLDS.YELLOW });
    expect(classifySkill(85)).toBe("strength");
    expect(classifySkill(84.99)).toBe("developing");
    expect(classifySkill(66)).toBe("developing");
    expect(classifySkill(65.99)).toBe("priority");
    expect(classifySkill(null)).toBe("not_scored");
  });
  it("labels 1/1 as limited evidence, not mastery", () => {
    expect(evidenceLabel(1, 100)).toBe("Limited evidence: 100% on 1 assessed item — not proof of broad mastery");
    expect(evidenceLabel(3, 100)).toBeNull();
  });
  it("report never prints 70/50 legends", () => {
    const html = renderDiagnosticReportHtml(buildDiagnosticReport({ attempt: attempt(50), test: { name: "Math", test_type: "math", questions: [mc("a", "x"), mc("b", "x")] }, responses: [ok("a"), no("b")] }));
    expect(html).not.toMatch(/70%\+|50[–-]69%|&lt;50%/);
    expect(html).toContain("Strength (85%+)");
  });
});

describe("retests", () => {
  it("Tier 3 = weeks 5/10/15, never sessions, mirrors followUps.ts", () => {
    expect(programForTier("Tier 3").retestWeeks).toEqual([5, 10, 15]);
    for (const t of ["Tier 1", "Tier 2", "Tier 3"] as const)
      expect(programForTier(t).retestWeeks).toEqual(getCheckpointsForWeeks(getProgramWeeksForTier(t)));
  });
  it("duplicate follow-up rows never produce duplicate retests", () => {
    const s = retestSchedule("Tier 3", [{ week_number: 5, status: "scheduled", unlock_date: "2026-11-01" }, { week_number: 5, status: "scheduled", unlock_date: "2026-11-01" }]);
    expect(s.map((x) => x.week)).toEqual([5, 10, 15]);
  });
  it("rendered report says weeks, not sessions", () => {
    const html = renderDiagnosticReportHtml(buildDiagnosticReport({ attempt: attempt(0), test: { name: "Math", test_type: "math", questions: [mc("a", "x")] }, responses: [no("a")] }));
    expect(html).toContain("Week 5 formal retest");
    expect(html).toContain("Week 15 formal retest");
    expect(html.toLowerCase()).not.toContain("retest at session");
    expect(html).toContain("15-week intensive program");
    expect(html).toContain("afterschool support and separate Saturday intensive sessions");
  });
});

describe("Math / ELA parity", () => {
  it("both subjects render identical section structure", () => {
    const heads = (html: string) => [...html.matchAll(/<h2>(\d)\./g)].map((m) => m[1]).join(",");
    const e = renderDiagnosticReportHtml(buildDiagnosticReport({ attempt: attempt(null), test: { name: "ELA", test_type: "ela", questions: elaBank }, responses: elaBank.map((q) => ok(q.id)) }));
    const m = renderDiagnosticReportHtml(buildDiagnosticReport({ attempt: attempt(null), test: { name: "Math", test_type: "math", questions: [mc("a", "fractions")] }, responses: [ok("a")] }));
    expect(heads(e)).toBe("1,2,3,4,5,6,7");
    expect(heads(m)).toBe(heads(e));
  });
});

describe("grading paths share the contract", () => {
  for (const f of ["grade-test", "finalize-grading", "regrade-test", "generate-result-download"]) {
    it(`${f} imports the shared report module and has no Math default`, () => {
      const src = readFileSync(`supabase/functions/${f}/index.ts`, "utf8");
      expect(src).toContain("_shared/diagnostic-report");
      expect(src).not.toMatch(/'General Math'|"General Math"/);
    });
  }
});

describe("summary lists", () => {
  it("a skill appearing in two sections is listed once with combined evidence", () => {
    const bank = [mc("a", "time", { section: "S1" }), mc("b", "time", { section: "S2" })];
    const r = buildDiagnosticReport({ attempt: attempt(50), test: { name: "Math", test_type: "math", questions: bank }, responses: [ok("a"), no("b")] });
    const all = [...r.strengths, ...r.developing, ...r.priority].map((s) => s.skill);
    expect(all.filter((s) => s === "Time")).toHaveLength(1);
    expect(r.priority.find((s) => s.skill === "Time")).toMatchObject({ correctItems: 1, scoredItems: 2, pct: 50 });
  });
});

/* ───────── Required-work coverage, teacher copy, emails, branding (synthetic only) ───────── */
import { assessCoverage, parseChoiceGroup, formatReportDate, BRAND_NAME, BRAND_TAGLINE } from "../supabase/functions/_shared/diagnostic-report.ts";
import { renderTeacherCopyHtml, renderEmailSummaryHtml } from "../supabase/functions/_shared/diagnostic-report-html.ts";

const SEC = "Section III - Multi-Step Word Problems (Choose 3 out of 5)";
const open5 = ["p1", "p2", "p3", "p4", "p5"].map((id) => ({ id, type: "open-ended", section: SEC, skill: "multi-step problems", question: `Word problem ${id}` }));
const mcA = [mc("m1", "place value", { section: "Section I" }), mc("m2", "place value", { section: "Section I" }), mc("m3", "fractions", { section: "Section I" })];
const pts = (id: string, earned: number, max: number): ResponseRow => ({ question_id: id, answer: "work", is_correct: earned >= max, points_awarded: earned, max_points: max });

describe("required choice-group coverage", () => {
  it("reads 'Choose 3 out of 5' from the section title", () => {
    expect(parseChoiceGroup({}, SEC, null)).toMatchObject({ required: 3, size: 5, source: "title" });
    expect(parseChoiceGroup({}, "Section I", null)).toBeNull();
    expect(parseChoiceGroup({ required_count: 2, choice_group: "g" }, "X", null)).toMatchObject({ key: "g", required: 2, source: "metadata" });
  });
  it("completed optional selection: 3 of 5 answered → complete; 2 unselected are optional, not missing", () => {
    const r = buildDiagnosticReport({ attempt: attempt(null), test: { name: "G5 Math", test_type: "math", questions: [...mcA, ...open5] }, responses: [...mcA.map((q) => ok(q.id)), pts("p1", 2, 3), ok("p2"), no("p3")] });
    expect(r.coverage.state).toBe("complete");
    expect(r.coverage.optionalNotSelectedIds.sort()).toEqual(["p4", "p5"]);
    expect(r.coverage.missingRequired).toBe(0);
    expect(r.score.basis).not.toMatch(/incomplete/);
  });
  it("under-selected required group (Tejani shape: 1 of 3 required) → incomplete, partial credit preserved, score unchanged", () => {
    const responses = [...mcA.map((q) => ok(q.id)), pts("p4", 1.5, 3)];
    const r = buildDiagnosticReport({ attempt: attempt(null), test: { name: "G5 Math", test_type: "math", questions: [...mcA, ...open5] }, responses });
    expect(r.coverage.state).toBe("incomplete");
    expect(r.coverage.choiceGroups[0]).toMatchObject({ required: 3, size: 5, answered: 1, missingRequired: 2, status: "under_selected" });
    expect(r.coverage.optionalNotSelected).toBe(0); // none can be called optional when the requirement is unmet
    expect(r.points).toEqual({ earned: 4.5, possible: 6 }); // missing work never scored as zero / invented
    expect(r.score.pct).toBe(75);
    expect(r.score.basis).toMatch(/recorded scored items/);
    expect(r.score.basis).toMatch(/required work is incomplete/);
    expect(r.coverage.statement).toMatch(/requires 3 of 5 responses but only 1 was saved/);
    expect(r.tierExplanation).toMatch(/recorded scored items only/);
    const html = renderDiagnosticReportHtml(r);
    expect(html).toContain("Required work incomplete");
    expect(html).toMatch(/2 required responses missing/);
  });
  it("ordinary missing mandatory item → incomplete with that question listed", () => {
    const r = buildDiagnosticReport({ attempt: attempt(null), test: { name: "G5 Math", test_type: "math", questions: mcA }, responses: [ok("m1"), ok("m2")] });
    expect(r.coverage.state).toBe("incomplete");
    expect(r.coverage.missingMandatoryIds).toEqual(["m3"]);
    expect(r.score.pct).toBe(100);
  });
  it("score arithmetic agreement is not treated as proof of completion", () => {
    const r = buildDiagnosticReport({ attempt: attempt(75), test: { name: "G5 Math", test_type: "math", questions: [...mcA, ...open5] }, responses: [...mcA.map((q) => ok(q.id)), pts("p4", 1.5, 3)] });
    expect(r.verification.state).toBe("verified"); // stored 75% reconciles…
    expect(r.coverage.state).toBe("incomplete"); // …but required work is still incomplete
  });
  it("pending manual responses count as answered for coverage but stay out of the score", () => {
    const c = assessCoverage([{ id: "a", outcome: "pending", choiceGroup: { key: "g", required: 1, size: 2, source: "title" } }, { id: "b", outcome: "unanswered", choiceGroup: { key: "g", required: 1, size: 2, source: "title" } }]);
    expect(c.state).toBe("complete");
  });
});

describe("teacher copy and email share the parent evidence", () => {
  const bank = [...mcA, ...open5];
  const responses = [...mcA.map((q) => ok(q.id)), pts("p4", 1.5, 3)];
  const r = buildDiagnosticReport({ attempt: attempt(null), test: { name: "G5 Math", test_type: "math", questions: bank }, responses });
  const parent = renderDiagnosticReportHtml(r);
  const teacher = renderTeacherCopyHtml(r, { responses });
  it("teacher copy contains every parent section heading plus an answer-key appendix", () => {
    for (const h of parent.match(/<h2>[^<]+<\/h2>/g)!) expect(teacher).toContain(h);
    expect(teacher).toContain("Teacher appendix");
    expect(teacher).toContain("Answer key");
    expect(parent).not.toContain("Answer key");
    expect(teacher).toContain("No saved response"); // not "Optional" since group is under-selected
    expect(teacher).toContain("1.5/3 pts");
  });
  it("email summary uses the model's score basis, 85/66 tiers, weeks 5/10/15 and hides tier when unverified", () => {
    const e = renderEmailSummaryHtml(r);
    expect(e).toContain(r.score.basis.replace(/÷/g, "÷"));
    expect(e).toContain("Required work incomplete");
    const bad = buildDiagnosticReport({ attempt: attempt(10), test: { name: "G5 Math", test_type: "math", questions: bank }, responses });
    const eb = renderEmailSummaryHtml(bad);
    expect(eb).toContain("require verification");
    expect(eb).not.toMatch(/Tier [123]/);
  });
});

describe("brand and time zone", () => {
  it("uses exact legal brand and tagline, never 'Learn Academy'", () => {
    const html = renderDiagnosticReportHtml(buildDiagnosticReport({ attempt: attempt(null), test: { name: "ELA", test_type: "ela", questions: elaBank }, responses: elaBank.map((q) => ok(q.id)) }));
    expect(BRAND_NAME).toBe("D.E.Bs LEARNING ACADEMY LLC");
    expect(BRAND_TAGLINE).toBe("Unlocking Brilliance Through Learning");
    expect(html).toContain(BRAND_NAME);
    expect(html).toContain(BRAND_TAGLINE);
    expect(html).not.toMatch(/Learn Academy/);
    for (const f of ["supabase/functions/_shared/diagnostic-report-html.ts", "supabase/functions/send-test-results/index.ts", "supabase/functions/finalize-grading/index.ts", "src/pages/ELAResults.tsx"])
      expect(readFileSync(f, "utf8")).not.toMatch(/D\.E\.Bs Learn Academy(?! logo)/);
  });
  it("formats dates in America/New_York (late-evening ET stays on the ET date)", () => {
    expect(formatReportDate("2026-10-12T02:30:00Z")).toBe("October 11, 2026");
    expect(formatReportDate(null)).toBe("—");
  });
});
