

## Fix: Show Granular ELA Skills + Sync Mapping Logic

### Problem

Two issues are causing incorrect ELA results:

1. **The `regrade-test` function collapses all skills into 4 broad categories** ("Vocabulary", "Grammar", "Spelling", "Reading Comprehension") instead of preserving granular skill names like "Compound Words", "Figurative Language", "Parts of Speech", etc.

2. **The `regrade-test` version of `mapToElaCoreSkill` is outdated** compared to `grade-test` -- it maps "figurative" to Reading Comprehension instead of Vocabulary, and is missing keywords like "compound word", "homophone", "word pattern", "parts of speech", "contraction".

The database questions for Grade 4 ELA have these `skill` tags: `vocabulary`, `grammar`, `reading_comprehension`, `writing`, `word_structure`, `spelling`, `figurative_language`. These are being collapsed into broad labels, losing the granularity the user needs.

### Solution

Instead of mapping every skill to a broad category for the skill analysis stats, **preserve the granular skill name** (e.g., "Figurative Language", "Word Structure", "Parts of Speech") in the skill stats. The section-level grouping (Vocabulary, Grammar, etc.) already happens in the UI via `ELASectionReport.tsx`'s `mapSkillToSection` -- so the edge functions should NOT flatten skill names.

Additionally, enhance the `inferSkillFromQuestion` function to produce more specific skill names for comprehension (Literal Comprehension, Inferential Comprehension, Analytical Comprehension) based on question text patterns.

---

### Changes

#### File 1: `supabase/functions/regrade-test/index.ts`

**Update `mapToElaCoreSkill` to preserve granular names instead of collapsing:**

Replace the current function (lines 81-88) so it:
- Returns `formatSkillName(skill)` directly (e.g., "Figurative Language", "Word Structure", "Compound Words") instead of collapsing to broad categories
- Only falls back to a broad category if the skill name is truly generic (e.g., just "general" or empty)
- Maps specific tags: "figurative_language" becomes "Figurative Language", "word_structure" becomes "Word Structure", "parts_of_speech" becomes "Parts of Speech"

**Update `inferSkillFromQuestion` (lines 101-150) for comprehension subtypes:**
- Questions containing "infer", "conclude", "suggest", "imply" produce "Inferential Comprehension"
- Questions containing "main idea", "detail", "stated", "according to" produce "Literal Comprehension"
- Questions containing "author's purpose", "tone", "theme", "analyze", "evaluate" produce "Analytical Comprehension"
- Default ELA fallback stays "Reading Comprehension"

#### File 2: `supabase/functions/grade-test/index.ts`

**Same changes as regrade-test** to keep them in sync:
- Update `mapToElaCoreSkill` (lines 396-409) to preserve granular skill names
- Update `inferSkillFromQuestion` (lines 422-472) with comprehension subtypes

#### File 3: `src/components/ELASectionReport.tsx`

**Update section threshold at line 132:**
- Change `percent >= 70 ? "Mastered" : percent >= 50` to use standardized thresholds: `percent >= 85 ? "Mastered" : percent >= 66 ? "Developing" : "Support Needed"`
- Line 139-140: Same threshold fix for individual skill categorization

**Ensure `mapSkillToSection` handles new granular names:**
- "Figurative Language" already maps to Vocabulary (line 102: `s.includes("figurative")`)
- "Word Structure" already maps to Vocabulary (line 102: `s.includes("word structure")`)
- "Parts of Speech" already maps to Grammar (line 99: `s.includes("parts of speech")`)
- "Compound Words" already maps to Vocabulary (line 102: `s.includes("compound")`)
- "Inferential Comprehension", "Literal Comprehension", "Analytical Comprehension" all map to Reading Comprehension (line 108: `s.includes("comprehension")`)
- No changes needed here -- the existing mapping already handles these granular names

#### File 4: Redeploy edge functions

Redeploy `regrade-test` and `grade-test`.

---

### Technical Details

**`mapToElaCoreSkill` replacement logic (both files):**
```
function mapToElaCoreSkill(skill: string): string {
  const s = skill.toLowerCase().replace(/[_-]/g, ' ');
  // Return formatted granular name -- the UI groups into sections
  if (!s || s === 'general' || s === 'general ela') return 'Reading Comprehension';
  return formatSkillName(skill);
}
```

**Comprehension subtype detection in `inferSkillFromQuestion`:**
```
// After ELA pattern matching, before default return:
if (text.includes('infer') || text.includes('conclude') || text.includes('suggest') || text.includes('imply'))
  return 'Inferential Comprehension';
if (text.includes('main idea') || text.includes('detail') || text.includes('according to') || text.includes('stated'))
  return 'Literal Comprehension';
if (text.includes('author') || text.includes('purpose') || text.includes('tone') || text.includes('theme') || text.includes('analyze') || text.includes('evaluate'))
  return 'Analytical Comprehension';
```

**`ELASectionReport.tsx` threshold fixes:**
- Line 132: `percent >= 85 ? "Mastered" : percent >= 66 ? "Developing" : "Support Needed"`
- Lines 139-140: `pct >= 85` for mastered, `pct >= 66` for developing

### After Deployment

Click "Refresh Skill Analysis" on the ELA results page. The skill breakdown will now show granular skills like "Figurative Language", "Word Structure", "Spelling", "Vocabulary", "Grammar" instead of just "General Math". The section report will group these into the 5 ELA sections automatically. Comprehension questions will be subcategorized as Literal, Inferential, or Analytical.
