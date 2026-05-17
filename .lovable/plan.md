## Goal
Stop students losing progress when a popup/tab-switch terminates a test. Let them resume the same attempt at the same question with the same answers and remaining time.

## Approach (two layers)

**Layer 1 — Soft warning before termination**
Instead of disabling the test on the very first tab switch, show a yellow warning the first time ("Stay on this tab — next switch will pause your test"). Only on the 2nd switch do we pause/terminate. This alone eliminates most accidental terminations from popups, notifications, autocomplete dropdowns, etc.

**Layer 2 — Resume the same attempt**
Continuously auto-save the in-progress state (answers, current question index, time remaining, adaptive questions added) so a student can return to the exact same spot.

- Auto-save runs every time an answer changes or the question index changes, and once per 5s for the timer.
- Saved to two places:
  - `localStorage` (instant, works even if offline) keyed by `attemptId`
  - `test_attempts` table (durable, survives device change) in a new `progress_state` JSONB column
- When `TakeTest.tsx` / `TakeELATest.tsx` loads an attempt that is still `in_progress` and has saved state, it restores answers/index/time automatically and shows a small "Resumed from where you left off" toast.
- The `TestSecurityWarning` dialog gets a new **"Resume Test"** button (in addition to "Return to Dashboard"). Clicking Resume clears `isTestDisabled` via `resetState()` and the student continues — their answers were never lost.
- Going back to the Dashboard and clicking the test again opens the same attempt (no new attempt is created) and resumes.

## Files to change

- `src/hooks/use-tab-visibility.tsx` — add a `warningCount` step; only set `isTestDisabled = true` on the 2nd switch. Expose `resetState` (already there) so Resume works.
- `src/components/TestSecurityWarning.tsx` — add an optional "Resume Test" action; relabel copy to "Test Paused" instead of "Terminated".
- `src/pages/TakeTest.tsx` — add `saveProgress()` + `restoreProgress()`; wire Resume button; don't auto-submit on pause.
- `src/pages/TakeELATest.tsx` — same save/restore wiring (currently has no security warning; add the same protection + resume).
- `src/pages/Dashboard.tsx` — when a student clicks a test that has an existing `in_progress` attempt, route to that attempt instead of creating a new one (verify current behavior; may already do this).
- Database migration — add `progress_state JSONB` column to `public.test_attempts` (nullable). RLS already restricts to the owning student.

## Edge cases

- Timer: when paused, the countdown stops. On resume, it continues from the saved remaining time (not wall-clock based, so a student isn't penalized for the pause).
- Submitted attempts: progress_state is cleared on submit so it can't be replayed.
- Multiple devices: DB copy wins over localStorage if both exist (compare `updated_at`).
- Grade 4/6 iframe diagnostics: out of scope — those run inside a static HTML file and don't use this flow.

## What the student sees

1. Accidentally clicks a popup → yellow banner: "Please stay on the test tab. One more switch will pause your test."
2. If it happens again → dialog: "Test Paused" with two buttons: **Resume Test** and **Return to Dashboard**.
3. Either choice keeps every answer, the current question, and the remaining time intact.

## Open question
Should we keep termination strict for any test (e.g., to discourage cheating on higher grades) and only enable resume for Grades 1–6? Default plan above applies resume to all grades.