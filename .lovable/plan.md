# Separate and publish TACHS admin report views

## What will change
- Make **Parent Report — Edit & Preview** the default attempt-detail tab, containing only the editor, exact family-safe preview, delivery status, approval/send controls, and safe print/preview actions.
- Move every diagnostic, payment, timing, answer-key, note, activity, email-history, and reopen control into **Internal Diagnostic Audit — Never Sent**, with an explicit admin-only warning.
- Add separate print boundaries so **Print Parent Report** prints only the family-safe preview; any internal print action remains inside the audit tab and is clearly labeled.
- Keep approval and sending separate: approval confirms no email was sent and stays on the parent tab; sending requires a second confirmation naming Kecha’s saved email and listing the safe report sections.

## Safety and verification
- Do not change the database schema, backend functions, report status, saved report content, attempts, or email records.
- Add regression tests for tab separation, internal-content exclusion, approval/send confirmation text, print boundaries, and the unchanged email-safety contract.
- Run the TACHS validators, full tests, typecheck, and production build.
- Browser-check both tabs against Mckenzie’s existing record using read-only navigation, then confirm her report remains draft and no email/event was added.
- Publish only the verified frontend and report the deployment identifier.

## Technical details
- Refactor the attempt-detail dialog in `AdminTachs.tsx` around the existing tab component and print-only wrappers.
- Preserve the current server-side parent-report builder; change it only if tests reveal a leak.
- Update the project roadmap to mark this authorized frontend publication milestone complete.
