// D.E.Bs TACHS Readiness Diagnostic — content banks.
//
// Pilot v1 (SAMPLE_BANK, 200 items) is FROZEN: existing attempts stay bound to blueprint version 1 and
// these exact question codes. Do not edit v1 content; author changes go into the active version.
//
// Pilot v2 (BANK_V2) is the active bank for all NEW attempts: Reading 50, Written Expression 50,
// every section is a new original pool larger than its administered count (Reading 80, Written 80,
// Mathematics 80, Figure Matrices 38, Paper Folding 32, Figure Classification 32) for adaptive selection;
// ability sections use five choices (A–E).
//
// Original content authored for the D.E.Bs pilot. Not affiliated with, sponsored by,
// or endorsed by the TACHS program or its publisher.
export * from "./bank-types.ts";
import { BLUEPRINT_V1, BLUEPRINT_V2, type BankQuestion, type Blueprint } from "./bank-types.ts";
import { READING } from "./bank-reading.ts";
import { WRITTEN } from "./bank-written.ts";
import { MATH } from "./bank-math.ts";
import { MATH_V2_BANK } from "./bank-math-v2.ts";
import { READING_V2 } from "./bank-reading-v2.ts";
import { WRITTEN_V2 } from "./bank-written-v2.ts";
import { PAPER_FOLDING_V2 } from "./bank-paper-folding-v2.ts";
import { FIGURE_MATRICES, PAPER_FOLDING, FIGURE_CLASSIFICATION } from "./bank-figures.ts";
import { FIGURE_MATRICES_V2, FIGURE_CLASSIFICATION_V2 } from "./bank-figures-v2.ts";

const KEYS = ["A", "B", "C", "D"] as const;
// Deterministic, non-repeating key pattern (period 8) so no section has long runs or a lopsided key distribution.
const KEY_PATTERN = ["B", "D", "A", "C", "C", "A", "D", "B"] as const;

/** Rotate text choices so the correct answer lands on a balanced, non-patterned key. Visual sections keep authored keys. */
function balanceKeys(items: BankQuestion[]): BankQuestion[] {
  return items.map((q, i) => {
    const target = KEY_PATTERN[i % KEY_PATTERN.length];
    const from = KEYS.indexOf(q.correct_key as typeof KEYS[number]);
    const to = KEYS.indexOf(target);
    if (from < 0 || from === to) return q;
    const shift = (to - from + 4) % 4;
    const rotated = q.choices.map((_, idx) => q.choices[(idx - shift + 4) % 4]).map((c, idx) => ({ ...c, key: KEYS[idx] }));
    return { ...q, choices: rotated, correct_key: target };
  });
}

/** Pilot v1 — frozen. */
export const SAMPLE_BANK: BankQuestion[] = [
  ...balanceKeys(READING),
  ...balanceKeys(WRITTEN),
  ...balanceKeys(MATH),
  ...FIGURE_MATRICES,
  ...PAPER_FOLDING,
  ...FIGURE_CLASSIFICATION,
];

const carry = (items: BankQuestion[]): BankQuestion[] => items.map((q) => ({ ...q, code: `V2-${q.code}` }));

/** Pilot v2 — active for new attempts. */
export const BANK_V2: BankQuestion[] = [
  ...balanceKeys(READING_V2),
  ...balanceKeys(WRITTEN_V2),
  ...balanceKeys(MATH_V2_BANK),
  ...FIGURE_MATRICES_V2,
  ...PAPER_FOLDING_V2,
  ...FIGURE_CLASSIFICATION_V2,
];

export const ACTIVE_BLUEPRINT: Blueprint = BLUEPRINT_V2;
export const ACTIVE_BANK: BankQuestion[] = BANK_V2;

/** Every shipped version, oldest first (used by validation and by the strand lookup). */
export const BANK_VERSIONS: { blueprint: Blueprint; bank: BankQuestion[]; frozen: boolean }[] = [
  { blueprint: BLUEPRINT_V1, bank: SAMPLE_BANK, frozen: true },
  { blueprint: BLUEPRINT_V2, bank: BANK_V2, frozen: false },
];

/** Reporting strand by question code (mathematics only; v1 items have no strand). */
export const STRAND_BY_CODE: Record<string, string> = Object.fromEntries(
  BANK_VERSIONS.flatMap((v) => v.bank.filter((q) => q.strand).map((q) => [q.code, q.strand as string])),
);

export const TACHS_BANK = SAMPLE_BANK;
export { READING, WRITTEN, MATH, MATH_V2_BANK, READING_V2, WRITTEN_V2, PAPER_FOLDING_V2, FIGURE_MATRICES_V2, FIGURE_CLASSIFICATION_V2, FIGURE_MATRICES, PAPER_FOLDING, FIGURE_CLASSIFICATION };
