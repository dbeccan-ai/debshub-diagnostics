# Roadmap

## TACHS Readiness Diagnostic — Pass 1
- [x] Schema + RLS: blueprints, question bank, attempts, sections, responses, events
- [x] Edge function `tachs-engine`: start/resume, next question, answer, submit section, grade, results
- [x] Sample content (all six sections, programmatic SVGs)
- [x] /tachs public landing page
- [x] Tests + Dashboard cards, confirm dialog (grade + parent email)
- [x] Attempt UI (timers, flag/review, breaks, calculator, aids)
- [x] Results page (bands, pacing, skill metrics, adaptive path, print)
- [x] Admin TEST MODE (watermark, short timers)
- [x] Routes registered, build clean

## Pass 2 — complete
- [x] Full 200-item original bank (50/50/50/20/15/15), seeded and live
- [x] Shared pure logic module (readiness bands, adaptive routing, disclaimer)
- [x] Email tracking columns + `tachs_attempt_events` audit table
- [x] `send-tachs-results` edge function (parent/guardian only (no staff copy), HTML-escaped, retry-safe)
- [x] Admin TACHS page `/admin/tachs`: filters, detail, answer audit, events, resend, reopen, print
- [x] Automated tests (`bun run test`): bank validation + bands/adaptive routing
- [x] Typecheck, build, and full end-to-end attempt verified

- [x] Pass 2 audit: parent-only email, normal-mode refuses under-stocked bank (503), /admin/tachs/:attemptId deep link, masked email status on results, balanced answer keys, FM duplicates fixed, `bun run test` runs bank validation + vitest, fingerprint-based idempotent reseed (200 active).

## TACHS sales & payment flow (done)
- [x] tachs_orders model + tachs_attempts.order_id/access_source, RLS, legacy/test-mode backfill
- [x] create-tachs-checkout / verify-tachs-payment edge functions ($175 + gross-up fee, metadata, idempotent verify)
- [x] tachs-engine server-side entitlement gating, admin grant + audit events
- [x] Homepage hero/tests/pricing/FAQ TACHS cards; /tests + dashboard payment-aware CTAs
- [x] /tachs/checkout, /tachs/payment-success, payment-aware /tachs/start
- [x] /admin/tachs payment column, order table, detail payment block, Grant TACHS access dialog
- [x] tests/tachs-entitlement.test.ts (14 tests); full suite 39 passing; typecheck clean
- [ ] Publish — awaiting owner verification (do not publish yet)

## TACHS Pilot v2 — full six-section rebuild (requested 2026-09-13)
- [x] Phase 1: finish math/paper-folding v2 test run, fix all failures
- [x] Ability sections → 5 choices (A–E): bank types, renderer/UI, keyboard nav, validation, results/review, tests
- [x] Reading v2 pool ≥75 (original passages, ≥10–12 vocab-in-context administered)
- [x] Written Expression v2 pool ≥75 (passage editing + standalone conventions)
- [x] Figure Matrices v2 pool ≥36 (rule-model generated, 5 choices)
- [x] Figure Classification v2 pool ≥30 (rule-spec generated, 5 choices)
- [x] Paper Folding v2 → 5 choices, revalidate
- [x] Representative TEST MODE (every major skill incl. vocabulary)
- [x] Admin “TACHS Content Audit” page linked from /admin/tachs
- [x] Scoring evidence: accuracy/items by difficulty, ceiling, skill min-sample warnings, vocab row, conventions breakdown, ability subskills
- [x] Validators/tests for all of the above; typecheck + production build
- [x] Old-vs-v2 audit table (Content Audit page, v1 vs v2 selector); NO seed/deploy/publish done
- [ ] Deploy tachs-engine + publish — blocked: awaiting owner preview review/approval
- [x] (16:29 request) Validate/wire Written v2; author Reading v2 directly; finish 5-choice Paper Folding, representative TEST MODE, admin Content Audit page, scoring UI, validators, tests, typecheck, build. Preview-only, v1 immutable.

## TACHS report-safety patch (preview-only, 2026-09-13)
- [x] Completion emails an acknowledgment only; report stays `draft` (`tachs-engine`, `send-tachs-results`)
- [x] Admin workflow draft -> reviewed -> approved -> sent (`admin_report_transition`); legacy resend gated behind approval
- [x] Parent/student API + email whitelisted via `_shared/tachs-report.ts` (no keys, rationales, stems, selected answers, adaptive path)
- [x] Admin internal report keeps item audit + rationales; V2-R/V2-W carry-over flagged (Mackenzie's record untouched)
- [x] SVG icon/placeholder tokens removed from parent report; accessible/printable tables; "Part-Whole" label
- [x] Tests: `tests/tachs-report-safety.test.ts` (90 total passing)
- [ ] BLOCKED on owner approval: deploy `tachs-engine` + `send-tachs-results`, then publish

## TACHS admin visibility (done, preview only)
- [x] Root cause fixed in engine code (FK-qualified profile embeds, errors surfaced) — NOT deployed
- [x] Admin page: error+retry state, All/Student/TEST MODE tabs, resettable filters, pinned Mckenzie link, direct DB fallback
- [x] Content Audit: v1 frozen vs v2 revised compare, carry-over notice
- [ ] Backend deploy of tachs-engine + send-tachs-results (awaiting owner approval)

## TACHS parent report architecture (preview-only, 2026-09-13 20:37)
- [x] A–F done: parent surface stripped, tier system, 6-section report, program config, parent_report_content (migration applied, additive/null), admin editor, tests 129 passing, build OK
- [ ] Owner decision: `tachs-engine` appears auto-deployed with an intermediate build; `send-tachs-results` deploy still pending owner approval

## TACHS pricing correction (20:52 follow-up, preview-only)
- [x] All items done (tests/tachs-pricing.test.ts); payment URLs remain null
## TACHS admin report tab separation and frontend publication (authorized 2026-09-13)
- [x] Separate parent-safe edit/preview and internal diagnostic audit tabs
- [x] Enforce safe print, approval, and explicit send confirmation UX
- [x] Add regression tests and complete browser/read-only data verification
- [x] Publish verified frontend; no backend deploy, email, event, or attempt mutation


- [x] TACHS At-Home Support Plan + admin-only curriculum — preview verified; backend deploy of tachs-engine, send-tachs-results, tachs-curriculum still pending owner authorization
