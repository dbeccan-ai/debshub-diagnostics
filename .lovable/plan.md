# Free Follow-Up Assessments (Week 5 / Week 10 Retakes)

Let students retake their original diagnostic at scheduled program checkpoints with no payment, visible to both admins and students.

## How it works

1. When a student finishes a diagnostic and is placed in a program (5-week or 10-week), the system creates scheduled follow-up entitlements:
   - 5-week program: one retake at Week 5
   - 10-week program: retakes at Week 5 and Week 10
2. Each follow-up points at the **same test** the student originally took, so growth is measured on identical items.
3. Follow-ups unlock on their scheduled date. Before that, the student sees "Available on Sep 12" (locked). Admins can unlock early or push the date.
4. Admins can also create a follow-up manually for any student who already has a completed attempt — useful for programs enrolled outside the app.
5. When a student starts an unlocked follow-up, the new attempt is created already marked as paid/no-payment-required, skipping checkout entirely.

## Admin side

New "Follow-Up Assessments" section in the admin area:
- Table of all scheduled follow-ups: student, test, checkpoint (Week 5 / Week 10), unlock date, status (Locked / Available / Completed / Expired).
- Actions per row: Unlock now, Change date, Cancel.
- "Grant follow-up" button: pick a student and one of their completed attempts, pick checkpoint (Week 5 / Week 10 / custom label), pick unlock date (defaults to +5 or +10 weeks from the original test).
- Each completed attempt row in the existing results view gets a quick "Schedule follow-up" action.

## Student side

On the student dashboard, a "Follow-Up Assessments" card:
- Locked: checkpoint name, test name, "Unlocks on <date>".
- Available: "Start Follow-Up — No payment required" button that goes straight into the test.
- Completed: link to the results, with a simple growth line (original score → follow-up score).

## Results comparison

The follow-up result page shows the original score alongside the new score with the point/percentage change, so progress across Week 5 and Week 10 is visible at a glance.

## Technical notes

- New table `follow_up_assessments`: student id, source attempt id, test id, grade level, checkpoint label, week number, unlock date, status, created-by, resulting attempt id, timestamps. RLS: students read their own; admins/teachers manage rows for their school; grants for authenticated + service_role.
- Attempts created from a follow-up carry `payment_status = 'not_required'` and a `follow_up_id` reference on `test_attempts`, so the existing paywall check in `TakeTest.tsx` passes without touching pricing or coupons.
- Auto-creation happens when an attempt is completed and a program length is known (tier/plan params already used by `Enroll.tsx`); a lightweight scheduled job flips rows from Locked to Available at their unlock date, with the UI also treating any past-due date as available.
- Reuses the existing test engine and grading paths — no changes to test content, checkout, or Stripe flows.
