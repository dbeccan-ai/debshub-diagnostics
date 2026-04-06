import { useState, useRef, useCallback } from "react";

interface PlacedShape {
  id: number;
  type: string;
  x: number;
  y: number;
  color: string;
}

const SHAPES = [
  { type: "circle", label: "⬤ Circle" },
  { type: "square", label: "⬜ Square" },
  { type: "triangle", label: "△ Triangle" },
  { type: "rectangle", label: "▬ Rectangle" },
  { type: "hexagon", label: "⬡ Hexagon" },
];

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#0891b2"];

export default function ShapesTool() {
  const [shapes, setShapes] = useState<PlacedShape[]>([]);
  const [selectedShape, setSelectedShape] = useState("circle");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const idRef = useRef(0);

  const getPos = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (dragging !== null) return;
    const pos = getPos(e);
    idRef.current += 1;
    setShapes(prev => [...prev, { id: idRef.current, type: selectedShape, x: pos.x, y: pos.y, color: selectedColor }]);
  };

  const handleShapeMouseDown = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    const pos = getPos(e);
    setDragging(id);
    setDragOffset({ x: pos.x - shape.x, y: pos.y - shape.y });
  }, [shapes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging === null) return;
    const pos = getPos(e);
    setShapes(prev => prev.map(s => s.id === dragging ? { ...s, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : s));
  }, [dragging, dragOffset]);

  const handleMouseUp = () => setDragging(null);

  const renderShape = (s: PlacedShape) => {
    const size = 30;
    switch (s.type) {
      case "circle":
        return <circle cx={0} cy={0} r={size} fill={s.color} opacity="0.7" />;
      case "square":
        return <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={s.color} opacity="0.7" />;
      case "triangle":
        return <polygon points={`0,${-size} ${-size},${size} ${size},${size}`} fill={s.color} opacity="0.7" />;
      case "rectangle":
        return <rect x={-size * 1.5} y={-size * 0.75} width={size * 3} height={size * 1.5} fill={s.color} opacity="0.7" />;
      case "hexagon": {
        const pts = Array.from({ length: 6 }).map((_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return `${Math.cos(a) * size},${Math.sin(a) * size}`;
        }).join(" ");
        return <polygon points={pts} fill={s.color} opacity="0.7" />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Shape selector */}
      <div className="flex flex-wrap gap-1">
        {SHAPES.map(s => (
          <button
            key={s.type}
            onClick={() => setSelectedShape(s.type)}
            className={`text-xs px-2 py-1 rounded ${selectedShape === s.type ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Color selector */}
      <div className="flex gap-2 items-center">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button onClick={() => setShapes([])} className="ml-auto text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
          Clear
        </button>
      </div>
      {/* Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="300"
        className="border rounded bg-white cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {shapes.map(s => (
          <g
            key={s.id}
            transform={`translate(${s.x},${s.y})`}
            onMouseDown={(e) => handleShapeMouseDown(e, s.id)}
            className="cursor-grab active:cursor-grabbing"
          >
            {renderShape(s)}
          </g>
        ))}
      </svg>
      <p className="text-xs text-gray-400">Click canvas to place shapes. Drag to reposition.</p>
    </div>
  );
}
