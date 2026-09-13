// Shared rule model for the v2 Ability sections (Figure Matrices, Figure Classification).
// A figure is a small attribute record; rendering, answer keys and distractors are all derived
// from the SAME record so geometry and keys cannot drift apart. Five choices (A–E) throughout.
import { GRAY, NAVY, type Choice, type ShapeKind, type VisualItem, type VisualSpec } from "./bank-types.ts";

export const ABILITY_KEYS = ["A", "B", "C", "D", "E"] as const;
export const ABILITY_CHOICES = 5;

export type Fill = "none" | "gray" | "black";
export type Size = "s" | "m" | "l";
export type Inner = "none" | "h" | "v" | "x" | "plus";
export type Corner = "tl" | "tr" | "bl" | "br";

export interface Cell {
  kind: ShapeKind;
  fill: Fill;
  rot: number;          // degrees clockwise
  size: Size;
  inner: Inner;         // internal line pattern
  ring: boolean;        // enclosed by an outer circle
  dots: Corner[];       // small marker dots at cell corners (count + position)
}

export const cell = (p: Partial<Cell> = {}): Cell => ({ kind: "square", fill: "none", rot: 0, size: "m", inner: "none", ring: false, dots: [], ...p });

const SIZE_PX: Record<Size, number> = { s: 22, m: 36, l: 50 };
const FILL_COLOR: Record<Fill, string> = { none: "none", gray: GRAY, black: NAVY };
const CORNER_XY: Record<Corner, [number, number]> = { tl: [12, 12], tr: [68, 12], bl: [12, 68], br: [68, 68] };
/** Rotational symmetry order used to normalise `rot` when comparing figures. */
const SYMMETRY: Record<ShapeKind, number> = { circle: 1, square: 90, plus: 90, diamond: 90, hexagon: 60, triangle: 120, star: 72, pentagon: 72, arrow: 360 };

export const normRot = (kind: ShapeKind, rot: number): number => {
  const p = SYMMETRY[kind];
  if (p === 1) return 0;
  return ((rot % p) + p) % p;
};

/** Canonical key: two cells with the same key look identical when rendered. */
export function cellKey(c: Cell): string {
  const rot = normRot(c.kind, c.rot);
  // inner lines are themselves symmetric: "x" and "plus" swap under 45° for square-symmetric shapes; keep it simple and exact.
  return [c.kind, c.fill, rot, c.size, c.inner, c.ring ? 1 : 0, [...c.dots].sort().join("")].join("|");
}
export const sameCell = (a: Cell, b: Cell) => cellKey(a) === cellKey(b);

/** Render a cell into 80×80 local coordinates. */
export function renderCell(c: Cell): VisualItem[] {
  const items: VisualItem[] = [];
  const size = SIZE_PX[c.size];
  if (c.ring) items.push({ t: "circle", cx: 40, cy: 40, r: 33, stroke: NAVY, fill: "none" });
  items.push({ t: "shape", kind: c.kind, cx: 40, cy: 40, size, fill: FILL_COLOR[c.fill], stroke: NAVY, rot: c.rot || undefined });
  const h = size / 2 - 1;
  const inner = c.fill === "black" ? "#fff" : NAVY;
  if (c.inner === "h" || c.inner === "plus") items.push({ t: "line", x1: 40 - h, y1: 40, x2: 40 + h, y2: 40, stroke: inner });
  if (c.inner === "v" || c.inner === "plus") items.push({ t: "line", x1: 40, y1: 40 - h, x2: 40, y2: 40 + h, stroke: inner });
  if (c.inner === "x") { const d = h * 0.7; items.push({ t: "line", x1: 40 - d, y1: 40 - d, x2: 40 + d, y2: 40 + d, stroke: inner }, { t: "line", x1: 40 + d, y1: 40 - d, x2: 40 - d, y2: 40 + d, stroke: inner }); }
  for (const d of c.dots) { const [x, y] = CORNER_XY[d]; items.push({ t: "circle", cx: x, cy: y, r: 4, fill: NAVY, stroke: NAVY }); }
  return items;
}

export const choiceFig = (items: VisualItem[]): VisualSpec => ({
  w: 80, h: 80, items: [{ t: "rect", x: 1, y: 1, w: 78, h: 78, stroke: "#cbd5e1", fill: "none" }, ...items],
});

export const FILL_WORD: Record<Fill, string> = { none: "unshaded", gray: "gray", black: "solid" };
export const SIZE_WORD: Record<Size, string> = { s: "small", m: "medium", l: "large" };
export const INNER_WORD: Record<Inner, string> = { none: "no inner line", h: "a horizontal inner line", v: "a vertical inner line", x: "two crossed diagonal lines", plus: "a plus-shaped inner cross" };

export function describeCell(c: Cell): string {
  const parts = [SIZE_WORD[c.size], FILL_WORD[c.fill], c.kind];
  let s = parts.join(" ");
  if (c.rot) s += ` rotated ${normRot(c.kind, c.rot)} degrees`;
  if (c.inner !== "none") s += ` with ${INNER_WORD[c.inner]}`;
  if (c.ring) s += ", enclosed in a circle";
  if (c.dots.length) s += `, with ${c.dots.length} corner dot${c.dots.length === 1 ? "" : "s"}`;
  return s;
}

export const NEXT_FILL: Record<Fill, Fill> = { none: "gray", gray: "black", black: "none" };
export const NEXT_SIZE: Record<Size, Size> = { s: "m", m: "l", l: "s" };
export const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];

/** Pack a correct figure and distractors into five keyed choices; the model index decides the key. */
export function packFive(correct: VisualSpec, distractors: VisualSpec[], correctIndex: number): { choices: Choice[]; correct_key: string } {
  if (distractors.length !== ABILITY_CHOICES - 1) throw new Error(`need ${ABILITY_CHOICES - 1} distractors, got ${distractors.length}`);
  if (correctIndex < 0 || correctIndex >= ABILITY_CHOICES) throw new Error(`bad correctIndex ${correctIndex}`);
  const all = [...distractors];
  all.splice(correctIndex, 0, correct);
  return { choices: all.map((v, i) => ({ key: ABILITY_KEYS[i], visual: v })), correct_key: ABILITY_KEYS[correctIndex] };
}

/** Pick the first N candidates that are drawable-distinct from the answer and from each other. */
export function distinctCandidates(correct: Cell, candidates: { label: string; c: Cell }[], n: number): { label: string; c: Cell }[] {
  const out: { label: string; c: Cell }[] = [];
  for (const cand of candidates) {
    if (sameCell(cand.c, correct)) continue;
    if (out.some((o) => sameCell(o.c, cand.c))) continue;
    out.push(cand);
    if (out.length === n) break;
  }
  return out;
}
