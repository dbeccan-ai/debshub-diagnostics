// Web-app entry point for the ADMIN-ONLY curriculum document builders (Markdown/TXT + DOCX).
// Imported only by the admin-guarded curriculum page and tests.
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { TachsCurriculum } from "./tachsCurriculum";

export { curriculumMarkdown, curriculumFileStem } from "../../supabase/functions/_shared/tachs-curriculum-doc";

const p = (text: string, opts: { bold?: boolean; bullet?: boolean; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] } = {}) =>
  new Paragraph({
    heading: opts.heading,
    bullet: opts.bullet ? { level: 0 } : undefined,
    children: [new TextRun({ text, bold: opts.bold })],
  });

/** Builds the admin-only curriculum as a real .docx blob. */
export async function curriculumDocxBlob(c: TachsCurriculum): Promise<Blob> {
  const body: Paragraph[] = [
    p(c.title, { heading: HeadingLevel.HEADING_1 }),
    p("ADMIN ONLY — internal consultant document. Never sent to families.", { bold: true }),
    p(`Student: ${c.student_name}${c.grade_level ? ` (Grade ${c.grade_level})` : ""}`),
    p(`Program: ${c.program.name}`),
    p(`Scope: ${c.program.schedule_label}`),
    p(`Diagnostic overall accuracy: ${c.overall_accuracy}%`),
    p("Diagnosed priorities", { heading: HeadingLevel.HEADING_2 }),
    p(`Priority sections: ${c.priorities.join(", ") || "None"}`),
    p(`Strengths to maintain: ${c.strengths.join(", ") || "None yet"}`),
    ...[...c.section_profile].sort((a, b) => a.priority_rank - b.priority_rank).map((s) =>
      p(`${s.priority_rank}. ${s.label} — ${s.accuracy}% (${s.tier_badge}) — weakest: ${s.weakest_skills.map((k) => `${k.label} ${k.correct}/${k.presented}`).join("; ") || "—"}`, { bullet: true })),
    p("Weekly and session sequence", { heading: HeadingLevel.HEADING_2 }),
  ];

  for (const w of c.weeks) {
    body.push(p(`Week ${w.week} — ${w.phase}`, { heading: HeadingLevel.HEADING_3 }));
    body.push(p(`Focus: ${w.focus_sections.join(" · ")}`));
    body.push(p(`Skills: ${w.focus_skills.join(" · ")}`));
    if (w.algebra_focus) body.push(p(`Algebra I foundations: ${w.algebra_focus}`));
    body.push(p("Objectives", { bold: true }));
    w.objectives.forEach((o) => body.push(p(o, { bullet: true })));
    for (const s of w.sessions) {
      body.push(p(`Session ${s.session} — ${s.day_label} (${s.minutes} minutes) — ${s.section_focus}`, { bold: true }));
      s.objectives.forEach((o) => body.push(p(`Objective: ${o}`, { bullet: true })));
      s.agenda.forEach((a) => body.push(p(`${a.block} (${a.minutes} min): ${a.detail}`, { bullet: true })));
      body.push(p(`Exit check: ${s.exit_check}`, { bullet: true }));
    }
    body.push(p("Independent practice", { bold: true }));
    w.independent_practice.forEach((o) => body.push(p(o, { bullet: true })));
    body.push(p("At-home reinforcement between sessions", { bold: true }));
    w.home_reinforcement.forEach((o) => body.push(p(o, { bullet: true })));
    if (w.progress_check) body.push(p(`Progress check: ${w.progress_check}`));
  }

  body.push(p("Assessment checkpoints", { heading: HeadingLevel.HEADING_2 }));
  c.milestones.forEach((m) => body.push(p(`Week ${m.week} (${m.kind.replace(/_/g, " ")}): ${m.description}`, { bullet: true })));
  body.push(p("Workbook development specifications", { heading: HeadingLevel.HEADING_2 }));
  c.workbook_specifications.forEach((w) => body.push(p(w, { bullet: true })));
  body.push(p("Consultant notes", { heading: HeadingLevel.HEADING_2 }));
  c.consultant_notes.forEach((n) => body.push(p(n, { bullet: true })));

  const doc = new Document({ sections: [{ children: body }] });
  return Packer.toBlob(doc);
}
