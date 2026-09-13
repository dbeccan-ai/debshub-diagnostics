// Pure helpers for the admin TACHS pages. No I/O so they are unit-testable.
import type { TachsAdminAttempt, TachsAuditRow, TachsCarryover, TachsSectionKey, TachsAuditItem } from "@/lib/tachs";

/** Pinned quick links to specific immutable attempts (IDs only — never score data). */
export const PINNED_ATTEMPTS: { id: string; label: string; note: string }[] = [
  {
    id: "90ebaec6-415a-45bd-a6f0-32b9421aedf2",
    label: "Mckenzie Gray — completed diagnostic",
    note: "Blueprint v2 attempt containing carry-over Reading/Written items (V2-R / V2-W). Not identical to the final revised v2 bank; consultant review required.",
  },
];

export type AttemptMode = "all" | "student" | "test";
export const MODE_LABEL: Record<AttemptMode, string> = { all: "All", student: "Student attempts", test: "TEST MODE" };

export const modeOf = (a: Pick<TachsAdminAttempt, "test_mode">): Exclude<AttemptMode, "all"> => (a.test_mode ? "test" : "student");
export const filterByMode = <T extends Pick<TachsAdminAttempt, "test_mode">>(attempts: T[], mode: AttemptMode): T[] =>
  mode === "all" ? attempts : attempts.filter((a) => modeOf(a) === mode);
export const countsByMode = (attempts: Pick<TachsAdminAttempt, "test_mode">[]): Record<AttemptMode, number> => ({
  all: attempts.length,
  student: attempts.filter((a) => !a.test_mode).length,
  test: attempts.filter((a) => a.test_mode).length,
});

/**
 * Result of loading the attempt list. An API failure is a distinct state from "zero attempts":
 * the UI must never render an empty table for `error`.
 */
export type ListLoad<T> =
  | { kind: "ok"; source: "engine" | "direct"; attempts: T[] }
  | { kind: "error"; message: string };
export const isEmptyData = <T>(l: ListLoad<T>) => l.kind === "ok" && l.attempts.length === 0;
export const isLoadError = <T>(l: ListLoad<T>) => l.kind === "error";

/** Mirrors the shared server helper; flags earlier blueprint-v2 carry-over codes. */
export function carryoverSummary(codes: (string | null | undefined)[]): TachsCarryover {
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

/** Raw rows as read directly from the database (admin RLS). */
export interface RawResponse { question_id: string; section_id: string; position: number; skill: string; difficulty: number; selected_key: string | null; is_correct: boolean | null; is_flagged: boolean; time_spent_seconds: number; presented_at: string; answered_at: string | null }
export interface RawQuestion { id: string; code: string; section_key: string; stem: string; correct_key: string; rationale: string | null }
export interface RawSection { id: string; section_key: TachsSectionKey }

/** Builds the internal answer audit from immutable stored responses + the exact question rows they reference. */
export function buildAuditRows(responses: RawResponse[], questions: RawQuestion[], sections: RawSection[]): TachsAuditRow[] {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const secMap = new Map(sections.map((s) => [s.id, s.section_key]));
  return [...responses].sort((a, b) => a.position - b.position).map((r) => {
    const q = qMap.get(r.question_id);
    return {
      section_key: secMap.get(r.section_id) ?? (q?.section_key as TachsSectionKey),
      position: r.position, code: q?.code, stem: q?.stem, skill: r.skill, difficulty: r.difficulty,
      selected_key: r.selected_key, correct_key: q?.correct_key, rationale: q?.rationale ?? null, is_correct: r.is_correct,
      is_flagged: r.is_flagged, time_spent_seconds: r.time_spent_seconds, presented_at: r.presented_at, answered_at: r.answered_at,
    };
  });
}

// ---------- Content audit: v1 frozen vs v2 revised comparison ----------
export interface VersionSectionSummary {
  key: string; name: string; administered: number; pool: number; choices: number; time_minutes: number;
  skills: { skill: string; quota: number; pool: number; ok: boolean }[];
  difficulty: { level: number; count: number; share: number; target: number | null; ok: boolean }[];
}
export interface VersionSummary { version: number; name: string; frozen: boolean; pool: number; administered: number; sections: VersionSectionSummary[] }

export interface SectionComparisonRow {
  key: string; name: string;
  left: VersionSectionSummary | null; right: VersionSectionSummary | null;
  pool_delta: number; choices_changed: boolean;
  skills: { skill: string; left_quota: number | null; right_quota: number | null; left_pool: number | null; right_pool: number | null; changed: boolean }[];
  difficulty: { level: number; left_share: number | null; right_share: number | null }[];
}

/** Side-by-side section comparison of two bank versions (pure; summary-only, no keys). */
export function compareVersions(left: VersionSummary, right: VersionSummary): SectionComparisonRow[] {
  const keys = [...new Set([...left.sections.map((s) => s.key), ...right.sections.map((s) => s.key)])];
  return keys.map((key) => {
    const l = left.sections.find((s) => s.key === key) ?? null;
    const r = right.sections.find((s) => s.key === key) ?? null;
    const skillKeys = [...new Set([...(l?.skills ?? []).map((s) => s.skill), ...(r?.skills ?? []).map((s) => s.skill)])];
    return {
      key, name: (r ?? l)?.name ?? key, left: l, right: r,
      pool_delta: (r?.pool ?? 0) - (l?.pool ?? 0),
      choices_changed: !!l && !!r && l.choices !== r.choices,
      skills: skillKeys.map((skill) => {
        const ls = l?.skills.find((s) => s.skill === skill); const rs = r?.skills.find((s) => s.skill === skill);
        return { skill, left_quota: ls?.quota ?? null, right_quota: rs?.quota ?? null, left_pool: ls?.pool ?? null, right_pool: rs?.pool ?? null, changed: (ls?.quota ?? null) !== (rs?.quota ?? null) || !ls || !rs };
      }),
      difficulty: [1, 2, 3].map((level) => ({
        level,
        left_share: l?.difficulty.find((d) => d.level === level)?.share ?? null,
        right_share: r?.difficulty.find((d) => d.level === level)?.share ?? null,
      })),
    };
  });
}

/** Items of one section, filtered. Used identically for both sides of a comparison. */
export function filterItems(items: TachsAuditItem[], f: { section?: string; skill?: string; difficulty?: string; query?: string }): TachsAuditItem[] {
  const q = (f.query ?? "").trim().toLowerCase();
  return items.filter((it) =>
    (!f.section || f.section === "all" || it.section_key === f.section) &&
    (!f.skill || f.skill === "all" || it.skill === f.skill) &&
    (!f.difficulty || f.difficulty === "all" || String(it.difficulty) === f.difficulty) &&
    (!q || `${it.code} ${it.stem} ${it.passage_title ?? ""}`.toLowerCase().includes(q)));
}

/** Codes used by an attempt that do not exist in the given bank (e.g. V2-R carry-over vs revised RD2). */
export function codesNotInBank(attemptCodes: (string | null | undefined)[], bankItems: Pick<TachsAuditItem, "code">[]): string[] {
  const set = new Set(bankItems.map((b) => b.code));
  return [...new Set(attemptCodes.filter((c): c is string => !!c && !set.has(c)))];
}
