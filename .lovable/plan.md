# Admin access to the 21-Day Recovery Plan

Right now the day-by-day 21-Day plan (with worksheets, phonics audio, and printing) only exists on the student-facing Reading Recovery dashboard, which requires an active enrollment. As an admin you never have one, so the only thing you see is the short "21-Day Recovery Roadmap" card on the results page — four generic bullet points per tier, not the actual day-by-day breakdown.

## What changes

**1. Results page (per student)**

Replace the generic tier bullets with the real breakdown when an admin (or the student) views a result:

- All 21 days listed with day number, title, category and description, grouped into Week 1 / 2 / 3.
- Days 1, 10 and 21 flagged as the Pre / Mid / Post assessment checkpoints.
- Each non-assessment day is clickable and opens the same worksheet dialog the student sees — tailored to that student's exact grade level from the assessment record — with the existing print button and phonics listen/record chips.
- Tier-specific guidance stays, shown as a short banner above the day list rather than replacing it.

**2. Admin results table**

Add a "21-Day Plan" action next to the existing view (eye) button on each row, opening the same day-by-day plan for that student at their assessed grade. Lets you review or print a plan without opening the full result.

**3. Read-only for admins**

Admins see and print the plan but do not mark days complete (there is no enrollment to write progress against). The "Mark complete" control only appears for the enrolled student on their own dashboard.

## Technical notes

- Extract the `get21DayRoadmap()` array and `categoryConfig` map out of `src/pages/ReadingRecoveryDashboard.tsx` into a shared module (e.g. `src/data/reading-recovery-roadmap.ts`) and import it in the dashboard, results page, and admin table so there is one source of truth.
- New component `src/components/ReadingRecoveryPlanBreakdown.tsx`: takes `gradeLevel`, optional `enrollmentId`/`studentName`, and a `readOnly` flag; renders the week-grouped day list and owns the `openActivityDay` state that drives `ReadingRecoveryActivityDialog`.
- `ReadingRecoveryActivityDialog` already accepts `enrollmentId: string | null` and `gradeLevel`; add a `readOnly` prop that hides the complete button. Worksheet tailoring keeps using `tuneForGrade` / `pickBand` / `gradeTargetWcpm`.
- `src/pages/ReadingRecoveryResults.tsx`: swap the static card body (around the "21-Day Recovery Roadmap" card) for the new component, resolving grade from the transcript's `grade_level`, falling back to parsing `grade_band`.
- `src/pages/AdminReadingRecoveryResults.tsx`: add the row action plus a dialog wrapper hosting the breakdown; include `grade_level` in the existing select so the plan uses the exact grade.
- No database or edge function changes.
