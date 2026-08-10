# Fix: "Unable to schedule follow-up"

## What's wrong

The `follow_up_assessments` table has row-level security policies (admins, teachers, students) but **no table-level grants** for the app's database roles. A check of the table's privileges shows no grants at all for the signed-in (`authenticated`), anonymous, or backend (`service_role`) roles.

Without those grants the backend API rejects every read and write to that table with a permission error before RLS is even evaluated. That's why:

- Admin/teacher "Grant Follow-Up" fails with "Could not schedule follow-up."
- The student dashboard follow-up card never shows anything.
- Automatic scheduling from the grading function silently creates nothing.

Everything else (policies, unique checkpoint index, foreign keys, UI code) is already correct.

## The fix

One database migration adding the missing grants:

- `authenticated`: SELECT, INSERT, UPDATE, DELETE — RLS still limits rows to admins, the teacher's own school, and the student's own records.
- `service_role`: ALL — needed by the grading function that auto-schedules Week 5/10/15 checkpoints.
- No `anon` grant: every policy requires a signed-in user.

## Verification after the migration

1. Confirm the grants exist on the table.
2. Schedule a follow-up from the admin Follow-Ups page and confirm the row is persisted with the right student, test, checkpoint and unlock date.
3. Confirm the scheduled row appears on the student dashboard card and unlocks on its date.
