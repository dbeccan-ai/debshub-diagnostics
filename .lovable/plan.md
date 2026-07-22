## Problem

Clicking **Start** on any non-assessment day in the 21-Day Recovery Blueprint (dashboard) currently fires `toast.info("Activity content coming soon!")`. Only Days 1, 10, 21 (assessments) route somewhere real. So Phonics, Vocabulary, Fluency, Comprehension, Writing, Review days all dead-end.

## Fix

Create a real, printable/interactive **Activity Workbook** for each of the 18 non-assessment days, wire the Start button to open it, and let the parent/teacher run the lesson right in the browser.

### 1. New activity content module
Create `src/data/reading-recovery-activities.ts` — a keyed record `activities[day]` with, for each of days 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20:

- `title`, `category`, `objective`, `estimatedMinutes`
- `warmUp` — 2–3 quick verbal prompts
- `instructions` — step-by-step teacher/parent script
- `worksheet` — array of exercise blocks. Block types:
  - `word-list` (e.g. consonant/vowel sound tables, sight-word sets, word families)
  - `fill-blank` (sentences with missing words)
  - `matching` (word ↔ picture / word ↔ definition)
  - `short-passage` (mini reading + 3–5 comprehension Qs)
  - `writing-prompt` (lines for student response)
  - `checklist` (fluency/expression rubric for the observer)
- `answerKey` where applicable
- `extension` — 1 optional bonus challenge

Content will be grade-neutral but leveled by the student's grade band (1–2, 3–4, 5–6, 7–8) using a `variantsByBand` object where phonics/vocab differs. Reuse the existing grade-band logic from `reading-recovery-content.ts`.

Day-by-day coverage (examples):
- Day 2 Phonics Warm-up — consonant chart, short/long vowel sort, blend practice, 10 CVC decode words
- Day 3 Sight Words Set 1 — 20 Dolch/Fry words by band, flashcards, sentence fill-blanks
- Day 4 Guided Reading 1 — short passage + fluency checklist for observer
- Day 5 Predictions — passage stops with "What do you think happens next?" prompts
- Day 6 Blending & Segmenting — digraphs (sh/ch/th), CCVC words
- Day 7 Week 1 Review — mixed 15-item quiz + reflection journal
- Day 8 Sight Words Set 2
- Day 9 Repeated Reading Fluency — 3 timed reads with WPM tracker
- Day 11 Asking Questions — passage + student-generated Qs template
- Day 12 Word Families — -at, -ip, -ock etc., generation grid
- Day 13 Independent Reading — self-selected reading log + 5 Qs
- Day 14 Week 2 Review — celebration certificate + reflection
- Day 15 Vocabulary Games — matching, synonyms, context clues
- Day 16 Expression & Phrasing — punctuation drills, dialogue reading
- Day 17 Summarizing — main idea/details graphic organizer + passage
- Day 18 Guided Reading 3
- Day 19 Writing Connection — story response prompt + planning organizer
- Day 20 Final Practice — mixed review + Post-Test warm-up

### 2. New workbook page/component
Create `src/components/ReadingRecoveryActivityDialog.tsx` — a full-screen `Dialog` that renders the activity for a given `day`:

- Header: Day #, title, category badge, objective, timer
- Warm-Up card
- Instructions card
- Worksheet blocks rendered per block type with input fields (state-only, no persistence needed)
- Show/Hide **Answer Key** toggle
- **Print** button (`window.print()`) with print CSS so the worksheet prints cleanly
- **Mark Complete** button that closes the dialog

### 3. Wire the dashboard button
Edit `src/pages/ReadingRecoveryDashboard.tsx` (lines 487–503):
- Replace `toast.info("Activity content coming soon!")` with opening the new dialog for that `activity.day`.
- Also enable Start for non-current days (view/preview mode) so parents can peek ahead — keep the amber highlight only for the current day.
- Add state `const [openDay, setOpenDay] = useState<number | null>(null)` and render `<ReadingRecoveryActivityDialog day={openDay} onClose={() => setOpenDay(null)} />`.

### 4. Print styling
Add a small `@media print` block (in `src/index.css` or scoped in the dialog) so the workbook prints without the app chrome.

## Out of scope

- No backend/DB changes; completion tracking stays as-is (local state).
- No AI generation — content is authored deterministically so it's stable and free.
- Assessment days (1, 10, 21) keep routing to `/reading-recovery/diagnostic`.

## Files touched

- **new** `src/data/reading-recovery-activities.ts`
- **new** `src/components/ReadingRecoveryActivityDialog.tsx`
- **edit** `src/pages/ReadingRecoveryDashboard.tsx` (Start handler + dialog render)
- **edit** `src/index.css` (print styles)
