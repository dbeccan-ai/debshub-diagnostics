import { useMemo, useState } from "react";
import { Calculator, Ruler, Triangle, Circle, Hexagon, Grid3X3, Pencil, ChevronLeft, ChevronRight, X } from "lucide-react";
import CalculatorTool from "@/components/tools/CalculatorTool";
import ScientificCalculatorTool from "@/components/tools/ScientificCalculatorTool";
import RulerTool from "@/components/tools/RulerTool";
import ProtractorTool from "@/components/tools/ProtractorTool";
import CompassTool from "@/components/tools/CompassTool";
import ShapesTool from "@/components/tools/ShapesTool";
import GraphPaperTool from "@/components/tools/GraphPaperTool";
import DrawingPadTool from "@/components/tools/DrawingPadTool";

interface TestToolsSidebarProps {
  gradeLevel?: number | null;
}

export default function TestToolsSidebar({ gradeLevel }: TestToolsSidebarProps) {
  const isAdvanced = (gradeLevel ?? 0) >= 9;

  const tools = useMemo(() => [
    {
      id: "calculator",
      label: isAdvanced ? "Sci Calculator" : "Calculator",
      icon: Calculator,
      component: isAdvanced ? ScientificCalculatorTool : CalculatorTool,
    },
    { id: "ruler", label: "Ruler", icon: Ruler, component: RulerTool },
    { id: "protractor", label: "Protractor", icon: Triangle, component: ProtractorTool },
    { id: "compass", label: "Compass", icon: Circle, component: CompassTool },
    { id: "shapes", label: "Shapes", icon: Hexagon, component: ShapesTool },
    { id: "graph", label: "Graph Paper", icon: Grid3X3, component: GraphPaperTool },
    { id: "draw", label: "Drawing Pad", icon: Pencil, component: DrawingPadTool },
  ], [isAdvanced]);
  const [expanded, setExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleToolClick = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, canvas, svg")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - panelPos.x, y: e.clientY - panelPos.y });
  };

  const handlePanelMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPanelPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePanelMouseUp = () => setDragging(false);

  const activeToolData = tools.find(t => t.id === activeTool);
  const ActiveComponent = activeToolData?.component;

  return (
    <>
      {/* Sidebar strip */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-200 ${
          expanded ? "w-48" : "w-12"
        } bg-[#001F3F]/95 backdrop-blur-sm rounded-l-xl shadow-2xl border-l border-t border-b border-white/10`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -left-5 top-1/2 -translate-y-1/2 w-5 h-10 bg-[#001F3F] text-white rounded-l flex items-center justify-center hover:bg-[#001F3F]/80 border border-white/10 border-r-0"
        >
          {expanded ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Tool buttons */}
        <div className="py-3 space-y-1 px-1">
          <div className="text-center mb-2">
            {expanded && <span className="text-[10px] uppercase tracking-wider text-[#FFD700] font-bold">Tools</span>}
          </div>
          {tools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex items-center gap-2 rounded-lg transition-colors ${
                  expanded ? "px-3 py-2" : "px-0 py-2 justify-center"
                } ${
                  isActive
                    ? "bg-[#FFD700] text-[#001F3F]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                title={tool.label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {expanded && <span className="text-xs font-medium truncate">{tool.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating tool panel */}
      {activeTool && ActiveComponent && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            left: panelPos.x,
            top: panelPos.y,
            minWidth: activeTool === "draw" ? "420px" : activeTool === "graph" ? "420px" : "280px",
            maxWidth: "90vw",
            maxHeight: "80vh",
          }}
          onMouseDown={handlePanelMouseDown}
          onMouseMove={handlePanelMouseMove}
          onMouseUp={handlePanelMouseUp}
          onMouseLeave={handlePanelMouseUp}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#001F3F] text-white cursor-move select-none">
            <div className="flex items-center gap-2">
              {activeToolData && <activeToolData.icon className="h-4 w-4 text-[#FFD700]" />}
              <span className="text-sm font-semibold">{activeToolData?.label}</span>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Panel body */}
          <div className="p-4 overflow-auto" style={{ maxHeight: "calc(80vh - 40px)" }}>
            <ActiveComponent />
          </div>
        </div>
      )}
    </>
  );
}
