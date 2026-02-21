
## Fix: ELA Results Missing Skills + Curriculum Generating Math Content

### Problems Identified

1. **ELA Home Support Plan shows "Rounding" (a math skill)** — The `RecommendedNextStepPanel` in `ELAResults.tsx` is called without `subject`, `studentName`, `prioritySkills`, or `developingSkills` props. Without these, the component can't filter skills or label the plan as ELA.

2. **Curriculum page shows "Personalized Math Boost: Mastering Rounding" for an ELA test** — The `generate-curriculum` edge function already fetches `test_type` from the database but never passes it to the AI prompt. So the AI doesn't know the test is ELA and defaults to math-style content.

3. **ELA test attempts in the database have "General Math" as a skill** — The upstream grading function is tagging ELA tests with math skill labels. The curriculum function needs to use `test_type` to override this and force ELA-appropriate content.

---

### Fix 1: `src/pages/ELAResults.tsx` — Pass subject and skills to RecommendedNextStepPanel

Both instances of `<RecommendedNextStepPanel>` (lines 349 and 629) currently only pass `overallScore`. They need to also pass:
- `subject="ELA"`
- `studentName={result.studentName}`
- `prioritySkills` — derived from `sectionBreakdown` sections with `percent < 50`
- `developingSkills` — derived from `sectionBreakdown` sections with `percent` between 50-69

This will ensure the Home Support Plan:
- Labels itself as "ELA Home Support Plan" (not generic)
- Shows the student's name
- Lists ELA section names (Reading Comprehension, Vocabulary, etc.) instead of math skills like "Rounding"

### Fix 2: `supabase/functions/generate-curriculum/index.ts` — Add subject awareness

The `test_type` is already fetched from the database (line 63) and extracted (line 101). Changes:
- Extract `testType` from the joined data (similar to how `testName` is extracted)
- Determine subject label: if `test_type` contains "ela", use "ELA/English Language Arts"; otherwise "Math"
- Add the subject to both the system prompt and user prompt so the AI generates subject-appropriate curriculum
- Add explicit instruction: "This is an ELA diagnostic — generate reading, writing, grammar, vocabulary, and spelling content only. Do NOT generate math content."

### Fix 3: `src/pages/Curriculum.tsx` — Display subject-aware title

Currently the curriculum title comes directly from the AI response. As an extra safeguard:
- The `testName` is already displayed in the hero section subtitle. No code change needed here since the AI prompt fix will produce correct titles.

---

### Technical Details

**File 1: `src/pages/ELAResults.tsx`**
- Compute `prioritySkills` and `developingSkills` from `result.sectionBreakdown` before the return statement
- Update both `RecommendedNextStepPanel` calls (lines 349 and 629) to include all required props

**File 2: `supabase/functions/generate-curriculum/index.ts`**
- Extract `testType` from `testsData` (line ~104)
- Determine `isELA` boolean and `subjectLabel`
- Add subject context to system prompt: "You are generating curriculum for a [subject] diagnostic. Only generate [subject]-appropriate content."
- Add subject context to user prompt: "This is a [subject] diagnostic test."
- If ELA, explicitly tell the AI: "Focus on reading comprehension, vocabulary, spelling, grammar, and writing skills. Do NOT include any math content."
