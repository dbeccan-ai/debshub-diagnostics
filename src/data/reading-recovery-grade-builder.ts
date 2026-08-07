// Per-grade passage builder for the Reading Recovery diagnostic.
// Converts a compact draft into the full Passage shape used by the app,
// deriving word counts, question ids, scoring thresholds and decoding
// checklists from the grade level so every grade is scored on its own bar.

import type { Passage, Question, GradeLevel, DecodingChecklist, ScoringThresholds } from './reading-recovery-content';

export type QLevel = 'literal' | 'inferential' | 'analytical';

export interface PassageDraft {
  grade: GradeLevel;
  version: 'A' | 'B' | 'C';
  title: string;
  lexile: string;
  focus: string;
  text: string;
  questions: Array<[QLevel, string]>;
  /** Grade-appropriate decoding targets shown on the administration sheet. */
  targets?: string[];
}

const VERSION_LABEL: Record<'A' | 'B' | 'C', string> = {
  A: 'Pre-Assessment (Day 0/1)',
  B: 'Mid-Point Check (Day 10-11)',
  C: 'Post-Assessment (Day 21)',
};

const gradeNumber = (grade: GradeLevel): number => (grade === 'K' ? 0 : parseInt(grade, 10));

export const gradeLabel = (grade: GradeLevel): string =>
  grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;

const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Error tolerance scales with passage length: a 35-word kindergarten passage
 * cannot allow the same absolute error count as a 500-word grade 12 passage.
 * Anchored to on-grade-level (end-of-year) expectations: 97%+ = strong,
 * 90-96% = needs support, below 90% = significant gap.
 */
export const errorBandsFor = (wordCount: number) => {
  const strongMax = Math.max(1, Math.round(wordCount * 0.03));
  const supportMax = Math.max(strongMax + 1, Math.round(wordCount * 0.1));
  return { strongMax, supportMax };
};

const decodingFocusByGrade = (grade: GradeLevel): string[] => {
  const g = gradeNumber(grade);
  if (g <= 0) return [
    'Named letters and produced matching sounds',
    'Blended simple CVC words (c-a-t → cat)',
    'Recognized high-frequency words by sight (the, and, is, my)',
    'Tracked print left to right with one-to-one matching',
  ];
  if (g === 1) return [
    'Blended CVC and CVCe words without prompting',
    'Applied common digraphs (sh, ch, th) accurately',
    'Read grade-1 sight words automatically',
    'Self-corrected when a word did not make sense',
  ];
  if (g === 2) return [
    'Decoded two-syllable words by chunking',
    'Applied vowel teams (ai, ea, oa) accurately',
    'Read grade-2 sight words automatically',
    'Used ending punctuation to phrase sentences',
  ];
  if (g <= 4) return [
    'Broke multi-syllabic words into syllables',
    'Applied prefixes and suffixes to decode meaning',
    'Read with phrasing rather than word-by-word',
    'Self-corrected without prompting',
  ];
  if (g <= 6) return [
    'Decoded academic and content-area vocabulary',
    'Used root words and affixes to unlock meaning',
    'Maintained expression across longer sentences',
    'Handled embedded clauses without losing meaning',
  ];
  if (g <= 8) return [
    'Decoded discipline-specific and abstract vocabulary',
    'Sustained accuracy across dense paragraphs',
    'Used context to resolve unfamiliar terms',
    'Read dialogue and narration with distinct expression',
  ];
  return [
    'Decoded technical, figurative and archaic vocabulary',
    'Sustained accuracy across complex syntax',
    'Parsed long sentences with multiple clauses',
    'Maintained meaning while reading dense argumentation',
  ];
};

const buildChecklist = (grade: GradeLevel, wordCount: number, targets?: string[]): DecodingChecklist => {
  const { strongMax, supportMax } = errorBandsFor(wordCount);
  return {
    accuracyLevels: {
      strong: `Read with 0-${strongMax} errors (97%+ accuracy) ✓ ON GRADE LEVEL`,
      needsSupport: `Read with ${strongMax + 1}-${supportMax} errors (needs targeted support)`,
      significantGap: `Read with ${supportMax + 1}+ errors (significant gap for ${gradeLabel(grade)})`,
    },
    strategies: decodingFocusByGrade(grade),
    ...(targets && targets.length ? { multiSyllabicWords: targets } : {}),
  };
};

const rangeLabel = (numbers: number[]): string => {
  if (!numbers.length) return '—';
  if (numbers.length === 1) return `Q${numbers[0]}`;
  const contiguous = numbers.every((n, i) => i === 0 || n === numbers[i - 1] + 1);
  return contiguous ? `Q${numbers[0]}-${numbers[numbers.length - 1]}` : numbers.map(n => `Q${n}`).join(', ');
};

/** A gap is flagged when the student gets less than ~60% of that level correct. */
const gapCutoff = (total: number): number => (total === 0 ? -1 : Math.max(0, Math.ceil(total * 0.6) - 1));

export const buildPassage = (draft: PassageDraft): Passage => {
  const wordCount = countWords(draft.text);

  const questions: Question[] = draft.questions.map(([level, text], i) => ({
    id: `G${draft.grade}-${draft.version}-${i + 1}`,
    number: i + 1,
    level,
    text,
  }));

  const byLevel = (level: QLevel) => questions.filter(q => q.level === level).map(q => q.number);
  const literal = byLevel('literal');
  const inferential = byLevel('inferential');
  const analytical = byLevel('analytical');

  const section = (nums: number[], label: string) => {
    const cutoff = gapCutoff(nums.length);
    return {
      questions: rangeLabel(nums),
      total: nums.length,
      gapThreshold: nums.length
        ? `0-${cutoff} correct = ${label} GAP`
        : `Not assessed at this grade`,
    };
  };

  const scoringThresholds: ScoringThresholds = {
    literal: section(literal, 'LITERAL'),
    inferential: section(inferential, 'INFERENTIAL'),
    analytical: section(analytical, 'ANALYTICAL'),
    totalQuestions: questions.length,
  };

  const { supportMax } = errorBandsFor(wordCount);

  return {
    grade: draft.grade,
    version: draft.version,
    versionLabel: VERSION_LABEL[draft.version],
    title: draft.title,
    metadata: {
      wordCount,
      lexile: draft.lexile,
      focus: draft.focus,
    },
    text: draft.text,
    questions,
    decodingChecklist: buildChecklist(draft.grade, wordCount, draft.targets),
    scoringThresholds,
    breakdownPoints: [
      `Decoding (${supportMax + 1}+ errors on ${gradeLabel(draft.grade)} text)`,
      `Literal Comprehension (${scoringThresholds.literal.gapThreshold})`,
      `Inferential Comprehension (${scoringThresholds.inferential.gapThreshold})`,
      `Analytical Comprehension (${scoringThresholds.analytical.gapThreshold})`,
    ],
  };
};
