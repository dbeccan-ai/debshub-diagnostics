# Fix: Grade 9 & 12 ELA tests show Math questions

## Root cause

The `tests` table rows for **Grade 7, 8, 9, and 12 ELA Diagnostic Test** store an empty `[]` in the `questions` column (verified via DB query — length = 2 bytes). When `TakeTest.tsx` loads these tests:

1. The edge function `get-test-questions` returns `[]`.
2. `normalizeQuestions` produces 0 questions, so `TakeTest` falls back to `getQuestionsByTestName(finalTestData.name)` in `src/lib/testQuestions.ts`.
3. That helper only searches `src/data/diagnostic-tests.json` (the **Math** dataset) and uses a loose match: `testName.toLowerCase().includes("grade " + t.grade)`.
4. "Grade 9 ELA Diagnostic Test" contains "grade 9", so it matches the **Grade 9 Math Diagnostic Assessment** entry and returns Math questions. Same for Grade 12.

Grades 10 & 11 work because their DB rows already contain full ELA question arrays. Grades 7 & 8 are likely broken in the same way but the user only reported 9 & 12.

## Fix

### 1. Make the JSON fallback subject-aware (`src/lib/testQuestions.ts`)

- Import `ela-diagnostic-tests.json` alongside the existing math JSON.
- In `getQuestionsByTestName`, detect ELA names (`/ela|english/i`) and search the ELA dataset; otherwise search the math dataset.
- Tighten the loose match so the grade-number shortcut requires the subject keyword to also match (prevents future cross-subject leaks). Use a regex like `\bgrade\s*${grade}\b` plus a subject check rather than plain `includes`.

### 2. Backfill the DB rows for the affected ELA tests

Add a migration that updates the `tests` rows whose `questions` is an empty array, copying the corresponding test object from `ela-diagnostic-tests.json` into the column. Scope:

- Grade 7 ELA Diagnostic Test
- Grade 8 ELA Diagnostic Test
- Grade 9 ELA Diagnostic Test
- Grade 12 ELA Diagnostic Test

This ensures the edge-function path (which is the primary path) returns the right questions and the JSON fallback is only a safety net.

## Verification

- Reload Grade 9 ELA and Grade 12 ELA: questions shown should be the ELA items listed in `src/data/ela-diagnostic-tests.json` (e.g. Grade 9 Q1 "What is the main purpose of an author using a first-person narrator?").
- Confirm Grades 7 & 8 ELA now also render ELA content.
- Confirm Math grades 9 & 12 are unaffected.

## Files touched

- `src/lib/testQuestions.ts` — subject-aware fallback.
- `supabase/migrations/<new>.sql` — backfill four ELA test rows.

No UI/styling changes.
