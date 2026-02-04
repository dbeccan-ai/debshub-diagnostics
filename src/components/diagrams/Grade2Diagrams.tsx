// Kid-friendly SVG diagrams for Grade 2 Math Diagnostic
// All diagrams are vector-based for crisp display on mobile + print

import React from "react";

// Q1: Place Value - Tens and Ones (3 tens + 5 ones = 35)
export const TensOnesDiagram = () => (
  <div className="my-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 items-end">
        {/* Tens column */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-[#1C2D5A] mb-2">Tens</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((rod) => (
              <svg key={rod} width="20" height="100" viewBox="0 0 20 100" className="drop-shadow-sm">
                {[...Array(10)].map((_, i) => (
                  <rect
                    key={i}
                    x="2"
                    y={2 + i * 10}
                    width="16"
                    height="9"
                    fill="#FFDE59"
                    stroke="#1C2D5A"
                    strokeWidth="1.5"
                    rx="1"
                  />
                ))}
              </svg>
            ))}
          </div>
          <span className="text-lg font-bold text-[#1C2D5A] mt-1">3</span>
        </div>
        
        {/* Ones column */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-[#1C2D5A] mb-2">Ones</span>
          <div className="flex gap-1 flex-wrap max-w-[60px] justify-center h-[100px] items-end">
            {[0, 1, 2, 3, 4].map((unit) => (
              <svg key={unit} width="16" height="16" viewBox="0 0 16 16">
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="14"
                  fill="#87CEEB"
                  stroke="#1C2D5A"
                  strokeWidth="1.5"
                  rx="2"
                />
              </svg>
            ))}
          </div>
          <span className="text-lg font-bold text-[#1C2D5A] mt-1">5</span>
        </div>
      </div>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-3 font-medium">
      📐 3 tens (30) + 5 ones (5) = ?
    </p>
  </div>
);

// Q9: Analog Clock showing 2:30
export const ClockDiagram = () => (
  <div className="my-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
    <div className="flex justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Clock face */}
        <circle cx="80" cy="80" r="75" fill="white" stroke="#1C2D5A" strokeWidth="4" />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = 80 + 60 * Math.cos(angle);
          const y1 = 80 + 60 * Math.sin(angle);
          const x2 = 80 + 70 * Math.cos(angle);
          const y2 = 80 + 70 * Math.sin(angle);
          const textX = 80 + 50 * Math.cos(angle);
          const textY = 80 + 50 * Math.sin(angle);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1C2D5A" strokeWidth="3" />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1C2D5A"
              >
                {i === 0 ? 12 : i}
              </text>
            </g>
          );
        })}
        
        {/* Hour hand (pointing between 2 and 3 for 2:30) */}
        <line
          x1="80"
          y1="80"
          x2="100"
          y2="50"
          stroke="#D72638"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Minute hand (pointing at 6 for :30) */}
        <line
          x1="80"
          y1="80"
          x2="80"
          y2="140"
          stroke="#1C2D5A"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle cx="80" cy="80" r="6" fill="#D72638" />
        
        {/* Labels */}
        <text x="25" y="145" fontSize="10" fill="#D72638" fontWeight="bold">Hour</text>
        <text x="110" y="145" fontSize="10" fill="#1C2D5A" fontWeight="bold">Minute</text>
      </svg>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-2 font-medium">
      ⏰ The minute hand on 6 means :30 (half past)
    </p>
  </div>
);

// Q10: Money - Coins (Quarter, Dime, Nickel)
export const CoinsDiagram = () => (
  <div className="my-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
    <div className="flex justify-center gap-4 flex-wrap">
      {/* Quarter */}
      <div className="flex flex-col items-center">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="28" fill="#C0C0C0" stroke="#808080" strokeWidth="2" />
          <circle cx="30" cy="30" r="24" fill="#D4AF37" stroke="#B8860B" strokeWidth="1" />
          <text x="30" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C2D5A">25¢</text>
          <text x="30" y="40" textAnchor="middle" fontSize="7" fill="#1C2D5A">Quarter</text>
        </svg>
        <span className="text-xs font-bold text-[#1C2D5A] mt-1">25¢</span>
      </div>
      
      {/* Dime */}
      <div className="flex flex-col items-center">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="#C0C0C0" stroke="#808080" strokeWidth="2" />
          <text x="25" y="23" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C2D5A">10¢</text>
          <text x="25" y="34" textAnchor="middle" fontSize="6" fill="#1C2D5A">Dime</text>
        </svg>
        <span className="text-xs font-bold text-[#1C2D5A] mt-1">10¢</span>
      </div>
      
      {/* Nickel */}
      <div className="flex flex-col items-center">
        <svg width="55" height="55" viewBox="0 0 55 55">
          <circle cx="27.5" cy="27.5" r="24" fill="#C0C0C0" stroke="#708090" strokeWidth="2" />
          <text x="27.5" y="25" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C2D5A">5¢</text>
          <text x="27.5" y="36" textAnchor="middle" fontSize="6" fill="#1C2D5A">Nickel</text>
        </svg>
        <span className="text-xs font-bold text-[#1C2D5A] mt-1">5¢</span>
      </div>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-3 font-medium">
      💰 Add up the coins: 25¢ + 10¢ + 5¢ = ?
    </p>
  </div>
);

// Q13: Fraction - Circle with 2/4 shaded
export const FractionCircleDiagram = () => (
  <div className="my-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
    <div className="flex justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Circle divided into 4 parts */}
        <circle cx="70" cy="70" r="60" fill="white" stroke="#1C2D5A" strokeWidth="3" />
        
        {/* Dividing lines */}
        <line x1="70" y1="10" x2="70" y2="130" stroke="#1C2D5A" strokeWidth="2" />
        <line x1="10" y1="70" x2="130" y2="70" stroke="#1C2D5A" strokeWidth="2" />
        
        {/* Shaded quarters (top-left and bottom-left = 2 parts) */}
        <path d="M70,70 L70,10 A60,60 0 0,0 10,70 Z" fill="#9B59B6" opacity="0.7" />
        <path d="M70,70 L10,70 A60,60 0 0,0 70,130 Z" fill="#9B59B6" opacity="0.7" />
        
        {/* Labels */}
        <text x="40" y="45" fontSize="16" fontWeight="bold" fill="white">1</text>
        <text x="40" y="105" fontSize="16" fontWeight="bold" fill="white">2</text>
        <text x="95" y="45" fontSize="16" fontWeight="bold" fill="#1C2D5A">3</text>
        <text x="95" y="105" fontSize="16" fontWeight="bold" fill="#1C2D5A">4</text>
      </svg>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-2 font-medium">
      🟣 2 of 4 parts are shaded. What fraction is this?
    </p>
  </div>
);

// Q14: Ruler with pencil at 6 inches
export const RulerDiagram = () => (
  <div className="my-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
    <div className="flex justify-center overflow-x-auto">
      <svg width="320" height="100" viewBox="0 0 320 100">
        {/* Ruler body */}
        <rect x="10" y="40" width="300" height="30" fill="#FFDE59" stroke="#1C2D5A" strokeWidth="2" rx="2" />
        
        {/* Inch marks and numbers */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((inch) => (
          <g key={inch}>
            <line
              x1={20 + inch * 40}
              y1={40}
              x2={20 + inch * 40}
              y2={55}
              stroke="#1C2D5A"
              strokeWidth="2"
            />
            <text
              x={20 + inch * 40}
              y={85}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="#1C2D5A"
            >
              {inch}
            </text>
            {/* Half-inch marks */}
            {inch < 7 && (
              <line
                x1={40 + inch * 40}
                y1={40}
                x2={40 + inch * 40}
                y2={50}
                stroke="#1C2D5A"
                strokeWidth="1"
              />
            )}
          </g>
        ))}
        
        {/* Pencil */}
        <rect x="20" y="15" width="240" height="12" fill="#87CEEB" stroke="#1C2D5A" strokeWidth="1" rx="1" />
        <polygon points="260,21 275,21 267.5,10" fill="#F4A460" stroke="#1C2D5A" strokeWidth="1" />
        <polygon points="275,21 283,21 275,15" fill="#2F2F2F" />
        
        {/* Arrow pointing to 6 */}
        <path d="M260,35 L260,40" stroke="#D72638" strokeWidth="2" />
        <polygon points="255,35 265,35 260,25" fill="#D72638" />
        
        {/* Start label */}
        <text x="20" y="12" fontSize="10" fill="#1C2D5A" fontWeight="bold">Start at 0</text>
      </svg>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-2 font-medium">
      📏 How many inches long is the pencil?
    </p>
  </div>
);

// Q16: Bar Graph - Colors
export const BarGraphDiagram = () => (
  <div className="my-4 p-4 bg-rose-50 rounded-xl border-2 border-rose-200">
    <div className="flex justify-center">
      <svg width="200" height="160" viewBox="0 0 200 160">
        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2="130" stroke="#1C2D5A" strokeWidth="2" />
        {/* X-axis */}
        <line x1="40" y1="130" x2="180" y2="130" stroke="#1C2D5A" strokeWidth="2" />
        
        {/* Y-axis labels */}
        {[0, 2, 4, 6, 8].map((n, i) => (
          <g key={n}>
            <text x="30" y={130 - i * 13.75 + 4} fontSize="10" textAnchor="end" fill="#1C2D5A">{n}</text>
            <line x1="37" y1={130 - i * 13.75} x2="40" y2={130 - i * 13.75} stroke="#1C2D5A" strokeWidth="1" />
          </g>
        ))}
        
        {/* Bars */}
        {/* Red bar - 7 */}
        <rect x="55" y={130 - 7 * 13.75} width="30" height={7 * 13.75} fill="#D72638" stroke="#1C2D5A" strokeWidth="1" />
        <text x="70" y={130 - 7 * 13.75 - 5} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">7</text>
        <text x="70" y="145" fontSize="10" textAnchor="middle" fill="#D72638" fontWeight="bold">Red</text>
        
        {/* Blue bar - 5 */}
        <rect x="95" y={130 - 5 * 13.75} width="30" height={5 * 13.75} fill="#4169E1" stroke="#1C2D5A" strokeWidth="1" />
        <text x="110" y={130 - 5 * 13.75 - 5} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">5</text>
        <text x="110" y="145" fontSize="10" textAnchor="middle" fill="#4169E1" fontWeight="bold">Blue</text>
        
        {/* Green bar - 3 */}
        <rect x="135" y={130 - 3 * 13.75} width="30" height={3 * 13.75} fill="#32CD32" stroke="#1C2D5A" strokeWidth="1" />
        <text x="150" y={130 - 3 * 13.75 - 5} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">3</text>
        <text x="150" y="145" fontSize="10" textAnchor="middle" fill="#32CD32" fontWeight="bold">Green</text>
        
        {/* Title */}
        <text x="110" y="12" fontSize="11" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">Favorite Colors</text>
      </svg>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-2 font-medium">
      📊 How many more students chose Red than Green?
    </p>
  </div>
);

// Q20: Cube with faces highlighted
export const CubeDiagram = () => (
  <div className="my-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
    <div className="flex justify-center">
      <svg width="160" height="140" viewBox="0 0 160 140">
        {/* Back faces */}
        <polygon points="50,30 110,30 110,90 50,90" fill="#87CEEB" stroke="#1C2D5A" strokeWidth="2" opacity="0.5" />
        <polygon points="50,30 80,10 140,10 110,30" fill="#B0E0E6" stroke="#1C2D5A" strokeWidth="2" opacity="0.5" />
        <polygon points="110,30 140,10 140,70 110,90" fill="#ADD8E6" stroke="#1C2D5A" strokeWidth="2" opacity="0.5" />
        
        {/* Front face - highlighted */}
        <polygon points="50,30 110,30 110,90 50,90" fill="#FFDE59" stroke="#1C2D5A" strokeWidth="3" />
        <text x="80" y="65" fontSize="12" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">FACE</text>
        
        {/* Top face */}
        <polygon points="50,30 80,10 140,10 110,30" fill="#FFF3B0" stroke="#1C2D5A" strokeWidth="2" />
        
        {/* Right face */}
        <polygon points="110,30 140,10 140,70 110,90" fill="#FFE566" stroke="#1C2D5A" strokeWidth="2" />
        
        {/* Labels */}
        <text x="80" y="125" fontSize="11" textAnchor="middle" fill="#1C2D5A" fontWeight="bold">
          Faces are the flat sides
        </text>
      </svg>
    </div>
    <p className="text-center text-sm text-[#1C2D5A] mt-2 font-medium">
      🧊 A cube has 6 faces (flat sides)
    </p>
  </div>
);

// Section 2: Picture Helpers

// Q21: Apples helper (15 + 8)
export const ApplesHelper = () => (
  <div className="my-3 p-3 bg-red-50 rounded-lg border border-red-200">
    <p className="text-xs text-[#1C2D5A] mb-2 font-medium">🖼️ Picture Helper:</p>
    <div className="flex flex-wrap gap-1 items-center justify-center">
      {/* First group: 15 apples (10 + 5) */}
      <div className="flex flex-wrap gap-0.5 p-1 bg-white rounded border border-red-300">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-lg">🍎</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-0.5 p-1 bg-white rounded border border-red-300 max-w-[80px]">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-lg">🍎</span>
        ))}
      </div>
      <span className="text-xl font-bold text-[#1C2D5A]">+</span>
      {/* Second group: 8 apples */}
      <div className="flex flex-wrap gap-0.5 p-1 bg-white rounded border border-green-300 max-w-[100px]">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="text-lg">🍏</span>
        ))}
      </div>
    </div>
    <p className="text-xs text-center text-[#1C2D5A] mt-2">15 red apples + 8 green apples</p>
  </div>
);

// Q22: Birds subtraction number line
export const BirdsHelper = () => (
  <div className="my-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-xs text-[#1C2D5A] mb-2 font-medium">🖼️ Picture Helper:</p>
    <div className="flex justify-center">
      <svg width="280" height="60" viewBox="0 0 280 60">
        {/* Number line */}
        <line x1="20" y1="40" x2="260" y2="40" stroke="#1C2D5A" strokeWidth="2" />
        
        {/* Start point: 32 */}
        <circle cx="220" cy="40" r="4" fill="#1C2D5A" />
        <text x="220" y="55" fontSize="10" textAnchor="middle" fontWeight="bold" fill="#1C2D5A">32</text>
        <text x="220" y="15" fontSize="14">🐦</text>
        
        {/* Arrow going left (subtract) */}
        <path d="M220,35 L80,35" stroke="#D72638" strokeWidth="2" strokeDasharray="4,2" />
        <polygon points="80,35 90,30 90,40" fill="#D72638" />
        <text x="150" y="25" fontSize="10" fill="#D72638" fontWeight="bold">−14</text>
        
        {/* End point: ? */}
        <circle cx="80" cy="40" r="4" fill="#D72638" />
        <text x="80" y="55" fontSize="10" textAnchor="middle" fontWeight="bold" fill="#D72638">?</text>
      </svg>
    </div>
    <p className="text-xs text-center text-[#1C2D5A] mt-1">Start at 32, subtract 14</p>
  </div>
);

// Q23: Tricycles helper (3 × 6 array)
export const TricyclesHelper = () => (
  <div className="my-3 p-3 bg-green-50 rounded-lg border border-green-200">
    <p className="text-xs text-[#1C2D5A] mb-2 font-medium">🖼️ Picture Helper:</p>
    <div className="flex flex-col gap-2 items-center">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2">
          <span className="text-2xl">🛴</span>
          <div className="flex gap-1 bg-white rounded px-2 py-1 border border-green-300">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="text-sm">⚫</span>
            ))}
          </div>
          <span className="text-xs text-[#1C2D5A]">= 6 wheels</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-center text-[#1C2D5A] mt-2">3 tricycles × 6 wheels each = ?</p>
  </div>
);

// Q24: Coins for counting (50¢ + 10¢ + 5¢)
export const MoneyHelper = () => (
  <div className="my-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
    <p className="text-xs text-[#1C2D5A] mb-2 font-medium">🖼️ Picture Helper:</p>
    <div className="flex justify-center gap-3 items-center">
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="#D4AF37" stroke="#B8860B" strokeWidth="2" />
        <text x="25" y="25" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#1C2D5A">50¢</text>
      </svg>
      <span className="text-xl font-bold">+</span>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="17" fill="#C0C0C0" stroke="#808080" strokeWidth="2" />
        <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold" fill="#1C2D5A">10¢</text>
      </svg>
      <span className="text-xl font-bold">+</span>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="18" fill="#C0C0C0" stroke="#708090" strokeWidth="2" />
        <text x="21" y="21" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold" fill="#1C2D5A">5¢</text>
      </svg>
      <span className="text-xl font-bold">=</span>
      <span className="text-lg font-bold text-[#D72638]">?</span>
    </div>
  </div>
);

// Q25: Pencils grouped into 5s
export const PencilsHelper = () => (
  <div className="my-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
    <p className="text-xs text-[#1C2D5A] mb-2 font-medium">🖼️ Picture Helper:</p>
    <div className="flex justify-center gap-3 flex-wrap">
      {[0, 1, 2, 3].map((group) => (
        <div key={group} className="flex gap-0.5 bg-white rounded px-2 py-1 border border-orange-300">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-lg">✏️</span>
          ))}
        </div>
      ))}
    </div>
    <p className="text-xs text-center text-[#1C2D5A] mt-2">20 pencils in groups of 5 = how many groups?</p>
  </div>
);

// Section 3: Drawing Areas

// Q26: Equal groups organizer (24 split into 2)
export const EqualGroupsDrawArea = () => (
  <div className="my-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✏️</span>
      <span className="text-lg">📌</span>
      <span className="text-lg">📏</span>
      <span className="text-sm font-medium text-[#1C2D5A]">Draw here</span>
    </div>
    <div className="grid grid-cols-2 gap-4 min-h-[180px]">
      <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
        <p className="text-center text-sm font-bold text-[#1C2D5A] border-b border-gray-200 pb-2 mb-2">
          Group 1
        </p>
        <div className="min-h-[120px]"></div>
      </div>
      <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
        <p className="text-center text-sm font-bold text-[#1C2D5A] border-b border-gray-200 pb-2 mb-2">
          Group 2
        </p>
        <div className="min-h-[120px]"></div>
      </div>
    </div>
  </div>
);

// Q27: Fraction circle template (4 parts, unshaded)
export const FractionDrawArea = () => (
  <div className="my-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✏️</span>
      <span className="text-lg">📌</span>
      <span className="text-lg">📏</span>
      <span className="text-sm font-medium text-[#1C2D5A]">Shade 3 of 4 parts</span>
    </div>
    <div className="flex justify-center min-h-[180px] items-center bg-white rounded-lg border-2 border-gray-300 p-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="white" stroke="#1C2D5A" strokeWidth="3" />
        <line x1="80" y1="10" x2="80" y2="150" stroke="#1C2D5A" strokeWidth="2" strokeDasharray="5,3" />
        <line x1="10" y1="80" x2="150" y2="80" stroke="#1C2D5A" strokeWidth="2" strokeDasharray="5,3" />
        <text x="55" y="55" fontSize="14" fill="#999">1</text>
        <text x="100" y="55" fontSize="14" fill="#999">2</text>
        <text x="55" y="110" fontSize="14" fill="#999">3</text>
        <text x="100" y="110" fontSize="14" fill="#999">4</text>
      </svg>
    </div>
  </div>
);

// Q28: Ruler template (0-6)
export const RulerDrawArea = () => (
  <div className="my-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✏️</span>
      <span className="text-lg">📌</span>
      <span className="text-lg">📏</span>
      <span className="text-sm font-medium text-[#1C2D5A]">Draw something 5 inches long</span>
    </div>
    <div className="min-h-[180px] bg-white rounded-lg border-2 border-gray-300 p-4">
      <svg width="100%" height="50" viewBox="0 0 300 50" preserveAspectRatio="xMidYMid meet">
        <rect x="10" y="20" width="280" height="25" fill="#FFF9E6" stroke="#CCC" strokeWidth="1" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6].map((inch) => (
          <g key={inch}>
            <line x1={20 + inch * 40} y1={20} x2={20 + inch * 40} y2={32} stroke="#999" strokeWidth="1" />
            <text x={20 + inch * 40} y={55} textAnchor="middle" fontSize="10" fill="#666">{inch}</text>
          </g>
        ))}
      </svg>
      <div className="h-[100px] border-t border-dashed border-gray-300 mt-4"></div>
    </div>
  </div>
);

// Q29: Blank bar graph grid
export const BarGraphDrawArea = () => (
  <div className="my-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✏️</span>
      <span className="text-lg">📌</span>
      <span className="text-lg">📊</span>
      <span className="text-sm font-medium text-[#1C2D5A]">Create a bar graph</span>
    </div>
    <div className="min-h-[180px] bg-white rounded-lg border-2 border-gray-300 p-4">
      <svg width="100%" height="160" viewBox="0 0 250 160" preserveAspectRatio="xMidYMid meet">
        {/* Y-axis */}
        <line x1="50" y1="10" x2="50" y2="130" stroke="#CCC" strokeWidth="1" />
        <text x="25" y="15" fontSize="10" fill="#999">Votes</text>
        
        {/* X-axis */}
        <line x1="50" y1="130" x2="230" y2="130" stroke="#CCC" strokeWidth="1" />
        <text x="140" y="150" fontSize="10" textAnchor="middle" fill="#999">Pets</text>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <line x1="50" y1={130 - i * 20} x2="230" y2={130 - i * 20} stroke="#EEE" strokeWidth="1" />
            <text x="40" y={133 - i * 20} fontSize="8" textAnchor="end" fill="#999">{i * 2}</text>
          </g>
        ))}
        
        {/* Bar placeholders */}
        <rect x="70" y="30" width="40" height="100" fill="none" stroke="#DDD" strokeWidth="1" strokeDasharray="3,3" />
        <rect x="130" y="30" width="40" height="100" fill="none" stroke="#DDD" strokeWidth="1" strokeDasharray="3,3" />
        <rect x="190" y="30" width="40" height="100" fill="none" stroke="#DDD" strokeWidth="1" strokeDasharray="3,3" />
        
        {/* Labels */}
        <text x="90" y="145" fontSize="8" textAnchor="middle" fill="#999">Dog</text>
        <text x="150" y="145" fontSize="8" textAnchor="middle" fill="#999">Cat</text>
        <text x="210" y="145" fontSize="8" textAnchor="middle" fill="#999">Fish</text>
      </svg>
    </div>
  </div>
);

// Q30: Base-ten blocks template
export const BaseTenDrawArea = () => (
  <div className="my-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">✏️</span>
      <span className="text-lg">📌</span>
      <span className="text-lg">📏</span>
      <span className="text-sm font-medium text-[#1C2D5A]">Draw base-ten blocks</span>
    </div>
    <div className="grid grid-cols-3 gap-3 min-h-[180px]">
      <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
        <p className="text-center text-sm font-bold text-[#1C2D5A] border-b border-gray-200 pb-2 mb-2">
          Hundreds
        </p>
        <div className="flex justify-center mb-2 opacity-30">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <rect x="2" y="2" width="36" height="36" fill="#FFD" stroke="#999" strokeWidth="1" />
            {[...Array(9)].map((_, i) => (
              <line key={i} x1={6 + i * 4} y1="2" x2={6 + i * 4} y2="38" stroke="#DDD" strokeWidth="0.5" />
            ))}
            {[...Array(9)].map((_, i) => (
              <line key={i} x1="2" y1={6 + i * 4} x2="38" y2={6 + i * 4} stroke="#DDD" strokeWidth="0.5" />
            ))}
          </svg>
        </div>
        <div className="min-h-[80px]"></div>
      </div>
      <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
        <p className="text-center text-sm font-bold text-[#1C2D5A] border-b border-gray-200 pb-2 mb-2">
          Tens
        </p>
        <div className="flex justify-center mb-2 opacity-30">
          <svg width="12" height="50" viewBox="0 0 12 50">
            {[...Array(10)].map((_, i) => (
              <rect key={i} x="1" y={1 + i * 5} width="10" height="4" fill="#FFD" stroke="#999" strokeWidth="0.5" />
            ))}
          </svg>
        </div>
        <div className="min-h-[80px]"></div>
      </div>
      <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
        <p className="text-center text-sm font-bold text-[#1C2D5A] border-b border-gray-200 pb-2 mb-2">
          Ones
        </p>
        <div className="flex justify-center mb-2 opacity-30">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="1" y="1" width="12" height="12" fill="#FFD" stroke="#999" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="min-h-[80px]"></div>
      </div>
    </div>
  </div>
);

// Diagram renderer mapping by question ID
export const getDiagramForQuestion = (questionId: string): React.ReactNode | null => {
  const diagrams: Record<string, React.ReactNode> = {
    q1: <TensOnesDiagram />,
    q9: <ClockDiagram />,
    q10: <CoinsDiagram />,
    q13: <FractionCircleDiagram />,
    q14: <RulerDiagram />,
    q16: <BarGraphDiagram />,
    q20: <CubeDiagram />,
  };
  return diagrams[questionId] || null;
};

export const getPictureHelperForQuestion = (questionId: string): React.ReactNode | null => {
  const helpers: Record<string, React.ReactNode> = {
    q21: <ApplesHelper />,
    q22: <BirdsHelper />,
    q23: <TricyclesHelper />,
    q24: <MoneyHelper />,
    q25: <PencilsHelper />,
  };
  return helpers[questionId] || null;
};

export const getDrawAreaForQuestion = (questionId: string): React.ReactNode | null => {
  const drawAreas: Record<string, React.ReactNode> = {
    q26: <EqualGroupsDrawArea />,
    q27: <FractionDrawArea />,
    q28: <RulerDrawArea />,
    q29: <BarGraphDrawArea />,
    q30: <BaseTenDrawArea />,
  };
  return drawAreas[questionId] || null;
};

// Map visual string values from database to diagram components
export const getGrade2DiagramByVisual = (visual: string): React.ReactNode | null => {
  const diagrams: Record<string, React.ReactNode> = {
    // Section I MCQ visuals
    tens_ones: <TensOnesDiagram />,
    clock_2_30: <ClockDiagram />,
    coins: <CoinsDiagram />,
    fraction_circle: <FractionCircleDiagram />,
    ruler: <RulerDiagram />,
    bar_graph: <BarGraphDiagram />,
    cube: <CubeDiagram />,
  };
  return diagrams[visual] || null;
};
