// D.E.Bs TACHS Readiness Diagnostic — full pilot content bank (200 original items).
// Reading 50, Written Expression 50, Mathematics 50, Figure Matrices 20,
// Paper Folding 15, Figure Classification 15.
// Original content authored for the D.E.Bs pilot. Not affiliated with, sponsored by,
// or endorsed by the TACHS program or its publisher.
export * from "./bank-types.ts";
import type { BankQuestion } from "./bank-types.ts";
import { READING } from "./bank-reading.ts";
import { WRITTEN } from "./bank-written.ts";
import { MATH } from "./bank-math.ts";
import { FIGURE_MATRICES, PAPER_FOLDING, FIGURE_CLASSIFICATION } from "./bank-figures.ts";

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

export const SAMPLE_BANK: BankQuestion[] = [
  ...balanceKeys(READING),
  ...balanceKeys(WRITTEN),
  ...balanceKeys(MATH),
  ...FIGURE_MATRICES,
  ...PAPER_FOLDING,
  ...FIGURE_CLASSIFICATION,
];

export const TACHS_BANK = SAMPLE_BANK;
export { READING, WRITTEN, MATH, FIGURE_MATRICES, PAPER_FOLDING, FIGURE_CLASSIFICATION };
