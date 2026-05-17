## Problem

Several ELA Reading Comprehension sections show questions that reference "the passage / story / article," but the passage itself is missing or is just a placeholder stub. Affected grades:

- **Grade 7** — no comprehension passage at all
- **Grade 8** — "Echoes of the River" is an ellipsis-only outline (~780 chars of "...")
- **Grade 9** — stub: `(Reading passage about Liana and investigative journalism)`
- **Grade 11** — stub: `(Passage about generational expectations and individual identity)`
- **Grade 12** — "The Cost of Knowing" is an ellipsis-only outline

`TakeELATest.tsx` correctly reads `section.passage` / `passage_title` and renders the passage above the questions — the bug is purely missing data in `src/data/ela-diagnostic-tests.json` (and the same rows backfilled into the `tests` DB table earlier).

## Fix

1. **Author full reading passages** (3-6 paragraphs each, grade-appropriate lexile/complexity) for:
   - Grade 7 — new passage matching the existing comprehension topics, or matching the existing essay theme so questions still align
   - Grade 8 — "Echoes of the River" (Layla, the polluted river, the factory) — expand the ellipsis outline into a full narrative consistent with all existing comprehension questions (symbolism of the river, Layla's character, theme)
   - Grade 9 — "The Weight of Silence" (Liana, Malik, investigative journalism) — write a full short story consistent with the 4 comprehension questions (Liana's disappearance, Malik's character arc, central theme, silence as a literary device)
   - Grade 11 — "The Burden of Legacy" (heirloom watch, generational expectations) — write a full passage consistent with the central-idea and symbolism questions
   - Grade 12 — "The Cost of Knowing" (Scopes trial → Brown v. Board → civil rights) — expand into a full informational/expository passage consistent with the existing 7 questions

2. **Update `src/data/ela-diagnostic-tests.json`** with the new passages (set `passage_title` + `passage` on the Reading Comprehension section for each affected grade).

3. **Re-backfill the `tests` table** in the database for Grade 7, 8, 9, 11, and 12 ELA Diagnostic Test rows so the edge-function path (`get-test-questions`) returns the updated sections. (The JSON file is the source of truth; the DB rows are a synced copy.)

4. **Verification**:
   - `node` check confirming every comprehension question's referenced entity (character names, "the article") appears in the corresponding passage
   - Spot-check `psql` query confirming each updated row's `questions` JSONB now contains the new passage text
   - Open one affected grade in the preview, start the test, confirm the passage card renders above the first comprehension question

## Files / data touched

- `src/data/ela-diagnostic-tests.json` (add/replace 5 passages)
- DB migration / update to `public.tests` for the 5 affected ELA rows

No UI/component changes — `TakeELATest.tsx` already handles passage rendering correctly.