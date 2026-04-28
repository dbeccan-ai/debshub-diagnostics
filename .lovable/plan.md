# Manual Grading: Partial Credit, Comments, and AI Suggestions

## Problems

1. **Static grading** — only "Mark Correct" / "Mark Incorrect" buttons. No way to enter a partial score (e.g. 2/3) or leave a comment for the parent/student.
2. **No suggestion** — the teacher reads each free-response answer cold, slowing down grading for Section 2 (short answer) and Section 3 (extended response) items.
3. **Score math is binary** — finalization treats every question as 1 point all-or-nothing, so a partial grade has nowhere to live.

## Solution

### 1. Schema additions (migration)

Add three nullable columns to `test_responses`:

| Column | Type | Purpose |
|---|---|---|
| `points_awarded` | numeric | Points the teacher gave (e.g. 2) |
| `max_points` | numeric | Out of how many (e.g. 3); defaults to 1 |
| `teacher_comment` | text | Free-form note shown on the result/report |

Backfill rule: existing rows where `is_correct = true` → `points_awarded = 1, max_points = 1`; `false` → `0, 1`. Keep `is_correct` so existing logic keeps working — when a teacher saves a partial grade, set `is_correct = (points_awarded >= max_points)` and store the fraction in the new columns.

### 2. Manual Grading UI (`src/pages/ManualGrading.tsx`)

Replace the two-button row with a richer card per pending response:

- **Points input**: numeric input "Points awarded" + "out of" (default 1, teacher can set 2, 3, 5...). Quick-pick chips for 0 / half / full.
- **Comment box**: textarea "Comment to student (optional)".
- **AI Suggestion button**: "Suggest grade" → calls a new edge function `suggest-grade` that returns `{ suggestedPoints, maxPoints, rationale, suggestedComment }`. Teacher can click "Use suggestion" to fill the form, then edit before saving.
- **Save button**: posts `{ responseId, attemptId, pointsAwarded, maxPoints, teacherComment }` to the existing `grade-manual-response` function (extended).

The legacy single-click Mark Correct / Mark Incorrect remain as one-click shortcuts that pre-fill points = max / 0 and save immediately.

### 3. Edge function changes

**`grade-manual-response`** — accept the new fields. Compute `is_correct = pointsAwarded >= maxPoints`. Persist all four fields. Recompute attempt score using the sum of `points_awarded / max_points` across graded responses (so partial credit affects the percentage correctly). Tier thresholds unchanged (85 / 66).

**`suggest-grade`** (new) — admin/teacher-gated, calls Lovable AI (`google/gemini-2.5-flash`) with the question text, expected answer, skill tag, and student answer. Returns suggested points (out of a sensible max inferred from the question — short answer = 2, extended response = 3, otherwise 1), a one-line rationale, and a 1–2 sentence comment to the student. No new secret needed (uses `LOVABLE_API_KEY`). Add to `supabase/config.toml` with `verify_jwt = true`.

**`finalize-grading`** — switch the score calculation to `sum(points_awarded) / sum(max_points)` when the new columns are populated, falling back to the boolean count otherwise.

### 4. Surface comments in results

`Results.tsx` and the parent email/PDF currently show only correctness. Add a small "Teacher's note" line under any question whose `teacher_comment` is non-empty so the partial-credit reasoning reaches the parent. (Minimal touch: only the per-question render block.)

## Files Changed

| File | Change |
|---|---|
| migration | Add `points_awarded`, `max_points`, `teacher_comment` to `test_responses`; backfill |
| `src/pages/ManualGrading.tsx` | Points input, comment box, AI-suggest button, partial-credit flow |
| `supabase/functions/grade-manual-response/index.ts` | Accept partial points + comment; recompute score from points |
| `supabase/functions/suggest-grade/index.ts` | New — Lovable AI grade suggestion |
| `supabase/config.toml` | Register `suggest-grade` with `verify_jwt = true` |
| `supabase/functions/finalize-grading/index.ts` | Score = Σ points / Σ max when present |
| `src/pages/Results.tsx` (and PDF/email render) | Show `teacher_comment` per question when present |

No new secrets required. No breaking changes to existing graded attempts.
