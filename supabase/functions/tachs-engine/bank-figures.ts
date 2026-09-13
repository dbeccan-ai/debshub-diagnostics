// Figure Matrices (20), Paper Folding (15), Figure Classification (15) — 50 original items.
// Every figure is generated programmatically, and each answer key is derived from the same
// rule used to draw the stem, so keys always match the rendered geometry.
import {
  type BankQuestion, type Choice, type ShapeKind, type VisualItem, type VisualSpec,
  NAVY, GRAY, RED, at, choiceFig, dots, grid, shape, single, unfolded,
} from "./bank-types.ts";

const keys = ["A", "B", "C", "D"];
const pack = (correctVisual: VisualSpec, distractors: VisualSpec[], correctIndex: number): { choices: Choice[]; correct_key: string } => {
  const all = [...distractors];
  all.splice(correctIndex, 0, correctVisual);
  return { choices: all.map((v, i) => ({ key: keys[i], visual: v })), correct_key: keys[correctIndex] };
};

// ---------------- Figure Matrices ----------------
/** Shape with a marker dot on its "top" so any rotation is visible. */
const rotFig = (kind: ShapeKind, rot: number, size = 36): VisualItem[] => {
  const rad = ((rot - 90) * Math.PI) / 180;
  return [
    shape(kind, 40, 40, size, { rot }),
    { t: "circle", cx: 40 + 22 * Math.cos(rad), cy: 40 + 22 * Math.sin(rad), r: 4, fill: RED, stroke: RED },
  ];
};

const fmRotation = (code: string, difficulty: 1 | 2 | 3, kind: ShapeKind, step: number, correctIndex: number): BankQuestion => {
  const rot = (i: number) => (((i % 3) + Math.floor(i / 3)) * step) % 360;
  const answer = rot(8);
  const wrong = [step, step * 2, step * 3].map((d) => (answer + d) % 360).filter((r) => r !== answer).slice(0, 3);
  const { choices, correct_key } = pack(
    choiceFig(rotFig(kind, answer)),
    wrong.map((r) => choiceFig(rotFig(kind, r))),
    correctIndex,
  );
  return {
    code, section_key: "figure_matrices", skill: "rotation", difficulty,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : rotFig(kind, rot(i)))),
    visual_alt: `A 3 by 3 grid of ${kind} figures, each marked with a red dot. Moving one cell to the right turns the figure ${step} degrees clockwise, and moving one cell down also turns it ${step} degrees clockwise. The bottom-right cell is missing.`,
    choices, correct_key,
    rationale: `Each step right or down adds ${step}°. The missing cell is four steps from the top-left figure, so it is turned ${answer}°.`,
  };
};

const FILLS = ["none", GRAY, NAVY];
const FILL_NAMES = ["unshaded", "gray", "black"];
const fmShading = (code: string, difficulty: 1 | 2 | 3, kinds: [ShapeKind, ShapeKind, ShapeKind], offset: number, correctIndex: number): BankQuestion => {
  const fillOf = (i: number) => FILLS[((i % 3) + offset * Math.floor(i / 3)) % 3];
  const kindOf = (i: number) => kinds[Math.floor(i / 3)];
  const answerFill = fillOf(8), answerKind = kindOf(8);
  const { choices, correct_key } = pack(
    choiceFig(single(answerKind, { fill: answerFill })),
    [
      choiceFig(single(answerKind, { fill: FILLS[(FILLS.indexOf(answerFill) + 1) % 3] })),
      choiceFig(single(answerKind, { fill: FILLS[(FILLS.indexOf(answerFill) + 2) % 3] })),
      choiceFig(single(kinds[0], { fill: answerFill })),
    ],
    correctIndex,
  );
  return {
    code, section_key: "figure_matrices", skill: "shading", difficulty,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : single(kindOf(i), { fill: fillOf(i) }))),
    visual_alt: `A 3 by 3 grid. Row 1 shows ${kinds[0]}s, row 2 shows ${kinds[1]}s, and row 3 shows ${kinds[2]}s. The shading in each row cycles through unshaded, gray, and black. The bottom-right cell is missing.`,
    choices, correct_key,
    rationale: `The row fixes the shape (${answerKind}) and the shading cycle gives a ${FILL_NAMES[FILLS.indexOf(answerFill)]} figure in the last cell.`,
  };
};

const fmCount = (code: string, difficulty: 1 | 2 | 3, base: number, correctIndex: number): BankQuestion => {
  const count = (i: number) => base + (i % 3) + Math.floor(i / 3);
  const answer = count(8);
  const { choices, correct_key } = pack(
    choiceFig(dots(answer)),
    [choiceFig(dots(answer - 1)), choiceFig(dots(answer - 2)), choiceFig(dots(Math.max(1, answer - 3)))],
    correctIndex,
  );
  return {
    code, section_key: "figure_matrices", skill: "count", difficulty,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : dots(count(i)))),
    visual_alt: `A 3 by 3 grid of dot groups. The first row has ${count(0)}, ${count(1)} and ${count(2)} dots, and each row below adds one more dot to each cell. The bottom-right cell is missing.`,
    choices, correct_key,
    rationale: `Each step right adds one dot and each step down adds one dot, so the missing cell holds ${answer} dots.`,
  };
};

const SIZES = [20, 32, 46];
const fmSize = (code: string, difficulty: 1 | 2 | 3, kinds: [ShapeKind, ShapeKind, ShapeKind], reverse: boolean, correctIndex: number): BankQuestion => {
  const sizeOf = (i: number) => (reverse ? SIZES[2 - (i % 3)] : SIZES[i % 3]);
  const kindOf = (i: number) => kinds[Math.floor(i / 3)];
  const answerSize = sizeOf(8), answerKind = kindOf(8);
  const { choices, correct_key } = pack(
    choiceFig(single(answerKind, {}, answerSize)),
    [
      choiceFig(single(answerKind, {}, SIZES[(SIZES.indexOf(answerSize) + 1) % 3])),
      choiceFig(single(kinds[0], {}, answerSize)),
      choiceFig(single(answerKind, { fill: NAVY }, answerSize)),
    ],
    correctIndex,
  );
  return {
    code, section_key: "figure_matrices", skill: "size_change", difficulty,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : single(kindOf(i), {}, sizeOf(i)))),
    visual_alt: `A 3 by 3 grid. Each row shows one unshaded shape three times, getting ${reverse ? "smaller" : "larger"} from left to right. Row 3 shows ${kinds[2]}s, and the last cell is missing.`,
    choices, correct_key,
    rationale: `The shape stays the same across a row while the size changes in order, so the missing figure is the ${reverse ? "smallest" : "largest"} unshaded ${answerKind}.`,
  };
};

export const FIGURE_MATRICES: BankQuestion[] = [
  fmRotation("FM-01", 1, "arrow", 90, 1),
  fmRotation("FM-02", 2, "triangle", 45, 2),
  fmRotation("FM-03", 2, "diamond", 90, 0),
  fmRotation("FM-04", 3, "pentagon", 45, 3),
  fmRotation("FM-05", 3, "square", 45, 1),
  fmShading("FM-06", 1, ["circle", "square", "triangle"], 0, 2),
  fmShading("FM-07", 2, ["hexagon", "pentagon", "diamond"], 1, 0),
  fmShading("FM-08", 2, ["square", "circle", "hexagon"], 2, 3),
  fmShading("FM-09", 3, ["triangle", "diamond", "star"], 1, 1),
  fmShading("FM-10", 3, ["pentagon", "hexagon", "circle"], 2, 2),
  fmCount("FM-11", 1, 1, 0),
  fmCount("FM-12", 2, 1, 3),
  fmCount("FM-13", 2, 2, 1),
  fmCount("FM-14", 3, 2, 2),
  fmCount("FM-15", 3, 1, 1),
  fmSize("FM-16", 1, ["circle", "square", "triangle"], false, 3),
  fmSize("FM-17", 2, ["hexagon", "diamond", "star"], false, 0),
  fmSize("FM-18", 2, ["square", "pentagon", "circle"], true, 2),
  fmSize("FM-19", 3, ["triangle", "hexagon", "diamond"], true, 1),
  fmSize("FM-20", 3, ["star", "circle", "pentagon"], false, 2),
];

// ---------------- Paper Folding ----------------
type Fold = "vertical" | "horizontal" | "diagonal";

/** Stem art: flat sheet with the fold line, an arrow, then the folded piece with its punches. */
function foldVisual(fold: Fold, holes: [number, number][]): VisualSpec {
  const items: VisualItem[] = [{ t: "rect", x: 10, y: 20, w: 100, h: 100, stroke: NAVY, fill: "#fff" }];
  if (fold === "vertical") items.push({ t: "line", x1: 60, y1: 20, x2: 60, y2: 120, stroke: NAVY, dash: true }, { t: "line", x1: 104, y1: 70, x2: 70, y2: 70, stroke: RED, arrow: true });
  if (fold === "horizontal") items.push({ t: "line", x1: 10, y1: 70, x2: 110, y2: 70, stroke: NAVY, dash: true }, { t: "line", x1: 60, y1: 114, x2: 60, y2: 80, stroke: RED, arrow: true });
  if (fold === "diagonal") items.push({ t: "line", x1: 10, y1: 20, x2: 110, y2: 120, stroke: NAVY, dash: true }, { t: "line", x1: 98, y1: 40, x2: 74, y2: 64, stroke: RED, arrow: true });
  items.push({ t: "line", x1: 125, y1: 70, x2: 152, y2: 70, stroke: "#64748b", arrow: true });
  if (fold === "vertical") items.push({ t: "rect", x: 165, y: 20, w: 50, h: 100, stroke: NAVY, fill: "#f1f5f9" });
  if (fold === "horizontal") items.push({ t: "rect", x: 165, y: 20, w: 100, h: 50, stroke: NAVY, fill: "#f1f5f9" });
  if (fold === "diagonal") items.push({ t: "line", x1: 165, y1: 20, x2: 265, y2: 120, stroke: NAVY }, { t: "line", x1: 165, y1: 20, x2: 165, y2: 120, stroke: NAVY }, { t: "line", x1: 165, y1: 120, x2: 265, y2: 120, stroke: NAVY });
  for (const [hx, hy] of holes) items.push({ t: "circle", cx: 165 + hx, cy: 20 + hy, r: 5, fill: "#fff", stroke: NAVY });
  return { w: 280, h: 140, items };
}

const mirror = (fold: Fold, [x, y]: [number, number]): [number, number] =>
  fold === "vertical" ? [100 - x, y] : fold === "horizontal" ? [x, 100 - y] : [y, x];

const FOLD_TEXT: Record<Fold, string> = {
  vertical: "folded in half from right to left along the vertical center line",
  horizontal: "folded in half from bottom to top along the horizontal center line",
  diagonal: "folded along the diagonal that runs from the top-left corner to the bottom-right corner",
};

const pfSingle = (code: string, difficulty: 1 | 2 | 3, fold: Fold, hole: [number, number], correctIndex: number): BankQuestion => {
  const answer: [number, number][] = [hole, mirror(fold, hole)];
  const wrongFolds: Fold[] = (["vertical", "horizontal", "diagonal"] as Fold[]).filter((f) => f !== fold);
  const { choices, correct_key } = pack(
    unfolded(answer),
    [unfolded([hole]), unfolded([hole, mirror(wrongFolds[0], hole)]), unfolded([hole, mirror(wrongFolds[1], hole)])],
    correctIndex,
  );
  return {
    code, section_key: "paper_folding", skill: "single_fold", difficulty,
    stem: "The paper is folded as shown and one hole is punched through it. How will the sheet look when it is unfolded?",
    visual: foldVisual(fold, hole),
    visual_alt: `A square sheet ${FOLD_TEXT[fold]}. One hole is punched through the folded paper.`,
    choices, correct_key,
    rationale: `Unfolding reflects the punch across the fold line, so the sheet shows the original hole and its mirror image, two holes in all.`,
  };
};

/** Quarter-fold stem art: both center folds shown, then the quarter sheet with its punch. */
function doubleFoldVisual(quarterHole: [number, number]): VisualSpec {
  return {
    w: 280, h: 140,
    items: [
      { t: "rect", x: 10, y: 20, w: 100, h: 100, stroke: NAVY, fill: "#fff" },
      { t: "line", x1: 60, y1: 20, x2: 60, y2: 120, stroke: NAVY, dash: true },
      { t: "line", x1: 10, y1: 70, x2: 110, y2: 70, stroke: NAVY, dash: true },
      { t: "line", x1: 125, y1: 70, x2: 152, y2: 70, stroke: "#64748b", arrow: true },
      { t: "rect", x: 165, y: 45, w: 50, h: 50, stroke: NAVY, fill: "#f1f5f9" },
      { t: "circle", cx: 165 + quarterHole[0] / 2, cy: 45 + quarterHole[1] / 2, r: 5, fill: "#fff", stroke: NAVY },
    ],
  };
}

const pfDouble = (code: string, difficulty: 1 | 2 | 3, hole: [number, number], correctIndex: number): BankQuestion => {
  const [x, y] = hole;
  const answer: [number, number][] = [[x, y], [100 - x, y], [x, 100 - y], [100 - x, 100 - y]];
  const { choices, correct_key } = pack(
    unfolded(answer),
    [unfolded([[x, y], [100 - x, y]]), unfolded([[x, y], [100 - x, 100 - y]]), unfolded([[x, y]])],
    correctIndex,
  );
  return {
    code, section_key: "paper_folding", skill: "double_fold", difficulty,
    stem: "The paper is folded in half twice, first along the vertical center line and then along the horizontal center line, and one hole is punched through the folded square. How will the sheet look when it is unfolded?",
    visual: doubleFoldVisual(hole),
    visual_alt: "A square sheet with a vertical and a horizontal center fold line, folded down to a quarter-size square. One hole is punched through the folded square.",
    choices, correct_key,
    rationale: "Two folds make four layers, so one punch opens into four holes placed symmetrically about both center lines.",
  };
};

export const PAPER_FOLDING: BankQuestion[] = [
  pfSingle("PF-01", 1, "vertical", [25, 30], 0),
  pfSingle("PF-02", 1, "horizontal", [20, 15], 1),
  pfSingle("PF-03", 2, "vertical", [15, 70], 2),
  pfSingle("PF-04", 2, "horizontal", [65, 25], 3),
  pfSingle("PF-05", 2, "diagonal", [30, 65], 0),
  pfSingle("PF-06", 3, "diagonal", [20, 80], 1),
  pfSingle("PF-07", 3, "vertical", [40, 50], 2),
  pfSingle("PF-08", 3, "horizontal", [35, 40], 3),
  pfDouble("PF-09", 2, [25, 25], 0),
  pfDouble("PF-10", 2, [15, 35], 1),
  pfDouble("PF-11", 3, [40, 20], 2),
  pfDouble("PF-12", 3, [30, 45], 3),
  pfDouble("PF-13", 3, [10, 10], 1),
  {
    code: "PF-14", section_key: "paper_folding", skill: "double_fold", difficulty: 1,
    stem: "A square sheet is folded in half twice, and then one hole is punched through all of the layers. How many holes will the sheet have when it is unfolded?",
    visual: doubleFoldVisual([25, 25]),
    visual_alt: "A square sheet with both center fold lines, folded into a quarter-size square with one hole punched through it.",
    choices: [{ key: "A", text: "1" }, { key: "B", text: "2" }, { key: "C", text: "4" }, { key: "D", text: "8" }],
    correct_key: "C", rationale: "Two folds create four layers of paper, so one punch makes four holes.",
  },
  {
    code: "PF-15", section_key: "paper_folding", skill: "single_fold", difficulty: 1,
    stem: "A square sheet is folded in half one time, and then two holes are punched through both layers. How many holes will the sheet have when it is unfolded?",
    visual: foldVisual("vertical", [[20, 30], [30, 75]]),
    visual_alt: "A square sheet folded in half from right to left, with two holes punched through the folded half.",
    choices: [{ key: "A", text: "2" }, { key: "B", text: "3" }, { key: "C", text: "4" }, { key: "D", text: "8" }],
    correct_key: "C", rationale: "One fold makes two layers, so each punch opens into two holes: 2 × 2 = 4.",
  },
];

// ---------------- Figure Classification ----------------
const row3 = (figs: VisualItem[][]): VisualSpec => ({
  w: 260, h: 90,
  items: figs.flatMap((f, i) => at(f, i * 90, 5)),
});

const fc = (
  code: string, difficulty: 1 | 2 | 3, skill: string, stemFigs: VisualItem[][],
  alt: string, correct: VisualItem[], wrong: [VisualItem[], VisualItem[], VisualItem[]],
  correctIndex: number, rationale: string,
): BankQuestion => {
  const { choices, correct_key } = pack(choiceFig(correct), wrong.map(choiceFig), correctIndex);
  return {
    code, section_key: "figure_classification", skill, difficulty,
    stem: "The first three figures are alike in some way. Which answer choice belongs with them?",
    visual: row3(stemFigs), visual_alt: alt, choices, correct_key, rationale,
  };
};

const pair = (kind: ShapeKind, shadedFirst: boolean, size = 22): VisualItem[] => [
  shape(kind, 28, 40, size, { fill: shadedFirst ? NAVY : "none" }),
  shape(kind, 54, 40, size, { fill: shadedFirst ? "none" : NAVY }),
];
const inside = (outer: ShapeKind, innerKind: ShapeKind = "circle"): VisualItem[] => [
  shape(outer, 40, 42, 46), shape(innerKind, 40, 42, 16),
];
const trio = (kind: ShapeKind, size = 20): VisualItem[] => [
  shape(kind, 26, 34, size), shape(kind, 54, 34, size), shape(kind, 40, 58, size),
];

export const FIGURE_CLASSIFICATION: BankQuestion[] = [
  // shape_attribute (5)
  fc("FC-01", 1, "shape_attribute",
    [single("triangle"), single("triangle", { rot: 90 }), single("triangle", { fill: GRAY, rot: 200 })],
    "Three triangles shown at different rotations, one of them gray.",
    single("triangle", { rot: 30, fill: NAVY }, 30),
    [single("square"), single("diamond"), single("hexagon")], 1,
    "All three figures are triangles; rotation, size and shading vary, so the only triangle belongs."),
  fc("FC-02", 2, "shape_attribute",
    [inside("square"), inside("hexagon"), inside("triangle")],
    "A small circle drawn inside a square, inside a hexagon, and inside a triangle.",
    inside("pentagon"),
    [[shape("circle", 40, 42, 46), shape("square", 40, 42, 16)], [shape("square", 40, 42, 46), shape("triangle", 40, 42, 16)], single("circle", {}, 20)], 2,
    "Each figure is a circle inside a straight-sided polygon, so a circle inside a pentagon belongs."),
  fc("FC-03", 2, "shape_attribute",
    [single("square"), single("diamond"), single("square", { rot: 30 })],
    "Three four-sided figures: a square, a diamond, and a tilted square.",
    single("square", { rot: 60 }),
    [single("triangle"), single("pentagon"), single("circle")], 0,
    "Every figure has exactly four straight sides, so the tilted square belongs."),
  fc("FC-04", 3, "shape_attribute",
    [[shape("circle", 40, 40, 44), shape("circle", 40, 40, 22)], [shape("square", 40, 40, 44), shape("square", 40, 40, 22)], [shape("hexagon", 40, 40, 44), shape("hexagon", 40, 40, 22)]],
    "Three figures, each a shape drawn inside a larger copy of the same shape.",
    [shape("triangle", 40, 44, 46), shape("triangle", 40, 44, 22)],
    [[shape("circle", 40, 40, 44), shape("square", 40, 40, 20)], single("pentagon"), [shape("star", 40, 40, 44), shape("circle", 40, 40, 18)]], 3,
    "In each figure a shape sits inside a larger copy of itself, which only the pair of triangles matches."),
  fc("FC-05", 1, "shape_attribute",
    [single("triangle"), single("square"), single("pentagon")],
    "One triangle, one square and one pentagon: closed figures with three, four and five straight sides.",
    single("hexagon"),
    [single("circle"), dots(2), [{ t: "line", x1: 20, y1: 60, x2: 60, y2: 20, stroke: NAVY }]], 2,
    "All are closed figures made only of straight sides, so the hexagon belongs while a circle or a line does not."),

  // count_attribute (5)
  fc("FC-06", 1, "count_attribute",
    [dots(3), trio("square"), trio("triangle", 22)],
    "Three groups, each containing exactly three figures: three dots, three squares and three triangles.",
    trio("hexagon"),
    [dots(2), dots(4), single("star")], 0,
    "Each group contains exactly three figures, so the group of three hexagons belongs."),
  fc("FC-07", 2, "count_attribute",
    [dots(2), [shape("square", 28, 40, 22), shape("square", 54, 40, 22)], [shape("star", 28, 40, 24), shape("star", 54, 40, 24)]],
    "Three groups of exactly two figures each: two dots, two squares and two stars.",
    [shape("triangle", 28, 42, 24), shape("triangle", 54, 42, 24)],
    [dots(3), single("hexagon"), trio("diamond")], 3,
    "Every group has exactly two figures, so the pair of triangles belongs."),
  fc("FC-08", 2, "count_attribute",
    [dots(4), [shape("circle", 26, 26, 18), shape("circle", 54, 26, 18), shape("circle", 26, 54, 18), shape("circle", 54, 54, 18)], [shape("diamond", 26, 26, 20), shape("diamond", 54, 26, 20), shape("diamond", 26, 54, 20), shape("diamond", 54, 54, 20)]],
    "Three groups of exactly four figures each.",
    [shape("square", 26, 26, 20), shape("square", 54, 26, 20), shape("square", 26, 54, 20), shape("square", 54, 54, 20)],
    [dots(3), trio("star", 18), dots(5)], 1,
    "Each group holds exactly four figures, so the four squares belong."),
  fc("FC-09", 3, "count_attribute",
    [single("triangle"), single("triangle", { rot: 180 }), [shape("triangle", 28, 40, 24), shape("triangle", 54, 40, 24)]],
    "Figures made only of triangles: one triangle, one upside-down triangle, and a pair of triangles.",
    [shape("triangle", 26, 30, 20), shape("triangle", 54, 30, 20), shape("triangle", 40, 58, 20)],
    [trio("square"), single("diamond"), dots(3)], 2,
    "Every figure is built only from triangles, so the group of three triangles belongs."),
  fc("FC-10", 3, "count_attribute",
    [dots(5), [shape("square", 24, 26, 16), shape("square", 56, 26, 16), shape("square", 40, 40, 16), shape("square", 24, 58, 16), shape("square", 56, 58, 16)], [shape("star", 24, 26, 18), shape("star", 56, 26, 18), shape("star", 40, 40, 18), shape("star", 24, 58, 18), shape("star", 56, 58, 18)]],
    "Three groups of exactly five figures each, arranged in the same pattern.",
    [shape("circle", 24, 26, 16), shape("circle", 56, 26, 16), shape("circle", 40, 40, 16), shape("circle", 24, 58, 16), shape("circle", 56, 58, 16)],
    [dots(4), dots(6), trio("hexagon")], 0,
    "Each group contains exactly five figures, so the five circles belong."),

  // shading_attribute (5)
  fc("FC-11", 1, "shading_attribute",
    [single("circle", { fill: NAVY }), single("square", { fill: NAVY }), single("pentagon", { fill: NAVY })],
    "A black circle, a black square and a black pentagon.",
    single("star", { fill: NAVY }),
    [single("circle", { fill: "none" }), single("square", { fill: GRAY }), single("hexagon", { dash: true })], 1,
    "All three figures are completely shaded black while the shape varies, so the black star belongs."),
  fc("FC-12", 2, "shading_attribute",
    [pair("square", true), pair("circle", false), pair("triangle", true, 24)],
    "Three figures, each a pair of identical shapes with exactly one of the two shaded black.",
    pair("diamond", false),
    [[shape("hexagon", 28, 40, 22, { fill: NAVY }), shape("hexagon", 54, 40, 22, { fill: NAVY })], [shape("star", 28, 40, 24), shape("star", 54, 40, 24)], [shape("square", 28, 40, 22, { fill: NAVY }), shape("circle", 54, 40, 22)]], 2,
    "Each figure pairs two identical shapes with exactly one shaded, and only the diamonds match both conditions."),
  fc("FC-13", 2, "shading_attribute",
    [single("circle", { fill: GRAY }), single("hexagon", { fill: GRAY }), single("triangle", { fill: GRAY })],
    "A gray circle, a gray hexagon and a gray triangle.",
    single("diamond", { fill: GRAY }),
    [single("diamond", { fill: NAVY }), single("circle", { fill: "none" }), single("square", { dash: true })], 3,
    "Every figure is shaded gray, so the gray diamond belongs."),
  fc("FC-14", 3, "shading_attribute",
    [[shape("square", 40, 40, 44), shape("circle", 40, 40, 18, { fill: NAVY })], [shape("circle", 40, 40, 44), shape("square", 40, 40, 18, { fill: NAVY })], [shape("hexagon", 40, 40, 46), shape("triangle", 40, 42, 18, { fill: NAVY })]],
    "Three figures, each an unshaded outer shape containing a small black inner shape.",
    [shape("triangle", 40, 44, 48), shape("circle", 40, 46, 16, { fill: NAVY })],
    [[shape("square", 40, 40, 44, { fill: NAVY }), shape("circle", 40, 40, 18)], single("circle", { fill: NAVY }, 20), [shape("hexagon", 40, 40, 46), shape("circle", 40, 40, 18)]], 0,
    "Each figure has an unshaded outer shape with a small black shape inside it."),
  fc("FC-15", 3, "shading_attribute",
    [single("square", { dash: true }), single("circle", { dash: true }), single("triangle", { dash: true })],
    "A square, a circle and a triangle, each drawn with a dashed outline.",
    single("pentagon", { dash: true }),
    [single("pentagon"), single("hexagon", { fill: NAVY }), single("star")], 2,
    "Every figure has a dashed outline, so the dashed pentagon belongs."),
];
