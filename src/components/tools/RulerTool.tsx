import { useState, useRef } from "react";

export default function RulerTool() {
  const [rotation, setRotation] = useState(0);
  const rulerRef = useRef<SVGSVGElement>(null);
  const inchPx = 96; // 1 inch = 96px at 96dpi
  const totalInches = 6;
  const w = inchPx * totalInches;
  const h = 60;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Rotate:</label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-10">{rotation}°</span>
      </div>
      <div className="overflow-auto bg-white rounded border p-2" style={{ maxWidth: "100%" }}>
        <svg
          ref={rulerRef}
          width={w + 20}
          height={h + 20}
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}
        >
          <g transform="translate(10,10)">
            {/* Ruler body */}
            <rect x="0" y="0" width={w} height={h} rx="2" fill="#f5deb3" stroke="#8b7355" strokeWidth="1.5" />
            {/* Inch marks */}
            {Array.from({ length: totalInches + 1 }).map((_, i) => (
              <g key={`inch-${i}`}>
                <line x1={i * inchPx} y1="0" x2={i * inchPx} y2="30" stroke="#333" strokeWidth="2" />
                <text x={i * inchPx} y={48} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">
                  {i}
                </text>
              </g>
            ))}
            {/* Half-inch marks */}
            {Array.from({ length: totalInches }).map((_, i) => (
              <line key={`half-${i}`} x1={i * inchPx + inchPx / 2} y1="0" x2={i * inchPx + inchPx / 2} y2="22" stroke="#555" strokeWidth="1.5" />
            ))}
            {/* Quarter-inch marks */}
            {Array.from({ length: totalInches * 4 }).map((_, i) => {
              if (i % 2 === 0) return null;
              return (
                <line key={`q-${i}`} x1={i * (inchPx / 4)} y1="0" x2={i * (inchPx / 4)} y2="15" stroke="#777" strokeWidth="1" />
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center">Drag this panel to position the ruler over your question</p>
    </div>
  );
}
