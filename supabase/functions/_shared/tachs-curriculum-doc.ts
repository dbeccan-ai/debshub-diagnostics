// ADMIN-ONLY document rendering for the personalized TACHS curriculum.
// Pure text generation (no Deno/React imports) so it is unit-testable and shared by the admin page's
// Markdown/TXT and DOCX downloads. Never used on any parent/student surface, email or print view.

import type { TachsCurriculum } from "./tachs-curriculum.ts";

const line = (s: string) => `${s}\n`;

/** Clean Markdown (also valid as plain text) for upload into a workbook-creation tool. */
export function curriculumMarkdown(c: TachsCurriculum): string {
  let out = "";
  out += line(`# ${c.title}`);
  out += line("");
  out += line(`**ADMIN ONLY — internal consultant document. Never sent to families.**`);
  out += line("");
  out += line(`- Student: ${c.student_name}${c.grade_level ? ` (Grade ${c.grade_level})` : ""}`);
  out += line(`- Program: ${c.program.name}`);
  out += line(`- Scope: ${c.program.schedule_label}`);
  out += line(`- Diagnostic overall accuracy: ${c.overall_accuracy}%`);
  out += line(`- Generated: ${new Date(c.generated_at).toISOString().slice(0, 10)}`);
  out += line("");

  out += line(`## Diagnosed priorities`);
  out += line(`Priority sections: ${c.priorities.join(", ") || "None — all sections at mastery"}`);
  out += line(`Strengths to maintain: ${c.strengths.join(", ") || "None yet"}`);
  out += line("");
  out += line(`| # | Section | Score | Tier | Weakest strands |`);
  out += line(`| --- | --- | --- | --- | --- |`);
  for (const s of [...c.section_profile].sort((a, b) => a.priority_rank - b.priority_rank)) {
    out += line(`| ${s.priority_rank} | ${s.label} | ${s.accuracy}% | ${s.tier_badge} | ${s.weakest_skills.map((k) => `${k.label} ${k.correct}/${k.presented}`).join("; ") || "—"} |`);
  }
  out += line("");

  out += line(`## Weekly and session sequence`);
  for (const w of c.weeks) {
    out += line("");
    out += line(`### Week ${w.week} — ${w.phase}`);
    out += line(`Focus: ${w.focus_sections.join(" · ")}`);
    out += line(`Skills: ${w.focus_skills.join(" · ")}`);
    if (w.algebra_focus) out += line(`Algebra I foundations: ${w.algebra_focus}`);
    out += line("");
    out += line(`**Objectives**`);
    for (const o of w.objectives) out += line(`- ${o}`);
    for (const s of w.sessions) {
      out += line("");
      out += line(`#### Session ${s.session} — ${s.day_label} (${s.minutes} minutes) — ${s.section_focus}`);
      for (const o of s.objectives) out += line(`- Objective: ${o}`);
      for (const a of s.agenda) out += line(`- ${a.block} (${a.minutes} min): ${a.detail}`);
      out += line(`- Exit check: ${s.exit_check}`);
    }
    out += line("");
    out += line(`**Independent practice**`);
    for (const o of w.independent_practice) out += line(`- ${o}`);
    out += line(`**At-home reinforcement between sessions**`);
    for (const o of w.home_reinforcement) out += line(`- ${o}`);
    if (w.progress_check) out += line(`**Progress check:** ${w.progress_check}`);
  }
  out += line("");

  out += line(`## Assessment checkpoints`);
  for (const m of c.milestones) out += line(`- Week ${m.week} (${m.kind.replace(/_/g, " ")}): ${m.description}`);
  out += line("");

  out += line(`## Workbook development specifications`);
  for (const w of c.workbook_specifications) out += line(`- ${w}`);
  out += line("");

  out += line(`## Consultant notes`);
  for (const n of c.consultant_notes) out += line(`- ${n}`);
  return out;
}

/** Safe file stem for downloads, e.g. "tachs-curriculum-mckenzie-gray-8-week". */
export function curriculumFileStem(c: TachsCurriculum): string {
  const name = c.student_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
  return `tachs-curriculum-${name}-${c.program.duration_weeks}-week`;
}
