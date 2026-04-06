import { useState } from "react";

export default function CalculatorTool() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  const handleNumber = (n: string) => {
    if (reset) {
      setDisplay(n);
      setReset(false);
    } else {
      setDisplay(display === "0" ? n : display + n);
    }
  };

  const handleOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op) {
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setReset(true);
  };

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prev !== null && op) {
      const current = parseFloat(display);
      const result = calculate(prev, current, op);
      setDisplay(String(Math.round(result * 1e10) / 1e10));
      setPrev(null);
      setOp(null);
      setReset(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const buttons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const handleButton = (btn: string) => {
    if (btn >= "0" && btn <= "9") handleNumber(btn);
    else if (["+", "-", "×", "÷"].includes(btn)) handleOp(btn);
    else if (btn === "=") handleEquals();
    else if (btn === "C") handleClear();
    else if (btn === ".") handleDecimal();
    else if (btn === "±") setDisplay(String(-parseFloat(display)));
    else if (btn === "%") setDisplay(String(parseFloat(display) / 100));
  };

  return (
    <div className="w-64 select-none">
      {/* Display */}
      <div className="bg-gray-900 text-white text-right text-2xl font-mono p-4 rounded-t-lg overflow-hidden">
        <div className="text-xs text-gray-400 h-4">
          {prev !== null ? `${prev} ${op}` : ""}
        </div>
        {display}
      </div>
      {/* Buttons */}
      <div className="grid grid-cols-4 gap-px bg-gray-300 rounded-b-lg overflow-hidden">
        {buttons.flat().map((btn, i) => (
          <button
            key={i}
            onClick={() => handleButton(btn)}
            className={`p-3 text-lg font-semibold transition-colors active:bg-gray-400 ${
              btn === "0" ? "col-span-2" : ""
            } ${
              ["+", "-", "×", "÷", "="].includes(btn)
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : ["C", "±", "%"].includes(btn)
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                : "bg-white text-gray-900 hover:bg-gray-100"
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
