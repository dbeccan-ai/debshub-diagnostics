// Print-safe HTML for the general K-12 Math/ELA diagnostic report. Same section order for both subjects.
// Charts are inline SVG (prints without "background graphics") and every value is also printed as text.
import { type DiagnosticReport, type SkillSummary, type ResponseRow, STATUS_LABEL, SKILL_STATUS_THRESHOLDS, UNMAPPED_SKILL, BRAND_NAME, BRAND_TAGLINE, formatReportDate } from "./diagnostic-report.ts";

const NAVY = "#1C2D5A", YELLOW = "#FFDE59", RED = "#D72638", GREEN = "#1E7B3C", AMBER = "#8A5A00";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const statusColor = (s: string) => (s === "strength" ? GREEN : s === "developing" ? AMBER : s === "priority" ? RED : "#555");
const statusWord = (s: string) => (s === "strength" ? "Strength" : s === "developing" ? "Developing" : s === "priority" ? "Priority support" : "Not yet scored");
const fmtDate = (d: string | null) => formatReportDate(d);
const gradeTxt = (g: number | null) => (g === null || g === undefined ? "Not recorded" : g === 0 ? "Kindergarten" : `Grade ${g}`);

function bar(pct: number | null, status: string) {
  const w = Math.max(0, Math.min(100, pct ?? 0));
  return `<svg class="bar" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="${pct ?? 0}%"><rect x="0" y="0" width="100" height="10" fill="#fff" stroke="#999" stroke-width="0.6"/><rect x="0" y="0" width="${w}" height="10" fill="${statusColor(status)}"/><line x1="${SKILL_STATUS_THRESHOLDS.DEVELOPING}" y1="0" x2="${SKILL_STATUS_THRESHOLDS.DEVELOPING}" y2="10" stroke="#000" stroke-width="0.4" stroke-dasharray="1,1"/><line x1="${SKILL_STATUS_THRESHOLDS.STRENGTH}" y1="0" x2="${SKILL_STATUS_THRESHOLDS.STRENGTH}" y2="10" stroke="#000" stroke-width="0.4" stroke-dasharray="1,1"/></svg>`;
}
const evidenceCell = (s: { usesPoints: boolean; earned: number; possible: number; correctItems: number; scoredItems: number; pendingItems: number }) =>
  `${s.usesPoints ? `${s.earned}/${s.possible} pts` : `${s.correctItems}/${s.scoredItems} correct`}<br><span class="sub">${s.scoredItems} scored item${s.scoredItems === 1 ? "" : "s"}${s.pendingItems ? `, ${s.pendingItems} pending` : ""}</span>`;

function list(items: SkillSummary[], empty: string) {
  if (!items.length) return `<p class="muted">${empty}</p>`;
  return `<ul>${items.map((s) => `<li><strong>${esc(s.skill)}</strong> — ${s.pct}% (${s.usesPoints ? `${s.earned}/${s.possible} pts` : `${s.correctItems}/${s.scoredItems}`})${s.lowEvidence ? ` <em>· limited evidence</em>` : ""}</li>`).join("")}</ul>`;
}

const CSS = `
@page { size: Letter; margin: 0.6in 0.6in 0.7in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.4; color: #111; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.wrap { max-width: 7.3in; margin: 0 auto; padding: 0.2in 0; }
header.brand { display: flex; align-items: center; gap: 12px; border-bottom: 4px solid ${NAVY}; padding-bottom: 8px; }
header.brand img { height: 48px; width: 48px; }
.brand-name { color: ${NAVY}; font-weight: 700; font-size: 16pt; letter-spacing: .5px; }
.brand-tag { color: #333; font-size: 12pt; }
.stripe { height: 6px; background: ${YELLOW}; border-bottom: 1px solid ${NAVY}; margin-bottom: 14px; }
h1 { color: ${NAVY}; font-size: 18pt; margin: 6px 0 4px; }
h2 { color: ${NAVY}; font-size: 14pt; margin: 18px 0 6px; border-bottom: 2px solid ${NAVY}; padding-bottom: 2px; break-after: avoid; page-break-after: avoid; }
section { break-inside: auto; }
.keep { break-inside: avoid; page-break-inside: avoid; }
.newpage { break-before: page; page-break-before: always; }
tr.grp, tr.grp th { break-after: avoid; page-break-after: avoid; }
table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; font-size: 12pt; }
thead { display: table-header-group; }
tr { break-inside: avoid; page-break-inside: avoid; }
th, td { border: 1px solid #777; padding: 5px 6px; text-align: left; vertical-align: top; }
th { background: #E8ECF5; color: ${NAVY}; }
.sub, .muted { color: #444; font-size: 12pt; }
.muted { font-style: italic; }
.bar { width: 100%; height: 12px; display: block; }
.status { font-weight: 700; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; }
.callout { border: 2px solid ${NAVY}; border-left: 8px solid ${YELLOW}; padding: 8px 10px; margin: 8px 0; }
.warn { border: 2px solid ${RED}; border-left: 8px solid ${RED}; padding: 8px 10px; margin: 8px 0; }
.score-big { font-size: 24pt; font-weight: 700; color: ${NAVY}; }
footer.end { margin-top: 18px; border-top: 2px solid ${NAVY}; padding-top: 6px; font-size: 12pt; color: #333; break-inside: avoid; page-break-inside: avoid; }
ul { margin: 4px 0 4px 20px; padding: 0; }
`;

function head(r: DiagnosticReport, logoUrl?: string | null, teacher = false) {
  return `<header class="brand">${logoUrl ? `<img src="${esc(logoUrl)}" alt="${BRAND_NAME} logo">` : ""}<div><div class="brand-name">${BRAND_NAME}</div><div class="brand-tag">${BRAND_TAGLINE} · D.E.Bs Diagnostic Hub</div></div></header><div class="stripe"></div>
<h1>${esc(r.subjectLabel)} Diagnostic Report${teacher ? " — Teacher Copy" : ""}</h1>${teacher ? `<p class="sub"><strong>Confidential staff copy:</strong> includes answer keys and item-level responses. Sections 1–7 are identical to the parent report.</p>` : ""}
<section class="keep"><div class="grid">
<div><strong>Student:</strong> ${esc(r.student.name)}</div><div><strong>Assessment:</strong> ${esc(r.test.name)}</div>
<div><strong>Assessed grade (test level):</strong> ${gradeTxt(r.assessedGrade)}</div><div><strong>Enrolled grade:</strong> ${r.enrolledGrade === null ? "Not confirmed by staff" : gradeTxt(r.enrolledGrade)}</div>
<div><strong>Completed:</strong> ${fmtDate(r.completedAt)}</div><div><strong>Subject:</strong> ${esc(r.subjectLabel)}</div></div></section>`;
}
function foot(r: DiagnosticReport) {
  return `<footer class="end"><strong>${BRAND_NAME}</strong> · <em>${BRAND_TAGLINE}</em><br>Contact · info@debslearnacademy.com · 347-364-1906 · www.debslearnacademy.com<br>Report generated ${formatReportDate(r.generatedAt, true)} (Eastern Time) · Report version ${esc(r.version)} · Attempt ${esc(r.test.attemptId.slice(0, 8))}</footer>`;
}

export interface TeacherCopyOptions { responses: ResponseRow[] }
function coverageBlock(r: DiagnosticReport) {
  const cv = r.coverage;
  if (!cv) return "";
  const groups = cv.choiceGroups.length ? `<table><thead><tr><th>Choice group</th><th>Required</th><th>Saved responses</th><th>Status</th></tr></thead><tbody>${cv.choiceGroups.map((g) => `<tr><td>${esc(g.key)}</td><td>${g.required} of ${g.size}</td><td>${g.answered}</td><td><strong>${g.status === "complete" ? "Requirement met" : `Incomplete — ${g.missingRequired} required response${g.missingRequired === 1 ? "" : "s"} missing`}</strong></td></tr>`).join("")}</tbody></table>` : "";
  if (cv.state === "complete") return `<p class="sub"><strong>Completion:</strong> ${esc(cv.statement)}</p>${groups}`;
  return `<div class="warn keep"><strong>Required work incomplete.</strong> ${esc(cv.statement)} This score is based on recorded scored items only (${cv.answeredRequired} of ${cv.requiredItems} required responses saved). Missing work was not scored as zero, and no answers were filled in.</div>${groups}`;
}
function teacherAppendix(r: DiagnosticReport, t: TeacherCopyOptions) {
  const byId = new Map(t.responses.map((x) => [x.question_id, x]));
  const optional = new Set(r.coverage?.optionalNotSelectedIds ?? []);
  const word = (o: string, id: string) => (o === "unanswered" ? (optional.has(id) ? "Optional — not selected" : "No saved response") : o === "pending" ? "Awaiting review" : o === "partial" ? "Partial credit" : o === "correct" ? "Correct" : "Incorrect");
  const sections = [...new Set(r.items.map((i) => i.section ?? "Questions"))];
  return `<section class="newpage"><h2>8. Teacher appendix: item responses and answer key</h2>
<p class="sub">Outcomes come from the same saved evidence used in sections 1–7. Points are shown only for scored items.</p>
${sections.map((sec) => `<table><thead><tr><th colspan="5">${esc(sec)}</th></tr><tr><th style="width:0.5in">#</th><th>Question / skill</th><th style="width:1.6in">Student response</th><th style="width:1.3in">Answer key</th><th style="width:1.2in">Outcome</th></tr></thead><tbody>${r.items.filter((i) => (i.section ?? "Questions") === sec).map((i) => {
    const resp = byId.get(i.id);
    return `<tr><td>${i.position}</td><td>${esc(i.question)}<br><span class="sub">${esc(i.skill === UNMAPPED_SKILL ? "Unmapped item" : i.skill)} · ${esc(i.domain)} · ${esc(i.id)}</span></td><td>${resp ? esc(resp.answer === "" || resp.answer == null ? "(blank)" : resp.answer) : "—"}</td><td>${esc(i.correct_answer || (i.scoring === "manual" ? "Rubric / teacher judgement" : "—"))}</td><td><strong>${word(i.outcome, i.id)}</strong>${i.possible !== null ? `<br><span class="sub">${i.earned}/${i.possible} pts</span>` : ""}</td></tr>`;
  }).join("")}</tbody></table>`).join("")}</section>`;
}

export function renderTeacherCopyHtml(r: DiagnosticReport, t: TeacherCopyOptions, opts: { logoUrl?: string | null } = {}): string {
  return renderDiagnosticReportHtml(r, { ...opts, teacher: t });
}

export function renderDiagnosticReportHtml(r: DiagnosticReport, opts: { logoUrl?: string | null; teacher?: TeacherCopyOptions } = {}): string {
  const open = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(r.subjectLabel)} Diagnostic Report — ${esc(r.student.name)}</title><style>${CSS}</style></head><body><main class="wrap">`;
  const close = `</main></body></html>`;

  if (r.verification.state === "requires_verification") {
    return `${open}${head(r, opts.logoUrl, !!opts.teacher)}
<div class="warn keep"><h2 style="border:none;margin-top:0;color:${RED}">Scoring details require verification</h2>
<p>This report cannot be issued as final because the saved records conflict or are incomplete. No tier, skill heat map or recommendations are shown until the evidence is verified by D.E.Bs staff.</p>
<p><strong>Missing or conflicting evidence:</strong></p><ul>${r.verification.issues.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
<section class="keep"><h2>Recorded values (unverified)</h2><table><tbody>
<tr><th>Stored overall score</th><td>${r.score.stored ?? "—"}%</td></tr>
<tr><th>Recomputed from saved responses</th><td>${r.score.pct ?? "—"}% (${esc(r.score.basis)})</td></tr>
<tr><th>Questions in bank / answered / scored / pending</th><td>${r.counts.totalItems} / ${r.counts.answered} / ${r.counts.scored} / ${r.counts.pending}</td></tr></tbody></table></section>
${r.verification.notes.length ? `<section><h2>Notes</h2><ul>${r.verification.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></section>` : ""}
${coverageBlock(r)}${opts.teacher ? teacherAppendix(r, opts.teacher) : ""}${foot(r)}${close}`;
  }

  const c = r.counts;
  const legend = `<p class="sub">Status key (text label always printed): <strong>${STATUS_LABEL.strength}</strong> · <strong>${STATUS_LABEL.developing}</strong> · <strong>${STATUS_LABEL.priority}</strong>. Dashed lines on each bar mark ${SKILL_STATUS_THRESHOLDS.DEVELOPING}% and ${SKILL_STATUS_THRESHOLDS.STRENGTH}%.</p>`;
  const shortNote = (x: { scoredItems: number; lowEvidence: boolean }) => (x.lowEvidence ? `<br><span class="sub">Limited evidence (${x.scoredItems} item${x.scoredItems === 1 ? "" : "s"})*</span>` : "");
  const shortStep = (t: string) => t.replace(/ Confirm with additional items before drawing conclusions\./, "");
  const domainsInOrder = [...new Set(r.skills.map((s) => s.domain))];
  const skillRows = domainsInOrder.map((d) => `<tr class="grp"><th colspan="5">${esc(d)}</th></tr>` + r.skills.filter((s) => s.domain === d).map((s) => `<tr><td>${esc(s.skill === UNMAPPED_SKILL ? "Unmapped items (no skill tag)" : s.skill)}${s.skillSource === "inferred" ? `<br><span class="sub">inferred from wording</span>` : ""}</td><td>${evidenceCell(s)}</td><td>${s.pct === null ? "—" : `${s.pct}%`}${bar(s.pct, s.status)}</td><td><span class="status" style="color:${statusColor(s.status)}">${statusWord(s.status)}</span>${shortNote(s)}</td><td>${esc(shortStep(s.nextStep))}</td></tr>`).join("")).join("");
  const domainRows = r.domains.map((d) => `<tr><td>${esc(d.domain)}</td><td>${d.notAssessed ? "—" : evidenceCell(d)}</td><td>${d.pct === null ? "—" : `${d.pct}%`}${d.notAssessed ? "" : bar(d.pct, d.status)}</td><td><span class="status" style="color:${statusColor(d.status)}">${d.notAssessed ? "Not assessed" : statusWord(d.status)}</span>${d.lowEvidence ? `<br><span class="sub">Limited evidence (${d.scoredItems} item${d.scoredItems === 1 ? "" : "s"})*</span>` : ""}</td></tr>`).join("");

  return `${open}${head(r, opts.logoUrl, !!opts.teacher)}
<section class="keep"><h2>1. Score summary</h2>
<div class="callout"><span class="score-big">${r.score.pct}%</span> &nbsp; <strong>${esc(r.score.tier)}</strong>
<p><strong>How this score was calculated:</strong> ${esc(r.score.basis)}</p></div>
<table><thead><tr><th>Questions on test</th><th>Fully correct</th><th>Partial credit</th><th>Incorrect</th><th>Awaiting review</th><th>No response</th></tr></thead>
<tbody><tr><td>${c.totalItems}</td><td>${c.correct}</td><td>${c.partial}</td><td>${c.incorrect}</td><td>${c.pending}</td><td>${c.unanswered}</td></tr></tbody></table>
${coverageBlock(r)}
${r.verification.notes.length ? `<ul class="sub">${r.verification.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}</section>
<section><h2>2. Strengths, developing skills and priority support</h2>
<div class="keep"><strong style="color:${GREEN}">Strengths (${SKILL_STATUS_THRESHOLDS.STRENGTH}%+)</strong>${list(r.strengths, "No assessed skill reached 85% yet.")}</div>
<div class="keep"><strong style="color:${AMBER}">Developing (${SKILL_STATUS_THRESHOLDS.DEVELOPING}–${SKILL_STATUS_THRESHOLDS.STRENGTH - 1}%)</strong>${list(r.developing, "No assessed skill fell in the developing range.")}</div>
<div class="keep"><strong style="color:${RED}">Priority support (below ${SKILL_STATUS_THRESHOLDS.DEVELOPING}%)</strong>${list(r.priority, "No assessed skill fell below 66%.")}</div></section>
<section class="keep"><h2>3. ${r.subject === "ela" ? "Domain" : "Section"} summary</h2>${legend}
<table><thead><tr><th>${r.subject === "ela" ? "Domain" : "Section"}</th><th>Evidence</th><th>Accuracy</th><th>Status</th></tr></thead><tbody>${domainRows}</tbody></table></section>
<section class="newpage"><h2>4. Skill-by-skill results</h2>
<table><thead><tr><th style="width:1.7in">Skill</th><th style="width:1.1in">Evidence</th><th style="width:1.1in">Accuracy</th><th style="width:1.3in">Status</th><th>Next step</th></tr></thead><tbody>${skillRows}</tbody></table>
<p class="sub">* Limited evidence: fewer than 3 scored items. A result such as 100% on one item is not proof of broad mastery (and 0% on one item is not proof of a broad gap); confirm with additional items.</p></section>
<section class="keep"><h2>5. Priority focus</h2>${r.priorityFocus.length ? `<ol>${r.priorityFocus.map((s) => `<li><strong>${esc(s.skill)}</strong> (${s.pct}% on ${s.scoredItems} item${s.scoredItems === 1 ? "" : "s"}): ${esc(s.nextStep)}</li>`).join("")}</ol>` : `<p>No assessed skill is below ${SKILL_STATUS_THRESHOLDS.DEVELOPING}%; continue with the developing skills above.</p>`}</section>
<section class="keep"><h2>6. What the ${esc(r.score.tier)} placement means</h2><p>${esc(r.tierExplanation)}</p></section>
<div class="keep"><section><h2>7. Program length and formal retests</h2><p>Recommended: <strong>${esc(r.program.label)}</strong>. Formal diagnostic retests are built into the program at:</p>
<table><thead><tr><th>Retest</th><th>Status</th></tr></thead><tbody>${r.program.retests.map((t) => `<tr><td>${esc(t.label)}</td><td>${t.status === "not_scheduled" ? "Scheduled when the program starts" : esc(t.status)}${t.unlock_date ? ` (opens ${fmtDate(t.unlock_date)})` : ""}</td></tr>`).join("")}</tbody></table></section>
${opts.teacher ? `</div>${teacherAppendix(r, opts.teacher)}${foot(r)}` : `${foot(r)}</div>`}${close}`;
}
