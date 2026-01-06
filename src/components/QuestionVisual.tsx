import React from "react";

interface VisualData {
  type: string;
  description: string;
  options?: string[];
  time?: string;
  groups?: { label: string; count: number; object: string }[];
  items?: string[];
}

interface QuestionVisualProps {
  visual: VisualData;
}

const QuestionVisual: React.FC<QuestionVisualProps> = ({ visual }) => {
  const renderShapes = () => {
    const shapes = visual.options || [];
    return (
      <div className="flex items-center justify-center gap-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
        {shapes.map((shape, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {shape === "triangle" && (
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <polygon
                  points="50,10 10,90 90,90"
                  fill="#FFB347"
                  stroke="#FF8C00"
                  strokeWidth="3"
                />
              </svg>
            )}
            {shape === "square" && (
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="80"
                  fill="#87CEEB"
                  stroke="#4169E1"
                  strokeWidth="3"
                />
              </svg>
            )}
            {shape === "circle" && (
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="#98FB98"
                  stroke="#228B22"
                  strokeWidth="3"
                />
              </svg>
            )}
            {shape === "rectangle" && (
              <svg viewBox="0 0 120 80" className="w-24 h-16">
                <rect
                  x="5"
                  y="5"
                  width="110"
                  height="70"
                  fill="#DDA0DD"
                  stroke="#8B008B"
                  strokeWidth="3"
                />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-600 capitalize">
              {String.fromCharCode(65 + index)}. {shape}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderClock = () => {
    const time = visual.time || "3:00";
    const [hours] = time.split(":").map(Number);
    const hourAngle = (hours % 12) * 30 - 90;

    return (
      <div className="flex justify-center py-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-dashed border-yellow-300">
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 120 120" className="w-32 h-32">
            {/* Clock face */}
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="white"
              stroke="#1e3a8a"
              strokeWidth="4"
            />
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 60 + 45 * Math.cos(angle);
              const y1 = 60 + 45 * Math.sin(angle);
              const x2 = 60 + 50 * Math.cos(angle);
              const y2 = 60 + 50 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1e3a8a"
                  strokeWidth="2"
                />
              );
            })}
            {/* Numbers */}
            {[12, 3, 6, 9].map((num) => {
              const angle = ((num === 12 ? 0 : num === 3 ? 90 : num === 6 ? 180 : 270) - 90) * (Math.PI / 180);
              const x = 60 + 38 * Math.cos(angle);
              const y = 60 + 38 * Math.sin(angle) + 5;
              return (
                <text
                  key={num}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#1e3a8a"
                >
                  {num}
                </text>
              );
            })}
            {/* Hour hand */}
            <line
              x1="60"
              y1="60"
              x2={60 + 25 * Math.cos(hourAngle * Math.PI / 180)}
              y2={60 + 25 * Math.sin(hourAngle * Math.PI / 180)}
              stroke="#1e3a8a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Minute hand (pointing at 12) */}
            <line
              x1="60"
              y1="60"
              x2="60"
              y2="20"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx="60" cy="60" r="4" fill="#1e3a8a" />
          </svg>
          <span className="text-sm font-medium text-gray-600">The clock shows {time}</span>
        </div>
      </div>
    );
  };

  const renderCoins = () => {
    const coins = [
      { name: "Penny", value: "1¢", color: "#CD7F32", size: "w-12 h-12" },
      { name: "Nickel", value: "5¢", color: "#C0C0C0", size: "w-14 h-14" },
      { name: "Dime", value: "10¢", color: "#C0C0C0", size: "w-11 h-11" },
      { name: "Quarter", value: "25¢", color: "#C0C0C0", size: "w-16 h-16" },
    ];

    return (
      <div className="flex items-end justify-center gap-6 py-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-dashed border-amber-300">
        {coins.map((coin, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={`${coin.size} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-4 border-opacity-50`}
              style={{ backgroundColor: coin.color, borderColor: "#8B4513" }}
            >
              <span className="text-xs">{coin.value}</span>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {String.fromCharCode(65 + index)}. {coin.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderObjectGroups = () => {
    const groups = visual.groups || [];
    
    const renderStars = (count: number, color: string) => {
      return (
        <div className="flex flex-wrap gap-1 justify-center">
          {[...Array(count)].map((_, i) => (
            <svg key={i} viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={color}
                stroke="#000"
                strokeWidth="0.5"
              />
            </svg>
          ))}
        </div>
      );
    };

    return (
      <div className="flex justify-center gap-12 py-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-dashed border-pink-300">
        {groups.map((group, index) => (
          <div key={index} className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
            <span className="text-sm font-bold text-gray-700">{group.label}</span>
            {renderStars(group.count, index === 0 ? "#FFD700" : "#FF69B4")}
            <span className="text-sm text-gray-500">({group.count} stars)</span>
          </div>
        ))}
      </div>
    );
  };

  const renderComparison = () => {
    const items = visual.items || [];

    return (
      <div className="flex items-end justify-center gap-12 py-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border-2 border-dashed border-green-300">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {item === "pencil" && (
              <svg viewBox="0 0 80 20" className="w-16 h-8">
                {/* Pencil body */}
                <rect x="15" y="5" width="50" height="10" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
                {/* Pencil tip */}
                <polygon points="15,5 15,15 5,10" fill="#F5DEB3" stroke="#8B4513" strokeWidth="1" />
                <polygon points="5,10 8,8 8,12" fill="#333" />
                {/* Eraser */}
                <rect x="65" y="5" width="10" height="10" fill="#FF69B4" stroke="#FF1493" strokeWidth="1" />
              </svg>
            )}
            {item === "car" && (
              <svg viewBox="0 0 120 60" className="w-40 h-20">
                {/* Car body */}
                <rect x="10" y="25" width="100" height="25" rx="5" fill="#E74C3C" stroke="#C0392B" strokeWidth="2" />
                {/* Car top */}
                <path d="M30,25 L40,10 L80,10 L90,25" fill="#E74C3C" stroke="#C0392B" strokeWidth="2" />
                {/* Windows */}
                <rect x="42" y="12" width="35" height="12" rx="2" fill="#87CEEB" stroke="#4169E1" strokeWidth="1" />
                {/* Wheels */}
                <circle cx="30" cy="50" r="10" fill="#333" stroke="#000" strokeWidth="2" />
                <circle cx="30" cy="50" r="4" fill="#666" />
                <circle cx="90" cy="50" r="10" fill="#333" stroke="#000" strokeWidth="2" />
                <circle cx="90" cy="50" r="4" fill="#666" />
                {/* Headlight */}
                <rect x="105" y="30" width="5" height="8" rx="1" fill="#FFD700" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-600 capitalize">
              {String.fromCharCode(65 + index)}. {item}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-500 mb-3 italic text-center">{visual.description}</p>
      {visual.type === "shapes" && renderShapes()}
      {visual.type === "clock" && renderClock()}
      {visual.type === "coins" && renderCoins()}
      {visual.type === "object_groups" && renderObjectGroups()}
      {visual.type === "comparison" && renderComparison()}
    </div>
  );
};

export default QuestionVisual;
