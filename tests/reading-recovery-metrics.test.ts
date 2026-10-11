import { describe, it, expect } from "vitest";
import {
  computeWcpm,
  computeAccuracy,
  pairPrePost,
  toCohortCsvRow,
  toCsv,
  type TranscriptMetricRow,
} from "../src/lib/readingRecoveryMetrics";

const row = (over: Partial<TranscriptMetricRow>): TranscriptMetricRow => ({
  id: "x",
  user_id: "u1",
  student_name: "Test",
  version: "A",
  final_error_count: null,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("computeWcpm", () => {
  it("computes words per minute from passage length and seconds", () => {
    expect(computeWcpm(120, 60)).toBe(120);
    expect(computeWcpm(100, 90)).toBe(67);
  });
  it("returns null without a valid duration", () => {
    expect(computeWcpm(120, null)).toBeNull();
    expect(computeWcpm(120, 0)).toBeNull();
    expect(computeWcpm(0, 60)).toBeNull();
  });
});

describe("computeAccuracy", () => {
  it("computes accuracy percentage", () => {
    expect(computeAccuracy(100, 3)).toBe(97);
    expect(computeAccuracy(50, 0)).toBe(100);
  });
  it("returns null when errors are unknown and never goes negative", () => {
    expect(computeAccuracy(100, null)).toBeNull();
    expect(computeAccuracy(10, 20)).toBe(0);
  });
});

describe("pairPrePost", () => {
  it("pairs Version A with the latest Version C and computes deltas", () => {
    const rows = [
      row({ version: "A", final_error_count: 10, wcpm: 60, created_at: "2026-01-01T00:00:00Z" }),
      row({ version: "B", final_error_count: 7, created_at: "2026-01-11T00:00:00Z" }),
      row({ version: "C", final_error_count: 4, wcpm: 85, created_at: "2026-01-22T00:00:00Z" }),
    ];
    const pair = pairPrePost(rows);
    expect(pair).not.toBeNull();
    expect(pair!.errorDelta).toBe(-6);
    expect(pair!.wcpmDelta).toBe(25);
    expect(pair!.daysBetween).toBe(21);
  });
  it("returns null when pre or post is missing", () => {
    expect(pairPrePost([row({ version: "A" })])).toBeNull();
    expect(pairPrePost([row({ version: "C" })])).toBeNull();
    expect(pairPrePost([])).toBeNull();
  });
  it("keeps deltas null when either side lacks the metric", () => {
    const pair = pairPrePost([
      row({ version: "A", final_error_count: 8, created_at: "2026-01-01T00:00:00Z" }),
      row({ version: "C", final_error_count: null, created_at: "2026-01-22T00:00:00Z" }),
    ]);
    expect(pair!.errorDelta).toBeNull();
    expect(pair!.wcpmDelta).toBeNull();
  });
});

describe("CSV export", () => {
  it("de-identifies rows (no names or user ids)", () => {
    const csvRow = toCohortCsvRow(row({ student_name: "Jane Doe", user_id: "secret-id" }), 0);
    expect(csvRow.student_ref).toBe("S001");
    expect(JSON.stringify(csvRow)).not.toContain("Jane Doe");
    expect(JSON.stringify(csvRow)).not.toContain("secret-id");
  });
  it("escapes commas and quotes", () => {
    const csv = toCsv([{ a: 'he said "hi, there"', b: 1 }]);
    expect(csv).toContain('"he said ""hi, there"""');
  });
  it("returns empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
