import { describe, it, expect } from "vitest";
import { buildDiagnosticReport } from "../supabase/functions/_shared/diagnostic-report";
import { validateStaffReportContext, OWNER_CONTEXT_ATTEMPTS } from "../supabase/functions/_shared/general-report-context";
import { renderDiagnosticReportHtml, renderTeacherCopyHtml } from "../supabase/functions/_shared/diagnostic-report-html";
import { resolveGrades, buildWeekSpecs } from "../supabase/functions/_shared/general-curriculum";

const identity = { attemptId: OWNER_CONTEXT_ATTEMPTS[0], studentId: "student", studentName: "Tejani Thomas", assessedGrade: 5 };
const context = { attemptId: identity.attemptId, studentId: "student", enrolledGrade: 6, ownerConfirmedStartingPlan: true };
describe("staff-confirmed context in standard reports", () => {
  it("requires authenticated staff and exact identity; owner facts cannot reach another report", () => {
    expect(() => validateStaffReportContext(context, identity, false)).toThrow(/authorized staff/);
    expect(() => validateStaffReportContext(context, { ...identity, studentId: "other" }, true)).toThrow(/match/);
    expect(() => validateStaffReportContext(context, { ...identity, studentName: "Other student" }, true)).toThrow(/not authorized/);
    expect(() => validateStaffReportContext({ ...context, enrolledGrade: 5 }, identity, true)).toThrow(/not authorized/);
    expect(validateStaffReportContext(null, identity, false)).toBeNull();
  });
  for (const [subject, earned, pct, id] of [["math", 19, 61.29, OWNER_CONTEXT_ATTEMPTS[0]], ["ela", 15.5, 50, OWNER_CONTEXT_ATTEMPTS[1]]] as const) {
    it(`${subject} preserves grade identity, points, standard sections and scoped attendance`, () => {
      const questions = [{ id: "q", skill: subject === "math" ? "Fractions" : "Main idea", type: "open-ended" }];
      const responses = [{ question_id: "q", is_correct: false, points_awarded: earned, max_points: 31 }];
      const input = { attempt: { id, score: pct, correct_answers: null, total_questions: null, completed_at: "2026-10-11T22:17:00Z", grade_level: 5 }, test: { name: `Grade 5 ${subject}`, test_type: subject, questions }, responses, studentName: "Tejani Thomas" };
      const c = validateStaffReportContext({ ...context, attemptId: id }, { ...identity, attemptId: id }, true);
      const plain = buildDiagnosticReport(input);
      const r = buildDiagnosticReport({ ...input, staffContext: c, staffConfirmedBy: "Dahalia Beccan" });
      expect(r.assessedGrade).toBe(5); expect(r.enrolledGrade).toBe(6);
      expect(r.points).toEqual(plain.points); expect(r.counts).toEqual(plain.counts); expect(r.coverage).toEqual(plain.coverage);
      expect(r.score.pct).toBe(pct); expect(r.program.weeks).toBe(15); expect(r.program.retests.map((x) => x.week)).toEqual([5, 10, 15]);
      const html = renderDiagnosticReportHtml(r);
      expect(html.indexOf("Assessment context")).toBeLessThan(html.indexOf("1. Score summary"));
      expect(html).toContain("Current enrolled grade:</strong> Grade 6.");
      expect(html).toContain("Diagnostic starting level:</strong> Grade 5.");
      expect(html).toContain("97.5 attendance hours"); expect(html).toContain("initially one hour per subject");
      expect(html).not.toMatch(/limited evidence|inferred from wording|principal|will repeat|Grade 5 student/i);
      expect(html).toContain("not evidence of separately administered or completed Grade 4 or Grade 3 tests");
      expect(renderTeacherCopyHtml(r, { responses })).toContain("97.5 attendance hours");
      expect(renderDiagnosticReportHtml(plain)).not.toMatch(/Tijani|97.5|45 afterschool/);
    });
  }
  it("other students can receive confirmation without individual facts", () => {
    const c = validateStaffReportContext({ attemptId: "other", studentId: "other", enrolledGrade: 7 }, { attemptId: "other", studentId: "other", studentName: "Other", assessedGrade: 6 }, true);
    expect(c?.ownerConfirmedStartingPlan).toBe(false);
  });
  it("anchors prerequisites once to confirmed Grade 6, never subtracts from Grade 5 too", () => {
    const grades = resolveGrades({ testedGrade: 5, confirmedEnrolledGrade: 6 });
    expect(grades).toMatchObject({ tested_grade: 5, enrolled_grade: 6, anchor_grade: 6, enrolled_verified: true });
    const weeks = buildWeekSpecs(grades.anchor_grade ?? 0, []);
    expect(weeks).toHaveLength(15); expect(weeks[0].phase_grade).toBe(3); expect(weeks[14].phase_grade).toBe(6);
  });
});