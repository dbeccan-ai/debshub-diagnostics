import React from "react";

// Q1: Enormous - elephant comparison
const EnormousVisual = () => (
  <div className="flex justify-center items-end gap-8 p-4 bg-gradient-to-b from-sky-100 to-green-100 rounded-xl mb-4">
    <div className="text-center">
      <svg viewBox="0 0 120 100" className="w-24 h-20">
        {/* Small mouse */}
        <ellipse cx="60" cy="70" rx="15" ry="10" fill="#9CA3AF" />
        <circle cx="50" cy="65" r="6" fill="#9CA3AF" />
        <circle cx="45" cy="60" r="4" fill="#F9A8D4" />
        <circle cx="55" cy="60" r="4" fill="#F9A8D4" />
        <circle cx="48" cy="64" r="1.5" fill="#1F2937" />
        <line x1="35" y1="65" x2="45" y2="65" stroke="#9CA3AF" strokeWidth="1" />
        <line x1="35" y1="67" x2="45" y2="66" stroke="#9CA3AF" strokeWidth="1" />
        <path d="M75 70 Q85 65 90 70" stroke="#F9A8D4" strokeWidth="2" fill="none" />
      </svg>
      <p className="text-xs font-medium text-gray-600">Small</p>
    </div>
    <div className="text-center">
      <svg viewBox="0 0 160 120" className="w-40 h-32">
        {/* Large elephant */}
        <ellipse cx="80" cy="70" rx="50" ry="35" fill="#6B7280" />
        <ellipse cx="40" cy="55" rx="20" ry="30" fill="#6B7280" />
        <circle cx="35" cy="45" r="4" fill="#1F2937" />
        <ellipse cx="25" cy="55" rx="12" ry="18" fill="#9CA3AF" />
        <path d="M30 70 Q20 100 35 110" stroke="#6B7280" strokeWidth="8" fill="none" />
        <rect x="50" y="95" width="12" height="25" rx="4" fill="#4B5563" />
        <rect x="70" y="95" width="12" height="25" rx="4" fill="#4B5563" />
        <rect x="90" y="95" width="12" height="25" rx="4" fill="#4B5563" />
        <rect x="110" y="95" width="12" height="25" rx="4" fill="#4B5563" />
        <path d="M125 65 Q140 60 135 75" stroke="#6B7280" strokeWidth="4" fill="none" />
      </svg>
      <p className="text-sm font-bold text-purple-600">ENORMOUS! 🐘</p>
    </div>
  </div>
);

// Q8: Simile with lion
const LionSimileVisual = () => (
  <div className="flex justify-center items-center gap-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl mb-4">
    <div className="text-center">
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        {/* Boy figure */}
        <circle cx="50" cy="25" r="15" fill="#FBBF24" />
        <circle cx="45" cy="22" r="2" fill="#1F2937" />
        <circle cx="55" cy="22" r="2" fill="#1F2937" />
        <path d="M45 30 Q50 35 55 30" stroke="#1F2937" strokeWidth="2" fill="none" />
        <rect x="42" y="40" width="16" height="25" rx="3" fill="#3B82F6" />
        <rect x="38" y="65" width="8" height="20" rx="2" fill="#1F2937" />
        <rect x="54" y="65" width="8" height="20" rx="2" fill="#1F2937" />
        {/* Cape */}
        <path d="M42 45 Q30 60 35 80" stroke="#EF4444" strokeWidth="4" fill="none" />
        <path d="M58 45 Q70 60 65 80" stroke="#EF4444" strokeWidth="4" fill="none" />
      </svg>
      <p className="text-xs font-medium text-gray-600">He is as brave...</p>
    </div>
    <span className="text-2xl">🟰</span>
    <div className="text-center">
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        {/* Lion */}
        <circle cx="50" cy="50" r="30" fill="#F59E0B" />
        <circle cx="50" cy="50" r="22" fill="#FBBF24" />
        <circle cx="42" cy="45" r="3" fill="#1F2937" />
        <circle cx="58" cy="45" r="3" fill="#1F2937" />
        <ellipse cx="50" cy="55" rx="5" ry="3" fill="#1F2937" />
        <line x1="35" y1="52" x2="25" y2="50" stroke="#1F2937" strokeWidth="1.5" />
        <line x1="35" y1="55" x2="25" y2="57" stroke="#1F2937" strokeWidth="1.5" />
        <line x1="65" y1="52" x2="75" y2="50" stroke="#1F2937" strokeWidth="1.5" />
        <line x1="65" y1="55" x2="75" y2="57" stroke="#1F2937" strokeWidth="1.5" />
        <path d="M42 62 Q50 68 58 62" stroke="#1F2937" strokeWidth="2" fill="none" />
      </svg>
      <p className="text-xs font-medium text-gray-600">...as a LION! 🦁</p>
    </div>
  </div>
);

// Q11: Child vs Children
const ChildrenVisual = () => (
  <div className="flex justify-center items-center gap-8 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl mb-4">
    <div className="text-center">
      <svg viewBox="0 0 60 80" className="w-12 h-16">
        <circle cx="30" cy="20" r="12" fill="#FBBF24" />
        <circle cx="26" cy="18" r="2" fill="#1F2937" />
        <circle cx="34" cy="18" r="2" fill="#1F2937" />
        <path d="M26 25 Q30 28 34 25" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        <rect x="22" y="32" width="16" height="22" rx="3" fill="#EC4899" />
        <rect x="20" y="54" width="6" height="16" rx="2" fill="#3B82F6" />
        <rect x="34" y="54" width="6" height="16" rx="2" fill="#3B82F6" />
      </svg>
      <p className="text-sm font-medium text-gray-700">1 child</p>
    </div>
    <span className="text-3xl">→</span>
    <div className="text-center flex gap-1">
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 60 80" className="w-10 h-14">
          <circle cx="30" cy="20" r="10" fill={i === 1 ? "#FBBF24" : i === 2 ? "#92400E" : "#FCD34D"} />
          <circle cx="27" cy="18" r="1.5" fill="#1F2937" />
          <circle cx="33" cy="18" r="1.5" fill="#1F2937" />
          <path d="M27 24 Q30 26 33 24" stroke="#1F2937" strokeWidth="1" fill="none" />
          <rect x="23" y="30" width="14" height="18" rx="2" fill={i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#F59E0B"} />
          <rect x="21" y="48" width="5" height="12" rx="1" fill="#1F2937" />
          <rect x="34" y="48" width="5" height="12" rx="1" fill="#1F2937" />
        </svg>
      ))}
      <p className="text-sm font-bold text-purple-600 self-end mb-2">children</p>
    </div>
  </div>
);

// Q21-25: Monarch Butterfly Migration Visual
const MonarchButterflyVisual = () => (
  <div className="p-4 bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 rounded-xl mb-4">
    <div className="relative h-48">
      {/* Map outline */}
      <svg viewBox="0 0 300 180" className="w-full h-full">
        {/* North America simplified */}
        <path 
          d="M50 30 Q80 20 120 25 Q150 30 180 40 Q200 50 220 80 Q230 100 225 130 Q220 150 200 160 Q180 165 150 160 Q120 155 100 140 Q80 125 60 100 Q50 80 45 60 Q45 45 50 30"
          fill="#90EE90"
          stroke="#2D5016"
          strokeWidth="2"
        />
        {/* Canada label */}
        <text x="100" y="50" className="text-xs font-bold fill-green-800">Canada 🍁</text>
        {/* USA */}
        <text x="130" y="90" className="text-xs font-bold fill-blue-800">USA 🇺🇸</text>
        {/* Mexico */}
        <ellipse cx="140" cy="145" rx="30" ry="15" fill="#FFD700" />
        <text x="115" y="150" className="text-xs font-bold fill-amber-800">Mexico 🌮</text>
        
        {/* Migration path arrow */}
        <path 
          d="M100 55 Q90 80 100 100 Q110 120 130 140"
          stroke="#FF6B35"
          strokeWidth="3"
          strokeDasharray="5,5"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#FF6B35" />
          </marker>
        </defs>
        
        {/* Butterflies along path */}
        <g transform="translate(95, 65)">
          <path d="M0 5 Q-8 0 -5 -5 Q0 -8 5 -5 Q8 0 5 5 Q0 8 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <path d="M0 5 Q8 0 5 -5 Q0 -8 -5 -5 Q-8 0 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <ellipse cx="0" cy="0" rx="1" ry="4" fill="#1F2937" />
        </g>
        <g transform="translate(105, 95)">
          <path d="M0 5 Q-8 0 -5 -5 Q0 -8 5 -5 Q8 0 5 5 Q0 8 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <path d="M0 5 Q8 0 5 -5 Q0 -8 -5 -5 Q-8 0 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <ellipse cx="0" cy="0" rx="1" ry="4" fill="#1F2937" />
        </g>
        <g transform="translate(120, 125)">
          <path d="M0 5 Q-8 0 -5 -5 Q0 -8 5 -5 Q8 0 5 5 Q0 8 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <path d="M0 5 Q8 0 5 -5 Q0 -8 -5 -5 Q-8 0 -5 5" fill="#FF8C00" stroke="#000" strokeWidth="0.5" />
          <ellipse cx="0" cy="0" rx="1" ry="4" fill="#1F2937" />
        </g>
        
        {/* Distance label */}
        <text x="180" y="100" className="text-xs font-bold fill-orange-600">3,000 miles! ✈️</text>
        
        {/* Trees in Mexico */}
        <g transform="translate(200, 140)">
          <polygon points="0,-15 10,5 -10,5" fill="#2D5016" />
          <rect x="-2" y="5" width="4" height="8" fill="#8B4513" />
        </g>
      </svg>
    </div>
    <p className="text-center text-sm font-medium text-gray-700 mt-2">
      🦋 Monarch Butterfly Migration Route 🦋
    </p>
  </div>
);

// Q9: Idiom - Raining cats and dogs
const RainingIdiomVisual = () => (
  <div className="flex justify-center p-4 bg-gradient-to-b from-gray-400 to-gray-300 rounded-xl mb-4">
    <svg viewBox="0 0 200 120" className="w-48 h-28">
      {/* Rain clouds */}
      <ellipse cx="50" cy="25" rx="30" ry="15" fill="#6B7280" />
      <ellipse cx="80" cy="20" rx="25" ry="12" fill="#4B5563" />
      <ellipse cx="120" cy="25" rx="35" ry="18" fill="#6B7280" />
      <ellipse cx="150" cy="20" rx="28" ry="14" fill="#4B5563" />
      
      {/* Heavy rain */}
      {[30, 50, 70, 90, 110, 130, 150, 170].map((x, i) => (
        <line key={i} x1={x} y1="40" x2={x - 5} y2="100" stroke="#60A5FA" strokeWidth="2" />
      ))}
      {[40, 60, 80, 100, 120, 140, 160].map((x, i) => (
        <line key={i} x1={x} y1="45" x2={x - 5} y2="95" stroke="#3B82F6" strokeWidth="2" />
      ))}
      
      {/* Cartoon cat falling */}
      <g transform="translate(60, 70) rotate(-15)">
        <ellipse cx="0" cy="0" rx="8" ry="6" fill="#FFA500" />
        <circle cx="-6" cy="-4" r="5" fill="#FFA500" />
        <polygon points="-10,-8 -8,-3 -5,-6" fill="#FFA500" />
        <polygon points="-3,-8 -5,-3 -8,-6" fill="#FFA500" />
        <circle cx="-7" cy="-5" r="1" fill="#1F2937" />
        <circle cx="-4" cy="-5" r="1" fill="#1F2937" />
      </g>
      
      {/* Cartoon dog falling */}
      <g transform="translate(140, 75) rotate(10)">
        <ellipse cx="0" cy="0" rx="10" ry="7" fill="#8B4513" />
        <circle cx="10" cy="-3" r="6" fill="#8B4513" />
        <ellipse cx="14" cy="-2" rx="4" ry="3" fill="#D2691E" />
        <circle cx="12" cy="-5" r="1" fill="#1F2937" />
        <ellipse cx="8" cy="-8" rx="3" ry="4" fill="#8B4513" />
        <ellipse cx="14" cy="-8" rx="3" ry="4" fill="#8B4513" />
      </g>
      
      {/* Ground with puddles */}
      <rect x="0" y="105" width="200" height="15" fill="#6B7280" />
      <ellipse cx="50" cy="108" rx="20" ry="3" fill="#60A5FA" opacity="0.5" />
      <ellipse cx="150" cy="110" rx="25" ry="4" fill="#60A5FA" opacity="0.5" />
    </svg>
  </div>
);

// Q26-30: Writing section visual
const WritingVisual = () => (
  <div className="flex justify-center items-center gap-4 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl mb-4">
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      {/* Pencil */}
      <rect x="30" y="20" width="12" height="60" rx="1" fill="#FBBF24" />
      <polygon points="30,80 36,95 42,80" fill="#F9A8D4" />
      <rect x="30" y="75" width="12" height="8" fill="#9CA3AF" />
      <polygon points="36,95 34,90 38,90" fill="#1F2937" />
      <rect x="30" y="20" width="12" height="5" fill="#10B981" />
    </svg>
    <div className="text-left">
      <p className="text-sm font-bold text-amber-700">✍️ Writing Section</p>
      <p className="text-xs text-gray-600">Express your ideas!</p>
    </div>
  </div>
);

// Q18: Types of text - procedural
const ProceduralTextVisual = () => (
  <div className="flex justify-center gap-6 p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl mb-4">
    <div className="text-center">
      <span className="text-3xl">📖</span>
      <p className="text-xs text-gray-600">Story</p>
    </div>
    <div className="text-center">
      <span className="text-3xl">📝</span>
      <p className="text-xs text-gray-600">Poem</p>
    </div>
    <div className="text-center border-2 border-green-500 rounded-lg p-1 bg-green-50">
      <span className="text-3xl">📋</span>
      <p className="text-xs font-bold text-green-700">Recipe/How-to</p>
    </div>
    <div className="text-center">
      <span className="text-3xl">👤</span>
      <p className="text-xs text-gray-600">Biography</p>
    </div>
  </div>
);

// Q3: Root word visual
const RootWordVisual = () => (
  <div className="flex justify-center items-center p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl mb-4">
    <div className="flex items-center gap-1">
      <span className="px-3 py-2 bg-red-200 rounded-l-lg text-sm font-medium text-red-700">un-</span>
      <span className="px-4 py-2 bg-green-300 text-sm font-bold text-green-800 border-2 border-green-500">happy</span>
      <span className="px-3 py-2 bg-blue-200 rounded-r-lg text-sm font-medium text-blue-700">-ness</span>
    </div>
    <div className="ml-4 text-center">
      <p className="text-xs text-gray-600">prefix + <span className="font-bold text-green-700">ROOT</span> + suffix</p>
    </div>
  </div>
);

// Q5: Prefix pre- visual
const PrefixPreVisual = () => (
  <div className="flex justify-center items-center gap-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl mb-4">
    <div className="text-center">
      <span className="text-4xl">👀</span>
      <p className="text-xs text-gray-600 mt-1">Pre-view</p>
      <p className="text-xs font-bold text-purple-600">= See BEFORE</p>
    </div>
    <span className="text-2xl">|</span>
    <div className="flex items-center gap-2">
      <span className="text-2xl">📅</span>
      <div>
        <p className="text-xs">Yesterday → Today → Tomorrow</p>
        <p className="text-xs font-bold text-purple-600">PRE = BEFORE ⬅️</p>
      </div>
    </div>
  </div>
);

// Export function to get visual for a question
export function getGrade4ELAVisualForQuestion(questionId: string): React.ReactNode {
  const visuals: Record<string, React.FC> = {
    "q1": EnormousVisual,
    "q3": RootWordVisual,
    "q5": PrefixPreVisual,
    "q8": LionSimileVisual,
    "q9": RainingIdiomVisual,
    "q11": ChildrenVisual,
    "q18": ProceduralTextVisual,
    "q21": MonarchButterflyVisual,
    "q22": MonarchButterflyVisual,
    "q23": MonarchButterflyVisual,
    "q24": MonarchButterflyVisual,
    "q25": MonarchButterflyVisual,
    "q26": WritingVisual,
    "q27": WritingVisual,
    "q28": WritingVisual,
    "q29": WritingVisual,
    "q30": WritingVisual,
  };

  const Visual = visuals[questionId];
  return Visual ? <Visual /> : null;
}
