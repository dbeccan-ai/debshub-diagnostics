import { useState } from "react";

type Mode = "scientific" | "graphing";

export default function ScientificCalculatorTool() {
  const [mode, setMode] = useState<Mode>("scientific");

  const src =
    mode === "scientific"
      ? "https://www.desmos.com/scientific"
      : "https://www.desmos.com/calculator";

  return (
    <div className="w-[380px] select-none">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-3">
        <button
          onClick={() => setMode("scientific")}
          className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "scientific"
              ? "bg-[#001F3F] text-[#FFD700]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Scientific
        </button>
        <button
          onClick={() => setMode("graphing")}
          className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "graphing"
              ? "bg-[#001F3F] text-[#FFD700]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Graphing
        </button>
      </div>

      {/* Desmos iframe */}
      <iframe
        key={mode}
        src={src}
        title={`Desmos ${mode} calculator`}
        className="w-full rounded-lg border border-gray-200"
        style={{ height: mode === "graphing" ? 480 : 400 }}
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
