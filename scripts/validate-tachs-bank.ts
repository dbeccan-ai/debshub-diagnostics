// Blueprint-aware bank validation. Fails (exit 1) unless every shipped version is internally consistent:
// administered quotas sum to the working allocation (50/50/50/20/15/15 = 200), every skill has at least
// its quota in the pool, pool minimums and difficulty mix hold, keys are balanced, codes/stems are unique,
// rationales and visuals/alt text are complete, and paper-folding geometry is valid.
import { BANK_VERSIONS, choiceCountFor, type BankQuestion, type Blueprint } from "../supabase/functions/tachs-engine/sample-bank.ts";
import { PAPER_FOLDING_V2_MODELS } from "../supabase/functions/tachs-engine/bank-paper-folding-v2.ts";
import { isDrawable, sameFigure } from "../supabase/functions/tachs-engine/fold-engine.ts";

const ADMINISTERED: Record<string, number> = { reading: 50, written_expression: 50, mathematics: 50, figure_matrices: 20, paper_folding: 15, figure_classification: 15 };
const VISUAL = new Set(["figure_matrices", "paper_folding", "figure_classification"]);
const errors: string[] = [];
const allCodes = new Set<string>();

function validateVersion(bp: Blueprint, bank: BankQuestion[], frozen: boolean) {
  const tag = `v${bp.version}`;
  const stems = new Set<string>();
  const counts: Record<string, number> = {};
  const skillCounts: Record<string, Record<string, number>> = {};
  const diffCounts: Record<string, Record<number, number>> = {};

  for (const q of bank as any[]) {
    const id = `${tag} ${q.code ?? "(no code)"}`;
    if (!q.code || allCodes.has(q.code)) errors.push(`${id}: missing/duplicate code`); allCodes.add(q.code);
    if (!ADMINISTERED[q.section_key]) errors.push(`${id}: bad section ${q.section_key}`);
    counts[q.section_key] = (counts[q.section_key] ?? 0) + 1;
    (skillCounts[q.section_key] ??= {})[q.skill] = (skillCounts[q.section_key]?.[q.skill] ?? 0) + 1;
    (diffCounts[q.section_key] ??= { 1: 0, 2: 0, 3: 0 })[q.difficulty] = (diffCounts[q.section_key]?.[q.difficulty] ?? 0) + 1;
    if (![1, 2, 3].includes(q.difficulty)) errors.push(`${id}: difficulty ${q.difficulty}`);
    if (!q.skill || /sample|placeholder/i.test(q.skill)) errors.push(`${id}: skill`);
    const stem = String(q.stem ?? "").trim();
    if (stem.length < 8 || /\b(sample|placeholder|question \d+)\b/i.test(stem)) errors.push(`${id}: weak stem`);
    const stemKey = `${q.section_key}|${q.passage_id ?? ""}|${stem}|${JSON.stringify(q.visual ?? null)}|${JSON.stringify(q.choices)}`;
    if (stems.has(stemKey)) errors.push(`${id}: repeated stem`); stems.add(stemKey);
    const n = choiceCountFor(q.section_key, bp.version);
    const expectKeys = "ABCDE".slice(0, n);
    const keys = (q.choices ?? []).map((c: any) => c.key).join("");
    if (keys !== expectKeys) errors.push(`${id}: choice keys ${keys} (expected ${expectKeys})`);
    const texts = (q.choices ?? []).map((c: any) => String(c.text ?? c.label ?? JSON.stringify(c.visual ?? "")).trim());
    if (new Set(texts).size !== n || texts.some((t: string) => !t)) errors.push(`${id}: choices not ${n} distinct non-empty`);
    if (!expectKeys.includes(q.correct_key)) errors.push(`${id}: correct_key ${q.correct_key}`);
    if (!q.rationale || String(q.rationale).trim().length < 10) errors.push(`${id}: rationale`);
    if (VISUAL.has(q.section_key)) {
      if (!q.visual || typeof q.visual !== "object") errors.push(`${id}: visual JSON missing`);
      if (!q.visual_alt || String(q.visual_alt).trim().length < 10) errors.push(`${id}: visual_alt`);
    }
    if (q.section_key === "mathematics" && bp.version >= 2 && !q.strand) errors.push(`${id}: mathematics item missing reporting strand`);
  }

  for (const s of bp.sections) {
    const quotaSum = Object.values(s.skill_quotas).reduce((a, b) => a + b, 0);
    if (quotaSum !== s.item_count) errors.push(`${tag} ${s.key}: skill quotas sum ${quotaSum} ≠ item_count ${s.item_count}`);
    if (s.item_count !== ADMINISTERED[s.key]) errors.push(`${tag} ${s.key}: administered ${s.item_count} ≠ working allocation ${ADMINISTERED[s.key]}`);
    const pool = counts[s.key] ?? 0;
    const min = s.pool_minimum ?? s.item_count;
    if (pool < min) errors.push(`${tag} ${s.key}: pool ${pool} < minimum ${min}`);
    for (const [skill, quota] of Object.entries(s.skill_quotas)) {
      const have = skillCounts[s.key]?.[skill] ?? 0;
      if (have < quota) errors.push(`${tag} ${s.key}/${skill}: pool ${have} < quota ${quota}`);
    }
    for (const skill of Object.keys(skillCounts[s.key] ?? {})) if (!(skill in s.skill_quotas)) errors.push(`${tag} ${s.key}: unknown skill ${skill}`);
    if (s.pool_difficulty_mix) {
      for (const [lvl, share] of Object.entries(s.pool_difficulty_mix)) {
        const actual = (diffCounts[s.key]?.[Number(lvl)] ?? 0) / Math.max(1, pool);
        if (Math.abs(actual - share) > 0.06) errors.push(`${tag} ${s.key}: level ${lvl} share ${(actual * 100).toFixed(1)}% vs target ${(share * 100).toFixed(1)}%`);
      }
    }
    // answer-key balance per section
    const seq = (bank as any[]).filter((q) => q.section_key === s.key).map((q) => q.correct_key);
    let run = 1;
    for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] ? run + 1 : 1; if (run > 4) { errors.push(`${tag} ${s.key}: answer-key run > 4 at item ${i + 1}`); break; } }
    const keyset = "ABCDE".slice(0, choiceCountFor(s.key, bp.version));
    const dist = keyset.split("").map((k) => seq.filter((x) => x === k).length);
    if (Math.min(...dist) < Math.floor(seq.length * 0.1)) errors.push(`${tag} ${s.key}: unbalanced key distribution ${dist.join("/")}`);
  }
  const administered = bp.sections.reduce((a, s) => a + s.item_count, 0);
  if (administered !== 200) errors.push(`${tag}: administered total ${administered}/200`);
  if (frozen && bank.length !== 200) errors.push(`${tag}: frozen bank must stay at 200 items (is ${bank.length})`);
  console.log(`${tag} ${bp.name}: pool ${bank.length}, administered ${administered}`, counts);
}

for (const v of BANK_VERSIONS) validateVersion(v.blueprint, v.bank, v.frozen);

// Paper Folding v2 geometry: correct figure drawable, choices pairwise distinct, single-fold count capped.
for (const [code, model] of Object.entries(PAPER_FOLDING_V2_MODELS)) {
  if (!isDrawable(model.correct)) errors.push(`${code}: correct figure not drawable`);
  const all = [model.correct, ...model.distractors.map((d) => d.u)];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (sameFigure(all[i], all[j])) errors.push(`${code}: choices ${i} and ${j} are the same figure`);
  if (model.distractors.length !== 3) errors.push(`${code}: ${model.distractors.length} distractors`);
}
const v2 = BANK_VERSIONS.find((v) => v.blueprint.version === 2)!;
const pfSingleQuota = v2.blueprint.sections.find((s) => s.key === "paper_folding")!.skill_quotas.single_fold ?? 0;
if (pfSingleQuota > 2) errors.push(`v2 paper_folding: single_fold presented quota ${pfSingleQuota} > 2`);
for (const q of v2.bank) if (q.section_key === "paper_folding" && q.choices.some((c) => c.text)) errors.push(`${q.code}: text-only paper folding choice`);

if (errors.length) { console.error(`TACHS bank validation FAILED (${errors.length}):\n- ` + errors.join("\n- ")); process.exit(1); }
console.log("TACHS bank OK");
