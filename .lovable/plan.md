

## Fix: ELA Results Still Showing Math Skills ("Rounding", "General Math")

### Root Cause

The database stores stale skill data from when the test was graded before ELA skill mapping was deployed. Three functions read this stale data without filtering or recalculating:

1. **`regrade-test`** -- Has wrong thresholds AND missing `q.text` fallback, so regrading doesn't fix the skills
2. **`generate-result-download`** -- Certificate reads `attempt.tier` and `skillAnalysis` directly from database (stale "General Math")
3. **`TierComponents.tsx`** -- The `isSubjectMatch` filter misses "Rounding" because it doesn't contain any `mathKeywords`

---

### Fix 1: `supabase/functions/regrade-test/index.ts` -- Fix thresholds and question normalization

**Problem**: Three bugs prevent regrading from producing correct ELA skills:
- Line 194: `normalizeQuestion` uses `q.question || q.question_text || ''` -- missing `q.text` fallback (Grade 4+ ELA uses `text` field)
- Line 356: Uses `>= 70` for mastered instead of `>= 85`, and `< 50` for needsSupport instead of `< 66`
- Line 373: Uses `score >= 80` for Tier 1 and `>= 50` for Tier 2 instead of the standardized 85/66 thresholds

**Changes**:
- Line 194: Add `q.text` fallback: `q.question || q.question_text || q.text || ''`
- Line 356: Change `>= 70` to `>= 85` for mastered
- Line 358: Change `< 50` to `< 66` for needsSupport  
- Line 373: Change `score >= 80` to `score >= 85` and `score >= 50` to `score >= 66`

### Fix 2: `supabase/functions/generate-result-download/index.ts` -- Recalculate tier and filter skills for ELA

**Problem**: The certificate (line 549) displays `attempt.tier` directly from database (could be stale "Tier 2" for a score that should be Tier 3). Skills shown include "General Math" for ELA tests.

**Changes**:
- Recalculate tier from score: `const correctedTier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3'`
- Use `correctedTier` instead of `attempt.tier` throughout the HTML template
- For ELA tests: filter out math-labeled skills ("General Math", "Rounding", etc.) from the mastered/needsSupport/developing arrays before rendering
- Add math keyword detection: any skill containing "math", "rounding", "multiplication", "division", "fraction", "decimal", "geometry", "algebra" should be excluded from ELA certificates

### Fix 3: `src/components/TierComponents.tsx` -- Expand math keyword filter

**Problem**: The `isSubjectMatch` filter (line 172-186) doesn't catch "Rounding" because it's not in the `mathKeywords` list.

**Changes**:
- Add specific math skill names to the filter: "rounding", "multiplication", "division", "fraction", "decimal", "place value", "perimeter", "area", "volume", "angle", "measurement", "pattern", "graph", "time", "money", "word problem", "general math"
- This ensures any stale math skills that slip through from old database records are excluded from ELA reports

### Fix 4: Redeploy edge functions

Redeploy `regrade-test` and `generate-result-download` so the fixes take effect.

---

### Technical Details

**File 1: `supabase/functions/regrade-test/index.ts`**
- Line 194: `question: q.question || q.question_text || q.text || ''`
- Line 356: `stats.percentage >= 85` (was `>= 70`)
- Line 358: `stats.percentage < 66` (was `< 50`)
- Line 373: `score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3'` (was `80/50`)

**File 2: `supabase/functions/generate-result-download/index.ts`**
- After line 126, add: `const correctedTier = (attempt.score || 0) >= 85 ? 'Tier 1' : (attempt.score || 0) >= 66 ? 'Tier 2' : 'Tier 3';`
- Detect ELA: `const isELA = attempt.tests?.test_type?.includes('ela') || attempt.tests?.name?.toLowerCase().includes('ela');`
- If ELA, filter math skills from `skillAnalysis.mastered`, `needsSupport`, `developing`, and `skillStats`
- Replace all `attempt.tier` references with `correctedTier` in the HTML template

**File 3: `src/components/TierComponents.tsx`**
- Line 172: Expand `mathKeywords` to include: "rounding", "multiplication", "division", "fraction", "decimal", "place value", "perimeter", "area", "volume", "angle", "measurement", "pattern", "word problem", "general math"

**Redeploy**: `regrade-test` and `generate-result-download` edge functions

### After Deployment

The student should click "Refresh Skill Analysis" on the results page to regrade with the corrected ELA mapping. The certificate will then show proper ELA skills (Reading Comprehension, Vocabulary, Grammar, Spelling) instead of "General Math" and "Rounding".
