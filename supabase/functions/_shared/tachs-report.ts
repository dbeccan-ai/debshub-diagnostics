// Report-safety layer for the D.E.Bs TACHS Readiness Diagnostic.
// Pure (no Deno / Supabase imports) so it is unit-testable and shared by
// tachs-engine (API shaping) and send-tachs-results (email HTML).
//
// Two strictly separated surfaces:
//   * PARENT released report — exactly: six section scores + D.E.Bs Tier, overall score + Tier,
//     the consultant-reviewed interpretation, the next-step plan, the recommended program & price,
//     and a disclaimer. Built ONLY from whitelisted section accuracies plus the consultant-controlled
//     parent_report_content structure. Never item counts, timing, pacing, bands, blueprint/bank/
//     carry-over notes, workflow status, reviewer identity, internal notes or any item-level data.
//   * ADMIN/internal report — everything (item audit, keys, rationales, adaptive path, bank notes),
//     served only by admin_detail to /admin/tachs/:attemptId.
//
// Delivery: completion sends ONLY an acknowledgment. The released report is visible/emailed only
// after an admin has moved it through draft -> reviewed -> approved (-> sent).

import {
  PROGRAM_FOR_TIER, PROGRAM_KEYS, TACHS_PROGRAMS, TACHS_TIERS, tachsTierFor, usd, installmentLabel, ENROLLMENT_CALL_URL,
  type TachsProgram, type TachsProgramKey, type TachsTierKey,
} from "./tachs-programs.ts";

export const APP_URL = "https://debshub-diagnostics.lovable.app";

export const SECTION_ORDER = ["reading", "written_expression", "mathematics", "figure_matrices", "paper_folding", "figure_classification"] as const;
export const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  written_expression: "Written Expression",
  mathematics: "Mathematics",
  figure_matrices: "Figure Matrices",
  paper_folding: "Paper Folding",
  figure_classification: "Figure Classification",
};

/** Human labels for skill keys; special cases first, then Title Case. (Admin surfaces only.) */
const SKILL_LABEL_OVERRIDES: Record<string, string> = {
  size_position_partwhole: "Size, Position & Part-Whole",
  partwhole: "Part-Whole",
  part_whole: "Part-Whole",
  two_rule_integration: "Two-Rule Integration",
  vocabulary_in_context: "Vocabulary in Context",
  main_idea: "Main Idea",
};
export const skillLabel = (skill: string): string => {
  if (SKILL_LABEL_OVERRIDES[skill]) return SKILL_LABEL_OVERRIDES[skill];
  return skill
    .replace(/partwhole/g, "part-whole")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bPart-whole\b/g, "Part-Whole");
};

// ---------- report status workflow ----------
export type ReportStatus = "draft" | "reviewed" | "approved" | "sent";
export const REPORT_STATUSES: ReportStatus[] = ["draft", "reviewed", "approved", "sent"];
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["reviewed"],
  reviewed: ["approved", "draft"],
  approved: ["sent", "draft"],
  sent: ["sent", "draft"], // re-send of an approved+sent report, or reopen for revision
};
export const canTransitionReport = (from: string, to: string): boolean =>
  (TRANSITIONS[from as ReportStatus] ?? []).includes(to as ReportStatus);
/** Only an approved (or previously sent) report may be emailed to / viewed by the parent. */
export const canSendParentReport = (status: string): boolean => status === "approved" || status === "sent";
export const isReportReleased = canSendParentReport;
/** Consultant content may be edited only before approval. */
export const canEditParentContent = (status: string): boolean => status === "draft" || status === "reviewed";

export const PARENT_REPORT_TITLE = "TACHS Diagnostic Results & Recommended Plan";
export const REPORT_PREPARING_MESSAGE =
  "Your reviewed report is being prepared. A D.E.Bs consultant reviews every diagnostic before results and the recommended plan are released. We will notify you as soon as it is ready.";
export const DISCLAIMER_SHORT =
  "These are D.E.Bs internal diagnostic results based on raw accuracy in our own original assessment. They are not an official TACHS scaled score, percentile, admission decision or guarantee of admission or scholarship. D.E.Bs is not affiliated with, sponsored by, or endorsed by the TACHS program.";
export const PLACEMENT_NOTE =
  "Placement is based on this diagnostic and finalized after consultant review with your family.";

// ---------- consultant-controlled content (no item-level data by construction) ----------
export interface ParentReportContent {
  interpretation: string;
  priority_sections: string[];
  recommended_program_key: TachsProgramKey;
  customized_next_steps: string[];
  price_override_cents: number | null;
  approved_for_parent_at: string | null;
}

// ---------- released parent report ----------
export interface ParentSectionScore { section_key: string; label: string; accuracy: number; tier: TachsTierKey; tier_badge: string; tier_label: string }
export interface ParentProgramView {
  key: TachsProgramKey; name: string; duration_weeks: number; sessions_per_week: number; total_cents: number; price_label: string;
  installments_label: string; focus: string[]; included: string[]; progress_monitoring: string; honesty_note: string | null;
  payment_url: string | null; enrollment_call_url: string;
}
export interface ParentReport {
  kind: "parent_released";
  title: string;
  assessment_date: string | null;
  overall: { accuracy: number; tier: TachsTierKey; tier_badge: string; tier_label: string };
  sections: ParentSectionScore[]; // exactly six, fixed order
  interpretation: string;
  priority_sections: string[];
  plan: string[];
  placement_note: string;
  program: ParentProgramView;
  disclaimer: string;
}

const tierView = (accuracy: number) => {
  const t = TACHS_TIERS[tachsTierFor(accuracy)];
  return { tier: t.key, tier_badge: t.badge, tier_label: t.label };
};

/** Whitelisted section scores only: exactly six rows in fixed order, accuracy + tier. */
export function sectionScores(results: Record<string, any> | null | undefined): ParentSectionScore[] {
  const raw: any[] = Array.isArray(results?.sections) ? results!.sections : [];
  return SECTION_ORDER.map((key) => {
    const s = raw.find((x) => x?.section_key === key);
    const accuracy = Math.max(0, Math.min(100, Math.round(Number(s?.accuracy ?? 0))));
    return { section_key: key, label: SECTION_LABELS[key], accuracy, ...tierView(accuracy) };
  });
}

const joinNames = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** Parent-friendly interpretation from the overall tier and the relative section pattern only. */
export function defaultInterpretation(overall: number, sections: ParentSectionScore[]): string {
  const strong = sections.filter((s) => s.tier === "green").map((s) => s.label);
  const developing = sections.filter((s) => s.tier === "yellow").map((s) => s.label);
  const priority = sections.filter((s) => s.tier === "red").map((s) => s.label);
  const t = TACHS_TIERS[tachsTierFor(overall)];
  const lead = t.key === "green"
    ? `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). Performance is strong across the TACHS sections, and the goal now is to keep that accuracy stable under exam pacing while stretching into more demanding reasoning.`
    : t.key === "yellow"
      ? `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). The foundations are in place, and the score pattern points to specific sections where focused practice over the coming weeks would move results toward mastery.`
      : `Overall, this diagnostic places the student in ${t.badge} — ${t.label} (${overall}% overall). The results show foundational gaps in several sections that will respond best to structured, step-by-step instruction before timed practice is added.`;
  const parts = [lead];
  if (strong.length) parts.push(`${joinNames(strong)} ${strong.length === 1 ? "is a clear strength" : "are clear strengths"} and should be maintained with regular review.`);
  if (developing.length) parts.push(`${joinNames(developing)} ${developing.length === 1 ? "is" : "are"} in the strengthening zone: accuracy is developing and would benefit from targeted, consistent practice.`);
  if (priority.length) parts.push(`${joinNames(priority)} ${priority.length === 1 ? "is a priority area" : "are priority areas"} where rebuilding core skills should come first.`);
  parts.push("This interpretation reflects the D.E.Bs consultant's review of the overall score and the pattern across sections.");
  return parts.join(" ");
}

/** Default next-step plan: priorities, cadence, duration, progress monitoring, reassessment. */
export function defaultNextSteps(program: TachsProgram, priority: string[]): string[] {
  const steps: string[] = [];
  steps.push(priority.length
    ? `Priorities: begin with ${joinNames(priority.map((k) => SECTION_LABELS[k] ?? k))}, then extend to the remaining sections.`
    : "Priorities: maintain accuracy across all six sections while increasing the level of challenge.");
  steps.push(`Instructional cadence: ${program.sessions_per_week} sessions per week with short, structured practice between sessions.`);
  steps.push(`Duration: ${program.duration_weeks} weeks (${program.name}).`);
  steps.push(`Progress monitoring: ${program.progress_monitoring}`);
  steps.push(program.tier === "green"
    ? "Reassessment: a timed full-length reassessment at the end of the program to confirm readiness."
    : "Reassessment: a full-length reassessment at the end of the program compares directly against this diagnostic.");
  return steps;
}

/** Safe generated defaults for the admin editor. Contains no item-level data. */
export function defaultParentReportContent(results: Record<string, any> | null | undefined): ParentReportContent {
  const overall = Math.max(0, Math.min(100, Math.round(Number(results?.overall_accuracy ?? 0))));
  const sections = sectionScores(results);
  const priority = sections.filter((s) => s.tier === "red").map((s) => s.section_key);
  const programKey = PROGRAM_FOR_TIER[tachsTierFor(overall)];
  return {
    interpretation: defaultInterpretation(overall, sections),
    priority_sections: priority,
    recommended_program_key: programKey,
    customized_next_steps: defaultNextSteps(TACHS_PROGRAMS[programKey], priority),
    price_override_cents: null,
    approved_for_parent_at: null,
  };
}

/** Validates/sanitizes consultant-entered content. Rejects anything outside the typed shape. */
export function sanitizeParentReportContent(input: unknown, results: Record<string, any> | null | undefined): { ok: true; content: ParentReportContent } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Content must be an object." };
  const defaults = defaultParentReportContent(results);
  const o = input as Record<string, unknown>;
  const allowed = new Set(["interpretation", "priority_sections", "recommended_program_key", "customized_next_steps", "price_override_cents", "approved_for_parent_at"]);
  const extra = Object.keys(o).filter((k) => !allowed.has(k));
  if (extra.length) return { ok: false, error: `Unexpected fields: ${extra.join(", ")}` };
  const interpretation = typeof o.interpretation === "string" ? o.interpretation.trim().slice(0, 4000) : defaults.interpretation;
  if (!interpretation) return { ok: false, error: "The interpretation cannot be empty." };
  const ps = Array.isArray(o.priority_sections) ? o.priority_sections : defaults.priority_sections;
  if (!ps.every((k) => typeof k === "string" && (SECTION_ORDER as readonly string[]).includes(k))) return { ok: false, error: "priority_sections must be TACHS section keys." };
  const pk = typeof o.recommended_program_key === "string" ? o.recommended_program_key : defaults.recommended_program_key;
  if (!PROGRAM_KEYS.includes(pk as TachsProgramKey)) return { ok: false, error: "Unknown program." };
  const stepsIn = Array.isArray(o.customized_next_steps) ? o.customized_next_steps : defaults.customized_next_steps;
  const steps = stepsIn.filter((s): s is string => typeof s === "string").map((s) => s.trim().slice(0, 600)).filter(Boolean).slice(0, 12);
  if (!steps.length) return { ok: false, error: "At least one next step is required." };
  let price: number | null = null;
  if (o.price_override_cents != null && o.price_override_cents !== "") {
    const n = Number(o.price_override_cents);
    if (!Number.isInteger(n) || n < 0 || n > 5_000_000) return { ok: false, error: "price_override_cents must be a whole number of cents." };
    price = n;
  }
  const content: ParentReportContent = {
    interpretation, priority_sections: [...new Set(ps as string[])], recommended_program_key: pk as TachsProgramKey,
    customized_next_steps: steps, price_override_cents: price, approved_for_parent_at: null, // approval stamp is set server-side only
  };
  const leaked = findForbiddenParentKeys(content).concat(findForbiddenParentPhrases(JSON.stringify(content)));
  if (leaked.length) return { ok: false, error: `Parent content must not contain internal terms (${leaked.join(", ")}).` };
  return { ok: true, content };
}

export function programView(key: TachsProgramKey, priceOverrideCents: number | null): ParentProgramView {
  const p = TACHS_PROGRAMS[key];
  const total = priceOverrideCents ?? p.total_cents;
  const perInstallment = priceOverrideCents != null ? Math.round(total / p.installments.count) : p.installments.amount_cents;
  return {
    key: p.key, name: p.name, duration_weeks: p.duration_weeks, sessions_per_week: p.sessions_per_week, total_cents: total, price_label: usd(total),
    installments_label: installmentLabel({ installments: { count: p.installments.count, amount_cents: perInstallment } }),
    focus: [...p.focus], included: [...p.included], progress_monitoring: p.progress_monitoring, honesty_note: p.honesty_note,
    payment_url: p.payment_url, enrollment_call_url: ENROLLMENT_CALL_URL,
  };
}

/**
 * Build the released parent report from stored results + consultant content. Whitelists by
 * construction: only section accuracies/tiers and the typed content structure are read.
 * When no content has been saved yet, safe generated defaults are used (admin preview only —
 * the results action never releases anything before approval).
 */
export function parentReportView(results: Record<string, any> | null | undefined, content?: ParentReportContent | null, assessmentDate?: string | null): ParentReport | null {
  if (!results) return null;
  const c = content ?? defaultParentReportContent(results);
  const overall = Math.max(0, Math.min(100, Math.round(Number(results.overall_accuracy ?? 0))));
  return {
    kind: "parent_released",
    title: PARENT_REPORT_TITLE,
    assessment_date: assessmentDate ?? null,
    overall: { accuracy: overall, ...tierView(overall) },
    sections: sectionScores(results),
    interpretation: c.interpretation,
    priority_sections: c.priority_sections.map((k) => SECTION_LABELS[k] ?? k),
    plan: [...c.customized_next_steps],
    placement_note: PLACEMENT_NOTE,
    program: programView(c.recommended_program_key, c.price_override_cents),
    disclaimer: DISCLAIMER_SHORT,
  };
}

/** Keys that must never appear in any parent payload or email. */
export const FORBIDDEN_PARENT_KEYS = [
  // item-level
  "correct_key", "rationale", "selected_key", "stem", "choices", "difficulty", "difficulty_path", "review", "audit", "evidence",
  "question_id", "questions", "responses", "passage_text", "skills", "strengths", "gaps", "skill",
  // internal decisions / bank
  "carryover", "blueprint_version", "blueprint", "bank", "code", "test_mode", "report_status", "report_notes", "notes",
  "report_reviewed_by", "report_approved_by", "reviewed_by", "approved_by", "reviewer", "approver", "events", "email", "email_status",
  // bands / raw counts / timing / pacing
  "band", "working_band", "next_steps", "focus_sections", "math_readiness", "item_count", "presented", "correct", "answered",
  "total_presented", "total_correct", "total_time_seconds", "time_used_seconds", "time_limit_seconds", "pace_seconds_per_item",
  "allotted_seconds_per_item", "pacing", "ended_by", "submit_reason", "started_at", "user_id",
];
export function findForbiddenParentKeys(payload: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (FORBIDDEN_PARENT_KEYS.includes(k)) found.add(k);
        walk(val);
      }
    }
  };
  walk(payload);
  return [...found];
}

/** Internal vocabulary that must never appear in parent-facing text/HTML. */
export const FORBIDDEN_PARENT_PHRASES: RegExp[] = [
  /blueprint/i, /carry-?over/i, /test mode/i, /\bpilot\b/i, /report status/i, /\bdraft\b/i, /\bapproved\b/i, /\bapproval\b/i,
  /reviewer/i, /rationale/i, /answer key/i, /correct answer/i, /item review/i, /question bank/i, /\bbank\b/i, /\bversion\b/i,
  /adaptive/i, /difficulty/i, /\badmin/i, /internal note/i, /working band/i, /pending consultant interpretation/i,
  /\bV2-[RW]/, /\bRD2\b/, /\bWR2\b/, /\/admin\//i, /svgPrint|svgStrengths|svgGaps|<svg/i, /percentile/i,
];
export function findForbiddenParentPhrases(text: string): string[] {
  return FORBIDDEN_PARENT_PHRASES.filter((re) => re.test(text)).map((re) => re.source);
}

/** Flags attempts that used the earlier blueprint-v2 Reading/Written carry-over codes (V2-R / V2-W). Admin-only. */
export function carryoverSummary(codes: (string | null | undefined)[]): { v2r: number; v2w: number; flagged: boolean; note: string | null } {
  let v2r = 0, v2w = 0;
  for (const c of codes) { if (!c) continue; if (c.startsWith("V2-R")) v2r++; else if (c.startsWith("V2-W")) v2w++; }
  const flagged = v2r + v2w > 0;
  return {
    v2r, v2w, flagged,
    note: flagged
      ? `This attempt used the earlier blueprint-v2 Reading/Written carry-over item codes (V2-R ×${v2r}, V2-W ×${v2w}), not the revised RD2/WR2 pools. Do not treat it as the final revised-bank baseline without consultant review.`
      : null,
  };
}

// ---------- email HTML (print-safe: text and CSS only, no SVG / icon components) ----------
export const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const shell = (heading: string, sub: string, body: string) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:#1C2D5A;color:#ffffff;padding:22px 24px;">
      <div style="font-size:13px;letter-spacing:1.4px;color:#FFDE59;font-weight:700;">D.E.Bs DIAGNOSTIC HUB</div>
      <h1 style="margin:6px 0 0;font-size:22px;">${esc(heading)}</h1>
      <div style="margin-top:6px;font-size:13px;color:#cbd5e1;">${esc(sub)}</div>
    </div>
    <div style="padding:24px;">${body}</div>
  </div></body></html>`;

/** Completion acknowledgment: contains NO results of any kind. */
export function acknowledgmentEmailHtml(input: { firstName: string; completedOn: string }): string {
  return shell("TACHS Readiness Diagnostic — assessment received", "Your reviewed report is being prepared", `
      <p style="margin:0 0 14px;">Hello,</p>
      <p style="margin:0 0 14px;">Thank you — <strong>${esc(input.firstName)}</strong>'s D.E.Bs TACHS Readiness Diagnostic was received and saved on ${esc(input.completedOn)}.</p>
      <div style="border-left:4px solid #FFDE59;background:#fffbea;padding:12px 16px;margin:0 0 16px;">
        <strong>What happens next</strong>
        <ol style="margin:8px 0 0 18px;padding:0;color:#334155;">
          <li>A D.E.Bs consultant reviews the complete diagnostic.</li>
          <li>We prepare the results report and the recommended next-step plan.</li>
          <li>D.E.Bs follows up with you directly to share the report and plan.</li>
        </ol>
      </div>
      <p style="margin:0 0 14px;color:#334155;">No scores are included in this message. Results are released only after consultant review.</p>
      <p style="margin:0 0 14px;color:#334155;">Questions in the meantime? Reply to this email or contact <a href="mailto:info@debslearnacademy.com" style="color:#1C2D5A;">info@debslearnacademy.com</a>.</p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(DISCLAIMER_SHORT)}</p>`);
}

const tierChip = (badge: string, label: string, color: string) =>
  `<span style="display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700;color:#ffffff;background:${esc(color)};">${esc(badge)} · ${esc(label)}</span>`;

/** Released parent report: scores + tiers, interpretation, plan, program & price, disclaimer. Nothing else. */
export function parentReportEmailHtml(input: { firstName: string; gradeLevel: number | null; completedOn: string; attemptId: string; report: ParentReport }): string {
  const r = input.report;
  const cell = "padding:8px 10px;border-bottom:1px solid #e2e8f0;";
  const rows = r.sections.map((s) => `
        <tr>
          <th scope="row" style="${cell}text-align:left;font-weight:600;">${esc(s.label)}</th>
          <td style="${cell}text-align:center;font-weight:600;">${esc(s.accuracy)}%</td>
          <td style="${cell}text-align:center;">${tierChip(s.tier_badge, s.tier_label, TACHS_TIERS[s.tier].color)}</td>
        </tr>`).join("");
  const p = r.program;
  const li = (xs: string[]) => xs.map((x) => `<li style="margin:0 0 6px;">${esc(x)}</li>`).join("");
  return shell(PARENT_REPORT_TITLE, "Reviewed by a D.E.Bs consultant", `
      <p style="margin:0 0 6px;">Hello, here are <strong>${esc(input.firstName)}</strong>'s${input.gradeLevel ? ` (Grade ${esc(input.gradeLevel)})` : ""} TACHS diagnostic results, completed on ${esc(input.completedOn)}.</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:20px 0 8px;">1. Student summary</h2>
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
        <div style="font-size:13px;color:#64748b;">Overall score</div>
        <div style="font-size:28px;font-weight:800;color:#1C2D5A;">${esc(r.overall.accuracy)}%</div>
        <div style="margin-top:6px;">${tierChip(r.overall.tier_badge, r.overall.tier_label, TACHS_TIERS[r.overall.tier].color)}</div>
      </div>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">2. Section results</h2>
      <table role="table" style="width:100%;border-collapse:collapse;font-size:14px;">
        <caption style="text-align:left;font-size:12px;color:#64748b;padding:0 0 6px;">Score and D.E.Bs Tier for each of the six TACHS sections.</caption>
        <thead><tr style="background:#f1f5f9;">
          <th scope="col" style="padding:8px 10px;text-align:left;">Section</th><th scope="col" style="padding:8px 10px;">Score</th><th scope="col" style="padding:8px 10px;">D.E.Bs Tier</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;color:#64748b;margin:8px 0 0;">Tier 1 = 85–100% Demonstrated Mastery · Tier 2 = 66–84% Strengthening Zone · Tier 3 = 0–65% Priority Intervention Required.</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">3. D.E.Bs consultant interpretation</h2>
      <p style="margin:0;color:#334155;line-height:1.55;">${esc(r.interpretation)}</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">4. Recommended next-step plan</h2>
      <ul style="margin:0 0 8px 18px;padding:0;color:#334155;">${li(r.plan)}</ul>
      <p style="font-size:13px;color:#475569;margin:0;">${esc(r.placement_note)}</p>

      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 8px;">5. Recommended program &amp; pricing</h2>
      <div style="border:2px solid #1C2D5A;border-radius:10px;padding:14px 16px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Recommended service option</div>
        <div style="font-size:18px;font-weight:800;color:#1C2D5A;margin-top:2px;">${esc(p.name)}</div>
        <div style="color:#334155;margin-top:4px;">${esc(p.duration_weeks)} weeks · ${esc(p.sessions_per_week)} sessions per week · <strong>${esc(p.price_label)}</strong> total</div>
        <div style="font-size:13px;color:#475569;margin-top:2px;">Payment plan available: ${esc(p.installments_label)}.</div>
        <div style="margin-top:10px;font-weight:600;">Focus</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(p.focus)}</ul>
        <div style="margin-top:10px;font-weight:600;">What is included</div><ul style="margin:4px 0 0 18px;padding:0;color:#334155;">${li(p.included)}</ul>
        ${p.honesty_note ? `<p style="font-size:13px;color:#475569;margin:10px 0 0;">${esc(p.honesty_note)}</p>` : ""}
        <p style="margin:16px 0 0;"><a href="${esc(p.enrollment_call_url)}" style="background:#1C2D5A;color:#FFDE59;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block;">Schedule Enrollment Call</a></p>
      </div>

      <p style="margin:22px 0;"><a href="${APP_URL}/tachs/results/${esc(input.attemptId)}" style="color:#1C2D5A;font-weight:700;">Open the report online</a></p>
      <h2 style="font-size:14px;color:#1C2D5A;margin:22px 0 6px;">6. Please note</h2>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(r.disclaimer)}</p>`);
}
