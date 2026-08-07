import { supabase } from "@/integrations/supabase/client";

export type FollowUpStatus = "scheduled" | "available" | "completed" | "cancelled";

export interface FollowUpAssessment {
  id: string;
  student_id: string;
  source_attempt_id: string | null;
  test_id: string;
  grade_level: number | null;
  checkpoint_label: string;
  week_number: number | null;
  unlock_date: string;
  status: string;
  school_id: string | null;
  created_by: string | null;
  result_attempt_id: string | null;
  created_at: string;
}

/** Program length (in weeks) implied by a diagnostic tier. */
export function getProgramWeeksForTier(tier: string | null | undefined): number {
  const t = (tier || "").toLowerCase();
  if (t.includes("green") || t.includes("tier 1") || t.includes("mastery")) return 5;
  if (t.includes("red") || t.includes("tier 3") || t.includes("priority")) return 15;
  return 10; // Tier 2 (Yellow / Strengthening) programs run 10 weeks
}

/** Checkpoints (week numbers) for a program length. */
export function getCheckpointsForWeeks(weeks: number): number[] {
  if (weeks <= 5) return [5];
  if (weeks <= 10) return [5, 10];
  return [5, 10, 15];
}

export function addWeeks(dateISO: string | null | undefined, weeks: number): string {
  const base = dateISO ? new Date(dateISO) : new Date();
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function isUnlocked(f: Pick<FollowUpAssessment, "status" | "unlock_date">): boolean {
  if (f.status === "cancelled" || f.status === "completed") return false;
  if (f.status === "available") return true;
  const today = new Date().toISOString().slice(0, 10);
  return f.unlock_date <= today;
}

export function formatUnlockDate(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface EnsureArgs {
  attemptId: string;
  studentId: string;
  testId: string;
  gradeLevel: number | null;
  tier: string | null;
  completedAt: string | null;
  schoolId?: string | null;
  createdBy?: string | null;
  weeks?: number;
}

/**
 * Creates the scheduled follow-up rows for a completed attempt if they don't exist yet.
 * Safe to call repeatedly — a unique index on (source_attempt_id, week_number) prevents duplicates.
 */
export async function ensureFollowUpsForAttempt(args: EnsureArgs): Promise<number> {
  const { attemptId, studentId, testId, gradeLevel, tier, completedAt } = args;
  if (!attemptId || !studentId || !testId) return 0;

  const { data: existing, error: existingError } = await supabase
    .from("follow_up_assessments")
    .select("week_number")
    .eq("source_attempt_id", attemptId);

  if (existingError) {
    console.error("follow-up lookup failed", existingError);
    return 0;
  }

  const have = new Set((existing || []).map((r: { week_number: number | null }) => r.week_number));
  const weeks = args.weeks ?? getProgramWeeksForTier(tier);
  const checkpoints = getCheckpointsForWeeks(weeks).filter((w) => !have.has(w));
  if (checkpoints.length === 0) return 0;

  const rows = checkpoints.map((week) => ({
    student_id: studentId,
    source_attempt_id: attemptId,
    test_id: testId,
    grade_level: gradeLevel,
    checkpoint_label: `Week ${week} Follow-Up`,
    week_number: week,
    unlock_date: addWeeks(completedAt, week),
    status: "scheduled",
    school_id: args.schoolId ?? null,
    created_by: args.createdBy ?? null,
  }));

  const { error } = await supabase.from("follow_up_assessments").insert(rows);
  if (error) {
    console.error("follow-up creation failed", error);
    return 0;
  }
  return rows.length;
}

/**
 * Starts (or resumes) the free retake attempt tied to a follow-up.
 * Returns the attempt id to navigate to.
 */
export async function startFollowUpAttempt(followUp: FollowUpAssessment): Promise<string> {
  if (followUp.result_attempt_id) {
    const { data: existing } = await supabase
      .from("test_attempts")
      .select("id, completed_at")
      .eq("id", followUp.result_attempt_id)
      .maybeSingle();
    if (existing) return existing.id;
  }

  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .insert({
      user_id: followUp.student_id,
      test_id: followUp.test_id,
      grade_level: followUp.grade_level,
      school_id: followUp.school_id,
      payment_status: "not_required",
      follow_up_id: followUp.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase
    .from("follow_up_assessments")
    .update({ result_attempt_id: attempt.id, status: "available" })
    .eq("id", followUp.id);

  return attempt.id;
}
