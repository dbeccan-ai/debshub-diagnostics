import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DiagnosticEvidenceReport } from "../src/components/DiagnosticEvidenceReport";
import { buildDiagnosticReport, flattenTestItems } from "../supabase/functions/_shared/diagnostic-report";
import { renderDiagnosticReportHtml, renderTeacherCopyHtml, renderEmailSummaryHtml, renderGeneralCertificateHtml } from "../supabase/functions/_shared/diagnostic-report-html";
import { prepareFutureBank } from "../supabase/functions/_shared/general-bank/prepare-future-bank";
import { readCanonicalTags } from "../supabase/functions/_shared/general-item-tags";
import snapshot from "../docs/general-bank/grade5-math-original.json";
import review from "../supabase/functions/_shared/general-bank/grade5-math-tags.review.json";

const attempt = { id: "synthetic", score: null, correct_answers: null, total_questions: null, completed_at: "2026-10-12T02:30:00Z", grade_level: 5 };
const responses = [
  { question_id: "a", is_correct: true },
  { question_id: "b", is_correct: false, points_awarded: 0.5, max_points: 2 },
  { question_id: "c", is_correct: null },
];
const questions = [
  { id: "a", type: "multiple-choice", question: "Round 520 to the nearest hundred", options: ["500", "600"], correct_answer: "500" },
  { id: "b", type: "open-ended", question: "Find the area", section: "Choose 2 of 3" },
  { id: "c", type: "open-ended", skill: "area", question: "Explain", section: "Choose 2 of 3" },
  { id: "d", type: "open-ended", skill: "area", question: "Explain", section: "Choose 2 of 3" },
  { id: "e", type: "open-ended", question: "Explain your solution" },
];
const r = buildDiagnosticReport({ attempt, test: { name: "Synthetic Math", test_type: "math", questions }, responses });
const forbidden = /limited evidence|inferred from wording|canonical|skill.source|skill tag|unmapped|not proof of broad|confirm with additional|bank.quality|positional IDs/i;

describe("general parent audience", () => {
  for (const [name, render] of Object.entries({ parent: renderDiagnosticReportHtml, certificate: renderGeneralCertificateHtml, email: renderEmailSummaryHtml, screen: (rep: typeof r) => renderToStaticMarkup(React.createElement(DiagnosticEvidenceReport, { report: rep })) })) {
    it(`${name} omits internal mechanics, retains scores, pending and required missing work`, () => {
      const html = render(r);
      expect(html).not.toMatch(forbidden);
      expect(html).not.toMatch(/complete mastery|Demonstrated Mastery/i);
      expect(html).toMatch(/3 points/);
      expect(html).toMatch(/review/i);
      expect(html).toMatch(/Required work incomplete/);
      expect(html).toMatch(/Reteach|Reinforce|Maintain/);
    });
    it(`${name} retains true scoring discrepancies`, () => {
      const bad = buildDiagnosticReport({ attempt: { ...attempt, score: 99 }, test: { name: "Math", test_type: "math", questions }, responses });
      expect(render(bad)).toMatch(/Scoring details require verification/);
    });
  }
  it("staff appendix retains provenance/sparse flags outside shared parent sections", () => {
    const html = renderTeacherCopyHtml(r, { responses });
    const [shared, internal] = html.split("<h2>8.");
    expect(shared).not.toMatch(forbidden);
    expect(internal).toContain("inferred from wording");
    expect(internal).toContain("Limited evidence");
    expect(internal).toContain("Unmapped");
  });
  it("rendering never changes counts or points; observed single-item strengths are not suppressed", () => {
    const before = JSON.stringify(r);
    renderDiagnosticReportHtml(r); renderEmailSummaryHtml(r); renderGeneralCertificateHtml(r);
    expect(JSON.stringify(r)).toBe(before);
    expect(r.points).toEqual({ earned: 1.5, possible: 3 });
    expect(r.counts).toMatchObject({ correct: 1, partial: 1, pending: 1, unanswered: 2, scored: 2 });
    expect(renderGeneralCertificateHtml(r)).toContain("Round");
    expect(r.strengths).toHaveLength(1);
    expect(r.strengths[0].lowEvidence).toBe(true);
  });
  it("parent Results avoids broad mastery insight and corrects Tier 3 duration", () => {
    const src = readFileSync("src/pages/Results.tsx", "utf8");
    expect(src).toContain("parentTierLabel");
    expect(src).not.toContain("<InsightBox");
    expect(src).toContain('"15-week"');
  });
  it("no blanket individualized attendance pattern or optional-week wording", () => {
    const html = renderDiagnosticReportHtml(r);
    expect(html).toContain("15-week intensive program");
    expect(html).not.toMatch(/12-week|optional extension|45 afterschool|60 one.to.one/);
  });
});

describe("actual Grade 5 Math canonical review configuration", () => {
  it("audits 30 actual q IDs, not the different 10-item local bank", () => {
    expect(snapshot.questions).toHaveLength(30);
    expect(review.items.map((x) => x.id)).toEqual(snapshot.questions.map((x) => x.id));
    expect(review.status).toBe("pending_owner_review");
    expect(review.apply_to_historical).toBe(false);
    for (const x of review.items) expect(readCanonicalTags(x.canonical_tags)).not.toBeNull();
  });
  it("requires approval and exact text/keys/options; returns new objects preserving source", () => {
    expect(() => prepareFutureBank(snapshot.questions, review, false)).toThrow(/approval/);
    const before = JSON.stringify(snapshot);
    const prepared = prepareFutureBank(snapshot.questions, review, true);
    expect(JSON.stringify(snapshot)).toBe(before);
    for (const [i, q] of prepared.entries()) {
      const { canonical_tags: _tags, ...untouched } = q;
      expect(untouched).toEqual(snapshot.questions[i]);
    }
    expect(() => prepareFutureBank(snapshot.questions.map((q, i) => i === 0 ? { ...q, correct_answer: "changed" } : q), review, true)).toThrow(/drift/);
  });
  it("canonical primary tags win over text rules; secondary skills never duplicate score points", () => {
    const prepared = prepareFutureBank(snapshot.questions, review, true);
    const res = prepared.map((q, i) => ({ question_id: q.id, is_correct: i % 2 === 0, points_awarded: i % 2 === 0 ? 2 : 0.5, max_points: 2 }));
    const before = buildDiagnosticReport({ attempt, test: { name: "Math", test_type: "math", questions: snapshot.questions }, responses: res });
    const after = buildDiagnosticReport({ attempt, test: { name: "Math", test_type: "math", questions: prepared }, responses: res });
    expect(after.counts).toEqual(before.counts);
    expect(after.points).toEqual(before.points);
    expect(after.score).toEqual(before.score);
    expect(after.skills.reduce((n, s) => n + s.possible, 0)).toBe(after.points.possible);
    expect(after.skills.reduce((n, s) => n + s.earned, 0)).toBe(after.points.earned);
    expect(after.items.every((i) => i.skillSource === "tag")).toBe(true);
    expect(after.items.find((i) => i.id === "q17")?.skill).toBe("Evaluate expressions using order of operations");
    expect(after.items.find((i) => i.id === "q29")?.secondarySkills).toContain("Subtract money amounts");
    expect(after.unmapped.count).toBe(0);
  });
  it("legacy ELA explicit tags survive unchanged and cross-subject metadata cannot override them", () => {
    const item = { id: "e", skill: "main idea", type: "open-ended", canonical_tags: review.items[0].canonical_tags };
    expect(flattenTestItems([item], "ela").items[0]).toMatchObject({ skill: "Main Idea", domain: "Reading Comprehension", secondarySkills: [] });
  });
  it("bank-quality flags preserved for q4/q5 equivalent choices and q22 ambiguous wording", () => {
    for (const id of ["q4", "q5", "q22"]) expect(review.items.find((x) => x.id === id)?.staff_review_notes.length).toBeGreaterThan(0);
  });
});