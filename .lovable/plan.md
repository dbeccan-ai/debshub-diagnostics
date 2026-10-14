# Mckenzie Gray TACHS retest (Sat Oct 17, 2026): read-only audit findings

Nothing was changed, no emails were sent and no records were written. Published URL confirmed: https://debshub-diagnostics.lovable.app

## Her records today
- One student profile, "Mckenzie Gray". There is no "McKenzie" or "Mackenzie" duplicate.
- One real attempt: completed Sep 13, 2026. Pilot v2 bank, paid through Stripe ($180.54), all 200 answers saved. Parent report was sent Sep 15.
- Her only order is already used by that attempt. She has no unused access and nothing in progress.

## Admin workflow and routes
- Admin TACHS console: `/admin/tachs`. The student detail page is `/admin/tachs/:attemptId`. Content audit: `/admin/tachs/content-audit`.
- Student flow: sign in, go to `/tachs/start`, then `/tachs/attempt/:id`. Results appear at `/tachs/results/:id` only after you approve the report.

## Does a retest need another payment?
- Yes, unless you grant access. Each paid order unlocks exactly one attempt, and hers is used.
- No charge: on `/admin/tachs`, use "Grant access" (search for her, give a reason such as "Retest Oct 17"). This creates a $0 grant that her next start uses up.
- Or she can pay again at `/tachs/checkout`.

## Assigning a new attempt without resetting the old one
- After the grant, she signs in on Saturday and clicks "Start diagnostic". This creates a brand-new attempt. The Sep 13 attempt, its answers, results, report and payment are untouched.
- Do NOT use "Reopen". That reopens a section of the old attempt.
- Do not tick the admin "TEST MODE" box. Also, an admin starting from her account isn't possible: attempts belong to whoever is signed in.

## Can she avoid questions she already saw?
No, not with the current setup:
- The engine only avoids repeats within the same attempt. It does not look at earlier attempts.
- The "revised bank" (Pilot v2) is the same bank she took on Sep 13. Pilot v1 is inactive, so there is no newer bank.

| Section | Items given | Questions in bank | She already saw | New ones left |
|---|---|---|---|---|
| Reading | 50 | 50 | 50 | 0 |
| Written Expression | 50 | 50 | 50 | 0 |
| Mathematics | 50 | 80 | 50 | 30 |
| Figure Matrices | 20 | 38 | 20 | 18 |
| Paper Folding | 15 | 32 | 15 | 17 |
| Figure Classification | 15 | 32 | 15 | 17 |

- Reading and Written Expression would repeat every question and passage she saw, in a possibly different order.
- In the other four sections, adaptive selection will very likely repeat many questions too.

## Exact duration and item counts
- 200 items across six sections, in this order: Reading 50 (30 min), Written Expression 50 (25), Mathematics 50 (40, calculator), Figure Matrices 20 (12), Paper Folding 15 (12), Figure Classification 15 (11).
- That is 130 minutes of testing plus breaks after Math (5 min), Figure Matrices (1) and Paper Folding (1): about 137 minutes in total.
- Timers run on the server and keep running if she disconnects. She can resume.

## Parent email, approval and privacy
- On start, she confirms the parent email. If it has changed, it overwrites the address on her profile.
- When she finishes, only an acknowledgment email goes out automatically. It contains no scores.
- The report stays a draft until an admin reviews and approves it. Only then can the parent report be released or sent, and results are hidden from her until then.
- Parent content blocks answer keys and internal fields. Other schools can't see her records.

## Limits when comparing with the baseline
1. Same bank and same version, so the scores line up technically. But repeated items (all of Reading and Written Expression) measure memory and practice, not just growth. Treat any gain as inflated.
2. There is no built-in side-by-side comparison of her two attempts. You would compare the two admin detail pages yourself.
3. Adaptive routing means each section can come out at a different difficulty, so raw percent correct isn't a perfect match. The difficulty-level breakdown helps.
4. The pilot bank is not calibrated against real TACHS norms. Any score is readiness evidence, not a predicted TACHS score.
5. The parent report from the earlier (eight-week program) baseline is not linked to the new attempt automatically.

## Options (need your decision; nothing will be built unless approved)
- A. Use it as is: grant access, and she retakes on Saturday with known repeats. You note the limits in the report.
- B. Build an exclusion so a retest avoids items she has already answered. This only helps Math and the three figure sections. Reading and Written Expression would need new passages and items first, plus a new bank version (v3), which needs owner content review before Saturday.
- C. Shorter retest: only the four sections with fresh items. This is not a full six-section attempt and would need its own setup.

### Technical notes
- Admin bypass is checked on the server through the roles table.
- Each attempt is locked to its own bank version, so in-progress and completed attempts keep identical content and scoring.
- A grant is refused if she already has unused access, and it closes any pending Stripe order so she isn't charged twice.
