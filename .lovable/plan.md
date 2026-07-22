# Phonics Listening & Pronunciation Practice

Add an interactive "PhonicsChip" that lets students tap any letter or word to hear it, then repeat it into the mic and get instant correct/try-again feedback. Attempt accuracy is logged so teachers can see progress.

## What the student experiences

1. In any phonics warm-up, word list, or Grade 1 ELA letter-sound item, each letter/word appears as a chip with a 🔊 speaker icon and a 🎤 mic icon.
2. Tap 🔊 → AI voice says the phoneme (letter) or blended pronunciation (word). They can replay as often as they like.
3. Tap 🎤 → 3-second recording. System transcribes and compares to the target.
   - ✅ "Great job! You said it correctly." (green pulse, +1 to streak)
   - 🔁 "Almost — try again. Listen once more." (auto-replays target audio)
4. Progress bar on each activity: "8 / 12 sounds mastered." Saved to their Reading Recovery record.

## Scope

- All Phonics-category days in the 21-Day Blueprint (Days 2, 5, 11, 14, etc.)
- Every `word-list` block in **all** activity days (so word-work across Vocabulary/Fluency days benefits too)
- Grade 1 ELA diagnostic — letter-sound identification questions

## Technical Details

### New shared component
`src/components/PhonicsChip.tsx`
- Props: `text`, `mode: "letter" | "word"`, `onResult(correct: boolean)`
- Play button → POST `/functions/v1/phonics-speak` → plays returned MP3 (cached in-memory Map keyed by text+mode so replays are free)
- Record button → uses `MediaRecorder` (webm), sends to `/functions/v1/phonics-check`
- Shows result badge, retry count, and cumulative attempt state

### New edge functions (both `verify_jwt = true`, added to `supabase/config.toml`)

**`phonics-speak`** — TTS via Lovable AI Gateway
- Model: `openai/gpt-4o-mini-tts`, voice `alloy` (warm, child-friendly), non-streaming (small payload)
- For `mode: "letter"`, prompt-instructs: *"Say only the primary short phoneme for the letter X, clearly and slowly, no letter name."* For `mode: "word"`: *"Say the word 'X' at a slow, encouraging pace."*
- Returns MP3 bytes; frontend caches per session

**`phonics-check`** — STT + match
- Accepts audio blob, target text, mode
- Sends audio to `openai/gpt-4o-transcribe` (`/v1/audio/transcriptions`)
- For letters: compares first phonetic token; a small mapping table (`a→"ah"/"æ"`, `b→"buh"/"bee"`, etc.) plus normalized-string match
- For words: normalized string equality (lowercase, strip punctuation), plus Levenshtein distance ≤ 1 tolerance
- Returns `{ correct: boolean, heard: string, target: string }`

### Progress logging

New table `phonics_attempts`:
```
id uuid pk, enrollment_id uuid null, user_id uuid, day_number int null,
target text, mode text, correct boolean, heard text, created_at timestamptz
```
- RLS: students insert/select their own; admins/teachers select all in their school
- GRANTs for `authenticated` + `service_role`
- Rollup query on `ReadingRecoveryDashboard` shows accuracy per day

### Wiring

- `src/components/ReadingRecoveryActivityDialog.tsx` — replace plain letter/word tiles in the `word-list` block with `<PhonicsChip>` when the activity `category === "Phonics"` OR block title contains "sound"/"phoneme"; word-mode chips elsewhere
- `src/pages/Grade1ELADiagnostic.tsx` — inject `<PhonicsChip mode="letter">` next to letter-sound questions
- `src/pages/ReadingRecoveryDashboard.tsx` — show mastery % strip per Phonics day, pulled from `phonics_attempts`

### Consent & permissions

- Mic permission requested on first 🎤 tap with a friendly explainer toast
- Reuses existing Reading Recovery recording consent — if consent missing, mic button is disabled with tooltip "Enable recording consent in your account to practice out loud"
- Play (🔊) always available regardless of consent

## Out of scope for this pass

- Voice selection / accent picker (defaults to `alloy`)
- Offline caching of audio beyond current session
- Full running-record replacement — this is practice, not assessment
