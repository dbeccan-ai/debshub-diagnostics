// Parent report architecture: strict surface separation, Diagnostic Hub tier mapping, TACHS program
// config, consultant-controlled content, and "unapproved = no scores".
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getTierFromScore, TIER_THRESHOLDS } from "../src/lib/tierConfig";
import {
  TACHS_PROGRAMS, PROGRAM_FOR_TIER, PROGRAM_KEYS, TACHS_TIER_THRESHOLDS, TACHS_TIERS, tachsTierFor, programForAccuracy, usd,
} from "../supabase/functions/_shared/tachs-programs.ts";
import {
  defaultParentReportContent, parentReportView, sanitizeParentReportContent, sectionScores, findForbiddenParentKeys, findForbiddenParentPhrases,
  parentReportEmailHtml, canEditParentContent, PARENT_REPORT_TITLE,
} from "../supabase/functions/_shared/tachs-report.ts";
import { STORED_RESULTS } from "./tachs-report-safety.test";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const INTERNAL_TERMS = /correct_key|rationale|selected_key|difficulty_path|\breview\b|carryover|blueprint|test_mode|TEST MODE|report_status|REPORT_STATUS_LABEL|report_notes|reviewed_by|approved_by|PACING|time_used|ended_by|total_presented|item_count|working_band|pending_interpretation|Pilot|Admin viewing|Internal \(admin-only\)|Show item review/;

describe("A. strict surface separation", () => {
  const page = strip(readFileSync("src/pages/TachsResults.tsx", "utf8"));
  it("parent page source has no internal review/workflow/bank/timing terms and no lucide icons", () => {
    expect(page).not.toMatch(INTERNAL_TERMS);
    expect(page).not.toMatch(/from "lucide-react"/);
    expect(page).not.toMatch(/data\.results|data\.review|data\.carryover|showInternal/);
  });
  it("parent page shows the six-section structure and the 'being prepared' state", () => {
    expect(page).toContain("Your reviewed report is being prepared");
    for (const h of ["1. Student Summary", "2. Section Results", "3. D.E.Bs Consultant Interpretation", "4. Recommended Next-Step Plan", "5. Recommended Program &amp; Pricing", "Schedule Enrollment Call"]) expect(page).toContain(h);
    expect(page).toMatch(/TableCaption/);
  });
  it("the parent results type carries no internal fields", () => {
    const lib = readFileSync("src/lib/tachs.ts", "utf8");
    const t = strip(lib.slice(lib.indexOf("export interface TachsResultsResponse"), lib.indexOf("export interface TachsReviewItem")));
    expect(t).not.toMatch(/results\?|review\?|carryover|report_status|test_mode|blueprint_version|email|user_id|started_at/);
  });
  it("admin detail page keeps the item audit, keys, rationales and bank notes", () => {
    const admin = readFileSync("src/pages/AdminTachs.tsx", "utf8");
    expect(admin).toMatch(/Answer audit/);
    expect(admin).toMatch(/Rationale/);
    expect(admin).toMatch(/detail\.carryover\?\.flagged/);
    expect(admin).toMatch(/data-testid="parent-content-editor"/);
  });
});

describe("B. Diagnostic Hub tier system", () => {
  it("TACHS tier thresholds equal the centralized tierConfig for every score 0..100", () => {
    expect(TACHS_TIER_THRESHOLDS.GREEN).toBe(TIER_THRESHOLDS.GREEN);
    expect(TACHS_TIER_THRESHOLDS.YELLOW).toBe(TIER_THRESHOLDS.YELLOW);
    for (let s = 0; s <= 100; s++) expect(tachsTierFor(s)).toBe(getTierFromScore(s));
    expect(TACHS_TIERS.green).toMatchObject({ badge: "Tier 1", label: "Demonstrated Mastery", range: "85–100%" });
    expect(TACHS_TIERS.yellow).toMatchObject({ badge: "Tier 2", label: "Strengthening Zone", range: "66–84%" });
    expect(TACHS_TIERS.red).toMatchObject({ badge: "Tier 3", label: "Priority Intervention Required", range: "0–65%" });
  });
  it("always yields exactly six section rows in fixed order, even with missing sections", () => {
    const rows = sectionScores({ sections: [{ section_key: "mathematics", accuracy: 91 }] });
    expect(rows.map((r) => r.section_key)).toEqual(["reading", "written_expression", "mathematics", "figure_matrices", "paper_folding", "figure_classification"]);
    expect(rows[2]).toMatchObject({ accuracy: 91, tier: "green", tier_badge: "Tier 1" });
    expect(rows[0]).toMatchObject({ accuracy: 0, tier: "red" });
  });
});

describe("D. TACHS program / pricing configuration", () => {
  it("maps each tier to the right program, duration, cadence and price", () => {
    expect(TACHS_PROGRAMS[PROGRAM_FOR_TIER.green]).toMatchObject({ name: "TACHS Strategy & Acceleration", duration_weeks: 6, sessions_per_week: 2, total_cents: 90_000, installments: { count: 2, amount_cents: 45_000 } });
    expect(TACHS_PROGRAMS[PROGRAM_FOR_TIER.yellow]).toMatchObject({ name: "TACHS Targeted Skill Builder", duration_weeks: 10, sessions_per_week: 2, total_cents: 150_000, installments: { count: 3, amount_cents: 50_000 } });
    expect(TACHS_PROGRAMS[PROGRAM_FOR_TIER.red]).toMatchObject({ name: "TACHS Intensive Readiness — Phase 1", duration_weeks: 16, sessions_per_week: 2, total_cents: 240_000, installments: { count: 4, amount_cents: 60_000 } });
    expect(programForAccuracy(92).name).toBe("TACHS Strategy & Acceleration");
    expect(programForAccuracy(85).name).toBe("TACHS Strategy & Acceleration");
    expect(programForAccuracy(84).name).toBe("TACHS Targeted Skill Builder");
    expect(programForAccuracy(66).name).toBe("TACHS Targeted Skill Builder");
    expect(programForAccuracy(65).name).toBe("TACHS Intensive Readiness — Phase 1");
    expect(programForAccuracy(0).name).toBe("TACHS Intensive Readiness — Phase 1");
    expect(usd(240_000)).toBe("$2,400");
  });
  it("payment URLs are null pending owner approval and no generic Math/ELA Stripe links are reused", () => {
    for (const k of PROGRAM_KEYS) expect(TACHS_PROGRAMS[k].payment_url).toBeNull();
    const src = readFileSync("supabase/functions/_shared/tachs-programs.ts", "utf8") + readFileSync("src/pages/TachsResults.tsx", "utf8");
    expect(src).not.toMatch(/buy\.stripe\.com|checkout\.stripe\.com|PAYMENT_PLANS|TIER_CTAS/);
    expect(TACHS_PROGRAMS.tachs_intensive_phase1.honesty_note).toMatch(/further preparation/i);
  });
});

describe("E. consultant-controlled content", () => {
  it("generates safe defaults from results with no item-level data", () => {
    const d = defaultParentReportContent(STORED_RESULTS);
    expect(d.recommended_program_key).toBe("tachs_intensive_phase1");
    expect(d.priority_sections).toEqual(["mathematics", "paper_folding"]);
    expect(d.approved_for_parent_at).toBeNull();
    expect(d.price_override_cents).toBeNull();
    expect(d.customized_next_steps.length).toBeGreaterThanOrEqual(5);
    expect(d.interpretation).toMatch(/Tier 3/);
    expect(d.interpretation).toMatch(/Written Expression/);
    expect(findForbiddenParentKeys(d)).toEqual([]);
    expect(findForbiddenParentPhrases(JSON.stringify(d))).toEqual([]);
    expect(JSON.stringify(d)).not.toMatch(/inference|algebra|Rebuild the two weakest|Developing/);
  });
  it("sanitizer rejects unexpected fields, bad programs and internal vocabulary", () => {
    expect(sanitizeParentReportContent({ interpretation: "ok", correct_key: "B" }, STORED_RESULTS).ok).toBe(false);
    expect(sanitizeParentReportContent({ recommended_program_key: "math_tier1" }, STORED_RESULTS).ok).toBe(false);
    expect(sanitizeParentReportContent({ interpretation: "The blueprint v2 carry-over items were hard." }, STORED_RESULTS).ok).toBe(false);
    expect(sanitizeParentReportContent({ price_override_cents: 12.5 }, STORED_RESULTS).ok).toBe(false);
    const ok = sanitizeParentReportContent({ interpretation: "Strong writing; build math first.", priority_sections: ["mathematics"], recommended_program_key: "tachs_skill_builder", customized_next_steps: ["Step one"], price_override_cents: 120000, approved_for_parent_at: "2020-01-01" }, STORED_RESULTS);
    expect(ok.ok).toBe(true);
    if (ok.ok) { expect(ok.content.approved_for_parent_at).toBeNull(); expect(ok.content.price_override_cents).toBe(120000); }
  });
  it("edits are allowed only before approval", () => {
    expect(canEditParentContent("draft")).toBe(true); expect(canEditParentContent("reviewed")).toBe(true);
    expect(canEditParentContent("approved")).toBe(false); expect(canEditParentContent("sent")).toBe(false);
  });
  it("the released view renders the saved content and price override, never internal notes", () => {
    const content = { interpretation: "Custom interpretation.", priority_sections: ["mathematics"], recommended_program_key: "tachs_skill_builder" as const, customized_next_steps: ["A", "B"], price_override_cents: 120000, approved_for_parent_at: "2026-09-13T20:00:00Z" };
    const view = parentReportView({ ...STORED_RESULTS, report_notes: "INTERNAL NOTE" }, content, "2026-09-13T19:00:00Z")!;
    expect(view.title).toBe(PARENT_REPORT_TITLE);
    expect(view.interpretation).toBe("Custom interpretation.");
    expect(view.priority_sections).toEqual(["Mathematics"]);
    expect(view.plan).toEqual(["A", "B"]);
    expect(view.program).toMatchObject({ name: "TACHS Targeted Skill Builder", total_cents: 120000, price_label: "$1,200", installments_label: "3 payments of $400" });
    const html = parentReportEmailHtml({ firstName: "M", gradeLevel: 8, completedOn: "x", attemptId: "id", report: view });
    expect(JSON.stringify(view) + html).not.toMatch(/INTERNAL NOTE/);
    expect(findForbiddenParentKeys(view)).toEqual([]);
  });
});

describe("F. engine contract: unapproved parent route withholds scores", () => {
  const engine = strip(readFileSync("supabase/functions/tachs-engine/index.ts", "utf8"));
  it("returns only a message before approval and never internal fields from results", () => {
    const block = engine.slice(engine.indexOf('if (action === "results")'), engine.indexOf('if (freshAttempt.status !== "in_progress")'));
    const preRelease = block.slice(0, block.indexOf("const full ="));
    expect(preRelease).toMatch(/released: false, message: REPORT_PREPARING_MESSAGE/);
    expect(preRelease).not.toMatch(/results|accuracy|report\b/);
    expect(block).not.toMatch(/blueprint_version|test_mode|user_id|started_at|email_status|report_status:/);
  });
  it("approval snapshots content with approved_for_parent_at and returning to draft clears it", () => {
    expect(engine).toMatch(/approved_for_parent_at: now\(\)\.toISOString\(\)/);
    expect(engine).toMatch(/approved_for_parent_at: null/);
  });
});
