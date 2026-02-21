

## Fix: ELA Priority Skills Not Showing + Wrong Tier in Curriculum

### Issues Found

**Issue 1: Tier thresholds inconsistent in TakeELATest.tsx**
Line 176 uses `overallPercent >= 70 ? "Tier 2"` instead of the standardized 66% threshold. Line 144 also uses 70% for section-level "Developing" status. A score of 61.54% should be Tier 3 but the client-side code calculates Tier 2 because it uses 70% as the cutoff.

**Issue 2: Curriculum page displays stale tier from database**
The `generate-curriculum` edge function reads `attempt.tier` from the database (which was set when the test was originally graded with the wrong thresholds). It needs to recalculate tier from the score using the correct thresholds (85/66/65).

**Issue 3: Grade 4 ELA questions use `text` field instead of `question`**
The database questions have `{ text: "What does...", skill: "vocabulary" }` but the `normalizeQuestion` function in grade-test only checks `q.question || q.question_text`, missing the `text` field entirely. This causes the question text to be empty, reducing the effectiveness of pattern-based skill inference.

**Issue 4: ELA skill data missing from previously graded attempts**
The Grade 4 ELA attempt in the database has `"General Math"` as its only skill because it was graded before the ELA mapping fixes were deployed. The grade-test function needs redeployment, and the curriculum function should recalculate tier from score rather than trusting the stored tier.

---

### Fix 1: `src/pages/TakeELATest.tsx` -- Correct tier thresholds

- Line 176: Change `overallPercent >= 70` to `overallPercent >= 66` for Tier 2 threshold
- Line 144: Change `percent >= 70 ? "Developing"` to `percent >= 66 ? "Developing"` for section status
- Line 152: Change `skillPct < 70` to `skillPct < 66` for support skill classification

### Fix 2: `supabase/functions/generate-curriculum/index.ts` -- Recalculate tier from score

Instead of trusting `attempt.tier` from the database, recalculate the tier:
```
const score = attempt.score || 0;
const correctedTier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';
```
Use `correctedTier` in the response instead of `attempt.tier`.

### Fix 3: `supabase/functions/grade-test/index.ts` -- Handle `text` field

In the `normalizeQuestion` function (line 541), add `q.text` as a fallback:
```
question: q.question || q.question_text || q.text || '',
```

### Fix 4: Redeploy edge functions

Redeploy both `grade-test` and `generate-curriculum` so the fixes take effect. Previously graded ELA tests will need to be retaken to get correct skill breakdowns, but the curriculum function will at least show the correct tier going forward.

---

### Technical Details

**File 1: `src/pages/TakeELATest.tsx`**
- Line 144: `percent >= 70` to `percent >= 66`
- Line 152: `skillPct < 70` to `skillPct < 66`
- Line 176: `overallPercent >= 70` to `overallPercent >= 66`

**File 2: `supabase/functions/generate-curriculum/index.ts`**
- After line 168 (where `attempt.tier` is used), recalculate: `const correctedTier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';`
- Line 263: Replace `tier: attempt.tier` with `tier: correctedTier`
- Also pass `correctedTier` in the user prompt instead of `attempt.tier`

**File 3: `supabase/functions/grade-test/index.ts`**
- Line 541: Add `q.text` fallback for question text normalization

**Redeploy**: `grade-test` and `generate-curriculum` edge functions

