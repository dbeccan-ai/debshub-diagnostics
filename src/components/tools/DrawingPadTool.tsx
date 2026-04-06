import { useState, useRef, useCallback, useEffect } from "react";

const COLORS = ["#000000", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#9333ea", "#ec4899", "#f97316"];
const SIZES = [2, 4, 6, 10];

export default function DrawingPadTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, color, lineWidth, isEraser]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setIsEraser(false); }}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              color === c && !isEraser ? "border-gray-800 scale-125" : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`text-xs px-2 py-1 rounded ${isEraser ? "bg-yellow-200 text-yellow-800" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          🧹 Eraser
        </button>
        {/* Size */}
        <select
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="text-xs border rounded px-1 py-0.5"
        >
          {SIZES.map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
        <button onClick={handleClear} className="ml-auto text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
          Clear
        </button>
      </div>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="border rounded cursor-crosshair w-full touch-none"
        style={{ maxHeight: "400px" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}
