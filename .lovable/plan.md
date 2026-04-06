

# Add Desmos Scientific/Graphing Calculator for Grades 9-12

## What's Changing
Embed the Desmos calculator as the calculator tool for higher grades (9-12), while keeping the basic calculator for lower grades. Desmos provides a full scientific and graphing calculator via a free embeddable iframe — no API key needed for the public embed URLs.

## Approach

Rather than installing a package (which requires an API key and Desmos approval), we'll use the **free Desmos embed URLs** via iframe:
- Scientific calculator: `https://www.desmos.com/scientific`
- Graphing calculator: `https://www.desmos.com/calculator`

This is the simplest, most reliable approach — no dependencies, no API keys.

## Changes

### 1. `src/components/tools/ScientificCalculatorTool.tsx` (Create)
- Embeds Desmos scientific calculator in an iframe
- Includes a toggle to switch between Scientific and Graphing modes
- Sized appropriately for the floating panel (~400x500)

### 2. `src/components/TestToolsSidebar.tsx` (Modify)
- Accept a `gradeLevel` prop (number or string)
- If grade >= 9, swap the basic `CalculatorTool` with `ScientificCalculatorTool` in the tools array
- Adjust the floating panel min-width for the scientific calculator

### 3. `src/pages/TakeTest.tsx` (Modify)
- Pass `gradeLevel={attempt?.grade_level}` to `<TestToolsSidebar />`

### 4. `src/pages/TakeELATest.tsx` (Modify)
- Pass `gradeLevel` from the route/test data to `<TestToolsSidebar />`

## Files

| File | Action |
|------|--------|
| `src/components/tools/ScientificCalculatorTool.tsx` | Create — Desmos iframe embed with scientific/graphing toggle |
| `src/components/TestToolsSidebar.tsx` | Modify — accept `gradeLevel` prop, conditionally use advanced calculator |
| `src/pages/TakeTest.tsx` | Modify — pass grade level to sidebar |
| `src/pages/TakeELATest.tsx` | Modify — pass grade level to sidebar |

No new dependencies. Uses free Desmos public embeds via iframe.

