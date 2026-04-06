import { useState, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  from: Point;
  to: Point;
}

export default function GraphPaperTool() {
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const gridSize = 20;
  const cols = 20;
  const rows = 15;
  const w = cols * gridSize;
  const h = rows * gridSize;
  const originX = 10 * gridSize; // center
  const originY = 7 * gridSize;

  const snapToGrid = (clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    return {
      x: Math.round(rawX / gridSize) * gridSize,
      y: Math.round(rawY / gridSize) * gridSize,
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    const pt = snapToGrid(e.clientX, e.clientY);

    if (connectMode && selectedPoint !== null) {
      // Draw line from selected to new point
      const newIdx = points.findIndex(p => p.x === pt.x && p.y === pt.y);
      if (newIdx === -1) {
        setPoints(prev => [...prev, pt]);
        setLines(prev => [...prev, { from: points[selectedPoint], to: pt }]);
      } else {
        setLines(prev => [...prev, { from: points[selectedPoint], to: points[newIdx] }]);
      }
      setSelectedPoint(null);
    } else {
      // Check if clicking existing point
      const existing = points.findIndex(p => p.x === pt.x && p.y === pt.y);
      if (existing !== -1 && connectMode) {
        setSelectedPoint(existing);
      } else if (existing === -1) {
        setPoints(prev => [...prev, pt]);
        if (connectMode) setSelectedPoint(points.length);
      }
    }
  };

  const gridToCoord = (pt: Point) => ({
    x: Math.round((pt.x - originX) / gridSize),
    y: -Math.round((pt.y - originY) / gridSize),
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => { setConnectMode(!connectMode); setSelectedPoint(null); }}
          className={`text-xs px-2 py-1 rounded ${connectMode ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          {connectMode ? "📏 Line Mode ON" : "📍 Point Mode"}
        </button>
        <button
          onClick={() => { setPoints([]); setLines([]); setSelectedPoint(null); }}
          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear
        </button>
      </div>
      <svg
        ref={svgRef}
        width={w}
        height={h}
        className="border rounded bg-white cursor-crosshair"
        onClick={handleClick}
      >
        {/* Grid lines */}
        {Array.from({ length: cols + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * gridSize} y1="0" x2={i * gridSize} y2={h} stroke={i === cols / 2 ? "#333" : "#e5e7eb"} strokeWidth={i === cols / 2 ? 2 : 1} />
        ))}
        {Array.from({ length: rows + 1 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * gridSize} x2={w} y2={i * gridSize} stroke={i === Math.floor(rows / 2) ? "#333" : "#e5e7eb"} strokeWidth={i === Math.floor(rows / 2) ? 2 : 1} />
        ))}
        {/* Axis labels */}
        <text x={w - 12} y={originY - 5} fontSize="10" fill="#666">x</text>
        <text x={originX + 5} y={12} fontSize="10" fill="#666">y</text>
        {/* Lines */}
        {lines.map((l, i) => (
          <line key={`l${i}`} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} stroke="#2563eb" strokeWidth="2" />
        ))}
        {/* Points */}
        {points.map((pt, i) => {
          const coord = gridToCoord(pt);
          return (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={selectedPoint === i ? "#f59e0b" : "#2563eb"}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (connectMode) setSelectedPoint(i);
                }}
              />
              <text x={pt.x + 8} y={pt.y - 8} fontSize="9" fill="#1e3a8a">
                ({coord.x},{coord.y})
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-gray-400">Click to plot points. Toggle Line Mode to connect them.</p>
    </div>
  );
}
