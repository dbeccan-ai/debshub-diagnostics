## 1. Reader profile on the diagnostic results

Add a "Reader Profile" card to the Reading Recovery results page (and the emailed/downloaded report), derived from data already captured in each diagnostic: omissions, substitutions, insertions, total error count, assessment duration, and the literal/inferential/analytical comprehension breakdown.

Profiles (primary + secondary shown):
- **Rusher** — fast read time relative to passage length, high omissions/insertions, comprehension weaker than fluency.
- **Word-by-Word Decoder** — slow read time, low error count, fluency drags comprehension.
- **Guesser / Visual Substituter** — substitutions dominate (word looks similar to target).
- **Skipper** — omissions dominate; whole words or lines dropped.
- **Word Caller** — accurate reading, weak comprehension (especially inferential/analytical).
- **Meaning-Maker** — errors present but comprehension strong; self-corrects meaning.
- **On-Track Reader** — few errors, strong comprehension.

Each profile card shows: primary label, secondary tendency, plain-English "why this profile" evidence (e.g. "read 247 words in 1:38 with 11 omissions"), and 3–4 targeted teaching strategies. Same block is included in the downloadable/emailed report HTML.

## 2. Correct grade band + grade-level tailoring for the 21-Day plan

The plan currently picks its band from `reading_recovery_enrollments.grade_level`, which is empty for most students (and set to 2 for this student) — so it defaults to the 1-2 band regardless of what grade was actually assessed.

Fix:
- Resolve the student's grade in this order: enrollment grade → grade implied by the most recent diagnostic's grade band → default. Write the resolved grade back to the enrollment so it stays correct.
- Add an editable **Grade** control on the Reading Recovery dashboard (and admin results view) so staff can correct it any time; the roadmap and workbook re-render immediately.
- Show the active band and grade on the dashboard header and in each activity dialog ("Grade 3 · Band 3-4") so a mismatch is visible at a glance.
- **Grade-specific tuning inside the band**: keep the band's worksheet structure, but tune content by exact grade — word lists trimmed/extended (fewer, higher-frequency words for the lower grade in a band; multisyllabic and morphology words for the upper grade), passage excerpt length, number of comprehension questions, writing-prompt line count, and fluency WCPM targets per grade (e.g. Grade 3 ≈ 90 WCPM, Grade 4 ≈ 110). Applied as a deterministic tuning layer over the existing band content, so no worksheet has to be rewritten.

## 3. Print-ready worksheets

The activity dialog currently calls `window.print()` on the whole app, so the dialog's scroll container, page chrome and fixed layout clip the content (as in the screenshots).

Fix:
- Add a dedicated print stylesheet scoped to the workbook: hide everything except the worksheet area, unset dialog max-height/overflow/transform, force full page width, black-on-white text, and page-break rules so word lists, passages and writing areas don't split across pages.
- Add a print header on each page: student name, grade, day number, activity title, date, and a name/date line for handwritten work.
- Print form fields as ruled answer lines/boxes rather than empty input outlines, and hide interactive-only controls (audio/mic chips, buttons) while keeping the printed word visible.
- Add a **Print with Answer Key** vs **Print Student Copy** choice.

## Technical notes

- New `src/lib/readerProfile.ts` computing profile from `reading_diagnostic_transcripts` fields (`detected_errors`, `final_error_count`, `assessment_duration_seconds`, `confirmed_errors.comprehensionSummary`) plus the passage word count from `reading-recovery-content`.
- `ReadingRecoveryResults.tsx`: render the profile card and inject it into `generateResultHTML`; `AdminReadingRecoveryResults.tsx` shows the profile label in the list.
- `reading-recovery-activities.ts`: add a `tuneForGrade(blocks, grade, band)` layer and per-grade fluency targets; `pickBand` unchanged.
- `ReadingRecoveryDashboard.tsx`: grade resolution + editable grade (updates `reading_recovery_enrollments.grade_level`), passes exact grade to the dialog.
- `ReadingRecoveryActivityDialog.tsx`: print-only render path + `@media print` rules in `index.css` scoped to `#rr-print-area`.
- No schema changes required.
