import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  acknowledgmentEmailHtml, canSendParentReport, canTransitionReport, carryoverSummary, findForbiddenParentKeys, findForbiddenParentPhrases,
  parentReportEmailHtml, parentReportView, skillLabel, REPORT_PREPARING_MESSAGE,
} from "../supabase/functions/_shared/tachs-report.ts";
import { skillLabel as engineSkillLabel } from "../supabase/functions/tachs-engine/logic.ts";
import { skillLabel as uiSkillLabel } from "../src/lib/tachs";
import { STORED_RESULTS } from "./tachs-fixtures";

const SVG_TOKENS = /svgPrint|svgStrengths|svgGaps|<svg|\bsvg\b/i;
const ANSWER_LEAK = /correct_key|rationale|selected_key|"stem"|difficulty_path|Correct answer|Why:/i;

describe("released parent report view", () => {
  const view = parentReportView(STORED_RESULTS, null, "2026-09-13T19:00:00Z")!;
  it("has exactly six section scores with tiers plus an overall tier", () => {
    expect(view.sections).toHaveLength(6);
    expect(view.sections.map((s) => [s.label, s.accuracy, s.tier_badge])).toEqual([
      ["Reading", 80, "Tier 2"], ["Written Expression", 88, "Tier 1"], ["Mathematics", 40, "Tier 3"],
      ["Figure Matrices", 70, "Tier 2"], ["Paper Folding", 40, "Tier 3"], ["Figure Classification", 87, "Tier 1"],
    ]);
    expect(view.overall).toMatchObject({ accuracy: 61, tier: "red", tier_badge: "Tier 3", tier_label: "Priority Intervention Required" });
  });
  it("contains no answers, rationales, question text, adaptive paths, bands, timing, counts, bank or workflow fields", () => {
    expect(findForbiddenParentKeys(view)).toEqual([]);
    expect(findForbiddenParentPhrases(JSON.stringify(view))).toEqual([]);
    expect(JSON.stringify(view)).not.toMatch(ANSWER_LEAK);
    expect(JSON.stringify(view)).not.toMatch(/Developing|working|blueprint|pacing|time_used|presented|Rebuild the two weakest/);
  });
  it("safety scanner catches leaked fields", () => {
    expect(findForbiddenParentKeys({ a: [{ correct_key: "B" }], b: { nested: { rationale: "x" } } }).sort()).toEqual(["correct_key", "rationale"]);
    for (const k of ["difficulty_path", "blueprint_version", "band", "total_presented", "time_used_seconds", "evidence", "next_steps"]) {
      expect(findForbiddenParentKeys(STORED_RESULTS)).toContain(k);
    }
    for (const k of ["carryover", "test_mode", "report_status", "report_notes", "report_reviewed_by", "report_approved_by", "code", "bank", "item_count", "pacing"]) {
      expect(findForbiddenParentKeys({ [k]: 1 })).toEqual([k]);
    }
    expect(findForbiddenParentPhrases("Pilot blueprint v2 carry-over")).not.toEqual([]);
  });
});

describe("completion acknowledgment email", () => {
  const html = acknowledgmentEmailHtml({ firstName: "Mckenzie", completedOn: "September 13, 2026" });
  it("contains no scores, bands, answers, rationales or workflow wording", () => {
    expect(html).toMatch(/assessment received/i);
    expect(html).toMatch(/being prepared/i);
    expect(html).not.toMatch(/%/);
    expect(html).not.toMatch(/Developing|Approaching|Strong Readiness|Building Foundations/);
    expect(html).not.toMatch(ANSWER_LEAK);
    expect(findForbiddenParentPhrases(html)).toEqual([]);
  });
  it("has no SVG placeholders or icon tokens", () => { expect(html).not.toMatch(SVG_TOKENS); });
});

describe("released parent report email", () => {
  const html = parentReportEmailHtml({ firstName: "Mckenzie", gradeLevel: 8, completedOn: "September 13, 2026", attemptId: "abc", report: parentReportView(STORED_RESULTS, null, null)! });
  it("shows section scores and tiers, interpretation, plan and program but no internal data", () => {
    expect(html).toContain("TACHS Diagnostic Results &amp; Recommended Plan");
    expect(html).toContain("80%");
    expect(html).toContain("Tier 3");
    expect(html).toContain("TACHS Intensive Readiness — Phase 1");
    expect(html).toContain("$2,400.00"); expect(html).toContain("$2,291.76");
    expect(html).toContain("Schedule Enrollment Call");
    expect(html).not.toMatch(ANSWER_LEAK);
    expect(html).not.toMatch(/inference|algebra:/i); // no skill/adaptive internals
    expect(html).not.toMatch(/Faster than allotted|Time used|per item|of 50|Pilot|blueprint|working band|pending consultant interpretation/i);
    expect(html).not.toMatch(/\/admin\//);
    expect(findForbiddenParentPhrases(html)).toEqual([]);
  });
  it("uses accessible table markup and no SVG tokens", () => {
    expect(html).toMatch(/<th scope="col"/);
    expect(html).toMatch(/<th scope="row"/);
    expect(html).toMatch(/<caption/);
    expect(html).not.toMatch(SVG_TOKENS);
  });
});

describe("report approval workflow", () => {
  it("only moves draft -> reviewed -> approved -> sent", () => {
    expect(canTransitionReport("draft", "reviewed")).toBe(true);
    expect(canTransitionReport("reviewed", "approved")).toBe(true);
    expect(canTransitionReport("approved", "sent")).toBe(true);
    expect(canTransitionReport("draft", "approved")).toBe(false);
    expect(canTransitionReport("draft", "sent")).toBe(false);
    expect(canTransitionReport("reviewed", "sent")).toBe(false);
  });
  it("only approved (or already sent) reports can be released or emailed", () => {
    expect(canSendParentReport("draft")).toBe(false);
    expect(canSendParentReport("reviewed")).toBe(false);
    expect(canSendParentReport("approved")).toBe(true);
    expect(canSendParentReport("sent")).toBe(true);
    expect(REPORT_PREPARING_MESSAGE).toMatch(/being prepared/);
  });
});

describe("server-side enforcement (source contracts)", () => {
  const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
  const sender = readFileSync("supabase/functions/send-tachs-results/index.ts", "utf8");
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  it("completion sends only the acknowledgment and leaves the report in draft", () => {
    expect(engine).toMatch(/report_status: "draft", email_status: "pending"/);
    expect(engine).toMatch(/await sendReportEmail\(attemptId, "acknowledgment"\)/);
    expect(engine).not.toMatch(/await sendReportEmail\(attemptId\);/);
  });
  it("the results action withholds scores before approval and never returns internal detail to anyone", () => {
    const resultsBlock = strip(engine.slice(engine.indexOf('if (action === "results")'), engine.indexOf('if (freshAttempt.status !== "in_progress")')));
    expect(resultsBlock).toMatch(/if \(!released && !admin\) return json\(\{ \.\.\.base, released: false, message: REPORT_PREPARING_MESSAGE \}\)/);
    expect(resultsBlock).toMatch(/findForbiddenParentKeys\(report\)/);
    expect(resultsBlock).toMatch(/findForbiddenParentPhrases/);
    expect(resultsBlock).not.toMatch(/correct_key|rationale|\breview\b|carryover|results: full|tachs_responses|tachs_questions|blueprint_version|test_mode|report_notes|email_status/);
    expect(engine).toMatch(/action === "admin_report_transition"/);
    expect(engine).toMatch(/if \(!canSendParentReport\(from\)\) return json/);
  });
  it("item review, keys and rationales are served only by admin_detail behind the admin check", () => {
    const detailBlock = engine.slice(engine.indexOf('if (action === "admin_detail")'), engine.indexOf('if (action === "admin_parent_report_content")'));
    expect(detailBlock).toMatch(/if \(!admin\) return json\(\{ error: "Forbidden" \}, 403\)/);
    expect(detailBlock).toMatch(/correct_key/);
    expect(detailBlock).toMatch(/rationale/);
    expect(detailBlock).toMatch(/carryoverSummary/);
  });
  it("parent content edits are admin-only, validated, and locked after approval", () => {
    const block = engine.slice(engine.indexOf('if (action === "admin_parent_report_content")'), engine.indexOf('if (action === "admin_report_transition")'));
    expect(block).toMatch(/if \(!admin\) return json\(\{ error: "Forbidden" \}, 403\)/);
    expect(block).toMatch(/canEditParentContent/);
    expect(block).toMatch(/sanitizeParentReportContent\(body\.content, a\.results\)/);
  });
  it("the sender re-checks approval, renders only the safe structure, and never reads internal notes", () => {
    expect(sender).toMatch(/if \(!canSendParentReport\(attempt\.report_status \?\? "draft"\)\)/);
    expect(sender).toMatch(/findForbiddenParentKeys\(report\)/);
    expect(sender).toMatch(/findForbiddenParentPhrases\(html\)/);
    expect(strip(sender)).not.toMatch(/results\.strengths|results\.gaps|results\.next_steps|rationale|correct_key|report_notes|blueprint_version|carryover/);
    expect(sender).not.toMatch(/bcc\s*:/i);
  });
});

describe("labels and screen/print output", () => {
  it("formats part-whole correctly everywhere", () => {
    for (const fn of [skillLabel, engineSkillLabel, uiSkillLabel]) {
      expect(fn("size_position_partwhole")).toBe("Size, Position & Part-Whole");
      expect(fn("vocabulary_in_context")).toBe("Vocabulary in Context");
      expect(fn("main_idea")).toBe("Main Idea");
    }
  });
  it("no literal SVG placeholder strings remain in TACHS source or templates", () => {
    for (const f of ["src/pages/TachsResults.tsx", "src/pages/AdminTachs.tsx", "supabase/functions/_shared/tachs-report.ts", "supabase/functions/send-tachs-results/index.ts"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/svgPrint|svgStrengths|svgGaps|<svg/);
    }
  });
});

describe("carry-over bank flag (admin-only)", () => {
  it("flags V2-R / V2-W attempts and leaves revised-bank attempts clean", () => {
    const f = carryoverSummary(["V2-R-01", "V2-W-07", "MA2-10", null]);
    expect(f.flagged).toBe(true); expect(f.v2r).toBe(1); expect(f.v2w).toBe(1);
    expect(f.note).toMatch(/Do not treat it as the final revised-bank baseline/);
    expect(carryoverSummary(["RD2-01", "WR2-02"]).flagged).toBe(false);
  });
});
