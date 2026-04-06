import { useState, useRef, useCallback } from "react";

interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export default function CompassTool() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const [currentRadius, setCurrentRadius] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setCenter(pos);
    setDrawing(true);
    setCurrentRadius(0);
  }, []);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !center) return;
    const pos = getPos(e);
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    setCurrentRadius(Math.sqrt(dx * dx + dy * dy));
  }, [drawing, center]);

  const handlePointerUp = useCallback(() => {
    if (drawing && center && currentRadius > 5) {
      setCircles(prev => [...prev, { cx: center.x, cy: center.y, r: currentRadius }]);
    }
    setDrawing(false);
    setCenter(null);
    setCurrentRadius(0);
  }, [drawing, center, currentRadius]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Click & drag to draw a circle</p>
        <button
          onClick={() => setCircles([])}
          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear
        </button>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="300"
        className="border rounded bg-white cursor-crosshair touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#2563eb" strokeWidth="2" />
        ))}
        {drawing && center && currentRadius > 0 && (
          <>
            <circle cx={center.x} cy={center.y} r={currentRadius} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx={center.x} cy={center.y} r="3" fill="#2563eb" />
          </>
        )}
      </svg>
    </div>
  );
}
