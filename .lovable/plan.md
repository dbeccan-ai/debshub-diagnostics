

# Add Grade-Level Selection to Demo Sandbox + Fix Demo Mode

## The Problem

Right now the demo page hardcodes "Grade 4 Math" and "Grade 1 ELA" sample tests. More critically, the `?demo=true` parameter is **not actually handled** by any test page — so navigating to these links either hits auth walls or goes to pages that don't exist for most grades.

For a principal demoing Grade 10, they need to select that grade, take a real sample of the Algebra 1 content, see scored results with tier placement, and view the homework/curriculum output — all without logging in.

## What We'll Build

### 1. Grade-Level Selectors on the Demo Page

In `src/pages/SchoolDemo.tsx`, replace the two hardcoded Math/ELA cards with cards that each include a grade dropdown (Grades 1-12). The principal selects a grade, then clicks "Take Sample Test."

### 2. A Dedicated Demo Test Page (`/demo/test`)

Create a new `src/pages/DemoTest.tsx` that:
- Reads grade and subject from query params (`/demo/test?subject=math&grade=10`)
- Pulls 5 questions from the existing JSON data files (`diagnostic-tests.json` for Math, `ela-diagnostic-tests.json` for ELA) for the selected grade
- Renders a lightweight test UI (no auth, no timer, no security checks, no database writes)
- On submit, auto-grades multiple-choice answers, calculates score/tier, and shows inline results with:
  - Score and tier badge (green/yellow/red)
  - Skill breakdown by topic
  - Sample homework recommendations
  - "Back to Demo" button

This keeps the demo self-contained — no database, no auth, no edge functions — while showcasing the real question content and tier placement system.

### 3. Inline Demo Results

After submission, the demo test page renders results directly (not navigating to `/results/:id`), showing:
- Overall score percentage and tier placement
- Per-skill breakdown (which topics were correct/incorrect)
- A sample "Recommended Next Steps" panel matching the tier
- A sample curriculum/homework preview relevant to the grade and subject

### 4. Route Addition

Add `/demo/test` route in `App.tsx` pointing to `DemoTest.tsx`.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SchoolDemo.tsx` | Add grade `Select` dropdowns to Math and ELA cards; update links to `/demo/test?subject=math&grade={X}` |
| `src/pages/DemoTest.tsx` | **New** — self-contained 5-question demo test with inline grading and results |
| `src/App.tsx` | Add `/demo/test` route |

No database changes needed. All data comes from existing JSON files.

