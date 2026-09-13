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
