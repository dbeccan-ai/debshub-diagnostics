import { describe, expect, it } from "vitest";
import { advanceAdaptive, bandFor, DISCLAIMER } from "../supabase/functions/tachs-engine/logic.ts";

describe("readiness bands", () => {
  it("maps documented D.E.Bs pilot thresholds", () => {
    expect(bandFor(95).key).toBe("strong");
    expect(bandFor(85).key).toBe("strong");
    expect(bandFor(84).key).toBe("approaching");
    expect(bandFor(70).key).toBe("approaching");
    expect(bandFor(69).key).toBe("developing");
    expect(bandFor(55).key).toBe("developing");
    expect(bandFor(54).key).toBe("foundations");
    expect(bandFor(0).key).toBe("foundations");
  });

  it("always returns a labelled band with a next-step plan", () => {
    for (let i = 0; i <= 100; i++) {
      const b = bandFor(i);
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.plan.length).toBeGreaterThan(0);
    }
  });

  it("states the preliminary, non-official disclaimer", () => {
    expect(DISCLAIMER).toMatch(/preliminary D\.E\.Bs readiness result/i);
    expect(DISCLAIMER).toMatch(/not an official TACHS/i);
  });
});

describe("adaptive routing", () => {
  const start = { difficulty: 2, streakCorrect: 0, streakIncorrect: 0 };

  it("holds difficulty after a single correct answer", () => {
    const s = advanceAdaptive(start, true);
    expect(s.difficulty).toBe(2);
    expect(s.streakCorrect).toBe(1);
    expect(s.transition).toBeNull();
  });

  it("raises difficulty after two consecutive correct answers and resets the streak", () => {
    const s = advanceAdaptive(advanceAdaptive(start, true), true);
    expect(s.difficulty).toBe(3);
    expect(s.streakCorrect).toBe(0);
    expect(s.transition).toBe("up");
  });

  it("lowers difficulty after two consecutive incorrect answers", () => {
    const s = advanceAdaptive(advanceAdaptive(start, false), false);
    expect(s.difficulty).toBe(1);
    expect(s.transition).toBe("down");
  });

  it("resets the streak when the run is broken", () => {
    const s = advanceAdaptive(advanceAdaptive(start, true), false);
    expect(s.difficulty).toBe(2);
    expect(s.streakCorrect).toBe(0);
    expect(s.streakIncorrect).toBe(1);
  });

  it("never moves outside the 1-3 difficulty range", () => {
    let s = { difficulty: 3, streakCorrect: 0, streakIncorrect: 0 };
    for (let i = 0; i < 10; i++) s = advanceAdaptive(s, true);
    expect(s.difficulty).toBe(3);
    let t = { difficulty: 1, streakCorrect: 0, streakIncorrect: 0 };
    for (let i = 0; i < 10; i++) t = advanceAdaptive(t, false);
    expect(t.difficulty).toBe(1);
  });

  it("holds state when the previous item was left unanswered", () => {
    const s = advanceAdaptive({ difficulty: 2, streakCorrect: 1, streakIncorrect: 0 }, null);
    expect(s.difficulty).toBe(2);
    expect(s.streakCorrect).toBe(1);
    expect(s.transition).toBeNull();
  });
});

import { mathReadiness, selectNextQuestion, seededRng, simulateSection } from "../supabase/functions/tachs-engine/logic.ts";
import { BLUEPRINT_V2, BANK_V2 } from "../supabase/functions/tachs-engine/sample-bank.ts";

const poolFor = (key: string) => BANK_V2.filter((q) => q.section_key === key).map((q) => ({ id: q.code, skill: q.skill, difficulty: q.difficulty }));
const sectionFor = (key: string) => BLUEPRINT_V2.sections.find((s) => s.key === key)!;

describe("adaptive selection (v2 pools)", () => {
  it("never repeats an item and never skips a required domain", () => {
    for (const key of ["mathematics", "paper_folding"]) {
      const sec = sectionFor(key);
      for (const seed of [1, 7, 42]) {
        const sim = simulateSection(poolFor(key), sec.skill_quotas, sec.item_count, () => 0.5, seededRng(seed));
        expect(sim.presented.length).toBe(sec.item_count);
        expect(new Set(sim.presented.map((p) => p.id)).size).toBe(sec.item_count);
        expect(sim.skillCounts).toEqual(sec.skill_quotas);
      }
    }
  });

  it("starts at level 2", () => {
    const sec = sectionFor("mathematics");
    const sim = simulateSection(poolFor("mathematics"), sec.skill_quotas, sec.item_count, () => 0.5, seededRng(3));
    expect(sim.path[0]).toBe(2);
  });

  it("gives high and low performers measurably different difficulty distributions while both meet quotas", () => {
    for (const key of ["mathematics", "paper_folding"]) {
      const sec = sectionFor(key);
      const pool = poolFor(key);
      const strong = simulateSection(pool, sec.skill_quotas, sec.item_count, () => 0.95, seededRng(11));
      const weak = simulateSection(pool, sec.skill_quotas, sec.item_count, () => 0.1, seededRng(11));
      expect(strong.skillCounts, key).toEqual(sec.skill_quotas);
      expect(weak.skillCounts, key).toEqual(sec.skill_quotas);
      expect(strong.meanDifficulty - weak.meanDifficulty, `${key} mean difficulty gap`).toBeGreaterThan(0.5);
      expect(strong.difficultyCounts[3], `${key} strong L3`).toBeGreaterThan(weak.difficultyCounts[3]);
      expect(weak.difficultyCounts[1], `${key} weak L1`).toBeGreaterThanOrEqual(strong.difficultyCounts[1]);
      // two different students should not see the same item sequence
      expect(strong.presented.map((p) => p.id).join()).not.toBe(weak.presented.map((p) => p.id).join());
    }
  });

  it("prefers the current difficulty inside open quotas, then the nearest level", () => {
    const cands = [
      { id: "a", skill: "x", difficulty: 1 }, { id: "b", skill: "x", difficulty: 3 }, { id: "c", skill: "y", difficulty: 2 },
    ];
    expect(selectNextQuestion(cands, { x: 1, y: 0 }, 3, () => 0)?.id).toBe("b");
    expect(selectNextQuestion(cands, { x: 1, y: 0 }, 2, () => 0)?.id).toBe("a"); // no level-2 x → nearest (1 before 3)
    expect(selectNextQuestion(cands, { x: 0, y: 1 }, 1, () => 0)?.id).toBe("c");
    expect(selectNextQuestion([], { x: 1 }, 2)).toBeNull();
  });
});

describe("mathematics readiness ladder", () => {
  it("aggregates by strand in Foundation → Grade 8 → Algebra I order and skips unstranded rows", () => {
    const rows = mathReadiness([
      { strand: "algebra1", is_correct: true }, { strand: "algebra1", is_correct: false },
      { strand: "foundation", is_correct: true }, { strand: null, is_correct: true }, { strand: "grade8", is_correct: null },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["foundation", "grade8", "algebra1"]);
    expect(rows[2]).toMatchObject({ presented: 2, correct: 1, accuracy: 50 });
    expect(rows[0].accuracy).toBe(100);
  });
  it("returns an empty ladder for legacy v1 responses", () => {
    expect(mathReadiness([{ strand: null, is_correct: true }])).toEqual([]);
  });
});

import { testModeQuotas, buildEvidence, sustainedCeiling } from "../supabase/functions/tachs-engine/logic";
import { BLUEPRINT_V2 } from "../supabase/functions/tachs-engine/bank-types";
import { BANK_V2, SAMPLE_BANK } from "../supabase/functions/tachs-engine/sample-bank";

describe("representative TEST MODE", () => {
  it("presents one item per skill for every v2 section", () => {
    for (const s of BLUEPRINT_V2.sections) {
      const pool = BANK_V2.filter((q) => q.section_key === s.key).length;
      const tm = testModeQuotas(s, pool);
      expect(Object.keys(tm.quotas).sort()).toEqual(Object.keys(s.skill_quotas).sort());
      expect(tm.item_count).toBe(Object.keys(s.skill_quotas).length);
      expect(Object.values(tm.quotas).reduce((a, b) => a + b, 0)).toBe(tm.item_count);
    }
  });
  it("keeps quotas consistent with item_count when capped by availability", () => {
    const tm = testModeQuotas({ skill_quotas: { a: 5, b: 3, c: 1, d: 2 }, item_count: 11 }, 2);
    expect(tm.item_count).toBe(2);
    expect(Object.values(tm.quotas).reduce((a, b) => a + b, 0)).toBe(2);
    expect(Object.keys(tm.quotas).sort()).toEqual(["a", "b"]);
  });
});

describe("scoring evidence", () => {
  const rows = [
    ...Array.from({ length: 4 }, (_, i) => ({ section_key: "reading", skill: "vocabulary_in_context", difficulty: 1, is_correct: i < 3 })),
    ...Array.from({ length: 4 }, (_, i) => ({ section_key: "reading", skill: "inference", difficulty: 2, is_correct: i < 1 })),
    { section_key: "reading", skill: "main_idea", difficulty: 3, is_correct: true },
  ];
  it("computes difficulty ceiling with a sample floor", () => {
    expect(sustainedCeiling(rows).level).toBe(1);
    expect(sustainedCeiling([{ section_key: "reading", skill: "x", difficulty: 3, is_correct: true }]).level).toBeNull();
  });
  it("flags low-sample skills and names sub-scores without claiming official scores", () => {
    const ev = buildEvidence(rows);
    expect(ev.skills.find((s) => s.skill === "main_idea")?.low_sample).toBe(true);
    expect(ev.groups.find((g) => g.key === "reading_vocabulary")?.accuracy).toBe(75);
    expect(ev.note).toMatch(/not official/i);
  });
});

describe("v1 immutability", () => {
  it("keeps the frozen v1 bank at 200 four-choice items with original codes", () => {
    expect(SAMPLE_BANK.length).toBe(200);
    expect(SAMPLE_BANK.every((q) => q.choices.length === 4 && !q.code.startsWith("V2-"))).toBe(true);
  });
});
