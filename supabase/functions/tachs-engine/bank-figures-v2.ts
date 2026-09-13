// Figure Matrices v2 (38-item pool for 20 administered) and Figure Classification v2 (32-item pool for
// 15 administered). Five choices (A–E). Every figure, answer key and distractor is generated from the
// same rule model (figure-model.ts) so the keyed answer always matches the drawn geometry.
import { type BankQuestion, type ShapeKind, type VisualItem, type VisualSpec, NAVY, at, grid } from "./bank-types.ts";
import {
  type Cell, type Corner, type Fill, type Inner, type Size, CORNERS, NEXT_FILL, NEXT_SIZE, cell, choiceFig, describeCell,
  distinctCandidates, packFive, renderCell, sameCell,
} from "./figure-model.ts";

// =====================================================================================
// Figure Matrices
// =====================================================================================
type Gen = (r: number, c: number) => Cell;

interface FmSpec { code: string; difficulty: 1 | 2 | 3; skill: string; gen: Gen; rule: string; correctIndex: number }

/** Distractors encode named errors: one-rule-only, wrong direction, wrong count, wrong overlay/shading step. */
function fmDistractors(gen: Gen, correct: Cell): { label: string; c: Cell }[] {
  const cands: { label: string; c: Cell }[] = [
    { label: "repeats the figure to its left, ignoring the column rule", c: gen(2, 1) },
    { label: "repeats the figure above it, ignoring the row rule", c: gen(1, 2) },
    { label: "turns in the wrong direction", c: { ...correct, rot: -correct.rot } },
    { label: "takes the shading one step too far", c: { ...correct, fill: NEXT_FILL[correct.fill] } },
    { label: "has the wrong number of dots", c: { ...correct, dots: correct.dots.length ? correct.dots.slice(0, -1) : ["tl"] } },
    { label: "has one dot too many", c: { ...correct, dots: [...correct.dots, CORNERS.find((k) => !correct.dots.includes(k)) ?? "tl"] } },
    { label: "uses the wrong size", c: { ...correct, size: NEXT_SIZE[correct.size] } },
    { label: "uses the shape from the first column", c: { ...correct, kind: gen(2, 0).kind } },
    { label: "uses the shape from the first row", c: { ...correct, kind: gen(0, 2).kind } },
    { label: "turns one step too far", c: { ...correct, rot: correct.rot + 45 } },
    { label: "changes the inner line", c: { ...correct, inner: correct.inner === "none" ? "h" : "none" } },
    { label: "adds or removes the enclosing circle", c: { ...correct, ring: !correct.ring } },
    { label: "copies the centre figure", c: gen(1, 1) },
    { label: "reverses the shading", c: { ...correct, fill: correct.fill === "black" ? "none" : "black" } },
  ];
  const picked = distinctCandidates(correct, cands, 4);
  if (picked.length < 4) throw new Error(`matrix distractors: only ${picked.length} distinct for ${describeCell(correct)}`);
  return picked;
}

function fm(spec: FmSpec): BankQuestion {
  const { gen } = spec;
  const correct = gen(2, 2);
  // Model sanity: the answer must not simply equal both neighbours (otherwise the rule is degenerate).
  if (sameCell(correct, gen(2, 1)) && sameCell(correct, gen(1, 2))) throw new Error(`${spec.code}: degenerate rule`);
  const ds = fmDistractors(gen, correct);
  const { choices, correct_key } = packFive(choiceFig(renderCell(correct)), ds.map((d) => choiceFig(renderCell(d.c))), spec.correctIndex);
  const rows = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (r === 2 && c === 2 ? "a missing cell" : describeCell(gen(r, c)))).join("; "));
  return {
    code: spec.code, section_key: "figure_matrices", skill: spec.skill, difficulty: spec.difficulty,
    stem: "Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : renderCell(gen(Math.floor(i / 3), i % 3)))),
    visual_alt: `A 3 by 3 grid. Row 1: ${rows[0]}. Row 2: ${rows[1]}. Row 3: ${rows[2]}.`,
    choices, correct_key,
    rationale: `${spec.rule} The missing figure is therefore a ${describeCell(correct)}. Wrong options: ${ds.map((d) => `one ${d.label}`).join("; ")}.`,
  };
}

const K = (...ks: ShapeKind[]) => ks;
const F: Fill[] = ["none", "gray", "black"];
const S: Size[] = ["s", "m", "l"];

export const FIGURE_MATRICES_V2_SPECS: FmSpec[] = [
  // ---------- rotation_reflection (7) ----------
  { code: "FM2-01", difficulty: 1, skill: "rotation_reflection", correctIndex: 2, rule: "Across each row the arrow turns 90 degrees clockwise; each row starts one step further round.",
    gen: (r, c) => cell({ kind: "arrow", rot: (r + c) * 90 }) },
  { code: "FM2-02", difficulty: 2, skill: "rotation_reflection", correctIndex: 0, rule: "Across each row the triangle turns 45 degrees clockwise, and down each column the shading advances one step.",
    gen: (r, c) => cell({ kind: "triangle", rot: c * 45, fill: F[r] }) },
  { code: "FM2-03", difficulty: 2, skill: "rotation_reflection", correctIndex: 4, rule: "Across each row the arrow turns 45 degrees clockwise; down each column the shape sits inside a circle on alternate rows.",
    gen: (r, c) => cell({ kind: "arrow", rot: r * 90 + c * 45, ring: r % 2 === 1 }) },
  { code: "FM2-04", difficulty: 3, skill: "rotation_reflection", correctIndex: 1, rule: "The arrow turns 90 degrees counter-clockwise across each row and the number of corner dots increases by one down each column.",
    gen: (r, c) => cell({ kind: "arrow", rot: -c * 90 + r * 45, dots: CORNERS.slice(0, r) }) },
  { code: "FM2-05", difficulty: 3, skill: "rotation_reflection", correctIndex: 3, rule: "Each row shows the same inner line turned 45 degrees at each step, while the outer shape changes down the columns and its size grows.",
    gen: (r, c) => cell({ kind: K("square", "hexagon", "pentagon")[r], inner: ["h", "x", "v"][c] as Inner, size: S[r] }) },
  { code: "FM2-06", difficulty: 2, skill: "rotation_reflection", correctIndex: 2, rule: "Across each row the arrow is reflected: 0, 180, then 0 degrees again is not the pattern; it turns 180 degrees then a further 90, and the shading alternates by column.",
    gen: (r, c) => cell({ kind: "arrow", rot: [0, 180, 270][c] + r * 90, fill: c % 2 ? "black" : "none" }) },
  { code: "FM2-07", difficulty: 3, skill: "rotation_reflection", correctIndex: 0, rule: "The triangle turns 45 degrees clockwise across each row and a further 45 degrees down each column, while the dot moves one corner clockwise down each column.",
    gen: (r, c) => cell({ kind: "triangle", rot: (r + c) * 45, dots: [CORNERS[r]] }) },

  // ---------- progression_count (6) ----------
  { code: "FM2-08", difficulty: 1, skill: "progression_count", correctIndex: 1, rule: "Each step to the right adds one corner dot; the shape stays fixed in each row.",
    gen: (r, c) => cell({ kind: K("circle", "square", "triangle")[r], dots: CORNERS.slice(0, c + 1) }) },
  { code: "FM2-09", difficulty: 2, skill: "progression_count", correctIndex: 4, rule: "Each step to the right adds one dot and each step down adds one more, so the count is row plus column plus one; shading advances down the columns.",
    gen: (r, c) => cell({ kind: "square", dots: CORNERS.slice(0, Math.min(4, r + c + 1)), fill: F[r] }) },
  { code: "FM2-10", difficulty: 2, skill: "progression_count", correctIndex: 3, rule: "The size grows across each row (small, medium, large) while the number of dots equals the row number.",
    gen: (r, c) => cell({ kind: "pentagon", size: S[c], dots: CORNERS.slice(0, r) }) },
  { code: "FM2-11", difficulty: 3, skill: "progression_count", correctIndex: 0, rule: "The dot count decreases by one across each row while the shape's shading advances one step across the row and the shape changes down the columns.",
    gen: (r, c) => cell({ kind: K("hexagon", "diamond", "star")[r], dots: CORNERS.slice(0, 3 - c), fill: F[c] }) },
  { code: "FM2-12", difficulty: 3, skill: "progression_count", correctIndex: 2, rule: "Dots are added one corner at a time clockwise across the row, and the starting corner moves one step down each column, while an inner cross appears only in the last column.",
    gen: (r, c) => cell({ kind: "square", dots: Array.from({ length: c + 1 }, (_, i) => CORNERS[(r + i) % 4]), inner: c === 2 ? "plus" : "none" }) },
  { code: "FM2-13", difficulty: 2, skill: "progression_count", correctIndex: 1, rule: "The shape gains sides across each row (triangle, square, pentagon) and grows one size step down each column.",
    gen: (r, c) => cell({ kind: K("triangle", "square", "pentagon")[c], size: S[r] }) },

  // ---------- shading_size_change (6) ----------
  { code: "FM2-14", difficulty: 1, skill: "shading_size_change", correctIndex: 3, rule: "Across each row the shading cycles unshaded, gray, solid; the shape is fixed in each row.",
    gen: (r, c) => cell({ kind: K("circle", "hexagon", "diamond")[r], fill: F[c] }) },
  { code: "FM2-15", difficulty: 2, skill: "shading_size_change", correctIndex: 0, rule: "Across each row the shading is inverted between the outer shape and its enclosing circle: a solid shape sits in a plain ring, a plain shape in a solid ring alternate; and size grows down each column.",
    gen: (r, c) => cell({ kind: "square", fill: c % 2 ? "none" : "black", ring: true, size: S[r] }) },
  { code: "FM2-16", difficulty: 2, skill: "shading_size_change", correctIndex: 2, rule: "The size shrinks across each row and the shading advances down each column.",
    gen: (r, c) => cell({ kind: "star", size: S[2 - c], fill: F[r] }) },
  { code: "FM2-17", difficulty: 3, skill: "shading_size_change", correctIndex: 4, rule: "Shading advances one step across each row AND one step down each column, so the corner cell is two steps on from the top-left, while the size follows the column.",
    gen: (r, c) => cell({ kind: "hexagon", fill: F[(r + c) % 3], size: S[c] }) },
  { code: "FM2-18", difficulty: 3, skill: "shading_size_change", correctIndex: 1, rule: "The inner line inverts in colour as the shading flips between solid and unshaded across each row, and the outer shape changes down the columns while size follows the row.",
    gen: (r, c) => cell({ kind: K("square", "circle", "pentagon")[r], fill: c % 2 ? "black" : "none", inner: "x", size: S[r] }) },
  { code: "FM2-19", difficulty: 2, skill: "shading_size_change", correctIndex: 3, rule: "Size grows down each column and the number of dots equals the column number, while the diamond keeps its shading.",
    gen: (r, c) => cell({ kind: "diamond", size: S[r], dots: CORNERS.slice(0, c), fill: "gray" }) },

  // ---------- two_rule_integration (9) ----------
  { code: "FM2-20", difficulty: 2, skill: "two_rule_integration", correctIndex: 2, rule: "Rule 1: the shape is fixed by row. Rule 2: the arrow turns 90 degrees clockwise and gains one dot across each row.",
    gen: (r, c) => cell({ kind: "arrow", rot: c * 90 + r * 90, dots: CORNERS.slice(0, c) }) },
  { code: "FM2-21", difficulty: 3, skill: "two_rule_integration", correctIndex: 0, rule: "Rule 1: shading advances down each column. Rule 2: the shape turns 45 degrees and grows one size across each row.",
    gen: (r, c) => cell({ kind: "triangle", fill: F[r], rot: c * 45, size: S[c] }) },
  { code: "FM2-22", difficulty: 3, skill: "two_rule_integration", correctIndex: 4, rule: "Rule 1: the enclosing circle appears in every other cell along each row, starting with the row number. Rule 2: the inner line cycles horizontal, vertical, crossed down the columns while the shape follows the column.",
    gen: (r, c) => cell({ kind: K("square", "hexagon", "circle")[c], ring: (r + c) % 2 === 0, inner: (["h", "v", "x"] as Inner[])[r] }) },
  { code: "FM2-23", difficulty: 3, skill: "two_rule_integration", correctIndex: 1, rule: "Rule 1: the dot moves one corner clockwise across each row. Rule 2: shading advances down each column while size shrinks down each column.",
    gen: (r, c) => cell({ kind: "pentagon", dots: [CORNERS[(r + c) % 4]], fill: F[r], size: S[2 - r] }) },
  { code: "FM2-24", difficulty: 3, skill: "two_rule_integration", correctIndex: 3, rule: "Rule 1: the arrow turns 90 degrees clockwise across each row. Rule 2: the shading cycles across the row and the number of dots equals the row number.",
    gen: (r, c) => cell({ kind: "arrow", rot: c * 90, fill: F[c], dots: CORNERS.slice(0, r) }) },
  { code: "FM2-25", difficulty: 3, skill: "two_rule_integration", correctIndex: 2, rule: "Rule 1: the shape gains sides across each row. Rule 2: an enclosing circle appears where row and column numbers match, and the shading advances down the columns.",
    gen: (r, c) => cell({ kind: K("triangle", "square", "hexagon")[c], ring: r === c, fill: F[r] }) },
  { code: "FM2-26", difficulty: 2, skill: "two_rule_integration", correctIndex: 0, rule: "Rule 1: the size grows across each row. Rule 2: the inner line alternates horizontal and vertical down the columns and the shape follows the row.",
    gen: (r, c) => cell({ kind: K("square", "circle", "hexagon")[r], size: S[c], inner: r % 2 ? "v" : "h" }) },
  { code: "FM2-27", difficulty: 3, skill: "two_rule_integration", correctIndex: 4, rule: "Rule 1: the triangle turns 45 degrees counter-clockwise across each row. Rule 2: the dots count down from three across the row while the shading follows the row.",
    gen: (r, c) => cell({ kind: "triangle", rot: -c * 45 + r * 90, dots: CORNERS.slice(0, 3 - c), fill: F[r] }) },
  { code: "FM2-28", difficulty: 2, skill: "two_rule_integration", correctIndex: 1, rule: "Rule 1: the star's shading advances across the row. Rule 2: the size grows down the columns and an enclosing circle marks the middle column.",
    gen: (r, c) => cell({ kind: "star", fill: F[c], size: S[r], ring: c === 1 }) },

  // ---------- alternating_pattern (4) ----------
  { code: "FM2-29", difficulty: 1, skill: "alternating_pattern", correctIndex: 3, rule: "Cells alternate between a solid circle and an unshaded square in a checkerboard: the corner cell matches the top-left.",
    gen: (r, c) => ((r + c) % 2 === 0 ? cell({ kind: "circle", fill: "black" }) : cell({ kind: "square" })) },
  { code: "FM2-30", difficulty: 2, skill: "alternating_pattern", correctIndex: 0, rule: "Shape alternates by column (hexagon, diamond, hexagon) while the shading alternates by row, and the size grows across the row.",
    gen: (r, c) => cell({ kind: c % 2 ? "diamond" : "hexagon", fill: r % 2 ? "gray" : "none", size: S[c] }) },
  { code: "FM2-31", difficulty: 3, skill: "alternating_pattern", correctIndex: 2, rule: "The enclosing circle alternates in a checkerboard, the inner line alternates horizontal/vertical by row, and the arrow turns 90 degrees across each row.",
    gen: (r, c) => cell({ kind: "arrow", rot: c * 90, ring: (r + c) % 2 === 1, inner: "none", dots: r % 2 ? ["tl"] : [] }) },
  { code: "FM2-32", difficulty: 2, skill: "alternating_pattern", correctIndex: 4, rule: "Dots alternate between the top-left and bottom-right corners across the row, and the shading advances down the column.",
    gen: (r, c) => cell({ kind: "square", dots: [c % 2 ? "br" : "tl"], fill: F[r], size: "l" }) },
];

// ---------- overlay_composition (6): the third column is a set operation on the first two ----------
type Comp = "h" | "v" | "d1" | "d2" | "circle" | "square" | "tri";
type Op = "union" | "difference" | "xor" | "intersection";
const OP_WORD: Record<Op, string> = { union: "combining the first two figures", difference: "removing the second figure's parts from the first", xor: "keeping only the parts that appear in exactly one of the first two figures", intersection: "keeping only the parts the first two figures share" };
const apply = (op: Op, a: Comp[], b: Comp[]): Comp[] => {
  const A = new Set(a), B = new Set(b);
  const all: Comp[] = ["h", "v", "d1", "d2", "circle", "square", "tri"];
  return all.filter((x) => op === "union" ? A.has(x) || B.has(x) : op === "difference" ? A.has(x) && !B.has(x) : op === "xor" ? A.has(x) !== B.has(x) : A.has(x) && B.has(x));
};
function renderComps(cs: Comp[]): VisualItem[] {
  const it: VisualItem[] = [];
  for (const c of cs) {
    if (c === "h") it.push({ t: "line", x1: 14, y1: 40, x2: 66, y2: 40, stroke: NAVY });
    if (c === "v") it.push({ t: "line", x1: 40, y1: 14, x2: 40, y2: 66, stroke: NAVY });
    if (c === "d1") it.push({ t: "line", x1: 18, y1: 18, x2: 62, y2: 62, stroke: NAVY });
    if (c === "d2") it.push({ t: "line", x1: 62, y1: 18, x2: 18, y2: 62, stroke: NAVY });
    if (c === "circle") it.push({ t: "circle", cx: 40, cy: 40, r: 26, stroke: NAVY, fill: "none" });
    if (c === "square") it.push({ t: "rect", x: 16, y: 16, w: 48, h: 48, stroke: NAVY, fill: "none" });
    if (c === "tri") it.push({ t: "shape", kind: "triangle", cx: 40, cy: 42, size: 44, stroke: NAVY, fill: "none" });
  }
  if (!it.length) it.push({ t: "rect", x: 30, y: 30, w: 20, h: 20, stroke: "#cbd5e1", fill: "none", dash: true });
  return it;
}
const compKey = (cs: Comp[]) => [...cs].sort().join(",");
const COMP_WORD: Record<Comp, string> = { h: "horizontal line", v: "vertical line", d1: "falling diagonal", d2: "rising diagonal", circle: "circle", square: "square", tri: "triangle" };
const compDesc = (cs: Comp[]) => cs.length ? cs.map((c) => COMP_WORD[c]).join(" + ") : "empty";

interface OverlaySpec { code: string; difficulty: 1 | 2 | 3; op: Op; rows: [Comp[], Comp[]][]; correctIndex: number }
function fmOverlay(spec: OverlaySpec): BankQuestion {
  const cells = spec.rows.map(([a, b]) => [a, b, apply(spec.op, a, b)]);
  const [a, b] = spec.rows[2];
  const correct = cells[2][2];
  const cands: { label: string; c: Comp[] }[] = (["union", "difference", "xor", "intersection"] as Op[]).filter((o) => o !== spec.op).map((o) => ({ label: `applies the wrong rule (${OP_WORD[o]})`, c: apply(o, a, b) }));
  cands.push({ label: "copies the first figure of the row", c: a }, { label: "copies the second figure of the row", c: b }, { label: "reverses the subtraction", c: apply("difference", b, a) }, { label: "copies the answer from the row above", c: cells[1][2] });
  const ds: { label: string; c: Comp[] }[] = [];
  for (const d of cands) { if (compKey(d.c) === compKey(correct) || ds.some((x) => compKey(x.c) === compKey(d.c))) continue; ds.push(d); if (ds.length === 4) break; }
  if (ds.length < 4) throw new Error(`${spec.code}: only ${ds.length} overlay distractors`);
  const { choices, correct_key } = packFive(choiceFig(renderComps(correct)), ds.map((d) => choiceFig(renderComps(d.c))), spec.correctIndex);
  return {
    code: spec.code, section_key: "figure_matrices", skill: "overlay_composition", difficulty: spec.difficulty,
    stem: "In each row, the third figure is made from the first two by the same rule. Which figure completes the matrix?",
    visual: grid((i) => (i === 8 ? null : renderComps(cells[Math.floor(i / 3)][i % 3]))),
    visual_alt: `A 3 by 3 grid of line and outline figures. ${cells.map((row, r) => `Row ${r + 1}: ${compDesc(row[0])}; ${compDesc(row[1])}; ${r === 2 ? "missing" : compDesc(row[2])}`).join(". ")}.`,
    choices, correct_key,
    rationale: `In rows 1 and 2 the third figure comes from ${OP_WORD[spec.op]}. Applying the same rule to row 3 (${compDesc(a)} and ${compDesc(b)}) gives ${compDesc(correct)}. Wrong options: ${ds.map((d) => `one ${d.label}`).join("; ")}.`,
  };
}

export const FIGURE_MATRICES_OVERLAY_SPECS: OverlaySpec[] = [
  { code: "FM2-33", difficulty: 1, op: "union", correctIndex: 1, rows: [[["h"], ["v"]], [["circle"], ["d1"]], [["square"], ["h"]]] },
  { code: "FM2-34", difficulty: 2, op: "difference", correctIndex: 4, rows: [[["h", "v", "circle"], ["circle"]], [["square", "d1", "d2"], ["d2"]], [["circle", "h", "d1"], ["h", "circle"]]] },
  { code: "FM2-35", difficulty: 2, op: "intersection", correctIndex: 0, rows: [[["h", "circle"], ["circle", "v"]], [["square", "d1"], ["d1", "d2"]], [["tri", "h", "v"], ["v", "circle", "h"]]] },
  { code: "FM2-36", difficulty: 3, op: "xor", correctIndex: 2, rows: [[["h", "circle"], ["circle", "v"]], [["square", "d1"], ["d1", "d2"]], [["tri", "h", "d1"], ["h", "circle", "d2"]]] },
  { code: "FM2-37", difficulty: 3, op: "xor", correctIndex: 3, rows: [[["square", "h"], ["square", "v"]], [["circle", "d1", "d2"], ["d1"]], [["circle", "square", "h"], ["square", "v", "h"]]] },
  { code: "FM2-38", difficulty: 3, op: "difference", correctIndex: 1, rows: [[["circle", "square", "h"], ["square"]], [["tri", "d1", "v"], ["v", "d1"]], [["square", "circle", "d1", "d2"], ["d2", "circle"]]] },
];

export const FIGURE_MATRICES_V2: BankQuestion[] = [
  ...FIGURE_MATRICES_V2_SPECS.map(fm),
  ...FIGURE_MATRICES_OVERLAY_SPECS.map(fmOverlay),
];

// =====================================================================================
// Figure Classification: three exemplars share a rule; pick the one option that also follows it.
// =====================================================================================
interface FcSpec {
  code: string; difficulty: 1 | 2 | 3; skill: string; correctIndex: number;
  rule: (c: Cell) => boolean; ruleText: string;
  exemplars: [Cell, Cell, Cell]; correct: Cell; distractors: [Cell, Cell, Cell, Cell];
  distractorNotes: [string, string, string, string];
}
const SIDES: Record<ShapeKind, number> = { triangle: 3, square: 4, diamond: 4, pentagon: 5, hexagon: 6, star: 10, arrow: 7, plus: 12, circle: 0 };
const isOdd = (c: Cell) => SIDES[c.kind] % 2 === 1;
const curved = (c: Cell) => c.kind === "circle";

function fc(spec: FcSpec): BankQuestion {
  for (const e of spec.exemplars) if (!spec.rule(e)) throw new Error(`${spec.code}: exemplar breaks its own rule (${describeCell(e)})`);
  if (!spec.rule(spec.correct)) throw new Error(`${spec.code}: keyed answer breaks the rule`);
  for (const d of spec.distractors) if (spec.rule(d)) throw new Error(`${spec.code}: distractor satisfies the rule (${describeCell(d)})`);
  const all = [spec.correct, ...spec.distractors];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (sameCell(all[i], all[j])) throw new Error(`${spec.code}: duplicate choices`);
  for (const e of spec.exemplars) if (sameCell(e, spec.correct)) throw new Error(`${spec.code}: answer duplicates an exemplar`);
  const { choices, correct_key } = packFive(choiceFig(renderCell(spec.correct)), spec.distractors.map((d) => choiceFig(renderCell(d))), spec.correctIndex);
  const items: VisualItem[] = [];
  spec.exemplars.forEach((e, i) => { items.push({ t: "rect", x: i * 90 + 1, y: 1, w: 78, h: 78, stroke: "#94a3b8", fill: "none" }); items.push(...at(renderCell(e), i * 90, 0)); });
  const stemVisual: VisualSpec = { w: 260, h: 80, items };
  return {
    code: spec.code, section_key: "figure_classification", skill: spec.skill, difficulty: spec.difficulty,
    stem: "The three figures are alike in a certain way. Which answer choice belongs with them?",
    visual: stemVisual,
    visual_alt: `Three figures: ${spec.exemplars.map(describeCell).join("; ")}.`,
    choices, correct_key,
    rationale: `${spec.ruleText} The correct choice is a ${describeCell(spec.correct)}. Wrong options: ${spec.distractorNotes.map((n) => `one ${n}`).join("; ")}.`,
  };
}

const c = cell;
export const FIGURE_CLASSIFICATION_V2_SPECS: FcSpec[] = [
  // ---------- shape_attribute_combo (7) ----------
  { code: "FC2-01", difficulty: 1, skill: "shape_attribute_combo", correctIndex: 2, ruleText: "Each figure is a solid shape with an odd number of sides.",
    rule: (x) => isOdd(x) && x.fill === "black",
    exemplars: [c({ kind: "triangle", fill: "black" }), c({ kind: "pentagon", fill: "black" }), c({ kind: "arrow", fill: "black" })],
    correct: c({ kind: "triangle", fill: "black", rot: 90, size: "l" }),
    distractors: [c({ kind: "triangle" }), c({ kind: "square", fill: "black" }), c({ kind: "hexagon", fill: "black" }), c({ kind: "pentagon", fill: "gray" })],
    distractorNotes: ["is odd-sided but unshaded", "is solid but four-sided", "is solid but six-sided", "is odd-sided but gray"] },
  { code: "FC2-02", difficulty: 2, skill: "shape_attribute_combo", correctIndex: 0, ruleText: "Each figure is an even-sided shape enclosed in a circle, and the shape is not solid.",
    rule: (x) => !isOdd(x) && !curved(x) && x.ring && x.fill !== "black",
    exemplars: [c({ kind: "square", ring: true }), c({ kind: "hexagon", ring: true, fill: "gray" }), c({ kind: "diamond", ring: true })],
    correct: c({ kind: "hexagon", ring: true, size: "s" }),
    distractors: [c({ kind: "square", ring: true, fill: "black" }), c({ kind: "pentagon", ring: true }), c({ kind: "hexagon" }), c({ kind: "circle", ring: true })],
    distractorNotes: ["is enclosed but solid", "is enclosed but odd-sided", "is even-sided but not enclosed", "is a curved shape, not a polygon"] },
  { code: "FC2-03", difficulty: 2, skill: "shape_attribute_combo", correctIndex: 4, ruleText: "Each figure is gray and carries exactly two corner dots.",
    rule: (x) => x.fill === "gray" && x.dots.length === 2,
    exemplars: [c({ kind: "circle", fill: "gray", dots: ["tl", "br"] }), c({ kind: "square", fill: "gray", dots: ["tr", "bl"] }), c({ kind: "star", fill: "gray", dots: ["tl", "tr"] })],
    correct: c({ kind: "pentagon", fill: "gray", dots: ["bl", "br"] }),
    distractors: [c({ kind: "pentagon", fill: "gray", dots: ["bl"] }), c({ kind: "pentagon", fill: "black", dots: ["bl", "br"] }), c({ kind: "circle", fill: "gray", dots: ["tl", "tr", "br"] }), c({ kind: "square", dots: ["tl", "br"] })],
    distractorNotes: ["has only one dot", "is solid rather than gray", "has three dots", "is unshaded"] },
  { code: "FC2-04", difficulty: 3, skill: "shape_attribute_combo", correctIndex: 1, ruleText: "Each figure is a large odd-sided polygon whose inner line is a single vertical line, and none is solid.",
    rule: (x) => isOdd(x) && x.size === "l" && x.inner === "v" && x.fill !== "black",
    exemplars: [c({ kind: "triangle", size: "l", inner: "v" }), c({ kind: "pentagon", size: "l", inner: "v", fill: "gray" }), c({ kind: "arrow", size: "l", inner: "v" })],
    correct: c({ kind: "pentagon", size: "l", inner: "v" }),
    distractors: [c({ kind: "pentagon", size: "m", inner: "v" }), c({ kind: "triangle", size: "l", inner: "h" }), c({ kind: "hexagon", size: "l", inner: "v" }), c({ kind: "arrow", size: "l", inner: "v", fill: "black" })],
    distractorNotes: ["is medium rather than large", "has a horizontal inner line", "is even-sided", "is solid"] },
  { code: "FC2-05", difficulty: 3, skill: "shape_attribute_combo", correctIndex: 3, ruleText: "Each figure has the same number of corner dots as it has shading steps: unshaded shapes have no dots, gray shapes have one, solid shapes have two.",
    rule: (x) => x.dots.length === ["none", "gray", "black"].indexOf(x.fill),
    exemplars: [c({ kind: "square" }), c({ kind: "circle", fill: "gray", dots: ["tl"] }), c({ kind: "hexagon", fill: "black", dots: ["tl", "br"] })],
    correct: c({ kind: "triangle", fill: "gray", dots: ["br"] }),
    distractors: [c({ kind: "triangle", fill: "gray", dots: ["tl", "br"] }), c({ kind: "square", fill: "black", dots: ["tl"] }), c({ kind: "circle", dots: ["tr"] }), c({ kind: "hexagon", fill: "black" })],
    distractorNotes: ["is gray with two dots", "is solid with one dot", "is unshaded with a dot", "is solid with no dots"] },
  { code: "FC2-06", difficulty: 1, skill: "shape_attribute_combo", correctIndex: 0, ruleText: "Each figure is a four-sided shape with crossed diagonal lines inside.",
    rule: (x) => SIDES[x.kind] === 4 && x.inner === "x",
    exemplars: [c({ kind: "square", inner: "x" }), c({ kind: "diamond", inner: "x" }), c({ kind: "square", inner: "x", fill: "gray", size: "l" })],
    correct: c({ kind: "diamond", inner: "x", size: "s" }),
    distractors: [c({ kind: "square", inner: "plus" }), c({ kind: "hexagon", inner: "x" }), c({ kind: "diamond" }), c({ kind: "triangle", inner: "x" })],
    distractorNotes: ["has a plus-shaped cross, not diagonals", "is six-sided", "has no inner lines", "is three-sided"] },
  { code: "FC2-07", difficulty: 2, skill: "shape_attribute_combo", correctIndex: 2, ruleText: "Each figure is a small unshaded shape with an odd number of sides.",
    rule: (x) => x.size === "s" && x.fill === "none" && isOdd(x),
    exemplars: [c({ kind: "triangle", size: "s" }), c({ kind: "pentagon", size: "s" }), c({ kind: "arrow", size: "s", rot: 90 })],
    correct: c({ kind: "triangle", size: "s", rot: 180 }),
    distractors: [c({ kind: "triangle", size: "m" }), c({ kind: "pentagon", size: "s", fill: "gray" }), c({ kind: "square", size: "s" }), c({ kind: "hexagon", size: "s" })],
    distractorNotes: ["is medium-sized", "is gray", "is four-sided", "is six-sided"] },

  // ---------- count_shading (6) ----------
  { code: "FC2-08", difficulty: 1, skill: "count_shading", correctIndex: 3, ruleText: "Each figure has exactly three corner dots.",
    rule: (x) => x.dots.length === 3,
    exemplars: [c({ kind: "circle", dots: ["tl", "tr", "bl"] }), c({ kind: "square", fill: "black", dots: ["tl", "br", "bl"] }), c({ kind: "star", dots: ["tr", "br", "bl"] })],
    correct: c({ kind: "hexagon", fill: "gray", dots: ["tl", "tr", "br"] }),
    distractors: [c({ kind: "hexagon", fill: "gray", dots: ["tl", "tr"] }), c({ kind: "circle", dots: CORNERS }), c({ kind: "square", dots: ["tl"] }), c({ kind: "star", fill: "black" })],
    distractorNotes: ["has two dots", "has four dots", "has one dot", "has no dots"] },
  { code: "FC2-09", difficulty: 2, skill: "count_shading", correctIndex: 1, ruleText: "Each solid figure has an even number of dots and each unshaded figure has an odd number.",
    rule: (x) => (x.fill === "black" ? x.dots.length % 2 === 0 : x.fill === "none" ? x.dots.length % 2 === 1 : false),
    exemplars: [c({ kind: "square", fill: "black", dots: ["tl", "br"] }), c({ kind: "circle", dots: ["tr"] }), c({ kind: "pentagon", fill: "black", dots: CORNERS })],
    correct: c({ kind: "triangle", dots: ["tl", "tr", "bl"] }),
    distractors: [c({ kind: "triangle", dots: ["tl", "tr"] }), c({ kind: "square", fill: "black", dots: ["tl"] }), c({ kind: "circle", fill: "gray", dots: ["tr"] }), c({ kind: "pentagon", fill: "black", dots: ["tl", "tr", "bl"] })],
    distractorNotes: ["is unshaded with two dots", "is solid with one dot", "is gray, which the rule does not use", "is solid with three dots"] },
  { code: "FC2-10", difficulty: 2, skill: "count_shading", correctIndex: 4, ruleText: "The number of dots equals the number of shading steps plus one: unshaded has one dot, gray two, solid three.",
    rule: (x) => x.dots.length === ["none", "gray", "black"].indexOf(x.fill) + 1,
    exemplars: [c({ kind: "circle", dots: ["tl"] }), c({ kind: "square", fill: "gray", dots: ["tl", "br"] }), c({ kind: "hexagon", fill: "black", dots: ["tl", "tr", "bl"] })],
    correct: c({ kind: "diamond", fill: "gray", dots: ["tr", "bl"] }),
    distractors: [c({ kind: "diamond", fill: "gray", dots: ["tr"] }), c({ kind: "circle", fill: "black", dots: ["tl", "br"] }), c({ kind: "square", dots: ["tl", "br"] }), c({ kind: "hexagon", fill: "black", dots: CORNERS })],
    distractorNotes: ["is gray with one dot", "is solid with two dots", "is unshaded with two dots", "is solid with four dots"] },
  { code: "FC2-11", difficulty: 3, skill: "count_shading", correctIndex: 0, ruleText: "Each figure is gray with as many dots as the shape has sides divided by two (triangle rounds down to one).",
    rule: (x) => x.fill === "gray" && x.dots.length === Math.floor(SIDES[x.kind] / 2) && SIDES[x.kind] >= 3 && SIDES[x.kind] <= 8,
    exemplars: [c({ kind: "square", fill: "gray", dots: ["tl", "br"] }), c({ kind: "hexagon", fill: "gray", dots: ["tl", "tr", "bl"] }), c({ kind: "triangle", fill: "gray", dots: ["tr"] })],
    correct: c({ kind: "diamond", fill: "gray", dots: ["tr", "bl"] }),
    distractors: [c({ kind: "diamond", fill: "gray", dots: ["tr", "bl", "tl"] }), c({ kind: "pentagon", fill: "gray", dots: ["tl", "tr", "bl"] }), c({ kind: "hexagon", fill: "black", dots: ["tl", "tr", "bl"] }), c({ kind: "triangle", fill: "gray", dots: ["tl", "tr"] })],
    distractorNotes: ["is a four-sided shape with three dots", "is a pentagon with three dots instead of two", "is solid rather than gray", "is a triangle with two dots"] },
  { code: "FC2-12", difficulty: 3, skill: "count_shading", correctIndex: 2, ruleText: "Each figure is enclosed in a circle, and the number of dots is one fewer than the shading step (gray has none, solid has one); unshaded figures are never enclosed here.",
    rule: (x) => x.ring && ((x.fill === "gray" && x.dots.length === 0) || (x.fill === "black" && x.dots.length === 1)),
    exemplars: [c({ kind: "square", ring: true, fill: "gray" }), c({ kind: "triangle", ring: true, fill: "black", dots: ["br"] }), c({ kind: "hexagon", ring: true, fill: "gray" })],
    correct: c({ kind: "pentagon", ring: true, fill: "black", dots: ["tl"] }),
    distractors: [c({ kind: "pentagon", ring: true, fill: "black" }), c({ kind: "square", ring: true, fill: "gray", dots: ["tl"] }), c({ kind: "triangle", fill: "black", dots: ["br"] }), c({ kind: "hexagon", ring: true, dots: ["tl"] })],
    distractorNotes: ["is solid but has no dot", "is gray but has a dot", "is not enclosed", "is unshaded"] },
  { code: "FC2-13", difficulty: 1, skill: "count_shading", correctIndex: 1, ruleText: "Each figure is solid and carries exactly one corner dot.",
    rule: (x) => x.fill === "black" && x.dots.length === 1,
    exemplars: [c({ kind: "circle", fill: "black", dots: ["tl"] }), c({ kind: "hexagon", fill: "black", dots: ["br"] }), c({ kind: "triangle", fill: "black", dots: ["tr"] })],
    correct: c({ kind: "star", fill: "black", dots: ["bl"] }),
    distractors: [c({ kind: "star", fill: "black" }), c({ kind: "circle", fill: "gray", dots: ["tl"] }), c({ kind: "hexagon", fill: "black", dots: ["tl", "br"] }), c({ kind: "triangle", dots: ["tr"] })],
    distractorNotes: ["has no dot", "is gray", "has two dots", "is unshaded"] },

  // ---------- orientation_symmetry (6) ----------
  { code: "FC2-14", difficulty: 1, skill: "orientation_symmetry", correctIndex: 4, ruleText: "Each arrow points straight down (rotated 90 degrees clockwise from pointing right).",
    rule: (x) => x.kind === "arrow" && ((x.rot % 360) + 360) % 360 === 90,
    exemplars: [c({ kind: "arrow", rot: 90 }), c({ kind: "arrow", rot: 90, fill: "black", size: "s" }), c({ kind: "arrow", rot: 90, fill: "gray", size: "l" })],
    correct: c({ kind: "arrow", rot: 90, ring: true }),
    distractors: [c({ kind: "arrow", rot: 270 }), c({ kind: "arrow", rot: 0, fill: "black" }), c({ kind: "arrow", rot: 180, fill: "gray" }), c({ kind: "triangle", rot: 90 })],
    distractorNotes: ["points up", "points right", "points left", "is a triangle, not an arrow"] },
  { code: "FC2-15", difficulty: 2, skill: "orientation_symmetry", correctIndex: 0, ruleText: "Each figure has a vertical line of symmetry as drawn: an upright shape with a vertical inner line or no inner line, and any dot pattern is mirrored left-right.",
    rule: (x) => normRotOk(x) && x.kind !== "arrow" && (x.inner === "none" || x.inner === "v" || x.inner === "plus") && mirroredLR(x.dots),
    exemplars: [c({ kind: "triangle", inner: "v" }), c({ kind: "hexagon", dots: ["tl", "tr"] }), c({ kind: "circle", inner: "plus", dots: ["bl", "br"] })],
    correct: c({ kind: "pentagon", inner: "v", dots: CORNERS }),
    distractors: [c({ kind: "pentagon", inner: "v", dots: ["tl"] }), c({ kind: "triangle", inner: "h" }), c({ kind: "arrow" }), c({ kind: "hexagon", dots: ["tl", "br"] })],
    distractorNotes: ["has a single unmirrored dot", "has only a horizontal inner line", "is an arrow pointing sideways", "has dots on opposite corners"] },
  { code: "FC2-16", difficulty: 2, skill: "orientation_symmetry", correctIndex: 3, ruleText: "Each triangle points to the left (rotated 270 degrees) and is enclosed in a circle.",
    rule: (x) => x.kind === "triangle" && ((x.rot % 360) + 360) % 360 === 270 && x.ring,
    exemplars: [c({ kind: "triangle", rot: 270, ring: true }), c({ kind: "triangle", rot: 270, ring: true, fill: "black", size: "s" }), c({ kind: "triangle", rot: 270, ring: true, fill: "gray" })],
    correct: c({ kind: "triangle", rot: 270, ring: true, size: "l", dots: ["tl"] }),
    distractors: [c({ kind: "triangle", rot: 90, ring: true }), c({ kind: "triangle", rot: 270 }), c({ kind: "arrow", rot: 180, ring: true }), c({ kind: "triangle", rot: 0, ring: true, fill: "black" })],
    distractorNotes: ["points right", "is not enclosed", "is an arrow", "points up"] },
  { code: "FC2-17", difficulty: 3, skill: "orientation_symmetry", correctIndex: 2, ruleText: "The arrow's direction matches the position of its single dot: pointing right with a top-right dot, down with a bottom-right dot, left with a bottom-left dot, up with a top-left dot.",
    rule: (x) => x.kind === "arrow" && x.dots.length === 1 && x.dots[0] === (["tr", "br", "bl", "tl"] as Corner[])[(((x.rot % 360) + 360) % 360) / 90],
    exemplars: [c({ kind: "arrow", rot: 0, dots: ["tr"] }), c({ kind: "arrow", rot: 90, dots: ["br"] }), c({ kind: "arrow", rot: 180, dots: ["bl"], fill: "gray" })],
    correct: c({ kind: "arrow", rot: 270, dots: ["tl"], fill: "black" }),
    distractors: [c({ kind: "arrow", rot: 270, dots: ["tr"] }), c({ kind: "arrow", rot: 0, dots: ["bl"] }), c({ kind: "arrow", rot: 90, dots: ["br", "tr"] }), c({ kind: "arrow", rot: 180, dots: ["br"], fill: "gray" })],
    distractorNotes: ["points up with the dot on the wrong side", "points right with the dot at bottom-left", "has two dots", "points left with a bottom-right dot"] },
  { code: "FC2-18", difficulty: 3, skill: "orientation_symmetry", correctIndex: 1, ruleText: "Each figure is a square-family shape whose inner line runs parallel to the side the single dot sits on: a dot on top or bottom pairs with a horizontal line, and a dot at left or right corner pairs with the line that points toward it—here, all dots are top corners so all lines are horizontal.",
    rule: (x) => SIDES[x.kind] === 4 && x.inner === "h" && x.dots.length === 1 && (x.dots[0] === "tl" || x.dots[0] === "tr"),
    exemplars: [c({ kind: "square", inner: "h", dots: ["tl"] }), c({ kind: "diamond", inner: "h", dots: ["tr"] }), c({ kind: "square", inner: "h", dots: ["tr"], fill: "gray", size: "l" })],
    correct: c({ kind: "diamond", inner: "h", dots: ["tl"], size: "s" }),
    distractors: [c({ kind: "diamond", inner: "v", dots: ["tl"] }), c({ kind: "square", inner: "h", dots: ["bl"] }), c({ kind: "hexagon", inner: "h", dots: ["tr"] }), c({ kind: "square", inner: "h", dots: ["tl", "tr"] })],
    distractorNotes: ["has a vertical line", "has its dot at the bottom", "is six-sided", "has two dots"] },
  { code: "FC2-19", difficulty: 2, skill: "orientation_symmetry", correctIndex: 4, ruleText: "Each figure is turned 45 degrees from its upright position and is unshaded.",
    rule: (x) => x.fill === "none" && ((x.rot % 90) + 90) % 90 === 45 && x.kind !== "circle",
    exemplars: [c({ kind: "square", rot: 45 }), c({ kind: "triangle", rot: 45 }), c({ kind: "hexagon", rot: 45, size: "l" })],
    correct: c({ kind: "pentagon", rot: 45 }),
    distractors: [c({ kind: "pentagon" }), c({ kind: "square", rot: 45, fill: "black" }), c({ kind: "triangle", rot: 90 }), c({ kind: "circle" })],
    distractorNotes: ["is upright", "is solid", "is turned 90 degrees, not 45", "is a circle, which has no turn to show"] },

  // ---------- internal_structure (7) ----------
  { code: "FC2-20", difficulty: 1, skill: "internal_structure", correctIndex: 0, ruleText: "Each figure is enclosed in an outer circle.",
    rule: (x) => x.ring,
    exemplars: [c({ kind: "square", ring: true }), c({ kind: "triangle", ring: true, fill: "black" }), c({ kind: "star", ring: true, size: "s" })],
    correct: c({ kind: "hexagon", ring: true, fill: "gray" }),
    distractors: [c({ kind: "hexagon", fill: "gray" }), c({ kind: "circle", size: "l" }), c({ kind: "square", inner: "x" }), c({ kind: "circle", inner: "plus" })],
    distractorNotes: ["has no enclosing circle", "is a large circle by itself", "has inner lines but no ring", "is a circle with a cross, not an enclosed shape"] },
  { code: "FC2-21", difficulty: 2, skill: "internal_structure", correctIndex: 3, ruleText: "Each figure has exactly two inner line segments (crossed diagonals or a plus) and no shading.",
    rule: (x) => (x.inner === "x" || x.inner === "plus") && x.fill === "none",
    exemplars: [c({ kind: "square", inner: "x" }), c({ kind: "circle", inner: "plus" }), c({ kind: "hexagon", inner: "x", size: "l" })],
    correct: c({ kind: "pentagon", inner: "plus" }),
    distractors: [c({ kind: "pentagon", inner: "v" }), c({ kind: "square", inner: "x", fill: "gray" }), c({ kind: "circle", inner: "h" }), c({ kind: "hexagon", ring: true })],
    distractorNotes: ["has one inner line", "is shaded", "has one inner line", "has an outer ring but no inner lines"] },
  { code: "FC2-22", difficulty: 2, skill: "internal_structure", correctIndex: 1, ruleText: "Each figure is solid, so its inner line shows in white, and the line is a single straight segment.",
    rule: (x) => x.fill === "black" && (x.inner === "h" || x.inner === "v"),
    exemplars: [c({ kind: "square", fill: "black", inner: "h" }), c({ kind: "circle", fill: "black", inner: "v" }), c({ kind: "hexagon", fill: "black", inner: "h", size: "l" })],
    correct: c({ kind: "triangle", fill: "black", inner: "v" }),
    distractors: [c({ kind: "triangle", fill: "black", inner: "x" }), c({ kind: "square", fill: "gray", inner: "h" }), c({ kind: "circle", inner: "v" }), c({ kind: "hexagon", fill: "black" })],
    distractorNotes: ["has two crossed lines", "is gray", "is unshaded", "has no inner line"] },
  { code: "FC2-23", difficulty: 3, skill: "internal_structure", correctIndex: 2, ruleText: "Each figure is enclosed in a circle and has an inner line count equal to its number of dots: one straight line with one dot, or a cross with two dots.",
    rule: (x) => x.ring && ((["h", "v"].includes(x.inner) && x.dots.length === 1) || (["x", "plus"].includes(x.inner) && x.dots.length === 2)),
    exemplars: [c({ kind: "square", ring: true, inner: "h", dots: ["tl"] }), c({ kind: "circle", ring: true, inner: "x", dots: ["tl", "br"] }), c({ kind: "pentagon", ring: true, inner: "v", dots: ["br"] })],
    correct: c({ kind: "hexagon", ring: true, inner: "plus", dots: ["tr", "bl"] }),
    distractors: [c({ kind: "hexagon", ring: true, inner: "plus", dots: ["tr"] }), c({ kind: "square", ring: true, inner: "h", dots: ["tl", "br"] }), c({ kind: "circle", inner: "x", dots: ["tl", "br"] }), c({ kind: "pentagon", ring: true, dots: ["br"] })],
    distractorNotes: ["has a cross but only one dot", "has one line but two dots", "is not enclosed", "has no inner line"] },
  { code: "FC2-24", difficulty: 3, skill: "internal_structure", correctIndex: 4, ruleText: "Each figure is an even-sided polygon with a plus-shaped cross inside, and it is not enclosed; gray shading is allowed but solid is not.",
    rule: (x) => !isOdd(x) && !curved(x) && x.inner === "plus" && !x.ring && x.fill !== "black",
    exemplars: [c({ kind: "square", inner: "plus" }), c({ kind: "hexagon", inner: "plus", fill: "gray" }), c({ kind: "diamond", inner: "plus", size: "l" })],
    correct: c({ kind: "hexagon", inner: "plus", size: "s" }),
    distractors: [c({ kind: "hexagon", inner: "x", size: "s" }), c({ kind: "pentagon", inner: "plus" }), c({ kind: "square", inner: "plus", ring: true }), c({ kind: "diamond", inner: "plus", fill: "black" })],
    distractorNotes: ["has diagonals instead of a plus", "is odd-sided", "is enclosed", "is solid"] },
  { code: "FC2-25", difficulty: 2, skill: "internal_structure", correctIndex: 0, ruleText: "Each figure has a horizontal inner line and one dot in a bottom corner.",
    rule: (x) => x.inner === "h" && x.dots.length === 1 && (x.dots[0] === "bl" || x.dots[0] === "br"),
    exemplars: [c({ kind: "circle", inner: "h", dots: ["bl"] }), c({ kind: "square", inner: "h", dots: ["br"], fill: "gray" }), c({ kind: "star", inner: "h", dots: ["bl"] })],
    correct: c({ kind: "hexagon", inner: "h", dots: ["br"] }),
    distractors: [c({ kind: "hexagon", inner: "v", dots: ["br"] }), c({ kind: "circle", inner: "h", dots: ["tl"] }), c({ kind: "square", inner: "h", dots: ["bl", "br"] }), c({ kind: "star", dots: ["bl"] })],
    distractorNotes: ["has a vertical line", "has its dot at the top", "has two dots", "has no inner line"] },
  { code: "FC2-26", difficulty: 1, skill: "internal_structure", correctIndex: 3, ruleText: "Each figure has a single vertical inner line.",
    rule: (x) => x.inner === "v",
    exemplars: [c({ kind: "square", inner: "v" }), c({ kind: "circle", inner: "v", fill: "gray" }), c({ kind: "triangle", inner: "v", size: "l" })],
    correct: c({ kind: "pentagon", inner: "v", fill: "black" }),
    distractors: [c({ kind: "pentagon", inner: "h" }), c({ kind: "square", inner: "plus" }), c({ kind: "circle", inner: "x" }), c({ kind: "triangle", ring: true })],
    distractorNotes: ["has a horizontal line", "has a plus cross", "has crossed diagonals", "has an outer ring only"] },

  // ---------- size_position_partwhole (6) ----------
  { code: "FC2-27", difficulty: 1, skill: "size_position_partwhole", correctIndex: 2, ruleText: "Each figure is small.",
    rule: (x) => x.size === "s",
    exemplars: [c({ kind: "circle", size: "s" }), c({ kind: "square", size: "s", fill: "black" }), c({ kind: "triangle", size: "s", fill: "gray" })],
    correct: c({ kind: "hexagon", size: "s", inner: "h" }),
    distractors: [c({ kind: "hexagon", size: "m", inner: "h" }), c({ kind: "circle", size: "l" }), c({ kind: "square", fill: "black" }), c({ kind: "triangle", size: "l", fill: "gray" })],
    distractorNotes: ["is medium", "is large", "is medium", "is large"] },
  { code: "FC2-28", difficulty: 2, skill: "size_position_partwhole", correctIndex: 1, ruleText: "Each figure is large and carries its single dot in the corner diagonally opposite the top-left, that is, bottom-right.",
    rule: (x) => x.size === "l" && x.dots.length === 1 && x.dots[0] === "br",
    exemplars: [c({ kind: "circle", size: "l", dots: ["br"] }), c({ kind: "square", size: "l", dots: ["br"], fill: "gray" }), c({ kind: "pentagon", size: "l", dots: ["br"] })],
    correct: c({ kind: "star", size: "l", dots: ["br"], fill: "black" }),
    distractors: [c({ kind: "star", size: "m", dots: ["br"] }), c({ kind: "circle", size: "l", dots: ["tl"] }), c({ kind: "square", size: "l", dots: ["br", "tl"] }), c({ kind: "pentagon", size: "l" })],
    distractorNotes: ["is medium", "has its dot at top-left", "has two dots", "has no dot"] },
  { code: "FC2-29", difficulty: 2, skill: "size_position_partwhole", correctIndex: 4, ruleText: "Each figure is a small shape enclosed in a circle (a part inside a whole), and the small shape is solid.",
    rule: (x) => x.size === "s" && x.ring && x.fill === "black",
    exemplars: [c({ kind: "square", size: "s", ring: true, fill: "black" }), c({ kind: "triangle", size: "s", ring: true, fill: "black" }), c({ kind: "star", size: "s", ring: true, fill: "black" })],
    correct: c({ kind: "hexagon", size: "s", ring: true, fill: "black" }),
    distractors: [c({ kind: "hexagon", size: "m", ring: true, fill: "black" }), c({ kind: "square", size: "s", ring: true }), c({ kind: "triangle", size: "s", fill: "black" }), c({ kind: "star", size: "s", ring: true, fill: "gray" })],
    distractorNotes: ["is medium, nearly filling the ring", "is unshaded", "has no enclosing circle", "is gray"] },
  { code: "FC2-30", difficulty: 3, skill: "size_position_partwhole", correctIndex: 0, ruleText: "The size matches the number of dots: small with one dot, medium with two, large with three—and every figure is gray.",
    rule: (x) => x.fill === "gray" && x.dots.length === ["s", "m", "l"].indexOf(x.size) + 1,
    exemplars: [c({ kind: "circle", size: "s", fill: "gray", dots: ["tl"] }), c({ kind: "square", size: "m", fill: "gray", dots: ["tl", "br"] }), c({ kind: "hexagon", size: "l", fill: "gray", dots: ["tl", "tr", "bl"] })],
    correct: c({ kind: "triangle", size: "m", fill: "gray", dots: ["tr", "bl"] }),
    distractors: [c({ kind: "triangle", size: "m", fill: "gray", dots: ["tr"] }), c({ kind: "circle", size: "l", fill: "gray", dots: ["tl", "br"] }), c({ kind: "square", size: "s", dots: ["tl"] }), c({ kind: "hexagon", size: "s", fill: "gray", dots: ["tl", "tr", "bl"] })],
    distractorNotes: ["is medium with one dot", "is large with two dots", "is unshaded", "is small with three dots"] },
  { code: "FC2-31", difficulty: 3, skill: "size_position_partwhole", correctIndex: 3, ruleText: "Each figure is a large, enclosed, odd-sided shape whose dots sit only in top corners.",
    rule: (x) => x.size === "l" && x.ring && isOdd(x) && x.dots.length > 0 && x.dots.every((d) => d === "tl" || d === "tr"),
    exemplars: [c({ kind: "triangle", size: "l", ring: true, dots: ["tl"] }), c({ kind: "pentagon", size: "l", ring: true, dots: ["tl", "tr"], fill: "gray" }), c({ kind: "arrow", size: "l", ring: true, dots: ["tr"] })],
    correct: c({ kind: "pentagon", size: "l", ring: true, dots: ["tr"], fill: "black" }),
    distractors: [c({ kind: "pentagon", size: "l", ring: true, dots: ["br"] }), c({ kind: "hexagon", size: "l", ring: true, dots: ["tl"] }), c({ kind: "triangle", size: "m", ring: true, dots: ["tl"] }), c({ kind: "arrow", size: "l", dots: ["tr"] })],
    distractorNotes: ["has its dot at the bottom", "is even-sided", "is medium", "is not enclosed"] },
  { code: "FC2-32", difficulty: 2, skill: "size_position_partwhole", correctIndex: 1, ruleText: "Each figure is a medium shape with dots on exactly the two left-hand corners.",
    rule: (x) => x.size === "m" && x.dots.length === 2 && x.dots.includes("tl") && x.dots.includes("bl"),
    exemplars: [c({ kind: "circle", dots: ["tl", "bl"] }), c({ kind: "square", dots: ["tl", "bl"], fill: "black" }), c({ kind: "pentagon", dots: ["tl", "bl"], fill: "gray" })],
    correct: c({ kind: "hexagon", dots: ["tl", "bl"], inner: "h" }),
    distractors: [c({ kind: "hexagon", dots: ["tr", "br"], inner: "h" }), c({ kind: "circle", size: "l", dots: ["tl", "bl"] }), c({ kind: "square", dots: ["tl", "tr"], fill: "black" }), c({ kind: "pentagon", dots: ["tl"], fill: "gray" })],
    distractorNotes: ["has its dots on the right", "is large", "has its dots on top", "has one dot"] },
];

function normRotOk(x: Cell): boolean { return x.rot === 0; }
function mirroredLR(d: Corner[]): boolean {
  const s = new Set(d);
  return (s.has("tl") === s.has("tr")) && (s.has("bl") === s.has("br"));
}

export const FIGURE_CLASSIFICATION_V2: BankQuestion[] = FIGURE_CLASSIFICATION_V2_SPECS.map(fc);
