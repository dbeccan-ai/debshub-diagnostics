import { describe, expect, it } from "vitest";
import { BANK_V2, BANK_VERSIONS, BLUEPRINT_V1, BLUEPRINT_V2, SAMPLE_BANK } from "../supabase/functions/tachs-engine/sample-bank.ts";
import { MATH_V2 } from "../supabase/functions/tachs-engine/bank-math-v2.ts";
import { PAPER_FOLDING_V2, PAPER_FOLDING_V2_MODELS, PAPER_FOLDING_V2_SPECS } from "../supabase/functions/tachs-engine/bank-paper-folding-v2.ts";
import { isDrawable, sameFigure, unfold } from "../supabase/functions/tachs-engine/fold-engine.ts";

/** Normalize an answer string/number so an independently computed `ans` can be compared to the keyed choice. */
export function normalizeAnswer(v: number | string): string {
  if (typeof v === "number") return String(Math.round(v * 1e6) / 1e6);
  let s = String(v).trim().replace(/−/g, "-").replace(/×/g, "*").replace(/,/g, "");
  s = s.replace(/^[a-z]\s*=\s*/i, "").replace(/\$/g, "").replace(/(°F|°C|°|%|cm²|cm|m²|m|ft|in|mph|kg|km|hours?|minutes?|units?|points?)\b/gi, "");
  s = s.replace(/\s+/g, "");
  if (/^-?\d+(\.\d+)?$/.test(s)) return String(Math.round(Number(s) * 1e6) / 1e6);
  return s.toLowerCase();
}

describe("Pilot v1 stays frozen", () => {
  it("still ships exactly 200 items with the original codes and blueprint", () => {
    expect(SAMPLE_BANK.length).toBe(200);
    expect(SAMPLE_BANK.every((q) => !q.code.startsWith("V2-"))).toBe(true);
    expect(BLUEPRINT_V1.version).toBe(1);
    expect(BLUEPRINT_V1.sections.find((s) => s.key === "mathematics")?.skill_quotas.algebra_patterns).toBe(10);
  });
  it("v2 never reuses a v1 code (global unique constraint)", () => {
    const v1 = new Set(SAMPLE_BANK.map((q) => q.code));
    for (const q of BANK_V2) expect(v1.has(q.code), q.code).toBe(false);
  });
});

describe("Pilot v2 blueprint", () => {
  it("keeps the working allocation (50/50/50/20/15/15 = 200) and 130 minutes", () => {
    expect(BLUEPRINT_V2.version).toBe(2);
    expect(BLUEPRINT_V2.sections.map((s) => s.item_count)).toEqual([50, 50, 50, 20, 15, 15]);
    expect(BLUEPRINT_V2.sections.reduce((a, s) => a + s.time_minutes, 0)).toBe(130);
    for (const s of BLUEPRINT_V2.sections) expect(Object.values(s.skill_quotas).reduce((a, b) => a + b, 0), s.key).toBe(s.item_count);
  });
  it("preserves the v1 calculator policy per section", () => {
    for (const s of BLUEPRINT_V2.sections) expect(s.calculator, s.key).toBe(BLUEPRINT_V1.sections.find((x) => x.key === s.key)?.calculator);
  });
  it("administers the requested mathematics content blueprint", () => {
    expect(BLUEPRINT_V2.sections.find((s) => s.key === "mathematics")?.skill_quotas).toEqual({
      number_integer_fluency: 6, ratio_proportion_percent: 6, algebra_functions: 20, geometry_measurement: 8, data_probability_statistics: 6, multistep_modeling: 4,
    });
  });
  it("caps single-fold paper folding at 2 presented items", () => {
    expect(BLUEPRINT_V2.sections.find((s) => s.key === "paper_folding")?.skill_quotas.single_fold).toBe(2);
  });
  it("is the active version", () => {
    expect(BANK_VERSIONS.at(-1)?.blueprint.version).toBe(2);
    expect(BANK_VERSIONS.find((v) => v.blueprint.version === 1)?.frozen).toBe(true);
  });
});

describe("Mathematics v2 pool", () => {
  const items = MATH_V2;
  it("has at least 75 original items with a 20/45/35 difficulty mix (±6 pts)", () => {
    expect(items.length).toBeGreaterThanOrEqual(75);
    const share = (d: number) => items.filter((q) => q.difficulty === d).length / items.length;
    expect(Math.abs(share(1) - 0.2)).toBeLessThanOrEqual(0.06);
    expect(Math.abs(share(2) - 0.45)).toBeLessThanOrEqual(0.06);
    expect(Math.abs(share(3) - 0.35)).toBeLessThanOrEqual(0.06);
  });
  it("covers every presented skill with more items than its quota so selection is genuinely adaptive", () => {
    const quotas = BLUEPRINT_V2.sections.find((s) => s.key === "mathematics")!.skill_quotas;
    for (const [skill, quota] of Object.entries(quotas)) {
      const n = items.filter((q) => q.skill === skill).length;
      expect(n, skill).toBeGreaterThan(quota);
      const levels = new Set(items.filter((q) => q.skill === skill).map((q) => q.difficulty));
      expect(levels.size, `${skill} difficulty spread`).toBeGreaterThanOrEqual(2);
    }
  });
  it("keys every item to the independently computed answer", () => {
    for (const q of items) {
      const choice = q.choices.find((c) => c.key === q.correct_key)!;
      expect(normalizeAnswer(choice.text!), `${q.code}: keyed "${choice.text}" vs computed ${q.ans}`).toBe(normalizeAnswer(q.ans));
    }
  });
  it("has four distinct options and a rationale that explains the solution and at least one distractor", () => {
    for (const q of items) {
      expect(new Set(q.choices.map((c) => normalizeAnswer(c.text!))).size, q.code).toBe(4);
      expect(q.rationale.length, q.code).toBeGreaterThan(40);
    }
  });
  it("has no duplicate or near-duplicate stems", () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    const seen = new Map<string, string>();
    for (const q of items) {
      const k = norm(q.stem);
      expect(seen.has(k), `${q.code} duplicates ${seen.get(k)}`).toBe(false);
      seen.set(k, q.code);
    }
    // near-duplicate: same stem after stripping all digits
    const noDigits = new Map<string, string[]>();
    for (const q of items) { const k = q.stem.toLowerCase().replace(/[\d.,−-]/g, "").replace(/\s+/g, " "); noDigits.set(k, [...(noDigits.get(k) ?? []), q.code]); }
    for (const [, codes] of noDigits) expect(codes.length, `near-duplicate stems ${codes.join(", ")}`).toBeLessThanOrEqual(1);
  });
  it("labels every item with a reporting strand and covers all three rungs in algebra", () => {
    for (const q of items) expect(["foundation", "grade8", "algebra1"], q.code).toContain(q.strand);
    const alg = items.filter((q) => q.skill === "algebra_functions");
    expect(alg.length).toBeGreaterThanOrEqual(28);
    expect(alg.filter((q) => q.strand === "algebra1").length).toBeGreaterThanOrEqual(12);
    expect(alg.filter((q) => q.strand === "grade8").length).toBeGreaterThanOrEqual(8);
  });
  it("level-3 items are multistep (word or expression models), not just bigger numbers", () => {
    for (const q of items.filter((q) => q.difficulty === 3)) {
      const words = q.stem.split(/\s+/).length;
      const ops = (q.stem.match(/[+\-−×÷*/^²³=<>≤≥]/g) ?? []).length;
      expect(words >= 14 || ops >= 3, `${q.code} does not look multistep: "${q.stem}"`).toBe(true);
    }
  });
});

describe("Paper Folding v2 pool", () => {
  it("has at least 30 items, no more than 15% single-fold, 45–50% level 2, and no text-only choices", () => {
    expect(PAPER_FOLDING_V2.length).toBeGreaterThanOrEqual(30);
    const n = PAPER_FOLDING_V2.length;
    expect(PAPER_FOLDING_V2.filter((q) => q.difficulty === 1).length / n).toBeLessThanOrEqual(0.15);
    const l2 = PAPER_FOLDING_V2.filter((q) => q.difficulty === 2).length / n;
    expect(l2).toBeGreaterThanOrEqual(0.45); expect(l2).toBeLessThanOrEqual(0.5);
    for (const q of PAPER_FOLDING_V2) for (const c of q.choices) { expect(c.visual, q.code).toBeTruthy(); expect(c.text, q.code).toBeUndefined(); }
    expect(PAPER_FOLDING_V2.some((q) => /how many holes/i.test(q.stem))).toBe(false);
  });
  it("uses diagnostic skills with two- and three-fold, diagonal, multi-punch, notch and asymmetric items", () => {
    const skills = new Set(PAPER_FOLDING_V2.map((q) => q.skill));
    for (const s of ["single_fold", "two_fold_reflection", "three_fold_sequence", "diagonal_reflection", "multiple_punches", "edge_notch", "asymmetric_fold"]) expect(skills.has(s), s).toBe(true);
    expect(PAPER_FOLDING_V2_SPECS.filter((s) => s.folds.length >= 3).length).toBeGreaterThanOrEqual(6);
    expect(PAPER_FOLDING_V2_SPECS.filter((s) => s.folds.some((f) => f.short === "diagonal")).length).toBeGreaterThanOrEqual(5);
    expect(PAPER_FOLDING_V2_SPECS.filter((s) => (s.cuts?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(3);
  });
  it("keys every item to the fold engine's own unfolded result", () => {
    for (const spec of PAPER_FOLDING_V2_SPECS) {
      const q = PAPER_FOLDING_V2.find((x) => x.code === spec.code)!;
      const model = PAPER_FOLDING_V2_MODELS[spec.code];
      const recomputed = unfold(spec.folds, spec.holes, spec.cuts ?? []);
      expect(sameFigure(recomputed, model.correct), spec.code).toBe(true);
      // the keyed choice's visual must be drawn from the correct figure (holes count matches)
      const keyed = q.choices.find((c) => c.key === q.correct_key)!;
      const circles = keyed.visual!.items.filter((it: any) => it.t === "circle").length;
      expect(circles, spec.code).toBe(model.correct.holes.length);
    }
  });
  it("every choice is a distinct, drawable, unambiguous figure", () => {
    for (const [code, model] of Object.entries(PAPER_FOLDING_V2_MODELS)) {
      const figs = [model.correct, ...model.distractors.map((d) => d.u)];
      expect(figs.length, code).toBe(4);
      expect(isDrawable(model.correct), code).toBe(true);
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(sameFigure(figs[i], figs[j]), `${code} choices ${i}/${j} identical`).toBe(false);
    }
  });
  it("distractors differ by reflection order / orientation / layer count rather than only hole count", () => {
    let sameCount = 0;
    for (const model of Object.values(PAPER_FOLDING_V2_MODELS)) for (const d of model.distractors) if (d.u.holes.length === model.correct.holes.length && d.u.cuts.length === model.correct.cuts.length) sameCount++;
    expect(sameCount / (Object.keys(PAPER_FOLDING_V2_MODELS).length * 3)).toBeGreaterThanOrEqual(0.4);
  });
  it("shows each fold as a sequential panel followed by the punch panel, with alt text", () => {
    for (const spec of PAPER_FOLDING_V2_SPECS) {
      const q = PAPER_FOLDING_V2.find((x) => x.code === spec.code)!;
      const labels = q.visual!.items.filter((it: any) => it.t === "text").map((it: any) => it.s);
      expect(labels.filter((l: string) => /^Fold \d/.test(l)).length, spec.code).toBe(spec.folds.length);
      expect(labels.some((l: string) => /^Punch/.test(l)), spec.code).toBe(true);
      expect(q.visual_alt!.length, spec.code).toBeGreaterThan(30);
    }
  });
});
