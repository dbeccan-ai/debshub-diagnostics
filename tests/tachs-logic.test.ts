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
    expect(bandFor(54).key).toBe("building");
    expect(bandFor(0).key).toBe("building");
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
