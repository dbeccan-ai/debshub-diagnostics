# Staff-confirmed context in the standard general report

No confirmed enrolled-grade field exists in the current general profiles/attempts schema. Historical `test_attempts.grade_level` remains the diagnostic level. Do not repurpose it.

## Regeneration

After the updated functions are explicitly authorized for deployment, an authenticated admin opens the student's existing Results page, enters the current enrolled grade and selects **Confirm report context**. For the two identity-verified owner assessments only, the admin also selects the owner-confirmed starting-plan checkbox before confirming. Enter Grade 6 for that plan. The page sends `reportContext` with exact attempt ID, student ID, enrolled grade and the individual-plan flag to `generate-result-download`; the server validates admin authorization, identity, historical Grade 5 level and the allowed assessments. The standard template renders identification, Assessment context, then existing sections 1–7 and heat maps. Teacher copy receives the same request-scoped context and retains its staff appendix.

The existing Download PDF button regenerates this standard report with the confirmed context and returns HTML without uploading it or updating certificate/student records. Context is held only in the open page; no local storage, URL parameters or global student override. Reopening either assessment requires re-confirmation. A copied parent link does not contain confirmation and is not a persisted contextual report. The browser refuses a model response that silently omits confirmation. For now, the unreleased service cannot produce this context through the live app; the two actual standard report templates were rendered locally, privately, for validation. No emails or automatic certificate regeneration are triggered.

Other students can receive their own current-grade confirmation; the individual starting plan and schedule are restricted to the two verified owner assessments. Staff identity is server-derived rather than accepted as a client claim. The owner's confirmation in this conversation is recorded as a requirement, not a student-record write or a globally inferred enrollment grade.

Curriculum generation is unchanged: its existing authorized `confirmedEnrolledGrade` input must separately receive Grade 6. Its shared grade resolver anchors the prerequisite sequence once to Grade 6 (Grade 3 through Grade 6), never subtracting from both assessment and enrollment grades. Report context is not automatically transferred to curriculum generation; no new curriculum or retest records were generated.

Remaining release limitations: function deployment and frontend publication were not authorized; no persisted confirmation history/table was added; stored certificates and parent links do not acquire the request-only context. These require a separately authorized persistence/release workflow, not a silent record mutation.
## Concise official context

The standard official report and on-screen context show both confirmed Grade 6 enrollment and Grade 5 diagnostic starting level, followed only by: “The diagnostic began at Grade 5 to identify prerequisite skills needed for Grade 6 learning.” The instructional-purpose statement remains in program guidance, not the context section. The fuller rationale is reserved for the shared parent email summary when an authorized request-scoped context is supplied; existing automatic email flows do not acquire or persist that confirmation. No message has been sent and no standalone letter/report was created.
