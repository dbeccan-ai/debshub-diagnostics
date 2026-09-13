// Content Audit summary for the admin page and the static snapshot. Pure: no I/O, no secrets.
// The summary never includes stems, answer keys or rationales — those are only served by the
// admin-gated `admin_content_audit` engine action.
import { BANK_VERSIONS, choiceCountFor, type BankQuestion, type Blueprint } from "./sample-bank.ts";
import { READING_V2_PASSAGES } from "./bank-reading-v2.ts";
import { WRITTEN_V2_PASSAGES } from "./bank-written-v2.ts";
import { testModeQuotas } from "./logic.ts";

export interface SectionAudit {
  key: string; name: string; administered: number; pool: number; pool_minimum: number; choices: number; time_minutes: number;
  skills: { skill: string; quota: number; pool: number; ok: boolean }[];
  difficulty: { level: number; count: number; share: number; target: number | null; ok: boolean }[];
  keys: Record<string, number>;
  test_mode: { item_count: number; skills: string[] };
  warnings: string[];
}
export interface PassageAudit { id: string; title: string; kind: string; words: number; items: number; section: string }
export interface ContentAudit {
  generated_at: string;
  versions: { version: number; name: string; frozen: boolean; pool: number; administered: number; sections: SectionAudit[]; passages: PassageAudit[]; warnings: string[] }[];
}

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function auditVersion(bp: Blueprint, bank: BankQuestion[], frozen: boolean) {
  const warnings: string[] = [];
  const sections: SectionAudit[] = bp.sections.map((s) => {
    const items = bank.filter((q) => q.section_key === s.key);
    const sw: string[] = [];
    const skills = Object.entries(s.skill_quotas).map(([skill, quota]) => {
      const pool = items.filter((q) => q.skill === skill).length;
      if (pool < quota) sw.push(`${skill}: pool ${pool} < quota ${quota}`);
      return { skill, quota, pool, ok: pool >= quota };
    });
    for (const q of items) if (!(q.skill in s.skill_quotas)) sw.push(`${q.code}: unknown skill ${q.skill}`);
    const difficulty = [1, 2, 3].map((level) => {
      const count = items.filter((q) => q.difficulty === level).length;
      const share = items.length ? count / items.length : 0;
      const target = s.pool_difficulty_mix?.[String(level)] ?? null;
      const ok = target == null || Math.abs(share - target) <= 0.06;
      if (!ok) sw.push(`level ${level} share ${(share * 100).toFixed(0)}% vs target ${((target ?? 0) * 100).toFixed(0)}%`);
      return { level, count, share, target, ok };
    });
    const keys: Record<string, number> = {};
    for (const q of items) keys[q.correct_key] = (keys[q.correct_key] ?? 0) + 1;
    const n = choiceCountFor(s.key, bp.version);
    for (const q of items) if (q.choices.length !== n) sw.push(`${q.code}: ${q.choices.length} choices (expected ${n})`);
    const min = s.pool_minimum ?? s.item_count;
    if (items.length < min) sw.push(`pool ${items.length} < minimum ${min}`);
    const tm = testModeQuotas(s, items.length);
    return {
      key: s.key, name: s.name, administered: s.item_count, pool: items.length, pool_minimum: min, choices: n, time_minutes: s.time_minutes,
      skills, difficulty, keys, test_mode: { item_count: tm.item_count, skills: Object.keys(tm.quotas) }, warnings: sw,
    };
  });
  const passages: PassageAudit[] = bp.version >= 2
    ? [
      ...READING_V2_PASSAGES.map((p) => ({ id: p.id, title: p.title, kind: p.kind, words: words(p.text), items: bank.filter((q) => q.passage_id === p.id).length, section: "reading" })),
      ...WRITTEN_V2_PASSAGES.map((p) => ({ id: p.id, title: p.title, kind: "editing", words: words(p.text), items: bank.filter((q) => q.passage_id === p.id).length, section: "written_expression" })),
    ]
    : [];
  for (const p of passages) if (p.section === "reading" && (p.words < 300 || p.words > 450)) warnings.push(`${p.id}: ${p.words} words (target 300–450)`);
  const administered = bp.sections.reduce((a, s) => a + s.item_count, 0);
  if (administered !== 200) warnings.push(`administered total ${administered} ≠ 200`);
  return { version: bp.version, name: bp.name, frozen, pool: bank.length, administered, sections, passages, warnings };
}

export function buildContentAudit(): ContentAudit {
  return { generated_at: new Date().toISOString(), versions: BANK_VERSIONS.map((v) => auditVersion(v.blueprint, v.bank, v.frozen)) };
}

/** Admin-only item previews (answers included). Never send to students. */
export function auditItems(version: number) {
  const v = BANK_VERSIONS.find((x) => x.blueprint.version === version);
  if (!v) return [];
  return v.bank.map((q) => ({
    code: q.code, section_key: q.section_key, skill: q.skill, difficulty: q.difficulty, strand: q.strand ?? null,
    stem: q.stem, passage_id: q.passage_id ?? null, passage_title: q.passage_title ?? null, visual: q.visual ?? null, visual_alt: q.visual_alt ?? null,
    choices: q.choices, correct_key: q.correct_key, rationale: q.rationale,
  }));
}
