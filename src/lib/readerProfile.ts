// Reader profile derivation for the Reading Recovery diagnostic.
// Uses only data already captured on reading_diagnostic_transcripts.

export type ReaderProfileId =
  | "rusher"
  | "decoder"
  | "guesser"
  | "skipper"
  | "word-caller"
  | "meaning-maker"
  | "on-track";

export interface ReaderProfileDefinition {
  id: ReaderProfileId;
  label: string;
  emoji: string;
  summary: string;
  strategies: string[];
}

export interface ReaderProfileResult {
  primary: ReaderProfileDefinition;
  secondary: ReaderProfileDefinition | null;
  evidence: string[];
  metrics: {
    wordCount: number | null;
    durationSeconds: number | null;
    wpm: number | null;
    accuracyPct: number | null;
    errors: number;
    omissions: number;
    substitutions: number;
    insertions: number;
    comprehensionPct: number | null;
    higherOrderPct: number | null;
  };
}

export const READER_PROFILES: Record<ReaderProfileId, ReaderProfileDefinition> = {
  rusher: {
    id: "rusher",
    label: "The Rusher",
    emoji: "🏃",
    summary:
      "Reads at speed and pushes past the text — words get dropped or added, and meaning slips because there is no pause to check.",
    strategies: [
      "Set a pacing goal: finger-track or use a pacing card so one line is read at a time.",
      "Use 'stop and say it back' — after every 2–3 sentences, the student retells in their own words.",
      "Echo reading: adult models a calm, phrased pace and the student echoes it.",
      "Reward accuracy over speed — score the read on words read correctly, not time.",
    ],
  },
  decoder: {
    id: "decoder",
    label: "The Word-by-Word Decoder",
    emoji: "🐢",
    summary:
      "Works hard and is fairly accurate, but reads one word at a time. All the effort goes into sounding out, leaving little left for meaning.",
    strategies: [
      "Phrase-scooping: mark text into 3–4 word phrases and practise reading each scoop in one breath.",
      "Repeated reading of a short passage 3× to build automaticity.",
      "Pre-teach the 5 hardest words before reading so decoding load drops.",
      "Build sight-word automaticity with timed 3-second flash practice.",
    ],
  },
  guesser: {
    id: "guesser",
    label: "The Guesser / Visual Substituter",
    emoji: "🔍",
    summary:
      "Uses the first letters or the shape of a word and guesses the rest — substitutions dominate the running record.",
    strategies: [
      "Cover-and-reveal: uncover a word chunk by chunk so the whole word must be read.",
      "Practise word pairs that differ at the end (though/thought, quite/quiet).",
      "Prompt with 'Look at the end of the word' instead of 'What would make sense?'.",
      "Daily syllable/affix work so long words are chunked, not guessed.",
    ],
  },
  skipper: {
    id: "skipper",
    label: "The Skipper",
    emoji: "↪️",
    summary:
      "Leaves out words or jumps whole phrases and lines. The gist survives, but detail and precision are lost.",
    strategies: [
      "Use a reading window or ruler under the line to hold place.",
      "Read aloud with the adult tracking the print and pausing on omissions.",
      "Enlarge print / increase line spacing for practice texts.",
      "Have the student re-read any sentence where a word was dropped, this time pointing to each word.",
    ],
  },
  "word-caller": {
    id: "word-caller",
    label: "The Word Caller",
    emoji: "🗣️",
    summary:
      "Reads the words accurately and smoothly, but does not hold on to the meaning — comprehension, especially inference, lags well behind decoding.",
    strategies: [
      "Stop-and-jot: one sentence summary after each paragraph.",
      "Teach inference explicitly with 'the text says… so I think…' sentence frames.",
      "Preview vocabulary and set a purpose for reading before the first read.",
      "Ask 'why' and 'how do you know' questions, never only 'who/what/where'.",
    ],
  },
  "meaning-maker": {
    id: "meaning-maker",
    label: "The Meaning-Maker",
    emoji: "💡",
    summary:
      "Makes decoding errors but keeps hold of the story — substitutions usually make sense. Accuracy work will unlock the next level.",
    strategies: [
      "Targeted phonics on the specific patterns missed in the running record.",
      "Praise the self-correcting habit and make it explicit: 'Did that look right AND sound right?'",
      "Word-study of the exact words misread, then re-read the same passage.",
      "Gradually raise text level once accuracy reaches 95%+.",
    ],
  },
  "on-track": {
    id: "on-track",
    label: "The On-Track Reader",
    emoji: "🌟",
    summary:
      "Accurate, appropriately paced and comprehending well. The focus now is stretch: harder text, deeper thinking.",
    strategies: [
      "Move to the next text level and monitor accuracy.",
      "Add analytical questions: author's purpose, theme, point of view.",
      "Encourage daily independent reading with a short response journal.",
      "Introduce expression and phrasing goals (reading like a storyteller).",
    ],
  },
};

const countArr = (v: unknown) => (Array.isArray(v) ? v.length : 0);

const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
};

export interface ProfileInput {
  detectedErrors: any;
  finalErrorCount: number | null;
  durationSeconds: number | null;
  comprehensionSummary: any;
  passageWordCount: number | null;
}

export const computeReaderProfile = (input: ProfileInput): ReaderProfileResult | null => {
  const { detectedErrors, finalErrorCount, durationSeconds, comprehensionSummary, passageWordCount } = input;

  const omissions = countArr(detectedErrors?.omissions);
  const substitutions = countArr(detectedErrors?.substitutions);
  const insertions = countArr(detectedErrors?.insertions);
  const errors = finalErrorCount ?? omissions + substitutions + insertions;

  const wordCount = passageWordCount ?? null;
  const wpm =
    wordCount && durationSeconds && durationSeconds > 0
      ? Math.round((wordCount / durationSeconds) * 60)
      : null;
  const accuracyPct = wordCount ? Math.max(0, Math.round(((wordCount - errors) / wordCount) * 100)) : null;

  const totalQ = comprehensionSummary?.total?.total ?? 0;
  const correctQ = comprehensionSummary?.total?.correct ?? 0;
  const comprehensionPct = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : null;

  const hoTotal =
    (comprehensionSummary?.inferential?.total ?? 0) + (comprehensionSummary?.analytical?.total ?? 0);
  const hoCorrect =
    (comprehensionSummary?.inferential?.correct ?? 0) + (comprehensionSummary?.analytical?.correct ?? 0);
  const higherOrderPct = hoTotal > 0 ? Math.round((hoCorrect / hoTotal) * 100) : null;

  if (errors === 0 && comprehensionPct === null && wpm === null) return null;

  const totalDetected = omissions + substitutions + insertions;
  const share = (n: number) => (totalDetected > 0 ? n / totalDetected : 0);

  const accurate = accuracyPct === null ? errors <= 3 : accuracyPct >= 95;
  const weakComprehension = comprehensionPct !== null && comprehensionPct < 70;
  const strongComprehension = comprehensionPct !== null && comprehensionPct >= 75;
  const fast = wpm !== null && wpm >= 150;
  const slow = wpm !== null && wpm > 0 && wpm <= 70;

  // Score every profile; the two highest become primary and secondary.
  const scores: Record<ReaderProfileId, number> = {
    rusher: 0,
    decoder: 0,
    guesser: 0,
    skipper: 0,
    "word-caller": 0,
    "meaning-maker": 0,
    "on-track": 0,
  };

  if (fast) scores.rusher += 3;
  if (wpm !== null && wpm >= 120 && wpm < 150) scores.rusher += 1;
  if (share(omissions) + share(insertions) >= 0.5 && totalDetected >= 4) scores.rusher += 2;
  if (fast && weakComprehension) scores.rusher += 2;

  if (slow) scores.decoder += 3;
  if (slow && accurate) scores.decoder += 2;
  if (slow && weakComprehension) scores.decoder += 1;

  if (share(substitutions) >= 0.5 && totalDetected >= 4) scores.guesser += 3;
  if (substitutions >= 6) scores.guesser += 1;

  if (share(omissions) >= 0.45 && totalDetected >= 4) scores.skipper += 3;
  if (omissions >= 6) scores.skipper += 1;

  if (accurate && weakComprehension) scores["word-caller"] += 4;
  if (accurate && higherOrderPct !== null && higherOrderPct < 50) scores["word-caller"] += 2;

  if (!accurate && strongComprehension) scores["meaning-maker"] += 4;

  if (accurate && strongComprehension) scores["on-track"] += 5;
  if (accurate && strongComprehension && !fast && !slow) scores["on-track"] += 2;

  const ranked = (Object.keys(scores) as ReaderProfileId[])
    .map((id) => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score);

  const primaryId = ranked[0].score > 0 ? ranked[0].id : accurate ? "on-track" : "decoder";
  const secondaryCandidate = ranked.find((r) => r.id !== primaryId && r.score >= 2);

  const evidence: string[] = [];
  if (wordCount && durationSeconds)
    evidence.push(
      `Read ${wordCount} words in ${fmtDuration(durationSeconds)}${wpm ? ` (~${wpm} words per minute)` : ""}.`
    );
  evidence.push(
    `${errors} total oral reading error${errors === 1 ? "" : "s"}${
      accuracyPct !== null ? ` — ${accuracyPct}% accuracy` : ""
    }.`
  );
  if (totalDetected > 0)
    evidence.push(
      `Error mix: ${substitutions} substitution${substitutions === 1 ? "" : "s"}, ${omissions} omission${
        omissions === 1 ? "" : "s"
      }, ${insertions} insertion${insertions === 1 ? "" : "s"}.`
    );
  if (comprehensionPct !== null)
    evidence.push(
      `Comprehension ${correctQ}/${totalQ} (${comprehensionPct}%)${
        higherOrderPct !== null ? ` — ${higherOrderPct}% on inferential/analytical questions` : ""
      }.`
    );

  return {
    primary: READER_PROFILES[primaryId],
    secondary: secondaryCandidate ? READER_PROFILES[secondaryCandidate.id] : null,
    evidence,
    metrics: {
      wordCount,
      durationSeconds,
      wpm,
      accuracyPct,
      errors,
      omissions,
      substitutions,
      insertions,
      comprehensionPct,
      higherOrderPct,
    },
  };
};
