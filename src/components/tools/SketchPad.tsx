import { useCallback, useEffect, useRef, useState } from "react";

const COLORS = ["#1C2D5A", "#D72638", "#16a34a", "#2563eb", "#FFDE59"];
const SIZES = [
  { label: "S", value: 2 },
  { label: "M", value: 5 },
  { label: "L", value: 10 },
];

interface SketchPadProps {
  /** Unique key so a student's drawing survives navigating between questions. */
  storageKey: string;
  /** Height of the drawing surface in px. */
  height?: number;
  /** Static template (SVG / grid / boxes) rendered behind the drawing layer. */
  children?: React.ReactNode;
  label?: string;
}

export default function SketchPad({ storageKey, height = 220, children, label = "Draw here" }: SketchPadProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<string[]>([]);

  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(5);
  const [eraser, setEraser] = useState(false);

  const fullKey = `sketch:${storageKey}`;

  const persist = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      localStorage.setItem(fullKey, canvas.toDataURL("image/png"));
    } catch {
      /* quota — ignore */
    }
  }, [fullKey]);

  // Size the backing store and restore any saved drawing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const setup = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const prev = canvas.width ? canvas.toDataURL("image/png") : null;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const saved = prev ?? localStorage.getItem(fullKey);
      if (saved) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = saved;
      }
    };

    setup();
    const ro = new ResizeObserver(() => setup());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fullKey]);

  const posFrom = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    history.current = [...history.current.slice(-19), canvas.toDataURL("image/png")];
    drawing.current = true;
    last.current = posFrom(e);
    // Dot for a single tap
    const ctx = canvas.getContext("2d");
    if (ctx && last.current) {
      ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, (eraser ? size * 2.5 : size) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = posFrom(e);
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = eraser ? size * 2.5 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    persist();
  };

  const restore = (dataUrl: string | null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        persist();
      };
      img.src = dataUrl;
    } else {
      persist();
    }
  };

  const undo = () => {
    const prev = history.current.pop() ?? null;
    restore(prev);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) history.current = [...history.current.slice(-19), canvas.toDataURL("image/png")];
    restore(null);
  };

  return (
    <div className="my-4 p-3 sm:p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm font-medium text-[#1C2D5A] mr-1">✏️ {label}</span>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Pencil color ${c}`}
            onClick={() => {
              setColor(c);
              setEraser(false);
            }}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              color === c && !eraser ? "border-[#1C2D5A] scale-110" : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-6 bg-gray-300" />
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSize(s.value)}
            className={`w-7 h-7 rounded-md text-xs font-bold ${
              size === s.value ? "bg-[#1C2D5A] text-white" : "bg-white border border-gray-300 text-[#1C2D5A]"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setEraser((v) => !v)}
          className={`text-xs px-2 py-1.5 rounded-md font-medium ${
            eraser ? "bg-[#FFDE59] text-[#1C2D5A]" : "bg-white border border-gray-300 text-[#1C2D5A]"
          }`}
        >
          🧽 Eraser
        </button>
        <button
          type="button"
          onClick={undo}
          className="text-xs px-2 py-1.5 rounded-md bg-white border border-gray-300 text-[#1C2D5A] font-medium"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-xs px-2 py-1.5 rounded-md bg-red-100 text-[#D72638] font-medium hover:bg-red-200"
        >
          Clear
        </button>
      </div>

      <div
        ref={wrapRef}
        className="relative bg-white rounded-lg border-2 border-gray-300 overflow-hidden"
        style={{ height }}
      >
        <div className="absolute inset-0 p-2 pointer-events-none select-none">{children}</div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">Use your finger, stylus, or mouse to draw. Your drawing is saved automatically.</p>
    </div>
  );
}
