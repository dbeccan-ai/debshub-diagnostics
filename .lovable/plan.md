

# Add Demo Test Questions for All Missing Grades

## Problem
The demo test shows "Sample Not Available" for Math grades 2-5 and ELA grades 1-4 because these grades' questions exist only in the database, not in the local JSON files that `DemoTest.tsx` reads from.

## Solution
Add the missing grade entries to both JSON data files by pulling existing MC questions from the database. Only multiple-choice questions are needed (the demo extracts MC only). Each grade entry will include 8-10 MC questions — enough for the 5-question demo sample.

## Missing Grades

| File | Missing Grades |
|------|---------------|
| `src/data/diagnostic-tests.json` | 2, 3, 4, 5 |
| `src/data/ela-diagnostic-tests.json` | 1, 2, 3, 4 |

## Approach

1. Query the database for each missing grade's questions (already confirmed all exist)
2. Add each grade as a new entry in `all_diagnostics` array in the respective JSON file, matching the existing format: `{ grade, test_name, total_time_minutes, sections: [{ section_title, instructions, time_limit_minutes, calculator_allowed, questions: [...] }] }`
3. Include only the MC questions (type: `multiple_choice`) with `id`, `number`, `type`, `topic`, `question_text`, `choices`, `correct_answer`
4. No code changes to `DemoTest.tsx` needed — it already handles the format correctly

## Files Changed

| File | Change |
|------|--------|
| `src/data/diagnostic-tests.json` | Add grade 2, 3, 4, 5 entries to `all_diagnostics` |
| `src/data/ela-diagnostic-tests.json` | Add grade 1, 2, 3, 4 entries to `all_diagnostics` |

No database changes. No new files. No code logic changes.

