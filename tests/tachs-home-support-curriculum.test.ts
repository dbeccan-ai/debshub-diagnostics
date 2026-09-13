// At-Home Support Plan (parent-safe) and Personalized TACHS Curriculum (admin-only) regression tests.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  defaultParentReportContent, defaultHomeSupportPlan, sanitizeHomeSupportPlan, sanitizeParentReportContent, parentReportView,
  parentReportEmailHtml, findForbiddenParentKeys, findForbiddenParentPhrases, sectionScores, canTransitionReport, canSendParentReport,
  REPORT_PREPARING_MESSAGE, HOME_SUPPORT_TITLE,
} from "../supabase/functions/_shared/tachs-report.ts";
import { buildTachsCurriculum, sectionProfile, CURRICULUM_MILESTONES } from "../supabase/functions/_shared/tachs-curriculum.ts";
import { TACHS_PROGRAMS } from "../supabase/functions/_shared/tachs-programs.ts";
import { STORED_RESULTS } from "./tachs-fixtures";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const ITEM_LEAK = /correct_key|rationale|selected_key|"stem"|difficulty_path|blueprint|stripe|payment_intent|checkout_session|time_used|presented|report_notes|weakest_skills|focus_skills|lesson_sequence|consultant_notes/i;
const SKILL_LABEL_LEAK = /Vocabulary in Context|Rotation & Reflection|Two-Rule Integration|Algebra & Functions|Multistep Modeling|inference/i;

describe("At-Home Support Plan — generation and privacy", () => {
  const content = defaultParentReportContent(STORED_RESULTS);
  const view = parentReportView(STORED_RESULTS, content, "2026-09-13T19:00:00Z")!;
  it("is generated from the approved priority sections and the program, not raw skill rows", () => {
    const hp = content.home_support_plan;
    expect(hp.section_actions.map((s) => s.section_key)).toEqual(content.priority_sections);
    for (const s of hp.section_actions) expect(s.actions.length).toBeGreaterThanOrEqual(2);
    const p = TACHS_PROGRAMS[content.recommended_program_key];
    expect(hp.cadence).toContain(`${p.sessions_per_week} consultant-led sessions each week for ${p.duration_weeks} weeks`);
    expect(hp.weekly_routine.length).toBeGreaterThanOrEqual(3);
    expect(hp.guidance.join(" ")).toMatch(/independently/);
    expect(hp.guidance.join(" ")).toMatch(/do not coach or prompt during timed practice/i);
    expect(hp.progress_check).toContain(p.progress_monitoring);
    expect(JSON.stringify(hp)).not.toMatch(SKILL_LABEL_LEAK);
  });
  it("scales session length/cadence by tier and falls back when no priorities are set", () => {
    const sections = sectionScores(STORED_RESULTS);
    expect(defaultHomeSupportPlan("tachs_strategy", [], sections).cadence).toMatch(/3 short independent practice blocks of about 20 minutes/);
    expect(defaultHomeSupportPlan("tachs_intensive_phase1", [], sections).cadence).toMatch(/4 short independent practice blocks of about 30 minutes/);
    expect(defaultHomeSupportPlan("tachs_strategy", [], sections).section_actions.length).toBeGreaterThan(0);
  });
  it("released view/email include the plan and still pass every forbidden-key/phrase scan", () => {
    expect(view.home_support.title).toBe(HOME_SUPPORT_TITLE);
    expect(view.home_support.sections.map((s) => s.label)).toEqual(view.priority_sections);
    expect(findForbiddenParentKeys(view)).toEqual([]);
    expect(findForbiddenParentPhrases(JSON.stringify(view))).toEqual([]);
    expect(JSON.stringify(view)).not.toMatch(ITEM_LEAK);
    const html = parentReportEmailHtml({ firstName: "Mckenzie", gradeLevel: 8, completedOn: "September 13, 2026", attemptId: "abc", report: view });
    expect(html).toContain(`5. ${HOME_SUPPORT_TITLE}`);
    expect(html).toContain("Weekly cadence:");
    expect(html).toContain("6. Recommended program");
    expect(html).not.toMatch(ITEM_LEAK);
    expect(html).not.toMatch(/\/admin\/|curriculum/i);
    expect(findForbiddenParentPhrases(html)).toEqual([]);
  });
  it("sanitizer allows home_support_plan but rejects nested internal/forbidden fields recursively", () => {
    const ok = sanitizeParentReportContent({ ...content }, STORED_RESULTS);
    expect(ok.ok).toBe(true);
    const nested = { ...content, home_support_plan: { ...content.home_support_plan, section_actions: [{ section_key: "reading", actions: ["x"], correct_key: "B" }] } };
    expect(sanitizeParentReportContent(nested, STORED_RESULTS)).toMatchObject({ ok: false });
    const extra = { ...content, home_support_plan: { ...content.home_support_plan, difficulty_path: [1, 2] } };
    expect(sanitizeParentReportContent(extra, STORED_RESULTS)).toMatchObject({ ok: false });
    const badKey = { ...content, home_support_plan: { ...content.home_support_plan, section_actions: [{ section_key: "algebra", actions: ["x"] }] } };
    expect(sanitizeParentReportContent(badKey, STORED_RESULTS)).toMatchObject({ ok: false });
    expect(findForbiddenParentKeys({ home_support_plan: { guidance: [{ rationale: "x" }] } })).toEqual(["rationale"]);
    expect(sanitizeHomeSupportPlan(null, content.home_support_plan)).toMatchObject({ ok: true });
    expect(sanitizeHomeSupportPlan({ cadence: "" }, content.home_support_plan)).toMatchObject({ ok: false });
  });
  it("older saved content without a plan still renders a generated plan", () => {
    const { home_support_plan: _drop, ...legacy } = content;
    const v = parentReportView(STORED_RESULTS, legacy as typeof content, null)!;
    expect(v.home_support.sections.length).toBeGreaterThan(0);
  });
  it("unapproved parents receive only the preparing message; approval alone never sends", () => {
    const engine = strip(readFileSync("supabase/functions/tachs-engine/index.ts", "utf8"));
    expect(engine).toMatch(/if \(!released && !admin\) return json\(\{ \.\.\.base, released: false, message: REPORT_PREPARING_MESSAGE \}\)/);
    expect(REPORT_PREPARING_MESSAGE).toMatch(/being prepared/);
    expect(canTransitionReport("reviewed", "approved")).toBe(true);
    expect(canSendParentReport("approved")).toBe(true);
    const admin = readFileSync("src/pages/AdminTachs.tsx", "utf8");
    expect(admin).toContain("Confirm approval — do not send");
    expect(admin).toMatch(/At-Home Support Plan; approved program and pricing; disclaimer/);
  });
});

describe("parent-facing surfaces: home plan present, curriculum absent", () => {
  const page = strip(readFileSync("src/pages/TachsResults.tsx", "utf8"));
  const component = strip(readFileSync("src/components/TachsHomeSupportPlan.tsx", "utf8"));
  it("parent page renders only the server home_support view and has a plan-only print action", () => {
    expect(page).toContain("Print / Save At-Home Plan");
    expect(page).toMatch(/print-home-only \.print-break:not\(\.home-plan-keep\) \{ display: none !important; \}/);
    expect(page).toMatch(/aria-labelledby="summary-h"[\s\S]*home-plan-keep|home-plan-keep" aria-labelledby="summary-h"/);
    for (const src of [page, component]) {
      expect(src).not.toMatch(/tachsCurriculum|buildTachsCurriculum|tachsAdminDirect|loadAdminDetail|\/admin\//);
      expect(src).not.toMatch(ITEM_LEAK);
    }
  });
  it("the admin editor edits/regenerates the plan and previews it with a safe print boundary", () => {
    const admin = readFileSync("src/pages/AdminTachs.tsx", "utf8");
    expect(admin).toContain('data-testid="home-plan-editor"');
    expect(admin).toContain("Regenerate home plan from priorities");
    expect(admin).toContain('data-print-surface="home-plan"');
    expect(admin).toMatch(/body\.printing-tachs-home-plan \* \{ visibility: hidden !important; \}/);
    const parentTab = admin.slice(admin.indexOf('<TabsContent value="parent"'), admin.indexOf('<TabsContent value="internal"'));
    expect(parentTab).not.toMatch(/curriculum/i);
  });
});

describe("Personalized TACHS Curriculum — admin only", () => {
  it("builds program-aligned weeks with 2 sessions/week, milestones and a final reassessment", () => {
    for (const [key, weeks] of [["tachs_strategy", 6], ["tachs_skill_builder", 10], ["tachs_intensive_phase1", 16]] as const) {
      const c = buildTachsCurriculum({ results: STORED_RESULTS, programKey: key, studentName: "Mckenzie", gradeLevel: 8, generatedAt: "2026-09-14T00:00:00Z" });
      expect(c.admin_only).toBe(true);
      expect(c.weeks).toHaveLength(weeks);
      expect(c.program.sessions_per_week).toBe(2);
      expect(c.program.total_sessions).toBe(weeks * 2);
      expect(c.weeks.at(-1)!.phase).toBe("Final reassessment");
      expect(c.milestones.at(-1)).toMatchObject({ week: weeks, kind: "final_reassessment" });
      for (const m of CURRICULUM_MILESTONES[key]) expect(c.weeks[m - 1].progress_check).toBeTruthy();
      for (const w of c.weeks) { expect(w.lesson_sequence).toHaveLength(2); expect(w.objectives.length).toBeGreaterThan(0); expect(w.independent_practice.length).toBeGreaterThan(0); expect(w.home_reinforcement.length).toBeGreaterThan(0); }
    }
  });
  it("prioritizes the weakest sections/skills while maintaining strengths and covering all six domains", () => {
    const c = buildTachsCurriculum({ results: STORED_RESULTS, programKey: "tachs_intensive_phase1", studentName: "M", gradeLevel: 8 });
    const profile = sectionProfile(STORED_RESULTS);
    const weakest = [...profile].sort((a, b) => a.priority_rank - b.priority_rank)[0];
    const primaries = c.weeks.map((w) => w.focus_sections[0]);
    const count = (l: string) => primaries.filter((p) => p === l).length;
    expect(count(weakest.label)).toBeGreaterThanOrEqual(count(profile.find((p) => p.tier === "green")!.label));
    expect(new Set(c.weeks.flatMap((w) => w.focus_sections.map((f) => f.replace(/^Maintain: /, ""))))).toEqual(new Set(profile.map((p) => p.label)));
    expect(c.weeks.every((w) => w.focus_sections[2].startsWith("Maintain: "))).toBe(true);
    expect(c.weeks.some((w) => w.focus_skills.some((s) => s.includes(weakest.weakest_skills[0].label)))).toBe(true);
    expect(JSON.stringify(c)).toMatch(/introductory-to-mid Algebra I/);
  });
  it("the endpoint validates the admin role server-side before reading any attempt and is read-only", () => {
    const fn = strip(readFileSync("supabase/functions/tachs-curriculum/index.ts", "utf8"));
    const roleIdx = fn.indexOf('.eq("role", "admin")'); const readIdx = fn.indexOf('from("tachs_attempts")');
    expect(roleIdx).toBeGreaterThan(-1); expect(readIdx).toBeGreaterThan(roleIdx);
    expect(fn).toMatch(/return json\(\{ error: "Forbidden" \}, 403\)/);
    expect(fn).not.toMatch(/\.update\(|\.insert\(|\.upsert\(|\.delete\(|resend|sendReportEmail/i);
    const general = readFileSync("supabase/functions/generate-curriculum/index.ts", "utf8");
    expect(general).toContain("if (attempt.user_id !== user.id)"); // ownership rules of the general endpoint untouched
  });
  it("the curriculum page is admin-guarded, registered before :attemptId, and never imported by parent pages", () => {
    const page = readFileSync("src/pages/AdminTachsCurriculum.tsx", "utf8");
    expect(page).toMatch(/\.eq\("role", "admin"\)/);
    expect(page).toContain("ADMIN ONLY");
    expect(page).not.toMatch(/parent_email|mailto:|Send|tachs\/results/);
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app.indexOf('/admin/tachs/:attemptId/curriculum')).toBeLessThan(app.indexOf('path="/admin/tachs/:attemptId"'));
    for (const f of ["src/pages/TachsResults.tsx", "src/pages/Dashboard.tsx", "src/components/TachsDashboardCard.tsx", "src/pages/TachsAttempt.tsx"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/tachsCurriculum|tachs-curriculum|\/curriculum/);
    }
    const admin = readFileSync("src/pages/AdminTachs.tsx", "utf8");
    const internal = admin.slice(admin.indexOf('<TabsContent value="internal"'));
    expect(internal).toContain("Generate Personalized TACHS Curriculum");
  });
});
