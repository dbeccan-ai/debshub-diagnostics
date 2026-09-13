import React from "react";

export type VisualItem =
  | { t: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; dash?: boolean }
  | { t: "rect"; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; rot?: number; dash?: boolean }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; stroke?: string; dash?: boolean; arrow?: boolean }
  | { t: "text"; x: number; y: number; s: string; size?: number }
  | { t: "shape"; kind: "triangle" | "diamond" | "star" | "hexagon" | "pentagon" | "arrow" | "plus" | "square" | "circle"; cx: number; cy: number; size: number; fill?: string; stroke?: string; rot?: number; dash?: boolean };

export interface VisualSpec { w: number; h: number; items: VisualItem[] }

const STROKE = "currentColor";

function polygon(kind: string, cx: number, cy: number, size: number): string {
  const r = size / 2;
  const pts: [number, number][] = [];
  const poly = (n: number, offset = -Math.PI / 2, rr = r) => {
    for (let i = 0; i < n; i++) { const a = offset + (i * 2 * Math.PI) / n; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  };
  switch (kind) {
    case "triangle": poly(3); break;
    case "diamond": poly(4); break;
    case "pentagon": poly(5); break;
    case "hexagon": poly(6, 0); break;
    case "square": return `${cx - r},${cy - r} ${cx + r},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`;
    case "star": {
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 === 0 ? r : r * 0.45; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      break;
    }
    case "arrow": {
      const s = r; pts.push([cx - s, cy - s * 0.35], [cx, cy - s * 0.35], [cx, cy - s * 0.8], [cx + s, cy], [cx, cy + s * 0.8], [cx, cy + s * 0.35], [cx - s, cy + s * 0.35]);
      break;
    }
    case "plus": {
      const a = r * 0.35; pts.push([cx - a, cy - r], [cx + a, cy - r], [cx + a, cy - a], [cx + r, cy - a], [cx + r, cy + a], [cx + a, cy + a], [cx + a, cy + r], [cx - a, cy + r], [cx - a, cy + a], [cx - r, cy + a], [cx - r, cy - a], [cx - a, cy - a]);
      break;
    }
    default: poly(4);
  }
  return pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
}

const fillOf = (f?: string) => (f === "black" ? STROKE : f === "gray" ? "hsl(var(--muted-foreground))" : f && f !== "none" && f !== "white" ? f : f === "white" ? "hsl(var(--background))" : "none");

function Item({ it, i }: { it: VisualItem; i: number }) {
  const dash = "dash" in it && it.dash ? "5 4" : undefined;
  switch (it.t) {
    case "circle":
      return <circle key={i} cx={it.cx} cy={it.cy} r={it.r} fill={fillOf(it.fill)} stroke={it.stroke ?? STROKE} strokeWidth={2} strokeDasharray={dash} />;
    case "rect":
      return <rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} fill={fillOf(it.fill)} stroke={it.stroke ?? STROKE} strokeWidth={2} strokeDasharray={dash} transform={it.rot ? `rotate(${it.rot} ${it.x + it.w / 2} ${it.y + it.h / 2})` : undefined} />;
    case "line":
      return <line key={i} x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={it.stroke ?? STROKE} strokeWidth={2} strokeDasharray={dash} markerEnd={it.arrow ? "url(#tachs-arrow)" : undefined} />;
    case "text":
      return <text key={i} x={it.x} y={it.y} fontSize={it.size ?? 14} textAnchor="middle" dominantBaseline="middle" fill={STROKE} fontFamily="system-ui, sans-serif">{it.s}</text>;
    case "shape":
      if (it.kind === "circle") return <circle key={i} cx={it.cx} cy={it.cy} r={it.size / 2} fill={fillOf(it.fill)} stroke={it.stroke ?? STROKE} strokeWidth={2} strokeDasharray={dash} />;
      return <polygon key={i} points={polygon(it.kind, it.cx, it.cy, it.size)} fill={fillOf(it.fill)} stroke={it.stroke ?? STROKE} strokeWidth={2} strokeDasharray={dash} transform={it.rot ? `rotate(${it.rot} ${it.cx} ${it.cy})` : undefined} />;
    default:
      return null;
  }
}

export function TachsVisual({ spec, alt, className, maxWidth = 360 }: { spec: unknown; alt?: string | null; className?: string; maxWidth?: number }) {
  const s = spec as VisualSpec | null | undefined;
  if (!s || !Array.isArray(s.items)) return null;
  return (
    <svg
      viewBox={`0 0 ${s.w} ${s.h}`}
      role="img"
      aria-label={alt ?? "Figure"}
      className={className ?? "text-foreground"}
      style={{ width: "100%", maxWidth, height: "auto", display: "block" }}
    >
      <title>{alt ?? "Figure"}</title>
      <defs>
        <marker id="tachs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill={STROKE} />
        </marker>
      </defs>
      {s.items.map((it, i) => <Item it={it} i={i} key={i} />)}
    </svg>
  );
}

export default TachsVisual;
