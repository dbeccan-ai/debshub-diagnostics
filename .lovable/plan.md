# Add a Pause Break Button to Tests

## Problem
Students (especially those with ADHD) need to take short breaks during a test. Today there is no learner-facing pause control — the only "pause" is the involuntary one that fires when the tab loses focus.

## Goal
Give every student a visible **Pause Break** button while taking a test. When pressed:
- The countdown timer stops.
- Answers and the question they're on are hidden behind a full-screen overlay (so they can step away without seeing the screen).
- A "Resume Test" button brings them back exactly where they left off.
- Auto-save (already in place) keeps the attempt safe if they close the tab during the break.

## Scope
- Apply to `TakeTest.tsx` (all standard diagnostics) and `TakeELATest.tsx` (ELA suite).
- Out of scope: Grade 4 / Grade 6 embedded iframe diagnostics, and Reading Recovery oral assessments (timer behavior there is different and recording is involved).

## UI
- A small "Pause Break" button next to the timer in the test header.
- When paused: full-screen overlay with a calming message ("Test paused — take your time"), a break duration counter (counts up), and a large "Resume Test" button.
- Optional soft cap: after 10 minutes paused, show "Ready to resume?" nudge (does not auto-resume).

## Technical Notes
- Add `isPaused` state in `TakeTest.tsx` / `TakeELATest.tsx`.
- Timer `useEffect` already decrements `timeRemaining` each second — guard it with `if (isPaused) return;`.
- New `<TestPauseOverlay />` component for the overlay (consistent across both pages).
- Reuse the existing autosave path so the pause survives a page reload (store `isPaused` in `progress_state` and `localStorage` too, so a refresh resumes paused).
- Tab-visibility logic stays as-is: if a student is on the pause screen and switches tabs, no penalty is added (because the test loop is already halted; we'll also short-circuit `useTabVisibility` while paused).

## Files to Change
- `src/pages/TakeTest.tsx` — add pause state, button, overlay, timer guard, persist in progress_state.
- `src/pages/TakeELATest.tsx` — same treatment.
- `src/components/TestPauseOverlay.tsx` — new overlay component.
- `src/hooks/use-tab-visibility.tsx` — accept an `enabled` toggle we can flip off during pause (already supports `enabled`; we'll pass `enabled && !isPaused`).

## Open Question
Should there be a **limit** on total pause time per attempt (e.g. 15 min cumulative) to discourage misuse, or unlimited? Default plan: unlimited, with a gentle 10-minute nudge.
