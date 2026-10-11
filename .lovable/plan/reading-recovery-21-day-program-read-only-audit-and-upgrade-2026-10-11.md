# Reading Recovery 21-Day Program — Read-Only Audit and Upgrade Plan

Commit audited: `3488437cae22ba132fa059529dccbbcf581de45b`. Repo: a private Lovable-hosted git remote. Its address contains a login token, so it is not reproduced here. Use GitHub sync if you need a shareable URL.
Nothing was changed. All database reads were aggregate SELECTs only, and no names, audio or emails were viewed.

## 1. Evidence base

- Routes (`src/App.tsx`): `/reading-recovery`, `/reading-recovery/auth`, `/reading-recovery/dashboard`, `/reading-recovery/diagnostic`, `/reading-recovery/results/:transcriptId`, `/admin/reading-recovery-results`.
- Content: `src/data/reading-recovery-roadmap.ts` (21 days), `reading-recovery-activities.ts` (worksheets, 1,490 lines), `reading-recovery-grade-builder.ts`, `reading-recovery-grades-lower.ts` / `-upper.ts` (K–12 passages, versions A/B/C), `reading-recovery-content.ts` (legacy band passages), `src/lib/readerProfile.ts`.
- Capture and scoring: `OralReadingAutoAssist.tsx`, `OralQuestionAssist.tsx`, `PhonicsChip.tsx`, plus the backend functions `transcribe-audio`, `evaluate-oral-answer`, `phonics-check` and `phonics-speak`.
- Tables: `reading_diagnostic_transcripts`, `reading_recovery_enrollments`, `reading_recovery_progress`, `phonics_attempts`, and the `diagnostic-audio` storage bucket.

## 2. Implemented / partial / missing matrix

| Area | Status | Evidence and gap |
|---|---|---|
| 21 daily lessons | Implemented (content) | One 21-day roadmap. Days 1/10/21 are assessments and 18 are worksheet days. A single sequence is tuned per grade (`tuneForGrade`). There is no branching by diagnosed skill. |
| Progression by grade/skill | Partial | Passages, word-count error bands and decoding checklists are per grade (K–12). Daily lessons change difficulty by grade but not by which skill the student is weak in. |
| Baseline placement | Partial | Version A at the exact grade gives a tier and a reader profile. There is no below-grade search, so the student's real instructional level is not found. |
| Audio capture | Implemented | Browser recording (`MediaRecorder`, `audio/webm`). The audio bucket holds 0 files, so no audio is kept for later checking. |
| Speech recognition | Implemented (AI) | `transcribe-audio` uses Gemini. `phonics-check` uses gpt-4o-transcribe with fuzzy matching. Children's speech and accents may be misheard, and this has not been checked for accuracy. |
| Accuracy / error scoring | Partial | Errors are detected automatically, then confirmed by a person (`detected_errors` and `confirmed_errors`), and `final_error_count` is saved. Bands are 97% / 90% accuracy. |
| WCPM / timing | Partial | WCPM targets exist, but the code only saves total session time (`assessment_duration_seconds`). It does not save reading time per passage, so WCPM is not actually measured. Word timings are stored in 0 of 8 records. |
| Human review | Partial | The adult giving the test confirms errors. Oral comprehension can be scored with AI help. There is no second-person check and no record of who reviewed what. |
| Comprehension items and scoring | Implemented (small) | Literal, inferential and analytical questions for each passage, with a gap cutoff of about 60%. The question set has not been calibrated. |
| Weekly activities | Implemented (content) | Organized into weekly groups in the plan view. There is no weekly mastery check. |
| Saves / identity / reload | Partial, with a risk | Progress is saved in the database under the user's own records. Transcripts are saved under the **logged-in adult**, with the student's name as free text. That means no stable student ID, and the same name could match different children or be duplicated. It works across devices only for whoever logs in. Lessons are not saved partway through. |
| Day 21 reassessment / alternate forms | Partial | Separate A/B/C passages exist per grade. Whether they are equally hard has not been checked, and passages have no version numbers. `version_b_completed_at` is never filled in (0 of 10), and nothing records Version C completion. |
| Parent / instructor / cohort reports | Partial | Per-student results page, a function that emails parent results, a printable plan, and grade-separated charts. There is **no cohort/class report and no CSV export**. |
| Languages | Partial | The interface can be switched to EN, ES, FR or ZH. Passages, questions and scoring are English only. The AI notes the reader's accent but does not assess in their home language. It is not a native-language assessment. |
| Tablet / Chromebook / microphone | Partial | Standard microphone permission request. Recording is forced to `audio/webm`, which fails on iPad/Safari. There is no microphone test and no fallback if the device lacks a supported format. |
| Multi-site cohort permissions | Missing | The Reading Recovery tables have no `school_id`. Access rules cover only the owner and admins, so teachers cannot see their own school's transcripts or enrollments. School isolation exists only for `phonics_attempts`. |
| Supervising 20 students | Missing | No class roster, live dashboard or batch assignment for Reading Recovery. |
| Preserved systems | Confirmed | Nothing here touches TACHS, tier thresholds (85/66/65) or the `follow_up_assessments` retests at 5/10/15 weeks. |

## 3. Real-record evidence (aggregate, read-only)

- Enrollments: 10, all active. Version A completed: 6. Version B completed: 0.
- Diagnostic transcripts: 8, all Version A. 7 completed and 1 incomplete. Grades recorded: 1–2 (5), 3–4 (1), 1 (1), 7–8 (1).
  - These were saved under 6 adult logins with 8 different student names.
  - All 8 have a final error count; 5 have human-confirmed errors; 4 have transcripts; 0 have word timings.
- Matched pre/post pairs (Version A with C, same student and grade): **0**. Pre/mid pairs (Version A with B): **0**.
- Daily practice: 3 days marked complete across 2 enrollments (one with 1 day, one with 2). The highest day reached was Day 3.
- Phonics attempts: 325 attempts by 2 users, 102 marked correct (31%).
- Conclusion: there are **no paired outcome results** for the program. The records only show that people started it: baseline tests were taken and a few days were practiced. They say nothing about whether it works. All tests in `tests/` are synthetic and none cover Reading Recovery.

## 4. Minimal priority upgrades (proposed, not started)

1. **Student identity and school scope** (about 2–3 days)
   - Add `student_id` (linking to the student's profile) and `school_id` to transcripts and enrollments, keeping the free-text name for older records.
   - Add teacher access scoped to their school, plus a careful, additive backfill.
   - Tests: access checks for each role and school.
2. **Real WCPM and timing** (about 1–2 days)
   - Save the reading start and stop time for each passage, store WCPM and accuracy, and keep word timings.
   - Tests: unit tests for the calculations.
3. **Pre/post tracking and alternate-form versions** (about 2 days)
   - Add a passage form version, set the Version B and C completion dates, and add a function that pairs a student's Version A and C.
   - Tests: synthetic pairing tests.
4. **Cohort report and CSV export** (about 2–3 days)
   - A class or school table showing enrollment, number of days completed (dosage), A/B/C status and the change from pre to post, with names removed in exports.
5. **Tablet/Chromebook microphone reliability** (about 1 day)
   - Detect which recording formats the device supports (fall back to mp4 on Safari) and add a microphone check before starting.
   - Tests: Playwright tests with a simulated microphone.
6. **Roster for supervising 20 students** (about 3–4 days)
   - Assign Reading Recovery to a class and give the teacher a live progress view.
7. **Later work (larger):**
   - Equating the alternate forms.
   - Checking how accurate the speech recognition is on child recordings.
   - Native-language passages, if they are required.
   - Branching daily lessons by skill.

Total for items 1–6: about 11–15 days of work. Every step adds to what exists, keeps all existing records, uses synthetic data for testing, and involves no publishing, emails or student enrollments without separate approval.
