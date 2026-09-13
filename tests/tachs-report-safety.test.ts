import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  acknowledgmentEmailHtml, canSendParentReport, canTransitionReport, carryoverSummary, findForbiddenParentKeys,
  parentReportEmailHtml, parentReportView, skillLabel, BAND_WORKING_LABEL,
} from "../supabase/functions/_shared/tachs-report.ts";
import { skillLabel as engineSkillLabel } from "../supabase/functions/tachs-engine/logic.ts";
import { skillLabel as uiSkillLabel } from "../src/lib/tachs";

// A realistic stored results blob including everything that must NOT reach parents.
const STORED_RESULTS = {
  version: 2, blueprint_version: 2, generated_at: "2026-09-13T18:56:31Z",
  overall_accuracy: 61, total_presented: 200, total_correct: 122, total_time_seconds: 7200,
  band: { key: "developing", label: "Developing", color: "#d97706" },
  next_steps: "Rebuild the two weakest sections before adding timed practice.",
  focus_sections: ["mathematics", "paper_folding"],
  sections: [
    { section_key: "reading", item_count: 50, presented: 50, answered: 50, correct: 40, accuracy: 80, time_limit_seconds: 2100, time_used_seconds: 2100, pace_seconds_per_item: 42, allotted_seconds_per_item: 42, submit_reason: "timeout", avg_difficulty: 2.1, max_difficulty: 3, difficulty_path: [{ position: 1, difficulty: 2, skill: "inference" }], skills: { inference: { presented: 10, answered: 10, correct: 8 } } },
    { section_key: "mathematics", item_count: 50, presented: 50, answered: 46, correct: 20, accuracy: 40, time_limit_seconds: 2400, time_used_seconds: 900, pace_seconds_per_item: 18, allotted_seconds_per_item: 48, submit_reason: "student", avg_difficulty: 1.4, max_difficulty: 2, difficulty_path: [{ position: 1, difficulty: 2, skill: "algebra" }], skills: { algebra: { presented: 10, answered: 9, correct: 3 } } },
  ],
  skills: [{ section_key: "reading", skill: "inference", presented: 10, correct: 8, accuracy: 80 }],
  strengths: [], gaps: [],
  evidence: { by_difficulty: [], sections: [], skills: [], groups: [], min_sample: 3, note: "x" },
  disclaimer: "d",
};

const SVG_TOKENS = /svgPrint|svgStrengths|svgGaps|<svg|\bsvg\b/i;
const ANSWER_LEAK = /correct_key|rationale|selected_key|"stem"|difficulty_path|Correct answer|Why:/i;

describe("parent preliminary report view", () => {
  const view = parentReportView(STORED_RESULTS)!;
  it("keeps raw accuracy and pacing transparent", () => {
    expect(view.overall_accuracy).toBe(61);
    expect(view.sections.map((s) => [s.label, s.accuracy, s.pacing, s.ended_by])).toEqual([
      ["Reading", 80, "on_pace", "timer"], ["Mathematics", 40, "rushed", "student"],
    ]);
  });
  it("labels the band as an internal working interpretation pending consultant review", () => {
    expect(view.working_band?.label).toBe("Developing");
    expect(view.working_band?.interpretation).toBe(BAND_WORKING_LABEL);
    expect(view.pending_interpretation).toMatch(/consultant review/i);
    expect(view.pending_interpretation).toMatch(/not .*admission prediction/i);
  });
  it("contains no answers, rationales, question text, adaptive paths, evidence or next-step plans", () => {
    expect(findForbiddenParentKeys(view)).toEqual([]);
    expect(JSON.stringify(view)).not.toMatch(ANSWER_LEAK);
    expect(JSON.stringify(view)).not.toContain("Rebuild the two weakest");
  });
  it("safety scanner catches leaked fields", () => {
    expect(findForbiddenParentKeys({ a: [{ correct_key: "B" }], b: { nested: { rationale: "x" } } }).sort()).toEqual(["correct_key", "rationale"]);
    expect(findForbiddenParentKeys(STORED_RESULTS)).toContain("difficulty_path");
  });
});

describe("completion acknowledgment email", () => {
  const html = acknowledgmentEmailHtml({ firstName: "Mckenzie", completedOn: "September 13, 2026" });
  it("contains no scores, bands, answers or rationales", () => {
    expect(html).toMatch(/assessment received/i);
    expect(html).toMatch(/pending consultant review/i);
    expect(html).not.toMatch(/%/);
    expect(html).not.toMatch(/Developing|Approaching|Strong Readiness|Building Foundations/);
    expect(html).not.toMatch(ANSWER_LEAK);
  });
  it("has no SVG placeholders or icon tokens", () => { expect(html).not.toMatch(SVG_TOKENS); });
});

describe("approved parent report email", () => {
  const html = parentReportEmailHtml({ firstName: "Mckenzie", gradeLevel: 8, completedOn: "September 13, 2026", attemptId: "abc", report: parentReportView(STORED_RESULTS)!, blueprintVersion: 2 });
  it("shows section accuracy and pacing but no answer data", () => {
    expect(html).toContain("80%");
    expect(html).toContain("Faster than allotted");
    expect(html).toContain(BAND_WORKING_LABEL);
    expect(html).not.toMatch(ANSWER_LEAK);
    expect(html).not.toMatch(/inference|algebra/i); // no skill/adaptive internals
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
  it("only approved (or already sent) reports can be emailed", () => {
    expect(canSendParentReport("draft")).toBe(false);
    expect(canSendParentReport("reviewed")).toBe(false);
    expect(canSendParentReport("approved")).toBe(true);
    expect(canSendParentReport("sent")).toBe(true);
  });
});

describe("server-side enforcement (source contracts)", () => {
  const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
  const sender = readFileSync("supabase/functions/send-tachs-results/index.ts", "utf8");
  it("completion sends only the acknowledgment and leaves the report in draft", () => {
    expect(engine).toMatch(/report_status: "draft", email_status: "pending"/);
    expect(engine).toMatch(/await sendReportEmail\(attemptId, "acknowledgment"\)/);
    expect(engine).not.toMatch(/await sendReportEmail\(attemptId\);/);
  });
  it("students never receive review/keys from the results action; admins do", () => {
    expect(engine).toMatch(/if \(!admin\) return json\(\{ \.\.\.base, viewer: "student", report \}\)/);
    const resultsBlock = engine.slice(engine.indexOf('if (action === "results")'), engine.indexOf('viewer: "admin"'));
    const beforeAdmin = resultsBlock.slice(0, resultsBlock.indexOf('viewer: "student"'));
    expect(beforeAdmin).not.toMatch(/correct_key|rationale/);
    expect(engine).toMatch(/action === "admin_report_transition"/);
    expect(engine).toMatch(/if \(!canSendParentReport\(from\)\) return json/);
  });
  it("legacy resend is gated behind approval and the sender re-checks status", () => {
    expect(engine).toMatch(/admin_resend_email[\s\S]*?canSendParentReport\(a\.report_status \?\? "draft"\)/);
    expect(sender).toMatch(/if \(!canSendParentReport\(attempt\.report_status \?\? "draft"\)\)/);
    expect(sender).toMatch(/findForbiddenParentKeys\(report\)/);
    expect(sender).not.toMatch(/results\.strengths|results\.gaps|results\.next_steps|rationale|correct_key/);
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
  it("parent results page has no icon components, answer keys or rationales in the parent view", () => {
    const page = readFileSync("src/pages/TachsResults.tsx", "utf8");
    expect(page).not.toMatch(/from "lucide-react"/);
    expect(page).not.toMatch(/svgPrint|svgStrengths|svgGaps/);
    const parentView = page.slice(0, page.indexOf('viewer === "admin" && data.results'));
    expect(parentView).not.toMatch(/correct_key|rationale|difficulty_path|review\./);
    expect(page).toMatch(/TableCaption/);
  });
  it("no literal SVG placeholder strings remain in TACHS source or templates", () => {
    for (const f of ["src/pages/TachsResults.tsx", "src/pages/AdminTachs.tsx", "supabase/functions/_shared/tachs-report.ts", "supabase/functions/send-tachs-results/index.ts"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/svgPrint|svgStrengths|svgGaps|<svg/);
    }
  });
});

describe("carry-over bank flag", () => {
  it("flags V2-R / V2-W attempts and leaves revised-bank attempts clean", () => {
    const f = carryoverSummary(["V2-R-01", "V2-W-07", "MA2-10", null]);
    expect(f.flagged).toBe(true); expect(f.v2r).toBe(1); expect(f.v2w).toBe(1);
    expect(f.note).toMatch(/not be treated as the final revised-bank baseline/);
    expect(carryoverSummary(["RD2-01", "WR2-02"]).flagged).toBe(false);
  });
});
