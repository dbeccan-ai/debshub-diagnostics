import { useState } from "react";

export default function ProtractorTool() {
  const [rotation, setRotation] = useState(0);
  const r = 140;
  const cx = 160;
  const cy = 160;

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
      <div className="flex justify-center">
        <svg width="320" height="180" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}>
          {/* Semicircle */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="rgba(135,206,250,0.3)"
            stroke="#2563eb"
            strokeWidth="2"
          />
          {/* Base line */}
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#2563eb" strokeWidth="2" />
          {/* Degree marks */}
          {Array.from({ length: 19 }).map((_, i) => {
            const deg = i * 10;
            const rad = (deg * Math.PI) / 180;
            const inner = deg % 30 === 0 ? r - 25 : r - 15;
            const x1 = cx + r * Math.cos(Math.PI - rad);
            const y1 = cy - r * Math.sin(Math.PI - rad);
            const x2 = cx + inner * Math.cos(Math.PI - rad);
            const y2 = cy - inner * Math.sin(Math.PI - rad);
            return (
              <g key={deg}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e40af" strokeWidth={deg % 30 === 0 ? 2 : 1} />
                {deg % 30 === 0 && (
                  <text
                    x={cx + (r - 35) * Math.cos(Math.PI - rad)}
                    y={cy - (r - 35) * Math.sin(Math.PI - rad)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#1e3a8a"
                    fontWeight="bold"
                  >
                    {deg}°
                  </text>
                )}
              </g>
            );
          })}
          {/* Center dot */}
          <circle cx={cx} cy={cy} r="3" fill="#1e40af" />
        </svg>
      </div>
      <p className="text-xs text-gray-400 text-center">Drag this panel over an angle to measure it</p>
    </div>
  );
}
