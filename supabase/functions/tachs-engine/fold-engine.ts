// Paper Folding v2 — coordinate/reflection fold engine.
// The stem panels, the correct unfolded sheet and every distractor are generated from the SAME
// geometric model, so rendered geometry and answer keys can never drift apart.
// Sheet coordinates: 0..100 square, y increases downward (SVG convention).
import type { BankQuestion, Choice, VisualItem, VisualSpec } from "./bank-types.ts";
import { NAVY, RED } from "./bank-types.ts";

export type Pt = [number, number];
export type Poly = Pt[];
/** Triangle notch cut into an outer edge: base points b1, b2 lie on the edge, apex points inward. */
export type Cut = [Pt, Pt, Pt];

export interface FoldSpec {
  p1: Pt; p2: Pt;
  /** A point on the side of the line that stays put (the base). The other side is the flap. */
  keep: Pt;
  label: string;
  short: "vertical" | "horizontal" | "diagonal";
}

export interface FoldItemSpec {
  code: string;
  difficulty: 1 | 2 | 3;
  skill: string;
  folds: FoldSpec[];
  holes: Pt[];
  cuts?: Cut[];
  correctIndex: number;
}

export const SHEET: Poly = [[0, 0], [100, 0], [100, 100], [0, 100]];
const EPS = 1e-6;
const HOLE_R = 5;
export const MIN_EDGE_MARGIN = 6;
export const MIN_HOLE_GAP = 2 * HOLE_R + 2;

// ---------- fold constructors ----------
export const V = (x: number, keep: "left" | "right"): FoldSpec => ({
  p1: [x, 0], p2: [x, 100], keep: keep === "left" ? [0, 50] : [100, 50], short: "vertical",
  label: x === 50
    ? `the ${keep === "left" ? "right" : "left"} half is folded over onto the ${keep} half along the vertical center line`
    : `the ${keep === "left" ? "right" : "left"} part is folded over along an off-center vertical line ${x}% of the way from the left edge`,
});
export const H = (y: number, keep: "top" | "bottom"): FoldSpec => ({
  p1: [0, y], p2: [100, y], keep: keep === "top" ? [50, 0] : [50, 100], short: "horizontal",
  label: y === 50
    ? `the ${keep === "top" ? "bottom" : "top"} half is folded over onto the ${keep} half along the horizontal center line`
    : `the ${keep === "top" ? "bottom" : "top"} part is folded over along an off-center horizontal line ${y}% of the way down from the top edge`,
});
export const D = (p1: Pt, p2: Pt, keep: Pt, label: string): FoldSpec => ({ p1, p2, keep, label, short: "diagonal" });

// ---------- geometry ----------
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export const sideOf = (f: FoldSpec, q: Pt): number => cross(sub(f.p2, f.p1), sub(q, f.p1));

export function reflect(f: FoldSpec, q: Pt): Pt {
  const d = sub(f.p2, f.p1);
  const w = sub(q, f.p1);
  const t = (w[0] * d[0] + w[1] * d[1]) / (d[0] * d[0] + d[1] * d[1]);
  const foot: Pt = [f.p1[0] + t * d[0], f.p1[1] + t * d[1]];
  return [round(2 * foot[0] - q[0]), round(2 * foot[1] - q[1])];
}
const round = (n: number) => Math.round(n * 1000) / 1000;

function polyArea(p: Poly): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; }
  return a / 2;
}

/** Signed distance from q to the boundary of convex polygon p (positive inside). */
export function insideDistance(p: Poly, q: Pt): number {
  const orient = Math.sign(polyArea(p)) || 1;
  let min = Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const len = dist(a, b);
    if (len < EPS) continue;
    const s = (cross(sub(b, a), sub(q, a)) / len) * orient;
    min = Math.min(min, s);
  }
  return min;
}
export const inPoly = (p: Poly, q: Pt, tol = 0.5) => insideDistance(p, q) >= -tol;

/** Sutherland–Hodgman clip of a convex polygon to one side of a fold line. */
function clip(p: Poly, f: FoldSpec, sign: number): Poly {
  const out: Poly = [];
  for (let i = 0; i < p.length; i++) {
    const cur = p[i], prev = p[(i + p.length - 1) % p.length];
    const sc = sideOf(f, cur) * sign, sp = sideOf(f, prev) * sign;
    const inC = sc >= -EPS, inP = sp >= -EPS;
    if (inC !== inP) {
      const t = sp / (sp - sc);
      out.push([round(prev[0] + t * (cur[0] - prev[0])), round(prev[1] + t * (cur[1] - prev[1]))]);
    }
    if (inC) out.push(cur);
  }
  // drop duplicate consecutive points
  return out.filter((pt, i) => dist(pt, out[(i + out.length - 1) % out.length]) > EPS || out.length === 1);
}

export interface FoldStep { before: Poly; base: Poly; flap: Poly; flapR: Poly }

/** Apply one fold to a footprint. Throws if the flap would not land entirely on the base. */
export function applyFold(footprint: Poly, f: FoldSpec): FoldStep {
  const keepSign = Math.sign(sideOf(f, f.keep));
  if (!keepSign) throw new Error("keep point lies on the fold line");
  const base = clip(footprint, f, keepSign);
  const flap = clip(footprint, f, -keepSign);
  if (Math.abs(polyArea(base)) < 1 || Math.abs(polyArea(flap)) < 1) throw new Error("fold line does not cross the folded shape");
  const flapR = flap.map((q) => reflect(f, q));
  for (const q of flapR) if (!inPoly(base, q, 0.5)) throw new Error(`flap does not land on the base (point ${q.join(",")})`);
  return { before: footprint, base, flap, flapR };
}

export function foldSteps(folds: FoldSpec[]): FoldStep[] {
  const steps: FoldStep[] = [];
  let fp = SHEET;
  for (const f of folds) { const s = applyFold(fp, f); steps.push(s); fp = s.base; }
  return steps;
}

const key = (p: Pt) => `${Math.round(p[0])},${Math.round(p[1])}`;
const dedupePts = (pts: Pt[]) => pts.filter((p, i) => pts.findIndex((q) => dist(p, q) < 1) === i);
const dedupeCuts = (cs: Cut[]) => cs.filter((c, i) => cs.findIndex((d) => cutKey(c) === cutKey(d)) === i);
const cutKey = (c: Cut) => c.map(key).sort().join("|");

export interface Unfolded { holes: Pt[]; cuts: Cut[] }

/** Undo the folds in reverse order: each hole/cut gains a mirror image wherever a flap layer existed. */
export function unfold(folds: FoldSpec[], holes: Pt[], cuts: Cut[] = [], skipFoldIndex: number | null = null): Unfolded {
  const steps = foldSteps(folds);
  let H = [...holes];
  let C = [...cuts];
  for (let i = folds.length - 1; i >= 0; i--) {
    if (i === skipFoldIndex) continue;
    const f = folds[i], prev = steps[i].before;
    H = dedupePts([...H, ...H.map((h) => reflect(f, h)).filter((h) => inPoly(prev, h, 0.5))]);
    C = dedupeCuts([...C, ...C.map((c) => c.map((p) => reflect(f, p)) as Cut).filter((c) => c.every((p) => inPoly(prev, p, 0.75)))]);
  }
  return { holes: H, cuts: C };
}

export const canonical = (u: Unfolded) => [...u.holes.map(key).sort(), ...u.cuts.map(cutKey).sort()].join(";");

/** Two unfolded sheets are the same figure when every hole/cut has a counterpart within `tol`. */
export function sameFigure(a: Unfolded, b: Unfolded, tol = 3): boolean {
  if (a.holes.length !== b.holes.length || a.cuts.length !== b.cuts.length) return false;
  const usedH = new Set<number>();
  for (const h of a.holes) {
    const j = b.holes.findIndex((q, idx) => !usedH.has(idx) && dist(h, q) <= tol);
    if (j < 0) return false; usedH.add(j);
  }
  const usedC = new Set<number>();
  for (const c of a.cuts) {
    const j = b.cuts.findIndex((d, idx) => !usedC.has(idx) && c.every((p) => d.some((q) => dist(p, q) <= tol)));
    if (j < 0) return false; usedC.add(j);
  }
  return true;
}

const onSheetEdge = (p: Pt) => Math.abs(p[0]) < 0.5 || Math.abs(p[0] - 100) < 0.5 || Math.abs(p[1]) < 0.5 || Math.abs(p[1] - 100) < 0.5;

/** A drawable, non-overlapping sheet: holes inside with margin, holes apart, notch bases on the sheet edge. */
export function isDrawable(u: Unfolded): boolean {
  if (u.holes.length + u.cuts.length === 0) return false;
  for (const h of u.holes) if (h[0] < MIN_EDGE_MARGIN - 1 || h[0] > 100 - MIN_EDGE_MARGIN + 1 || h[1] < MIN_EDGE_MARGIN - 1 || h[1] > 100 - MIN_EDGE_MARGIN + 1) return false;
  for (let i = 0; i < u.holes.length; i++) for (let j = i + 1; j < u.holes.length; j++) if (dist(u.holes[i], u.holes[j]) < MIN_HOLE_GAP) return false;
  for (const c of u.cuts) {
    if (!onSheetEdge(c[0]) || !onSheetEdge(c[1]) || onSheetEdge(c[2])) return false;
    if (!inPoly(SHEET, c[2], 0)) return false;
    for (const h of u.holes) if (c.some((p) => dist(p, h) < HOLE_R + 2)) return false;
  }
  return true;
}

// ---------- distractor model ----------
const mapU = (u: Unfolded, fn: (p: Pt) => Pt): Unfolded => ({ holes: u.holes.map(fn), cuts: u.cuts.map((c) => c.map(fn) as Cut) });
const unionU = (a: Unfolded, b: Unfolded): Unfolded => ({ holes: dedupePts([...a.holes, ...b.holes]), cuts: dedupeCuts([...a.cuts, ...b.cuts]) });
const CENTER_V = V(50, "left"), CENTER_H = H(50, "top");
const MAIN_D = D([0, 0], [100, 100], [100, 0], ""), ANTI_D = D([100, 0], [0, 100], [0, 0], "");

/**
 * Candidate wrong answers, each modelling a named misconception, in priority order.
 * All are derived from the same fold model as the correct answer.
 */
export function distractorCandidates(spec: FoldItemSpec, correct: Unfolded): { label: string; u: Unfolded }[] {
  const { folds, holes, cuts = [] } = spec;
  const n = folds.length;
  const out: { label: string; u: Unfolded }[] = [];
  const punched: Unfolded = { holes, cuts };
  // 1. Forgot the first (outermost) fold: one layer of reflection missing.
  const partial = unfold(folds, holes, cuts, 0); // everything undone except the first (outermost) fold
  out.push({ label: "skipped the first fold", u: partial });
  // 2. Translated the punch instead of mirroring it across the first fold.
  const f0 = folds[0];
  // For axis folds, "translation" means sliding the copy across the line without mirroring the offset pattern:
  const slide = (p: Pt): Pt => {
    if (f0.short === "vertical") { const x = f0.p1[0]; const w = 100 - x >= x ? x : 100 - x; return [round(p[0] < x ? p[0] + w : p[0] - w), p[1]]; }
    if (f0.short === "horizontal") { const y = f0.p1[1]; const w = 100 - y >= y ? y : 100 - y; return [p[0], round(p[1] < y ? p[1] + w : p[1] - w)]; }
    return [round(100 - p[0]), round(100 - p[1])]; // diagonal: rotate 180° instead of transposing
  };
  out.push({ label: "slid the copy instead of mirroring it", u: unionU(partial, mapU(partial, slide)) });
  // 3. Skipped the most recent fold (only for 2+ folds).
  if (n > 1) out.push({ label: "skipped the last fold", u: unfold(folds, holes, cuts, n - 1) });
  // 4. Mirrored across the wrong line (perpendicular center line / other diagonal) for the first fold.
  const wrongLine = f0.short === "vertical" ? CENTER_H : f0.short === "horizontal" ? CENTER_V : (sideOf(MAIN_D, f0.p1) === 0 && sideOf(MAIN_D, f0.p2) === 0 ? ANTI_D : MAIN_D);
  out.push({ label: "mirrored across the wrong line", u: unionU(partial, mapU(partial, (p) => reflect(wrongLine, p))) });
  // 4b. Diagonal fold mistaken for a vertical / horizontal center fold.
  if (f0.short === "diagonal") {
    out.push({ label: "mirrored across the vertical center line instead of the diagonal", u: unionU(partial, mapU(partial, (p) => reflect(CENTER_V, p))) });
    out.push({ label: "mirrored across the horizontal center line instead of the diagonal", u: unionU(partial, mapU(partial, (p) => reflect(CENTER_H, p))) });
  }
  // 5. Off-center fold treated as a center fold.
  const isOffCenter = (f0.short === "vertical" && f0.p1[0] !== 50) || (f0.short === "horizontal" && f0.p1[1] !== 50);
  if (isOffCenter) out.push({ label: "treated the off-center fold as a center fold", u: unionU(partial, mapU(partial, (p) => reflect(f0.short === "vertical" ? CENTER_V : CENTER_H, p))) });
  // 6. Correct pattern but rotated 180° (orientation error).
  out.push({ label: "rotated the pattern", u: mapU(correct, (p) => [round(100 - p[0]), round(100 - p[1])]) });
  // 7. Transposed pattern (reflected over the wrong diagonal).
  out.push({ label: "transposed the pattern", u: mapU(correct, (p) => [p[1], p[0]]) });
  // 8. One punch dropped before unfolding.
  if (holes.length > 1) out.push({ label: "lost one punch", u: unfold(folds, holes.slice(1), cuts) });
  // 9. Extra reflection (one fold too many).
  const extra = f0.short === "vertical" ? CENTER_H : CENTER_V;
  out.push({ label: "added an extra fold", u: unionU(correct, mapU(correct, (p) => reflect(extra, p))) });
  // 10. Only the punched layer (no unfolding at all).
  out.push({ label: "did not unfold", u: punched });
  // 11. Mirror the correct answer left-right (orientation error).
  out.push({ label: "flipped the pattern", u: mapU(correct, (p) => [round(100 - p[0]), p[1]]) });
  return out;
}

export function buildDistractors(spec: FoldItemSpec, correct: Unfolded): { label: string; u: Unfolded }[] {
  const chosen: { label: string; u: Unfolded }[] = [];
  for (const c of distractorCandidates(spec, correct)) {
    if (!isDrawable(c.u)) continue;
    if (sameFigure(c.u, correct)) continue;
    if (chosen.some((k) => sameFigure(k.u, c.u))) continue;
    chosen.push(c);
    if (chosen.length === CHOICE_COUNT - 1) break;
  }
  return chosen;
}

// ---------- rendering ----------
const polyItem = (pts: Poly, fill: string, stroke: string = NAVY, dash = false): VisualItem => ({ t: "poly", pts: pts.map(([x, y]) => [x, y]), fill, stroke, dash });
const off = (pts: Poly, dx: number, dy: number): Poly => pts.map(([x, y]) => [round(x + dx), round(y + dy)]);
const centroid = (p: Poly): Pt => [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length];

/** Clip the infinite fold line to a convex polygon: the two boundary crossing points. */
function lineAcross(p: Poly, f: FoldSpec): [Pt, Pt] | null {
  const pts: Pt[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const sa = sideOf(f, a), sb = sideOf(f, b);
    if (Math.abs(sa) < EPS) pts.push(a);
    else if (sa * sb < 0) { const t = sa / (sa - sb); pts.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
  }
  const u = dedupePts(pts);
  return u.length >= 2 ? [u[0], u[u.length - 1]] : null;
}

function notchItems(c: Cut, dx: number, dy: number): VisualItem[] {
  const [b1, b2, apex] = c;
  const mid: Pt = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2];
  const nrm = sub(mid, apex); const len = Math.hypot(nrm[0], nrm[1]) || 1;
  const ext: Pt = [(nrm[0] / len) * 3, (nrm[1] / len) * 3];
  const cover: Poly = [[b1[0] + ext[0], b1[1] + ext[1]], [b2[0] + ext[0], b2[1] + ext[1]], apex];
  return [
    polyItem(off(cover, dx, dy), "#fff", "none"),
    { t: "line", x1: b1[0] + dx, y1: b1[1] + dy, x2: apex[0] + dx, y2: apex[1] + dy, stroke: NAVY },
    { t: "line", x1: b2[0] + dx, y1: b2[1] + dy, x2: apex[0] + dx, y2: apex[1] + dy, stroke: NAVY },
  ];
}

const holeItems = (holes: Pt[], dx: number, dy: number): VisualItem[] =>
  holes.map(([x, y]) => ({ t: "circle", cx: round(x + dx), cy: round(y + dy), r: HOLE_R, fill: "#fff", stroke: NAVY }));

/** Fully unfolded 100x100 sheet with holes and notches (answer-choice art). */
export function unfoldedSheet(u: Unfolded): VisualSpec {
  const pad = 3;
  return {
    w: 106, h: 106,
    items: [
      { t: "rect", x: pad, y: pad, w: 100, h: 100, stroke: NAVY, fill: "#fff" },
      ...u.cuts.flatMap((c) => notchItems(c, pad, pad)),
      ...holeItems(u.holes, pad, pad),
    ],
  };
}

const PANEL = 100, GAP = 44, PAD = 12, TOP = 14;

/** Top row: one panel per fold (footprint + dashed fold line + arrow), then the punch/cut panel. */
export function stemVisual(spec: FoldItemSpec): VisualSpec {
  const steps = foldSteps(spec.folds);
  const n = spec.folds.length;
  const items: VisualItem[] = [];
  const panelX = (i: number) => PAD + i * (PANEL + GAP);
  for (let i = 0; i <= n; i++) {
    const x0 = panelX(i);
    const footprint = i === 0 ? SHEET : steps[i - 1].base;
    // faint outline of the full sheet for spatial reference
    items.push({ t: "rect", x: x0, y: TOP, w: 100, h: 100, stroke: "#cbd5e1", fill: "none", dash: true });
    items.push(polyItem(off(footprint, x0, TOP), "#fff"));
    if (i > 0) items.push(polyItem(off(steps[i - 1].flapR, x0, TOP), "#dbe3f0", "#94a3b8"));
    if (i < n) {
      const f = spec.folds[i];
      const seg = lineAcross(footprint, f);
      if (seg) items.push({ t: "line", x1: seg[0][0] + x0, y1: seg[0][1] + TOP, x2: seg[1][0] + x0, y2: seg[1][1] + TOP, stroke: NAVY, dash: true });
      const from = centroid(steps[i].flap), to = centroid(steps[i].flapR);
      const shrink = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      const a = shrink(from, to, 0.15), b = shrink(from, to, 0.8);
      items.push({ t: "line", x1: a[0] + x0, y1: a[1] + TOP, x2: b[0] + x0, y2: b[1] + TOP, stroke: RED, arrow: true });
      items.push({ t: "text", x: x0 + 50, y: TOP + 116, s: `Fold ${i + 1}`, size: 11 });
      // connector arrow between panels
      items.push({ t: "line", x1: x0 + PANEL + 8, y1: TOP + 50, x2: x0 + PANEL + GAP - 10, y2: TOP + 50, stroke: "#64748b", arrow: true });
    } else {
      for (const c of spec.cuts ?? []) items.push(...notchItems(c, x0, TOP));
      items.push(...holeItems(spec.holes, x0, TOP));
      items.push({ t: "text", x: x0 + 50, y: TOP + 116, s: (spec.cuts?.length ? "Punch & cut" : "Punch"), size: 11 });
    }
  }
  return { w: PAD * 2 + (n + 1) * PANEL + n * GAP, h: TOP + 100 + 26, items };
}

// ---------- text ----------
function regionWord(p: Pt, poly: Poly): string {
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const fx = (p[0] - minX) / Math.max(1, maxX - minX), fy = (p[1] - minY) / Math.max(1, maxY - minY);
  const v = fy < 0.34 ? "upper" : fy > 0.66 ? "lower" : "middle";
  const h = fx < 0.34 ? "left" : fx > 0.66 ? "right" : "center";
  return v === "middle" && h === "center" ? "center" : `${v}-${h}`;
}

export function altText(spec: FoldItemSpec): string {
  const steps = foldSteps(spec.folds);
  const final = steps[steps.length - 1].base;
  const parts = spec.folds.map((f, i) => `Panel ${i + 1}: ${f.label}.`);
  const holes = spec.holes.map((h) => regionWord(h, final));
  let last = `Final panel: ${spec.holes.length === 1 ? "one hole is" : `${spec.holes.length} holes are`} punched through all layers of the folded shape (${holes.join("; ")}).`;
  if (spec.cuts?.length) last += ` ${spec.cuts.length === 1 ? "A small triangular notch is" : `${spec.cuts.length} small triangular notches are`} cut into an outer edge of the folded shape.`;
  return [...parts, last, "Answer choices show fully unfolded sheets."].join(" ");
}

export function rationaleText(spec: FoldItemSpec, correct: Unfolded, distractors: { label: string }[]): string {
  const n = spec.folds.length;
  let holes = [...spec.holes], cuts = [...(spec.cuts ?? [])];
  const steps = foldSteps(spec.folds);
  const lines: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const f = spec.folds[i], prev = steps[i].before;
    const before = holes.length;
    holes = dedupePts([...holes, ...holes.map((h) => reflect(f, h)).filter((h) => inPoly(prev, h, 0.5))]);
    cuts = dedupeCuts([...cuts, ...cuts.map((c) => c.map((p) => reflect(f, p)) as Cut).filter((c) => c.every((p) => inPoly(prev, p, 0.75)))]);
    const gained = holes.length - before;
    lines.push(`undo fold ${i + 1} (${f.short}): ${before} hole${before === 1 ? "" : "s"} → ${holes.length}${gained < before ? " (only the punches that sat on a doubled layer gain a mirror image)" : ""}`);
  }
  const total = `${correct.holes.length} hole${correct.holes.length === 1 ? "" : "s"}${correct.cuts.length ? ` and ${correct.cuts.length} notch${correct.cuts.length === 1 ? "" : "es"}` : ""}`;
  const wrong = distractors.map((d) => d.label).join("; ");
  return `Work backwards, mirroring across each fold line in reverse order: ${lines.join("; ")}. The unfolded sheet shows ${total}. Wrong choices model common errors: ${wrong}.`;
}

// ---------- item builder ----------
export const CHOICE_COUNT = 5;
const KEYS = ["A", "B", "C", "D", "E"];

export function buildFoldItem(spec: FoldItemSpec): BankQuestion & { model: { correct: Unfolded; distractors: { label: string; u: Unfolded }[] } } {
  const steps = foldSteps(spec.folds);
  const final = steps[steps.length - 1].base;
  for (const h of spec.holes) if (insideDistance(final, h) < MIN_EDGE_MARGIN - 0.01) throw new Error(`${spec.code}: hole ${h.join(",")} too close to an edge of the folded shape`);
  for (const c of spec.cuts ?? []) {
    if (!onSheetEdge(c[0]) || !onSheetEdge(c[1])) throw new Error(`${spec.code}: notch base must lie on an outer sheet edge`);
    if (!inPoly(final, c[0], 0.5) || !inPoly(final, c[1], 0.5) || !inPoly(final, c[2], 0)) throw new Error(`${spec.code}: notch not on the folded shape`);
  }
  const correct = unfold(spec.folds, spec.holes, spec.cuts ?? []);
  if (!isDrawable(correct)) throw new Error(`${spec.code}: correct unfolded sheet is not drawable (overlapping or edge holes)`);
  const distractors = buildDistractors(spec, correct);
  if (distractors.length < CHOICE_COUNT - 1) throw new Error(`${spec.code}: only ${distractors.length} distinct distractors available`);
  const visuals = distractors.map((d) => unfoldedSheet(d.u));
  visuals.splice(spec.correctIndex, 0, unfoldedSheet(correct));
  const choices: Choice[] = visuals.map((v, i) => ({ key: KEYS[i], visual: v }));
  const punchWord = spec.holes.length === 1 ? "one hole is punched" : `${spec.holes.length} holes are punched`;
  const cutWord = spec.cuts?.length ? ` and ${spec.cuts.length === 1 ? "a notch is" : "notches are"} cut from the edge` : "";
  return {
    code: spec.code, section_key: "paper_folding", skill: spec.skill, difficulty: spec.difficulty,
    stem: `The sheet is folded ${spec.folds.length === 1 ? "once" : spec.folds.length === 2 ? "twice" : "three times"} as shown, then ${punchWord} through all layers${cutWord}. How will the sheet look when it is completely unfolded?`,
    visual: stemVisual(spec),
    visual_alt: altText(spec),
    choices, correct_key: KEYS[spec.correctIndex],
    rationale: rationaleText(spec, correct, distractors),
    model: { correct, distractors },
  };
}
