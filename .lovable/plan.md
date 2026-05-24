## Fix Grade 9 ELA Writing Prompts

### Problem
Section III writing prompts reference a "Julia / lighthouse / grandfather" passage that doesn't exist. Section II's actual passage is "The Weight of Silence" (about Liana and Malik). Students have nothing to anchor Q26 (narrative) or Q27 (argumentative) to.

### Fix
Edit `src/data/ela-diagnostic-tests.json`, Grade 9 → Section III only:

1. **Add a short narrative excerpt to Section III** titled "The Lighthouse Letter" — a self-contained ~150-word passage introducing Julia, her late grandfather, his journal entry, and her arrival at the abandoned lighthouse. This sits at the section level (`passage` / `passage_title`) so the existing passage-rendering pipeline shows it above both writing prompts.

2. **Keep Q26 (narrative) as-is** — it now has the excerpt to continue from.

3. **Reword Q27 (argumentative)** so "the passage" clearly points to **The Weight of Silence** from Section II (Liana/Malik, journalism, truth-telling). New prompt focuses on whether pursuing difficult truths is worth the personal cost, with examples from that passage.

### Files
- `src/data/ela-diagnostic-tests.json` — Grade 9, Section III: add `passage_title` + `passage` keys; replace Q27 `question_text`.

### Out of scope
No code changes, no schema changes, no other grades touched. Passage rendering already works via the recently updated `normalizeQuestions` (section-level `passage` is propagated to each question).
