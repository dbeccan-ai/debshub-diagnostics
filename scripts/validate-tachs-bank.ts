// Fails (exit 1) unless the shipped TACHS bank is exactly 200 valid items: 50/50/50/20/15/15.
import { SAMPLE_BANK } from "../supabase/functions/tachs-engine/sample-bank.ts";

const TARGET: Record<string, number> = { reading: 50, written_expression: 50, mathematics: 50, figure_matrices: 20, paper_folding: 15, figure_classification: 15 };
const VISUAL = new Set(["figure_matrices", "paper_folding", "figure_classification"]);
const errors: string[] = [];
const codes = new Set<string>();
const stems = new Set<string>();
const counts: Record<string, number> = {};

for (const q of SAMPLE_BANK as any[]) {
  const id = q.code ?? "(no code)";
  if (!q.code || codes.has(q.code)) errors.push(`${id}: missing/duplicate code`); codes.add(q.code);
  if (!TARGET[q.section_key]) errors.push(`${id}: bad section ${q.section_key}`);
  counts[q.section_key] = (counts[q.section_key] ?? 0) + 1;
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${id}: difficulty ${q.difficulty}`);
  if (!q.skill || /sample|placeholder/i.test(q.skill)) errors.push(`${id}: skill`);
  const stem = String(q.stem ?? "").trim();
  if (stem.length < 8 || /\b(sample|placeholder|question \d+)\b/i.test(stem)) errors.push(`${id}: weak stem`);
  const stemKey = `${q.section_key}|${q.passage_id ?? ""}|${stem}|${VISUAL.has(q.section_key) ? JSON.stringify(q.visual ?? null) : ""}`;
  if (stems.has(stemKey)) errors.push(`${id}: repeated stem`); stems.add(stemKey);
  const keys = (q.choices ?? []).map((c: any) => c.key).join("");
  if (keys !== "ABCD") errors.push(`${id}: choice keys ${keys}`);
  const texts = (q.choices ?? []).map((c: any) => String(c.text ?? c.label ?? JSON.stringify(c.visual ?? "")).trim());
  if (new Set(texts).size !== 4 || texts.some((t: string) => !t)) errors.push(`${id}: choices not 4 distinct non-empty`);
  if (!["A", "B", "C", "D"].includes(q.correct_key)) errors.push(`${id}: correct_key ${q.correct_key}`);
  if (!q.rationale || String(q.rationale).trim().length < 10) errors.push(`${id}: rationale`);
  if (VISUAL.has(q.section_key)) {
    if (!q.visual || typeof q.visual !== "object") errors.push(`${id}: visual JSON missing`);
    if (!q.visual_alt || String(q.visual_alt).trim().length < 10) errors.push(`${id}: visual_alt`);
  }
}
for (const [k, n] of Object.entries(TARGET)) if ((counts[k] ?? 0) !== n) errors.push(`section ${k}: ${counts[k] ?? 0}/${n}`);
if (SAMPLE_BANK.length !== 200) errors.push(`total ${SAMPLE_BANK.length}/200`);

// Reject trivially patterned answer sequences (e.g. long runs of the same key) per section.
for (const sec of Object.keys(TARGET)) {
  const seq = (SAMPLE_BANK as any[]).filter((q) => q.section_key === sec).map((q) => q.correct_key);
  let run = 1;
  for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] ? run + 1 : 1; if (run > 4) { errors.push(`${sec}: answer-key run > 4 at item ${i + 1}`); break; } }
  const dist = "ABCD".split("").map((k) => seq.filter((s) => s === k).length);
  if (Math.min(...dist) < Math.floor(seq.length * 0.1)) errors.push(`${sec}: unbalanced key distribution ${dist.join("/")}`);
}

if (errors.length) { console.error(`TACHS bank validation FAILED (${errors.length}):\n- ` + errors.join("\n- ")); process.exit(1); }
console.log(`TACHS bank OK: ${SAMPLE_BANK.length} items`, counts);
