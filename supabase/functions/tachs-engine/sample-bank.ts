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

export const SAMPLE_BANK: BankQuestion[] = [
  ...READING,
  ...WRITTEN,
  ...MATH,
  ...FIGURE_MATRICES,
  ...PAPER_FOLDING,
  ...FIGURE_CLASSIFICATION,
];

export const TACHS_BANK = SAMPLE_BANK;
export { READING, WRITTEN, MATH, FIGURE_MATRICES, PAPER_FOLDING, FIGURE_CLASSIFICATION };
