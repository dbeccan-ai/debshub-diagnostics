# Roadmap — Reading Recovery 21-Day Program Upgrades (approved audit plan)

- [x] 1. Student identity + school scope: student_id/school_id on transcripts & enrollments, teacher school-scoped RLS, additive backfill (migration 0001)
- [x] 2. Real WCPM/timing: recording duration captured, WCPM + reading_duration_seconds + passage_form_version stored
- [x] 3. Pre/post tracking: version_c_completed_at set on Version C save, pairPrePost helper
- [x] 4. Cohort report + de-identified CSV export at /admin/reading-recovery-cohort
- [x] 5. Tablet/Chromebook mic reliability: MediaRecorder format fallback (webm→mp4/aac/ogg), correct file extension to transcribe-audio
- [x] 6. Roster for supervising students: cohort page roster with days done, A/B/C status, error/WCPM deltas (teachers see own school via RLS)
- [x] Validation: 10 new tests pass, typecheck, build
- [ ] Report to user: routes/schema/migration summary
