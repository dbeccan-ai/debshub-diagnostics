import React from "react";

// Clock showing 9:20
export const Clock920Diagram = () => (
  <div className="flex justify-center my-4">
    <svg width="140" height="140" viewBox="0 0 140 140" className="bg-white rounded-full border-4 border-gray-800">
      <circle cx="70" cy="70" r="65" fill="white" stroke="#1a1a1a" strokeWidth="4" />
      {/* Hour markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 70 + 52 * Math.cos(angle);
        const y1 = 70 + 52 * Math.sin(angle);
        const x2 = 70 + 60 * Math.cos(angle);
        const y2 = 70 + 60 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a1a" strokeWidth="3" />;
      })}
      {/* Hour numbers */}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 70 + 42 * Math.cos(angle);
        const y = 70 + 42 * Math.sin(angle);
        return (
          <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold" fill="#1a1a1a">
            {num}
          </text>
        );
      })}
      {/* Hour hand (9:20 - slightly past 9) */}
      <line x1="70" y1="70" x2="38" y2="75" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
      {/* Minute hand (20 minutes - pointing at 4) */}
      <line x1="70" y1="70" x2="100" y2="95" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="70" r="5" fill="#1a1a1a" />
    </svg>
  </div>
);

// Fraction model: rectangle with 8 parts, 5 shaded
export const Fraction58Diagram = () => (
  <div className="flex justify-center my-4">
    <svg width="200" height="60" viewBox="0 0 200 60">
      <rect x="0" y="10" width="200" height="40" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      {[...Array(8)].map((_, i) => (
        <React.Fragment key={i}>
          <rect
            x={i * 25}
            y="10"
            width="25"
            height="40"
            fill={i < 5 ? "#8B5CF6" : "white"}
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </React.Fragment>
      ))}
    </svg>
  </div>
);

// Bar graph: Favorite Lunch
export const BarGraphLunchDiagram = () => (
  <div className="flex justify-center my-4">
    <svg width="220" height="180" viewBox="0 0 220 180">
      {/* Title */}
      <text x="110" y="20" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a1a1a">
        Favorite Lunch
      </text>
      {/* Y-axis */}
      <line x1="50" y1="30" x2="50" y2="150" stroke="#1a1a1a" strokeWidth="2" />
      {/* X-axis */}
      <line x1="50" y1="150" x2="200" y2="150" stroke="#1a1a1a" strokeWidth="2" />
      {/* Y-axis labels */}
      {[0, 4, 8, 12].map((val, i) => (
        <React.Fragment key={val}>
          <text x="40" y={150 - i * 30} textAnchor="end" fontSize="12" fill="#1a1a1a">
            {val}
          </text>
          <line x1="48" y1={150 - i * 30} x2="50" y2={150 - i * 30} stroke="#1a1a1a" strokeWidth="1" />
        </React.Fragment>
      ))}
      {/* Bars */}
      {/* Pizza: 12 */}
      <rect x="65" y={150 - 90} width="35" height="90" fill="#EF4444" stroke="#1a1a1a" strokeWidth="1" />
      <text x="82" y="165" textAnchor="middle" fontSize="11" fill="#1a1a1a">Pizza</text>
      {/* Salad: 5 */}
      <rect x="110" y={150 - 37.5} width="35" height="37.5" fill="#22C55E" stroke="#1a1a1a" strokeWidth="1" />
      <text x="127" y="165" textAnchor="middle" fontSize="11" fill="#1a1a1a">Salad</text>
      {/* Fruit: 8 */}
      <rect x="155" y={150 - 60} width="35" height="60" fill="#F59E0B" stroke="#1a1a1a" strokeWidth="1" />
      <text x="172" y="165" textAnchor="middle" fontSize="11" fill="#1a1a1a">Fruit</text>
    </svg>
  </div>
);

// Number line showing 3/4
export const NumberLine34Diagram = () => (
  <div className="flex justify-center my-4">
    <svg width="280" height="70" viewBox="0 0 280 70">
      {/* Main line */}
      <line x1="20" y1="40" x2="260" y2="40" stroke="#1a1a1a" strokeWidth="3" />
      {/* Tick marks and labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 20 + i * 60;
        return (
          <React.Fragment key={i}>
            <line x1={x} y1="32" x2={x} y2="48" stroke="#1a1a1a" strokeWidth="2" />
            <text x={x} y="62" textAnchor="middle" fontSize="14" fill="#1a1a1a">
              {i}/4
            </text>
          </React.Fragment>
        );
      })}
      {/* Dot at 3/4 */}
      <circle cx={20 + 3 * 60} cy="40" r="8" fill="#8B5CF6" stroke="#1a1a1a" strokeWidth="2" />
      {/* Arrow pointing to dot */}
      <line x1={20 + 3 * 60} y1="15" x2={20 + 3 * 60} y2="28" stroke="#8B5CF6" strokeWidth="2" />
      <polygon points={`${20 + 3 * 60 - 5},18 ${20 + 3 * 60 + 5},18 ${20 + 3 * 60},28`} fill="#8B5CF6" />
    </svg>
  </div>
);

// Array 5x6 dots
export const Array56Diagram = () => (
  <div className="flex justify-center my-4">
    <svg width="180" height="160" viewBox="0 0 180 160">
      <text x="90" y="20" textAnchor="middle" fontSize="12" fill="#666">5 rows × 6 columns</text>
      {[...Array(5)].map((_, row) =>
        [...Array(6)].map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={25 + col * 25}
            cy={45 + row * 25}
            r="10"
            fill="#8B5CF6"
            stroke="#1a1a1a"
            strokeWidth="1"
          />
        ))
      )}
    </svg>
  </div>
);

// Draw area for array (Section 3)
export const DrawArrayArea = () => (
  <div className="my-4 p-4 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 print:bg-white">
    <p className="text-sm text-gray-600 mb-2 print:text-gray-800">Draw your 4 × 7 array here:</p>
    <svg width="280" height="180" viewBox="0 0 280 180" className="bg-white border border-gray-200">
      {/* Faint grid */}
      {[...Array(8)].map((_, row) =>
        [...Array(10)].map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={10 + col * 26}
            y={10 + row * 20}
            width="26"
            height="20"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))
      )}
    </svg>
    <div className="mt-2 space-y-2">
      <p className="text-sm text-gray-600">Multiplication sentence: ________________</p>
      <p className="text-sm text-gray-600">Division sentence: ________________</p>
      <p className="text-sm text-gray-600">How are they related? ________________</p>
    </div>
  </div>
);

// Draw area for number line (Section 3)
export const DrawNumberLineArea = () => (
  <div className="my-4 p-4 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 print:bg-white">
    <p className="text-sm text-gray-600 mb-2 print:text-gray-800">Mark 3/4 on this number line:</p>
    <svg width="300" height="80" viewBox="0 0 300 80" className="bg-white border border-gray-200">
      {/* Main line */}
      <line x1="20" y1="40" x2="280" y2="40" stroke="#1a1a1a" strokeWidth="2" />
      {/* End ticks */}
      <line x1="20" y1="30" x2="20" y2="50" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="280" y1="30" x2="280" y2="50" stroke="#1a1a1a" strokeWidth="2" />
      {/* Labels */}
      <text x="20" y="70" textAnchor="middle" fontSize="14" fill="#1a1a1a">0</text>
      <text x="280" y="70" textAnchor="middle" fontSize="14" fill="#1a1a1a">1</text>
    </svg>
    <div className="mt-2">
      <p className="text-sm text-gray-600">What does 3/4 mean? ________________</p>
    </div>
  </div>
);

// Map visual string values from database to diagram components
export const getGrade3DiagramByVisual = (visual: string): React.ReactNode | null => {
  const diagrams: Record<string, React.ReactNode> = {
    clock_9_20: <Clock920Diagram />,
    fraction_5_8: <Fraction58Diagram />,
    bar_graph_lunch: <BarGraphLunchDiagram />,
    number_line_3_4: <NumberLine34Diagram />,
    array_5_6: <Array56Diagram />,
    draw_array: <DrawArrayArea />,
    draw_number_line: <DrawNumberLineArea />,
  };
  return diagrams[visual] || null;
};
