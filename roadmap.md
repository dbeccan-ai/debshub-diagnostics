# Roadmap — Reading Recovery 21-Day Program Upgrades (approved audit plan)

- [x] 1. Student identity + school scope: student_id/school_id on transcripts & enrollments, teacher school-scoped RLS, additive backfill (migration 0001)
- [x] 2. Real WCPM/timing: recording duration captured, WCPM + reading_duration_seconds + passage_form_version stored
- [x] 3. Pre/post tracking: version_c_completed_at set on Version C save, pairPrePost helper
- [x] 4. Cohort report + de-identified CSV export at /admin/reading-recovery-cohort
- [x] 5. Tablet/Chromebook mic reliability: MediaRecorder format fallback (webm→mp4/aac/ogg), correct file extension to transcribe-audio
- [x] 6. Roster for supervising students: cohort page roster with days done, A/B/C status, error/WCPM deltas (teachers see own school via RLS)
- [x] Validation: 10 new tests pass, typecheck, build
- [x] Report to user: routes/schema/migration summary

# Roadmap — General K-12 report consistency (ERMA review)
- [x] Read-only root-cause audit of the two Grade 5 attempts
- [x] Shared evidence/scoring contract + print-safe report
- [x] Grading, regrade (dry-run), certificate, download use shared contract
- [x] Tests + synthetic/real-preview PDF render checks
- [ ] Deploy backend functions + publish (awaiting owner review)
- [ ] Optional: apply Tejani skill-analysis repair (admin, after review)

# Roadmap — Parent guidance and future canonical tags
- [x] Separate parent guidance from internal staff provenance/sparse-item audit; preserve material notices and points
- [x] Audit actual 30-item Grade 5 Math bank versus different local 10-item bank; create reviewable source-preserving map
- [x] Add canonical item schema and approval-gated pure future-bank configuration, without applying bank changes
- [x] Targeted/regression tests and synthetic parent/teacher/certificate visual checks (244 passed; 7-page parent / 13-page staff; no blank pages)
- [ ] Owner approval and future-bank release (blocked: owner review; no production changes authorized)
