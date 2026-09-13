// D.E.Bs TACHS Readiness Diagnostic — shared content types, blueprint and SVG helpers.
// All content is original work authored for the D.E.Bs pilot.
// Not affiliated with, sponsored by, or endorsed by the TACHS program or its publisher.

export type VisualItem =
  | { t: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; dash?: boolean }
  | { t: "rect"; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; rot?: number; dash?: boolean }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; stroke?: string; dash?: boolean; arrow?: boolean }
  | { t: "text"; x: number; y: number; s: string; size?: number }
  | { t: "poly"; pts: [number, number][]; fill?: string; stroke?: string; dash?: boolean }
  | { t: "shape"; kind: ShapeKind; cx: number; cy: number; size: number; fill?: string; stroke?: string; rot?: number; dash?: boolean };

export type ShapeKind = "triangle" | "diamond" | "star" | "hexagon" | "pentagon" | "arrow" | "plus" | "square" | "circle";

export interface VisualSpec { w: number; h: number; items: VisualItem[] }

export interface Choice { key: string; text?: string; visual?: VisualSpec }

export type SectionKey =
  | "reading"
  | "written_expression"
  | "mathematics"
  | "figure_matrices"
  | "paper_folding"
  | "figure_classification";

/** Mathematics reporting ladder (v2). */
export type MathStrand = "foundation" | "grade8" | "algebra1";

export interface BankQuestion {
  code: string;
  section_key: SectionKey;
  skill: string;
  difficulty: 1 | 2 | 3;
  stem: string;
  passage_id?: string;
  passage_title?: string;
  passage_text?: string;
  visual?: VisualSpec;
  visual_alt?: string;
  choices: Choice[];
  correct_key: string;
  rationale: string;
  strand?: MathStrand;
}

export interface BlueprintSection {
  key: SectionKey;
  name: string;
  order: number;
  item_count: number;
  time_minutes: number;
  calculator: boolean;
  break_after_minutes: number;
  skill_quotas: Record<string, number>;
  description: string;
  /** v2: minimum active pool size required for meaningful adaptive selection (defaults to item_count). */
  pool_minimum?: number;
  /** v2: target share of the POOL at each difficulty level, e.g. { 1: 0.2, 2: 0.45, 3: 0.35 } (validated with tolerance). */
  pool_difficulty_mix?: Record<string, number>;
}

export interface Blueprint { version: number; name: string; notes?: string; sections: BlueprintSection[] }

export const BLUEPRINT_V1 = {
  version: 1,
  name: "D.E.Bs TACHS Readiness Diagnostic — Pilot v1",
  notes:
    "D.E.Bs working allocation; the 130-minute total mirrors the published regular testing time. Section item counts and timing are not official TACHS specifications.",
  sections: [
    {
      key: "reading", name: "Reading", order: 1, item_count: 50, time_minutes: 30, calculator: false, break_after_minutes: 0,
      description: "Original literary, informational, paired and argument passages with questions on central idea, evidence, inference, structure, purpose, tone and vocabulary in context.",
      skill_quotas: { main_idea: 12, inference: 14, vocabulary_in_context: 12, text_structure: 12 },
    },
    {
      key: "written_expression", name: "Written Expression", order: 2, item_count: 50, time_minutes: 25, calculator: false, break_after_minutes: 0,
      description: "Editing and revising: usage and agreement, punctuation and capitalization, sentence structure and concision, organization and transitions.",
      skill_quotas: { grammar_usage: 14, punctuation_capitalization: 12, sentence_structure: 12, organization: 12 },
    },
    {
      key: "mathematics", name: "Mathematics", order: 3, item_count: 50, time_minutes: 40, calculator: true, break_after_minutes: 5,
      description: "Number operations, fractions/decimals/percent, ratios and pre-algebra, geometry and measurement, data and probability, multi-step problems.",
      skill_quotas: { number_operations: 12, fractions_decimals_percent: 10, algebra_patterns: 10, geometry_measurement: 10, data_probability: 8 },
    },
    {
      key: "figure_matrices", name: "Figure Matrices", order: 4, item_count: 20, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "Find the rule across the rows and columns of a 3 x 3 grid and choose the missing figure.",
      skill_quotas: { rotation: 5, shading: 5, count: 5, size_change: 5 },
    },
    {
      key: "paper_folding", name: "Paper Folding", order: 5, item_count: 15, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "A sheet of paper is folded and hole-punched. Choose how it looks when it is unfolded.",
      skill_quotas: { single_fold: 8, double_fold: 7 },
    },
    {
      key: "figure_classification", name: "Figure Classification", order: 6, item_count: 15, time_minutes: 11, calculator: false, break_after_minutes: 0,
      description: "Three figures share a rule. Choose the answer figure that belongs with them.",
      skill_quotas: { shape_attribute: 5, count_attribute: 5, shading_attribute: 5 },
    },
  ] as BlueprintSection[],
};

/** Academic sections use four choices (A–D); the three Ability sections use five (A–E) from v2 onward. */
export const ABILITY_SECTIONS: ReadonlySet<SectionKey> = new Set<SectionKey>(["figure_matrices", "paper_folding", "figure_classification"]);
export const choiceCountFor = (section: SectionKey, version: number): number => (version >= 2 && ABILITY_SECTIONS.has(section) ? 5 : 4);

/**
 * Pilot v2 — administered allocation unchanged (50/50/50/20/15/15 = 200 items, 130 minutes).
 * Every section draws from a pool larger than the administered count so adaptive routing produces
 * genuinely different difficulty paths. Calculator policy for Mathematics is carried over from v1
 * unchanged (D.E.Bs pilot decision; not an official TACHS policy statement). All section objects are
 * independent of v1 (no shared references), so v1 can never be mutated by v2 edits.
 */
export const BLUEPRINT_V2: Blueprint = {
  version: 2,
  name: "D.E.Bs TACHS Readiness Diagnostic — Pilot v2",
  notes:
    "D.E.Bs working allocation; the 130-minute total mirrors the published regular testing time. Section item counts and timing are not official TACHS specifications. v2: all six sections rebuilt with larger original pools, adaptive selection, Grade 8–9 academic reading, standalone conventions, a Grade 8 → Algebra I mathematics ladder, and five-choice Ability items.",
  sections: [
    {
      key: "reading", name: "Reading", order: 1, item_count: 50, time_minutes: 30, calculator: false, break_after_minutes: 0,
      description: "Ten longer original literary, historical, informational, argumentative and paired passages (300–450 words) with questions on central idea, inference, vocabulary in context, author's purpose and tone, structure, evidence and rhetorical analysis.",
      skill_quotas: { main_idea: 6, inference: 9, vocabulary_in_context: 9, author_purpose_tone: 8, text_structure: 6, detail_evidence: 6, rhetorical_analysis: 6 },
      pool_minimum: 75,
      pool_difficulty_mix: { "1": 0.2, "2": 0.45, "3": 0.35 },
    },
    {
      key: "written_expression", name: "Written Expression", order: 2, item_count: 50, time_minutes: 25, calculator: false, break_after_minutes: 0,
      description: "Passage editing and revision plus standalone conventions: capitalization, punctuation, spelling, word usage, agreement, sentence structure (fragments, run-ons, compound/complex), parallelism, modifiers, and organization.",
      skill_quotas: { grammar_usage: 10, punctuation_capitalization: 10, sentence_structure: 10, organization_coherence: 8, revision_style: 6, spelling_word_usage: 6 },
      pool_minimum: 75,
      pool_difficulty_mix: { "1": 0.2, "2": 0.45, "3": 0.35 },
    },
    {
      key: "mathematics", name: "Mathematics", order: 3, item_count: 50, time_minutes: 40, calculator: true, break_after_minutes: 5,
      description: "Late Grade 8 through introductory Algebra I: integer and number fluency, ratio/proportion/percent, algebra and functions (equations, inequalities, slope, function notation, systems, exponents, roots, sequences), geometry and measurement, data/probability/statistics, and multistep modeling.",
      skill_quotas: { number_integer_fluency: 6, ratio_proportion_percent: 6, algebra_functions: 20, geometry_measurement: 8, data_probability_statistics: 6, multistep_modeling: 4 },
      pool_minimum: 75,
      pool_difficulty_mix: { "1": 0.2, "2": 0.45, "3": 0.35 },
    },
    {
      key: "figure_matrices", name: "Figure Matrices", order: 4, item_count: 20, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "Find the rule across the rows and columns of a 3 x 3 grid — rotation, overlay composition, progression, shading/size change, alternation and integrated two-rule patterns — and choose the missing figure from five options.",
      skill_quotas: { rotation_reflection: 4, overlay_composition: 3, progression_count: 3, shading_size_change: 3, two_rule_integration: 5, alternating_pattern: 2 },
      pool_minimum: 36,
      pool_difficulty_mix: { "1": 0.13, "2": 0.42, "3": 0.45 },
    },
    {
      key: "paper_folding", name: "Paper Folding", order: 5, item_count: 15, time_minutes: 12, calculator: false, break_after_minutes: 1,
      description: "A sheet is folded one to three times (vertical, horizontal, diagonal, off-center), then punched or notched. Each fold is shown as its own panel; choose the fully unfolded sheet from five options.",
      skill_quotas: { single_fold: 2, two_fold_reflection: 3, three_fold_sequence: 3, diagonal_reflection: 2, multiple_punches: 2, edge_notch: 1, asymmetric_fold: 2 },
      pool_minimum: 30,
      pool_difficulty_mix: { "1": 0.125, "2": 0.47, "3": 0.405 },
    },
    {
      key: "figure_classification", name: "Figure Classification", order: 6, item_count: 15, time_minutes: 11, calculator: false, break_after_minutes: 0,
      description: "Three figures share a rule built from interacting attributes (shape family, shading, count, orientation, internal structure, size/position). Choose the one option of five that belongs with them.",
      skill_quotas: { shape_attribute_combo: 3, count_shading: 3, orientation_symmetry: 3, internal_structure: 3, size_position_partwhole: 3 },
      pool_minimum: 30,
      pool_difficulty_mix: { "1": 0.25, "2": 0.44, "3": 0.31 },
    },
  ],
};

export const MATH_STRAND_LABELS: Record<MathStrand, string> = {
  foundation: "Foundation (Grades 6–7 fluency)",
  grade8: "Grade-8 Readiness",
  algebra1: "Algebra-I Readiness",
};

// ---------- shared SVG helpers ----------
export const NAVY = "#1C2D5A";
export const GRAY = "#94a3b8";
export const RED = "#D72638";

export const shape = (
  kind: ShapeKind, cx: number, cy: number, size: number,
  extra: Partial<Extract<VisualItem, { t: "shape" }>> = {},
): VisualItem => ({ t: "shape", kind, cx, cy, size, stroke: NAVY, fill: "none", ...extra });

export const at = (it: VisualItem[], dx: number, dy: number): VisualItem[] =>
  it.map((i) => {
    if (i.t === "shape") return { ...i, cx: i.cx + dx, cy: i.cy + dy };
    if (i.t === "circle") return { ...i, cx: i.cx + dx, cy: i.cy + dy };
    if (i.t === "rect") return { ...i, x: i.x + dx, y: i.y + dy };
    if (i.t === "text") return { ...i, x: i.x + dx, y: i.y + dy };
    if (i.t === "poly") return { ...i, pts: i.pts.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
    return { ...i, x1: i.x1 + dx, y1: i.y1 + dy, x2: i.x2 + dx, y2: i.y2 + dy };
  });

/** 3x3 matrix, 240x240, 80px cells. `cellFn` returns cell-local items, or null for the missing cell. */
export function grid(cellFn: (i: number) => VisualItem[] | null): VisualSpec {
  const items: VisualItem[] = [];
  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * 80, y = Math.floor(i / 3) * 80;
    items.push({ t: "rect", x: x + 1, y: y + 1, w: 78, h: 78, stroke: "#94a3b8", fill: "none" });
    const c = cellFn(i);
    if (c === null) items.push({ t: "text", x: x + 40, y: y + 52, s: "?", size: 34 });
    else items.push(...at(c, x, y));
  }
  return { w: 240, h: 240, items };
}

export const single = (
  kind: ShapeKind, extra: Partial<Extract<VisualItem, { t: "shape" }>> = {}, size = 40,
): VisualItem[] => [shape(kind, 40, 40, size, extra)];

export const choiceFig = (items: VisualItem[]): VisualSpec => ({
  w: 80, h: 80,
  items: [{ t: "rect", x: 1, y: 1, w: 78, h: 78, stroke: "#cbd5e1", fill: "none" }, ...items],
});

const DOT_LAYOUTS: number[][][] = [
  [],
  [[40, 40]],
  [[28, 40], [52, 40]],
  [[40, 24], [28, 54], [52, 54]],
  [[28, 28], [52, 28], [28, 52], [52, 52]],
  [[28, 26], [52, 26], [40, 40], [28, 56], [52, 56]],
  [[26, 24], [54, 24], [26, 40], [54, 40], [26, 56], [54, 56]],
  [[22, 24], [40, 24], [58, 24], [22, 40], [58, 40], [22, 56], [58, 56]],
  [[22, 24], [40, 24], [58, 24], [22, 40], [58, 40], [22, 56], [40, 56], [58, 56]],
  [[22, 24], [40, 24], [58, 24], [22, 40], [40, 40], [58, 40], [22, 56], [40, 56], [58, 56]],
];

export const dots = (n: number, fill: string = NAVY): VisualItem[] =>
  (DOT_LAYOUTS[n] ?? DOT_LAYOUTS[1]).map(([x, y]) => ({ t: "circle", cx: x, cy: y, r: n > 6 ? 6 : 7, fill, stroke: NAVY }) as VisualItem);

/** Unfolded 100x100 sheet with holes given in 0-100 sheet coordinates. */
export const unfolded = (holes: [number, number][]): VisualSpec => ({
  w: 100, h: 100,
  items: [
    { t: "rect", x: 2, y: 2, w: 96, h: 96, stroke: NAVY, fill: "#fff" },
    ...holes.map(([x, y]) => ({ t: "circle", cx: 2 + x * 0.96, cy: 2 + y * 0.96, r: 5, fill: "#fff", stroke: NAVY }) as VisualItem),
  ],
});
