## Plan: Fix partial-page worksheet printing

1. **Replace modal-based printing with an isolated print document**
   - Instead of calling `window.print()` on the whole app/dialog, open a clean print window containing only the worksheet HTML.
   - This avoids Radix dialog transforms, viewport max-height, scroll containers, and app chrome from clipping the PDF/print output.

2. **Create print-safe worksheet markup**
   - Reuse the existing activity blocks, but render a dedicated print version with simple black-on-white layout.
   - Include the header: student name, grade, day, activity title, date/name lines, and Student Copy vs Answer Key.
   - Keep phonics/audio controls hidden while preserving the printed letters/words.

3. **Improve page-break and sizing rules**
   - Use Letter portrait margins, full printable width, normal document flow, no absolute positioning.
   - Prevent cards, word lists, passages, and writing boxes from splitting awkwardly.
   - Use ruled lines/boxes for written responses instead of interactive input styling.

4. **Keep the existing on-screen dialog unchanged**
   - The workbook dialog remains interactive for viewing, phonics listening, answer key toggling, and completion tracking.
   - Only the Print Student Copy / Print Answer Key buttons will use the new isolated print flow.

5. **Verify with browser print rendering**
   - Check the generated print/PDF layout against the uploaded screenshots’ issue: no blank top offset, no clipped left edge, no partial-width pages, and worksheet content starts properly at the printable margin.

## Technical notes

- Primary file: `src/components/ReadingRecoveryActivityDialog.tsx`.
- Likely approach: add a `buildPrintHtml(...)` helper and change `printWith(...)` to write that HTML into a temporary print window before triggering print.
- No database or backend changes needed.