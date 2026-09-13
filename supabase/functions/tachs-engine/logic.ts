// Pure scoring / adaptive-routing logic for the D.E.Bs TACHS Readiness Diagnostic.
// Kept free of Deno and Supabase imports so it can be unit tested directly.

export interface Band { key: string; label: string; min: number; color: string; plan: string }

/** D.E.Bs pilot readiness thresholds (overall raw accuracy, percent). */
export const BANDS: Band[] = [
  {
    key: "strong", label: "Strong Readiness", min: 85, color: "#16a34a",
    plan: "Keep momentum with one timed mixed section each week and short reviews of any remaining gap skills. Focus on pacing consistency and a steady test-day routine.",
  },
  {
    key: "approaching", label: "Approaching Readiness", min: 70, color: "#2563eb",
    plan: "Follow a 6-week plan: two focused skill sessions each week on the flagged gaps plus one full timed section. Re-assess at week 6.",
  },
  {
    key: "developing", label: "Developing", min: 55, color: "#d97706",
    plan: "Rebuild the two weakest sections before adding timed practice. Use short daily sessions of 20 to 30 minutes with a weekly progress check over 10 weeks.",
  },
  {
    key: "foundations", label: "Building Foundations", min: 0, color: "#dc2626",
    plan: "Begin with structured instruction in core reading, language and number skills. Delay timed practice until accuracy improves, and re-assess after a 15-week support block.",
  },
];

export const bandFor = (overallAccuracy: number): Band =>
  BANDS.find((b) => overallAccuracy >= b.min) ?? BANDS[BANDS.length - 1];

export interface AdaptiveState { difficulty: number; streakCorrect: number; streakIncorrect: number }

/**
 * Two consecutive correct answers move one difficulty level harder,
 * two consecutive incorrect answers move one level easier, otherwise hold.
 * Difficulty is clamped to 1 (easy) .. 3 (hard).
 */
export function advanceAdaptive(state: AdaptiveState, lastCorrect: boolean | null): AdaptiveState & { transition: "up" | "down" | null } {
  let { difficulty, streakCorrect: sc, streakIncorrect: si } = state;
  let transition: "up" | "down" | null = null;
  if (lastCorrect === true) {
    sc += 1; si = 0;
    if (sc >= 2) { if (difficulty < 3) { difficulty += 1; transition = "up"; } sc = 0; }
  } else if (lastCorrect === false) {
    si += 1; sc = 0;
    if (si >= 2) { if (difficulty > 1) { difficulty -= 1; transition = "down"; } si = 0; }
  }
  return { difficulty, streakCorrect: sc, streakIncorrect: si, transition };
}

export const DISCLAIMER =
  "This is a preliminary D.E.Bs readiness result, not an official TACHS scaled score, percentile, admission decision, or scholarship prediction. D.E.Bs working allocation; the 130-minute total mirrors the published regular testing time. Section item counts and timing are not official TACHS specifications.";

export const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  written_expression: "Written Expression",
  mathematics: "Mathematics",
  figure_matrices: "Figure Matrices",
  paper_folding: "Paper Folding",
  figure_classification: "Figure Classification",
};

export const skillLabel = (skill: string) =>
  skill.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Sections whose active bank is smaller than the blueprint target (normal mode must refuse to start). */
export function sectionsShortOfTarget(
  sections: { key: string; item_count: number }[],
  availability: Record<string, number>,
): { key: string; available: number; target: number }[] {
  return sections
    .filter((s) => (availability[s.key] ?? 0) < s.item_count)
    .map((s) => ({ key: s.key, available: availability[s.key] ?? 0, target: s.item_count }));
}

// ---------- adaptive selection (pure) ----------
export interface PoolItem { id: string; skill: string; difficulty: number }

/**
 * Pick the next item from `candidates` (already excludes presented items — sampling without replacement).
 * Content quotas are mandatory: while any skill still has quota, only those skills are eligible, so the
 * adaptive route can never skip a required domain. Within eligible skills the target difficulty is
 * preferred, then the nearest level. Ties are broken uniformly at random via `rng`.
 */
export function selectNextQuestion<T extends PoolItem>(
  candidates: T[], quotas: Record<string, number>, targetDifficulty: number, rng: () => number = Math.random,
): T | null {
  if (!candidates.length) return null;
  const open = new Set(Object.entries(quotas).filter(([, n]) => n > 0).map(([k]) => k));
  let eligible = open.size ? candidates.filter((q) => open.has(q.skill)) : candidates;
  if (!eligible.length) eligible = candidates; // pool cannot satisfy the quota: degrade gracefully instead of stalling
  const target = Math.min(3, Math.max(1, Math.round(targetDifficulty || 2)));
  const order = [target, target === 2 ? 1 : 2, target === 3 ? 1 : 3].filter((v, i, a) => a.indexOf(v) === i);
  for (const d of order) {
    const atD = eligible.filter((q) => q.difficulty === d);
    if (atD.length) return atD[Math.floor(rng() * atD.length)];
  }
  return eligible[Math.floor(rng() * eligible.length)];
}

/** Deterministic PRNG for tests and simulations (mulberry32). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulatedSection {
  presented: { id: string; skill: string; difficulty: number; correct: boolean }[];
  difficultyCounts: Record<number, number>;
  meanDifficulty: number;
  skillCounts: Record<string, number>;
  path: number[];
}

/**
 * Simulate one section exactly as the engine runs it: start at level 2, select with quotas, advance the
 * streak rule after each response. `pCorrect(difficulty)` models the student.
 */
export function simulateSection<T extends PoolItem>(
  pool: T[], quotas: Record<string, number>, itemCount: number, pCorrect: (difficulty: number) => number, rng: () => number,
): SimulatedSection {
  let state: AdaptiveState = { difficulty: 2, streakCorrect: 0, streakIncorrect: 0 };
  const remaining = { ...quotas };
  const presentedIds = new Set<string>();
  const presented: SimulatedSection["presented"] = [];
  const path: number[] = [];
  for (let i = 0; i < itemCount; i++) {
    const q = selectNextQuestion(pool.filter((p) => !presentedIds.has(p.id)), remaining, state.difficulty, rng);
    if (!q) break;
    presentedIds.add(q.id);
    if (remaining[q.skill] != null) remaining[q.skill] = Math.max(0, remaining[q.skill] - 1);
    const correct = rng() < pCorrect(q.difficulty);
    presented.push({ id: q.id, skill: q.skill, difficulty: q.difficulty, correct });
    path.push(q.difficulty);
    state = advanceAdaptive(state, correct);
  }
  const difficultyCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const skillCounts: Record<string, number> = {};
  for (const p of presented) { difficultyCounts[p.difficulty]++; skillCounts[p.skill] = (skillCounts[p.skill] ?? 0) + 1; }
  const meanDifficulty = presented.length ? presented.reduce((a, p) => a + p.difficulty, 0) / presented.length : 0;
  return { presented, difficultyCounts, meanDifficulty, skillCounts, path };
}

// ---------- mathematics reporting ladder ----------
export const MATH_STRAND_ORDER = ["foundation", "grade8", "algebra1"] as const;
export type MathStrandKey = typeof MATH_STRAND_ORDER[number];
export const MATH_STRAND_LABEL: Record<MathStrandKey, string> = {
  foundation: "Foundation (Grades 6–7 fluency)",
  grade8: "Grade-8 Readiness",
  algebra1: "Algebra-I Readiness",
};

export interface StrandRow { key: MathStrandKey; label: string; presented: number; correct: number; accuracy: number }

/** Aggregate Mathematics responses into the Foundation / Grade-8 / Algebra-I ladder (items without a strand are ignored). */
export function mathReadiness(rows: { strand: string | null | undefined; is_correct: boolean | null }[]): StrandRow[] {
  const acc: Record<string, { presented: number; correct: number }> = {};
  for (const r of rows) {
    if (!r.strand || !(MATH_STRAND_ORDER as readonly string[]).includes(r.strand)) continue;
    acc[r.strand] ??= { presented: 0, correct: 0 };
    acc[r.strand].presented++;
    if (r.is_correct) acc[r.strand].correct++;
  }
  return MATH_STRAND_ORDER.filter((k) => acc[k]).map((k) => ({
    key: k, label: MATH_STRAND_LABEL[k], presented: acc[k].presented, correct: acc[k].correct,
    accuracy: Math.round((acc[k].correct / acc[k].presented) * 100),
  }));
}

/** A section is locked once submitted or once its server deadline has passed. */
export function isSectionLocked(
  section: { status: string; deadline_at: string | null },
  nowMs: number = Date.now(),
): boolean {
  if (section.status === "submitted") return true;
  if (section.deadline_at && new Date(section.deadline_at).getTime() <= nowMs) return true;
  return false;
}

/** Grading is idempotent: a completed attempt with stored results is never regraded. */
export function needsGrading(attempt: { status: string; results: unknown | null }): boolean {
  return !(attempt.status === "completed" && attempt.results != null);
}

/** Masks an address for non-admin display: j•••e@example.com */
export function maskEmail(email: string | null | undefined): string | null {
  const pe = String(email ?? "");
  const at = pe.indexOf("@");
  if (at <= 0) return null;
  return `${pe[0]}${"•".repeat(Math.max(2, at - 2))}${at > 1 ? pe[at - 1] : ""}@${pe.slice(at + 1)}`;
}
