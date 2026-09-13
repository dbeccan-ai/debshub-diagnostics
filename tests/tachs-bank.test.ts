import { describe, expect, it } from "vitest";
import { BLUEPRINT_V1, SAMPLE_BANK } from "../supabase/functions/tachs-engine/sample-bank.ts";

const SECTION_COUNTS: Record<string, number> = {
  reading: 50, written_expression: 50, mathematics: 50,
  figure_matrices: 20, paper_folding: 15, figure_classification: 15,
};

describe("TACHS pilot item bank", () => {
  it("contains exactly 200 items", () => {
    expect(SAMPLE_BANK.length).toBe(200);
  });

  it("matches the D.E.Bs pilot blueprint allocation per section", () => {
    for (const [key, count] of Object.entries(SECTION_COUNTS)) {
      expect(SAMPLE_BANK.filter((q) => q.section_key === key).length, key).toBe(count);
    }
  });

  it("has 130 total testing minutes across six sections", () => {
    expect(BLUEPRINT_V1.sections.length).toBe(6);
    expect(BLUEPRINT_V1.sections.reduce((s, x) => s + x.time_minutes, 0)).toBe(130);
    expect(BLUEPRINT_V1.sections.reduce((s, x) => s + x.item_count, 0)).toBe(200);
  });

  it("uses unique stable IDs", () => {
    const codes = SAMPLE_BANK.map((q) => q.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("gives every item four distinct options with exactly one valid key", () => {
    for (const q of SAMPLE_BANK) {
      expect(q.choices.length, q.code).toBe(4);
      const keys = q.choices.map((c) => c.key);
      expect(new Set(keys).size, q.code).toBe(4);
      expect(keys, q.code).toContain(q.correct_key);
      const texts = q.choices.map((c) => c.text).filter(Boolean);
      if (texts.length === 4) expect(new Set(texts).size, q.code).toBe(4);
    }
  });

  it("tags every item with skill, difficulty, and a rationale", () => {
    for (const q of SAMPLE_BANK) {
      expect(q.skill?.length, q.code).toBeGreaterThan(0);
      expect([1, 2, 3], q.code).toContain(q.difficulty);
      expect(q.rationale?.trim().length, q.code).toBeGreaterThan(0);
      expect(q.stem?.trim().length, q.code).toBeGreaterThan(0);
    }
  });

  it("gives every visual item an accessible text alternative", () => {
    for (const q of SAMPLE_BANK) {
      if (q.visual) expect(q.visual_alt?.trim().length, q.code).toBeGreaterThan(0);
    }
  });

  it("satisfies every section skill quota exactly", () => {
    for (const section of BLUEPRINT_V1.sections) {
      const items = SAMPLE_BANK.filter((q) => q.section_key === section.key);
      for (const [skill, quota] of Object.entries(section.skill_quotas)) {
        expect(items.filter((q) => q.skill === skill).length, `${section.key}/${skill}`).toBe(quota);
      }
      const known = new Set(Object.keys(section.skill_quotas));
      for (const q of items) expect(known.has(q.skill), `${q.code} unknown skill ${q.skill}`).toBe(true);
    }
  });

  it("offers all three difficulty levels in every section so adaptive routing can move", () => {
    for (const section of BLUEPRINT_V1.sections) {
      const diffs = new Set(SAMPLE_BANK.filter((q) => q.section_key === section.key).map((q) => q.difficulty));
      expect(diffs.size, section.key).toBeGreaterThanOrEqual(2);
    }
  });
});
