

# Add Interactive Tools Sidebar to Diagnostic Tests

## What's Being Built
A collapsible sidebar toolbar that gives students access to digital tools during diagnostic tests — shapes, ruler, calculator, protractor, compass, graph paper, and a freehand drawing/coloring canvas. This addresses the gap where questions require graphing or drawing but no tools are available.

## Approach

### New Component: `src/components/TestToolsSidebar.tsx`
A collapsible sidebar panel (right side) with tool buttons. When a tool is selected, an overlay/modal opens with the interactive tool. Tools:

1. **Calculator** — Basic calculator with arithmetic operations (built with React state)
2. **Ruler** — SVG ruler with inch/cm markings that can be dragged/rotated on screen
3. **Protractor** — SVG semicircle protractor overlay, draggable
4. **Compass** — Simple circle-drawing tool (click center, drag radius)
5. **Shapes** — Palette of draggable shapes (circle, square, triangle, rectangle, hexagon) students can place on a canvas
6. **Graph Paper** — Full-screen grid overlay where students can plot points and draw lines
7. **Drawing Pad** — Freehand canvas (HTML5 Canvas) with pencil/pen tool, color picker, eraser, and line thickness control

### Integration Points
- **`src/pages/TakeTest.tsx`** — Add the sidebar alongside the main question content area. Wrap the existing `<main>` in a flex layout with the sidebar on the right.
- **`src/pages/TakeELATest.tsx`** — Same integration for ELA tests (useful for diagram/writing questions).
- **`src/pages/Grade4Diagnostic.tsx`** — If feasible, pass a message to the iframe or overlay tools on top.

### Layout Change
```text
┌──────────────────────────────────┬───────┐
│                                  │ Tools │
│        Question Content          │ ───── │
│        (existing layout)         │ 📐 📏 │
│                                  │ 🔢 📊 │
│                                  │ ✏️ 🎨 │
└──────────────────────────────────┴───────┘
```

The sidebar collapses to a thin icon strip (~48px) by default and expands (~280px) when toggled. On mobile, it becomes a bottom toolbar with tool icons.

### Tool Implementation Strategy
Each tool opens as a draggable, resizable floating panel over the test content (not replacing it). Students can use the tool while viewing the question. The drawing pad saves strokes in local state so work persists across questions within the session.

### Technical Details
- **Drawing/coloring**: HTML5 Canvas API with touch support for tablets
- **Graph paper**: SVG grid with click-to-plot points and drag-to-draw lines
- **Shapes**: Draggable SVG elements using pointer events
- **Ruler/Protractor**: SVG overlays with drag + rotate via CSS transforms
- **Calculator**: Pure React component with button grid and display
- **No external dependencies** — all built with Canvas API, SVG, and React state

## Files

| File | Action |
|------|--------|
| `src/components/TestToolsSidebar.tsx` | Create — main sidebar with tool buttons |
| `src/components/tools/CalculatorTool.tsx` | Create — basic calculator |
| `src/components/tools/RulerTool.tsx` | Create — draggable ruler |
| `src/components/tools/ProtractorTool.tsx` | Create — draggable protractor |
| `src/components/tools/CompassTool.tsx` | Create — circle drawing tool |
| `src/components/tools/ShapesTool.tsx` | Create — shape palette + placement |
| `src/components/tools/GraphPaperTool.tsx` | Create — interactive grid |
| `src/components/tools/DrawingPadTool.tsx` | Create — freehand canvas with colors |
| `src/pages/TakeTest.tsx` | Modify — add sidebar to layout |
| `src/pages/TakeELATest.tsx` | Modify — add sidebar to layout |

No new dependencies required. All tools built with native browser APIs.

