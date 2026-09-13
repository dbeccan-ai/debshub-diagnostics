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
- [x] `send-tachs-results` edge function (parent + admin BCC, HTML-escaped, retry-safe)
- [x] Admin TACHS page `/admin/tachs`: filters, detail, answer audit, events, resend, reopen, print
- [x] Automated tests (`bun run test`): bank validation + bands/adaptive routing
- [x] Typecheck, build, and full end-to-end attempt verified
