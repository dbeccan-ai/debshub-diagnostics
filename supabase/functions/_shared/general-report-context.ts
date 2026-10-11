// Request-scoped staff confirmation; never overwrites assessment grades or persists student records.
export interface StaffReportContext {
  attemptId: string;
  studentId: string;
  enrolledGrade: number;
  ownerConfirmedStartingPlan?: boolean;
}
export interface AssessmentContext {
  confirmedBy: string;
  explanation: string | null;
  parentExplanation: string | null;
  coverage: string;
  purpose: string;
  learningTarget: string | null;
  attendance: string | null;
}
export const OWNER_CONTEXT_ATTEMPTS = ["b6586fa5-1daa-46a6-bf70-270e0dc2d190", "cede86d5-e15d-4bb8-ae0c-7d64bed30cc9"];
export function validateStaffReportContext(raw: unknown, identity: { attemptId: string; studentId: string; studentName: string; assessedGrade: number | null }, authorized: boolean): StaffReportContext | null {
  if (raw === undefined || raw === null) return null;
  if (!authorized) throw new Error("Only authorized staff may confirm report context.");
  const c = raw as StaffReportContext;
  if (c.attemptId !== identity.attemptId || c.studentId !== identity.studentId) throw new Error("Report context does not match this student and assessment.");
  if (!Number.isInteger(c.enrolledGrade) || c.enrolledGrade < 0 || c.enrolledGrade > 12) throw new Error("Confirmed enrolled grade must be Kindergarten through Grade 12.");
  if (c.ownerConfirmedStartingPlan && (!OWNER_CONTEXT_ATTEMPTS.includes(identity.attemptId) || identity.studentName !== "Tejani Thomas" || identity.assessedGrade !== 5 || c.enrolledGrade !== 6)) throw new Error("The owner-confirmed starting plan is not authorized for this assessment.");
  return { attemptId: c.attemptId, studentId: c.studentId, enrolledGrade: c.enrolledGrade, ownerConfirmedStartingPlan: c.ownerConfirmedStartingPlan === true };
}
export function assessmentContext(c: StaffReportContext, confirmedBy: string): AssessmentContext {
  const individual = c.ownerConfirmedStartingPlan;
  return {
    confirmedBy,
    explanation: individual ? "The diagnostic began at Grade 5 to identify prerequisite skills needed for Grade 6 learning." : null,
    parentExplanation: individual ? "As discussed before testing, Tijani's diagnostic began with Grade 5 skills because he is at the beginning of Grade 6. This allows us to check the foundations needed for current-year learning and identify the specific skills to strengthen before progressing into Grade 6 work. Earlier prerequisite skills are reviewed where needed to guide instruction." : null,
    coverage: individual ? "This report presents the recorded Grade 5 diagnostic. The intended prerequisite pathway is an instructional plan, not evidence of separately administered or completed Grade 4 or Grade 3 tests. Earlier skills are identified as assessed only where the question or test information establishes that coverage." : "The assessment level identifies the diagnostic taken, not the student's current enrolled grade or an exact grade equivalent.",
    purpose: `These results guide ${individual ? "Tijani's" : "the student's"} learning plan and progress monitoring; they do not constitute a promotion or retention decision.`,
    learningTarget: individual ? "Over 15 weeks, address identified Grade 3–5 prerequisites as appropriate and progress toward Grade 6 application. Formal retests remain at Weeks 5, 10 and 15." : null,
    attendance: individual ? "Individual schedule: 45 afterschool support visits of about 1.5 hours, plus 15 Saturday two-hour integrated Math/ELA sessions, initially one hour per subject. Four visits weekly, approximately 97.5 attendance hours; these are not 60 individual intensive tutoring sessions." : null,
  };
}