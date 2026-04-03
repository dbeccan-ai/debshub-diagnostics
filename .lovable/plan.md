

# Rename "D.E.Bs LEARNING ACADEMY" → "D.E.Bs DIAGNOSTIC HUB"

## What's Changing
Replace every visible instance of "LEARNING ACADEMY" / "Learning Academy" with "DIAGNOSTIC HUB" / "Diagnostic Hub" across all frontend components and pages. This covers headers, footers, contact sections, certificates, alt text, and result downloads.

## Scope

**18 frontend files** contain this text. Key visible areas:

| File | Context |
|------|---------|
| `src/components/DEBsHeader.tsx` | Shared header component |
| `src/components/DiagnosticLanding.tsx` | Landing footer |
| `src/components/SampleResultsDialog.tsx` | Contact line |
| `src/pages/Index.tsx` | Homepage header |
| `src/pages/Dashboard.tsx` | Dashboard header |
| `src/pages/SchoolDemo.tsx` | Header + footer |
| `src/pages/Register.tsx` | Alt text |
| `src/pages/Results.tsx` | Contact section |
| `src/pages/ELAResults.tsx` | Certificate/report HTML |
| `src/pages/ReadingRecoveryResults.tsx` | Certificate HTML |
| `src/pages/DemoTest.tsx` | Contact section |
| `src/pages/Curriculum.tsx` | Contact section |
| `src/pages/Grade2Diagnostic.tsx` | Download text + footer |
| `src/pages/Grade6Diagnostic.tsx` | Download text + footers |
| `src/pages/Grade1ELADiagnostic.tsx` | (if present) |
| `src/pages/Grade4Diagnostic.tsx` | (if present) |
| `src/pages/ManualGrading.tsx` | (if present) |
| `src/pages/TakeTest.tsx` / `TakeELATest.tsx` | (if present) |

**Also 4 edge functions** (certificates, emails, reports) — these should be updated too for consistency:
- `supabase/functions/generate-certificate/index.ts`
- `supabase/functions/generate-teacher-copy/index.ts`
- `supabase/functions/finalize-grading/index.ts`
- `supabase/functions/notify-version-b-due/index.ts`

## Approach
Global find-and-replace across all files:
- `D.E.Bs LEARNING ACADEMY` → `D.E.Bs DIAGNOSTIC HUB`
- `D.E.Bs Learning Academy` → `D.E.Bs Diagnostic Hub`
- `DEBs Learning Academy` → `DEBs Diagnostic Hub`

No structural or layout changes — text-only swap.

