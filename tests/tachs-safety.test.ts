import { describe, expect, it } from "vitest";
import { isSectionLocked, maskEmail, needsGrading, sectionsShortOfTarget } from "../supabase/functions/tachs-engine/logic.ts";
import { readFileSync } from "node:fs";

const BLUEPRINT = [
  { key: "reading", item_count: 50 }, { key: "written_expression", item_count: 50 }, { key: "mathematics", item_count: 50 },
  { key: "figure_matrices", item_count: 20 }, { key: "paper_folding", item_count: 15 }, { key: "figure_classification", item_count: 15 },
];

describe("normal-mode bank coverage guard", () => {
  it("passes when every section meets its target", () => {
    const full = Object.fromEntries(BLUEPRINT.map((s) => [s.key, s.item_count]));
    expect(sectionsShortOfTarget(BLUEPRINT, full)).toEqual([]);
  });
  it("names every short section instead of silently shrinking", () => {
    const short = sectionsShortOfTarget(BLUEPRINT, { reading: 50, written_expression: 12, mathematics: 50, figure_matrices: 20, paper_folding: 15 });
    expect(short.map((s) => s.key)).toEqual(["written_expression", "figure_classification"]);
    expect(short[0]).toEqual({ key: "written_expression", available: 12, target: 50 });
  });
});

describe("timer lock", () => {
  const t = Date.parse("2026-09-13T10:00:00Z");
  it("locks a submitted section regardless of deadline", () => {
    expect(isSectionLocked({ status: "submitted", deadline_at: null }, t)).toBe(true);
  });
  it("locks once the server deadline passes and stays open before it", () => {
    expect(isSectionLocked({ status: "in_progress", deadline_at: "2026-09-13T09:59:59Z" }, t)).toBe(true);
    expect(isSectionLocked({ status: "in_progress", deadline_at: "2026-09-13T10:00:01Z" }, t)).toBe(false);
    expect(isSectionLocked({ status: "pending", deadline_at: null }, t)).toBe(false);
  });
});

describe("idempotent grading", () => {
  it("never regrades a completed attempt with stored results", () => {
    expect(needsGrading({ status: "completed", results: { overall_accuracy: 80 } })).toBe(false);
    expect(needsGrading({ status: "completed", results: null })).toBe(true);
    expect(needsGrading({ status: "in_progress", results: null })).toBe(true);
  });
});

describe("email privacy", () => {
  it("masks parent addresses for non-admin views", () => {
    expect(maskEmail("jordan@example.com")).toBe("j••••n@example.com");
    expect(maskEmail("")).toBeNull();
    expect(maskEmail(null)).toBeNull();
  });
  it("sends parent-only (no staff recipients) and never blocks grading on failure", () => {
    const sender = readFileSync("supabase/functions/send-tachs-results/index.ts", "utf8");
    expect(sender).not.toMatch(/bcc\s*:/i);
    expect(sender).not.toMatch(/dbeccan@/);
    expect(sender).toMatch(/email_status: "failed"/);
    const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
    // The email call is wrapped in try/catch and only logs on failure.
    expect(engine).toMatch(/async function sendReportEmail[\s\S]*?try \{[\s\S]*?\} catch/);
  });
});
