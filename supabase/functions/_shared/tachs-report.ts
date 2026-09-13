// Report-safety layer for the D.E.Bs TACHS Readiness Diagnostic.
// Pure (no Deno / Supabase imports) so it is unit-testable and shared by
// tachs-engine (API shaping) and send-tachs-results (email HTML).
//
// Two report surfaces exist:
//   * PARENT preliminary report — section-level raw accuracy and pacing, carefully worded
//     observations, and a readiness band that is explicitly labelled as a D.E.Bs internal
//     working interpretation pending consultant review. NEVER contains question text, selected
//     answers, answer keys, rationales or raw adaptive-path output.
//   * ADMIN/internal report — everything (item-level responses, keys, rationales, adaptive path).
//
// Delivery: completion sends ONLY an acknowledgment. The parent report is emailed only after an
// admin has moved it through draft -> reviewed -> approved -> sent.

export const APP_URL = "https://debshub-diagnostics.lovable.app";

export const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  written_expression: "Written Expression",
  mathematics: "Mathematics",
  figure_matrices: "Figure Matrices",
  paper_folding: "Paper Folding",
  figure_classification: "Figure Classification",
};

/** Human labels for skill keys; special cases first, then Title Case. */
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
/** Only an approved (or previously sent) report may be emailed to the parent. */
export const canSendParentReport = (status: string): boolean => status === "approved" || status === "sent";

export const BAND_WORKING_LABEL = "D.E.Bs internal working interpretation — pending consultant review";
export const PENDING_INTERPRETATION =
  "These are raw preliminary results. A D.E.Bs consultant reviews every attempt before the interpreted report and study plan are shared. Please do not treat any band, label or percentage here as an admission prediction.";
export const DISCLAIMER_SHORT =
  "This is a preliminary D.E.Bs readiness result, not an official TACHS scaled score, percentile, admission decision, or scholarship prediction. D.E.Bs is not affiliated with, sponsored by, or endorsed by the TACHS program.";

// ---------- parent-safe view ----------
export interface RawSection {
  section_key: string; item_count: number; presented: number; answered: number; correct: number; accuracy: number;
  time_limit_seconds: number; time_used_seconds: number; pace_seconds_per_item: number; allotted_seconds_per_item: number;
  submit_reason?: string | null;
  [k: string]: unknown;
}
export interface ParentSection {
  section_key: string; label: string; item_count: number; presented: number; answered: number; correct: number; accuracy: number;
  time_limit_seconds: number; time_used_seconds: number; pace_seconds_per_item: number; allotted_seconds_per_item: number;
  pacing: "rushed" | "on_pace" | "slow"; ended_by: "student" | "timer";
}
export interface ParentReport {
  kind: "parent_preliminary";
  overall_accuracy: number; total_presented: number; total_correct: number; total_time_seconds: number;
  sections: ParentSection[];
  observations: string[];
  working_band: { label: string; color: string; interpretation: string } | null;
  pending_interpretation: string;
  disclaimer: string;
  blueprint_version: number | null;
  generated_at: string | null;
}

export const pacingFor = (s: { pace_seconds_per_item: number; allotted_seconds_per_item: number }): ParentSection["pacing"] =>
  s.pace_seconds_per_item > s.allotted_seconds_per_item * 1.15 ? "slow"
    : s.pace_seconds_per_item < s.allotted_seconds_per_item * 0.6 ? "rushed" : "on_pace";
export const PACING_LABEL: Record<ParentSection["pacing"], string> = { rushed: "Faster than allotted", on_pace: "Within allotted pace", slow: "Slower than allotted" };

/** Carefully worded, non-predictive observations from section-level data only. */
export function sectionObservations(sections: ParentSection[]): string[] {
  const out: string[] = [];
  if (!sections.length) return out;
  const sorted = [...sections].sort((a, b) => b.accuracy - a.accuracy);
  const top = sorted[0], low = sorted[sorted.length - 1];
  if (top && top.accuracy >= 70) out.push(`${top.label} showed the highest raw accuracy in this sitting (${top.accuracy}% of presented items).`);
  if (low && low !== top && low.accuracy < 60) out.push(`${low.label} had the lowest raw accuracy in this sitting (${low.accuracy}%); the consultant review will look at which item types contributed.`);
  const timedOut = sections.filter((s) => s.ended_by === "timer");
  if (timedOut.length) out.push(`The timer ended ${timedOut.map((s) => s.label).join(", ")} before the student submitted, so pacing will be part of the review.`);
  const rushed = sections.filter((s) => s.pacing === "rushed");
  if (rushed.length) out.push(`${rushed.map((s) => s.label).join(", ")} ${rushed.length === 1 ? "was" : "were"} completed noticeably faster than the allotted pace; accuracy in those sections is read alongside that speed.`);
  const unanswered = sections.filter((s) => s.presented - s.answered > 0);
  if (unanswered.length) out.push(`Some presented items were left unanswered in ${unanswered.map((s) => `${s.label} (${s.presented - s.answered})`).join(", ")}.`);
  if (!out.length) out.push("Raw accuracy and pacing were consistent across sections; the consultant review will add the interpretation.");
  return out;
}

/**
 * Build the parent/student-safe report from stored results. Whitelists fields explicitly —
 * anything not listed (difficulty paths, evidence tables, skill rows, next-step plans, answer
 * data) is dropped by construction.
 */
export function parentReportView(results: Record<string, any> | null | undefined): ParentReport | null {
  if (!results) return null;
  const sections: ParentSection[] = ((results.sections ?? []) as RawSection[]).map((s) => ({
    section_key: s.section_key, label: SECTION_LABELS[s.section_key] ?? s.section_key,
    item_count: Number(s.item_count ?? 0), presented: Number(s.presented ?? 0), answered: Number(s.answered ?? 0), correct: Number(s.correct ?? 0),
    accuracy: Number(s.accuracy ?? 0), time_limit_seconds: Number(s.time_limit_seconds ?? 0), time_used_seconds: Number(s.time_used_seconds ?? 0),
    pace_seconds_per_item: Number(s.pace_seconds_per_item ?? 0), allotted_seconds_per_item: Number(s.allotted_seconds_per_item ?? 0),
    pacing: pacingFor({ pace_seconds_per_item: Number(s.pace_seconds_per_item ?? 0), allotted_seconds_per_item: Number(s.allotted_seconds_per_item ?? 0) }),
    ended_by: s.submit_reason === "timeout" ? "timer" : "student",
  }));
  const band = results.band && typeof results.band.label === "string"
    ? { label: String(results.band.label), color: String(results.band.color ?? "#1C2D5A"), interpretation: BAND_WORKING_LABEL }
    : null;
  return {
    kind: "parent_preliminary",
    overall_accuracy: Number(results.overall_accuracy ?? 0),
    total_presented: Number(results.total_presented ?? 0),
    total_correct: Number(results.total_correct ?? 0),
    total_time_seconds: Number(results.total_time_seconds ?? 0),
    sections,
    observations: sectionObservations(sections),
    working_band: band,
    pending_interpretation: PENDING_INTERPRETATION,
    disclaimer: DISCLAIMER_SHORT,
    blueprint_version: results.blueprint_version != null ? Number(results.blueprint_version) : null,
    generated_at: results.generated_at ? String(results.generated_at) : null,
  };
}

/** Keys that must never appear in any parent/student payload or email. */
export const FORBIDDEN_PARENT_KEYS = ["correct_key", "rationale", "selected_key", "stem", "choices", "difficulty_path", "review", "evidence", "next_steps"];
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

/** Flags attempts that used the earlier blueprint-v2 Reading/Written carry-over codes (V2-R / V2-W). */
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
const mmss = (sec: number) => `${Math.floor((sec ?? 0) / 60)} min ${String((sec ?? 0) % 60).padStart(2, "0")} sec`;

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
  return shell("TACHS Readiness Diagnostic — assessment received", "Preliminary results pending consultant review", `
      <p style="margin:0 0 14px;">Hello,</p>
      <p style="margin:0 0 14px;">Thank you — <strong>${esc(input.firstName)}</strong>'s D.E.Bs TACHS Readiness Diagnostic was received and saved on ${esc(input.completedOn)}.</p>
      <div style="border-left:4px solid #FFDE59;background:#fffbea;padding:12px 16px;margin:0 0 16px;">
        <strong>What happens next</strong>
        <ol style="margin:8px 0 0 18px;padding:0;color:#334155;">
          <li>A D.E.Bs consultant reviews the full attempt, including pacing and item-level patterns.</li>
          <li>We prepare the reviewed preliminary report and a study plan.</li>
          <li>D.E.Bs follows up with you directly to share the reviewed report and next steps.</li>
        </ol>
      </div>
      <p style="margin:0 0 14px;color:#334155;">No scores are included in this message. Preliminary results are released only after consultant review.</p>
      <p style="margin:0 0 14px;color:#334155;">Questions in the meantime? Reply to this email or contact <a href="mailto:info@debslearnacademy.com" style="color:#1C2D5A;">info@debslearnacademy.com</a>.</p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(DISCLAIMER_SHORT)}</p>`);
}

/** Approved parent preliminary report: section-level raw accuracy/pacing + observations only. */
export function parentReportEmailHtml(input: { firstName: string; gradeLevel: number | null; completedOn: string; attemptId: string; report: ParentReport; blueprintVersion: number | null }): string {
  const r = input.report;
  const cell = "padding:8px 10px;border-bottom:1px solid #e2e8f0;";
  const rows = r.sections.map((s) => `
        <tr>
          <th scope="row" style="${cell}text-align:left;font-weight:600;">${esc(s.label)}</th>
          <td style="${cell}text-align:center;">${esc(s.correct)} of ${esc(s.presented)}</td>
          <td style="${cell}text-align:center;font-weight:600;">${esc(s.accuracy)}%</td>
          <td style="${cell}text-align:center;">${esc(mmss(s.time_used_seconds))} of ${esc(mmss(s.time_limit_seconds))}</td>
          <td style="${cell}text-align:center;">${esc(PACING_LABEL[s.pacing])} (${esc(s.pace_seconds_per_item)}s per item)</td>
        </tr>`).join("");
  const band = r.working_band
    ? `<div style="border:1px dashed #94a3b8;border-radius:10px;padding:12px 16px;margin:18px 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">${esc(BAND_WORKING_LABEL)}</div>
        <div style="font-size:18px;font-weight:700;color:${esc(r.working_band.color)};margin-top:4px;">${esc(r.working_band.label)}</div>
        <div style="font-size:13px;color:#475569;margin-top:6px;">This working label is based only on overall raw accuracy and is not an admission prediction.</div>
      </div>` : "";
  return shell("TACHS Readiness Diagnostic — Preliminary Report", `Reviewed by D.E.Bs · ${input.blueprintVersion != null ? `Pilot blueprint v${input.blueprintVersion}` : "Pilot"}`, `
      <p style="margin:0 0 6px;">Hello, here is the reviewed preliminary summary for <strong>${esc(input.firstName)}</strong>${input.gradeLevel ? ` (Grade ${esc(input.gradeLevel)})` : ""}, completed on ${esc(input.completedOn)}.</p>
      <p style="margin:0 0 18px;color:#334155;">Overall raw accuracy: <strong>${esc(r.overall_accuracy)}%</strong> (${esc(r.total_correct)} of ${esc(r.total_presented)} presented items answered correctly).</p>
      <h2 style="font-size:16px;color:#1C2D5A;margin:0 0 8px;">Section results (raw accuracy and pacing)</h2>
      <table role="table" style="width:100%;border-collapse:collapse;font-size:14px;">
        <caption style="text-align:left;font-size:12px;color:#64748b;padding:0 0 6px;">Correct items, raw accuracy, time used and pacing for each section.</caption>
        <thead><tr style="background:#f1f5f9;">
          <th scope="col" style="padding:8px 10px;text-align:left;">Section</th><th scope="col" style="padding:8px 10px;">Correct</th>
          <th scope="col" style="padding:8px 10px;">Accuracy</th><th scope="col" style="padding:8px 10px;">Time used</th><th scope="col" style="padding:8px 10px;">Pacing</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 6px;">Observations</h2>
      <ul style="margin:0 0 0 18px;padding:0;color:#334155;">${r.observations.map((o) => `<li style="margin:0 0 6px;">${esc(o)}</li>`).join("")}</ul>
      ${band}
      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 6px;">Pending consultant interpretation</h2>
      <p style="margin:0;color:#334155;">${esc(r.pending_interpretation)} D.E.Bs will follow up with the interpreted report and plan.</p>
      <p style="margin:22px 0;"><a href="${APP_URL}/tachs/results/${esc(input.attemptId)}" style="background:#1C2D5A;color:#FFDE59;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block;">Open the preliminary report</a></p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(r.disclaimer)}</p>`);
}
