

## Fix: Home Plan Missing Weeks + Raw LaTeX in Practice Questions

### Issue 1: Home Plan Only Shows 3 Weeks Instead of 6

**Root Cause:** The 6-week plan table maps one skill per row using `.slice(0, 6)`. When only 3 priority skills exist (Decimals, Fractions, Money), only 3 rows are generated. The code needs to pad the list to always produce 6 rows, cycling through skills or adding review/consolidation weeks.

**Fix in `src/components/TierComponents.tsx`:**
- After slicing skills, pad the array to 6 entries by adding review/consolidation week labels if fewer than 6 skills exist
- For Math: Weeks 4-6 could be "Word Problem Practice", "Mixed Skill Review", "Progress Check + Celebration"
- For ELA: Similar padding with "Mixed ELA Review", "Writing Practice", "Progress Assessment"
- The activity descriptions for weeks 4-6 already exist in the ternary logic (indices 3, 4, 5) -- the problem is the skill array is too short to reach them

**Specific change:** Instead of only using `filteredPrioritySkills`, combine priority + developing skills, then pad with default review topics to guarantee 6 entries:
```
const allSkills = [...filteredPrioritySkills, ...filteredDevelopingSkills];
const paddedSkills = [...allSkills];
const defaultPadding = isELA 
  ? ["Mixed Reading Review", "Writing Practice", "Progress Assessment"]
  : ["Word Problem Practice", "Mixed Skill Review", "Progress Check"];
while (paddedSkills.length < 6) {
  paddedSkills.push(defaultPadding[paddedSkills.length - allSkills.length] || "Review");
}
```

---

### Issue 2: Practice Questions Show Raw LaTeX Instead of Rendered Fractions

**Root Cause:** The AI model (Gemini) returns math expressions using LaTeX notation like `\(\frac{1}{3} + \frac{1}{6}\)`. The `Curriculum.tsx` page renders these as plain text via `{currentQ?.question}`, so the LaTeX is displayed raw.

**Fix in `supabase/functions/generate-curriculum/index.ts`:**
- Add an instruction to the system prompt telling the AI to use plain text Unicode fractions or simple notation (e.g., "1/3 + 1/6") instead of LaTeX, since the output is rendered in a web UI without a LaTeX renderer.
- Add to the system prompt: "IMPORTANT: Do NOT use LaTeX notation. Write math expressions in plain text using / for fractions (e.g., '1/3 + 1/6' not '\\frac{1}{3}'). Use Unicode symbols where helpful (e.g., times, division sign)."

**Additionally in `src/pages/Curriculum.tsx`:**
- Add a simple sanitizer that strips any remaining LaTeX wrappers (`\(`, `\)`, `\frac{a}{b}` to `a/b`) as a fallback in case the AI still returns LaTeX despite the instruction.
- Apply this sanitizer to question text, options, hints, and explanations.

---

### Technical Changes

**File 1: `src/components/TierComponents.tsx`**
- Combine `filteredPrioritySkills` and `filteredDevelopingSkills` and pad to 6 entries for the weekly plan table (both Math and ELA branches)

**File 2: `supabase/functions/generate-curriculum/index.ts`**
- Add "no LaTeX" instruction to the system prompt so the AI generates plain-text math expressions

**File 3: `src/pages/Curriculum.tsx`**
- Add a `sanitizeMath()` helper function that converts `\frac{a}{b}` to `a/b` and strips `\(` / `\)` wrappers
- Apply it to question, options, hint, and explanation text rendering

