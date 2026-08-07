# Per-Grade Reading Diagnostics (K-12)

Replace the 4 grade bands (1-2, 3-4, 5-6, 7-8) with 13 individual grade levels (K through 12), each with its own on-grade-level passages and questions, so a Grade 2 student is measured against real Grade 2 text instead of a shared Grade 1-2 passage.

## What changes for you

- When starting a diagnostic, you pick an exact grade (Kindergarten, Grade 1, Grade 2, ... Grade 12) instead of a band.
- Each grade gets its own three passages: Pre-Test, Mid-Test, Post-Test — 39 passages total.
- Passage difficulty is anchored to **end-of-year, on-grade-level** rigor, so passing means the student truly handles grade content.
- Comprehension questions, accuracy thresholds, fluency (WCPM) targets, and tier cutoffs are set per grade rather than shared across two grades.
- Results, admin results table, and the 21-day plan all show and use the exact grade.
- The 4 assessments already completed are mapped to a best-guess grade (band 1-2 → Grade 2, 3-4 → Grade 4, 5-6 → Grade 6, 7-8 → Grade 8) so history stays readable.

## Content build

Each of the 13 grades gets 3 versions with:

- Passage text at grade-appropriate length and complexity (K: ~30-40 words decodable; Grade 2: ~120 words; Grade 5: ~250 words informational; Grade 9-12: ~400-600 words with literary/argumentative demand).
- 6-12 comprehension questions split literal / inferential / analytical, weighted toward analysis as grade rises.
- A decoding checklist and target word list matched to that grade's phonics or vocabulary demand.
- Per-grade scoring thresholds and error-count cutoffs.

Because this is 39 passage sets, content is authored in three waves within the same effort: K-2 first (highest need), then 3-6, then 7-12. The picker will only offer grades whose content is complete, and any not-yet-authored grade falls back to the nearest completed grade with a clear notice.

## Grade-tailored 21-day plan

- Worksheets and phonics targets key off the exact grade rather than the band.
- WCPM targets extend from Grade 1 through Grade 12 (currently capped at Grade 8).
- The dashboard grade selector offers K-12 and drives which plan variant renders.

## Technical notes

- `src/data/reading-recovery-content.ts`: change `Passage.gradeBand` to `grade: 'K' | 1..12`, rekey the `passages` record by grade, replace `gradeBands` export with a `gradeLevels` list, and update `getPassage(grade, version)`. Keep a `bandToGrade()` helper for legacy rows.
- `src/pages/ReadingRecoveryDiagnostic.tsx`: grade picker instead of band picker; replace the hardcoded `["1-2","3-4"]` elementary check and `gradeBand === "1-2"` gap thresholds with per-grade threshold values pulled from the passage's own `scoringThresholds`.
- Database: keep the existing `grade_band` column (no migration needed) but write the exact grade value into it, and add a `grade_level` integer column on `reading_diagnostic_transcripts` for clean filtering. Backfill the 4 existing rows to their mapped grade.
- `src/pages/ReadingRecoveryResults.tsx`, `src/pages/AdminReadingRecoveryResults.tsx`, `src/pages/ReadingRecoveryDashboard.tsx`: display "Grade N" instead of "Grade Band", filter by grade, and resolve the plan grade from `grade_level` first.
- `src/lib/readerProfile.ts` and `src/data/reading-recovery-activities.ts`: extend `WCPM_TARGETS` to grades 1-12 (K uses letter/sound accuracy rather than WCPM) and widen `tuneForGrade` clamping from 1-8 to 1-12.
