
# Rebuild ELAResults.tsx to Match the Math Results Page Structure

## Problem Summary

There are two separate ELA result systems in the codebase:

1. **Math/DB path**: `/results/:attemptId` → `Results.tsx` — pulls data from the database, shows a polished structured layout with tier badges, classification blocks, placement pathway, and the `RecommendedNextStepPanel`
2. **ELA path**: `/ela-results/grade-X` → `ELAResults.tsx` — pulls data from localStorage (saved by `TakeELATest.tsx`), has a different and inconsistent layout

The user wants `ELAResults.tsx` to look and function like `Results.tsx`. The good news is that `ELAResults.tsx` **already has the section breakdown data** (from localStorage), it just presents it in a different structure.

## Root Cause of Issues

- **Tier mismatch**: `ELAResults.tsx` uses its own inline tier logic (`overallPercent >= 85 ? "Tier 1" : ...`) instead of `getTierFromScore()` from `tierConfig.ts`
- **Layout divergence**: The ELA page has a "certificate" header not present in the Math page; the ordering of sections differs
- **Contact links not live**: Some contact info is plain text instead of `<a href>` tags
- **Missing unified components**: ELAResults doesn't use `TierClassificationBlocks`, `SkillRow`, `PlacementPathwayCard` in the same consistent order as the Math page

## What Will Be Changed

### `src/pages/ELAResults.tsx` — Full restructure to match Math results layout

The page will be rebuilt to follow the **exact same visual and functional structure** as `Results.tsx`, adapted for ELA data:

**Section 1 – Header Bar** (matches Math page)
- Back to Dashboard button (left)
- Share / Print / Download PDF / Retake Test buttons (right)

**Section 2 – Score Overview Card** (matches Math page)
- Tier badge (from `getTierFromScore()`) + tier label
- Large score percentage
- Student name / Test Type / Grade / Date grid
- `InsightBox` component
- `RecommendedNextStepPanel` (desktop)

**Section 3 – Quick Stats Row** (matches Math page)
- 3-card grid: Correct answers (green), Incorrect (red), Sections Tested (amber)

**Section 4 – Tier Classification Blocks** (matches Math page)
- `TierClassificationBlocks` using `sectionBreakdown` data, showing which ELA sections fall in 🔴/🟡/🟢

**Section 5 – Section-by-Section Performance Table** (matches Math page's SkillRow pattern)
- For each ELA section: section name, score bar, tier badge, recommendation
- Individual skill tags within each section (using `masteredSkills` + `supportSkills` already stored)

**Section 6 – Skills Assessed Tags** (matches Math page)
- Badge pills for each ELA section assessed

**Section 7 – Placement Pathway Card** (matches Math page)
- Reuse `PlacementPathwayCard` component

**Section 8 – Tier Explanation** (matches Math page)
- Tier label + helper text + live contact links

**Section 9 – Priority Focus for Next 6–8 Weeks** (from existing ELAResults, kept)
- Home strategies + school strategies per weak section
- 6-week curriculum outline (from `getCurriculumWeeks` logic, moved here from `ELASectionReport`)
- Parent commitment checklist

**Section 10 – Bottom CTA** (mobile repeat, matches Math page)
- `RecommendedNextStepPanel` on mobile

## Key Technical Details

- **Tier calculation**: Replace all inline `>= 85 ? "Tier 1"` with `getTierFromScore()` + `TIER_LABELS` from `tierConfig.ts`
- **Section data**: The localStorage `sectionBreakdown` array already contains `{ section, correct, total, percent, status, masteredSkills, supportSkills, recommendation }` — this maps directly to the `TierClassificationBlocks` input format
- **SkillRow reuse**: Individual skill tags within sections will use the existing `SkillRow` component from `TierComponents.tsx`, fed from `masteredSkills`/`supportSkills` arrays (note: no individual percentages stored per skill in localStorage — will show section-level scores for skill tags)
- **Contact links**: All email/phone/website will be `<a href="mailto:">` / `<a href="tel:">` links
- **No new dependencies** needed — all components already exist

## Files to Edit

1. **`src/pages/ELAResults.tsx`** — Complete restructure of the layout to mirror `Results.tsx`, while preserving all ELA-specific data (section breakdown, strategies, curriculum outline, parent checklist). The `getCurriculumWeeks` and strategy helpers will be kept inline in this file since they are ELA-specific.

No other files need to change — all the shared components (`TierComponents.tsx`, `tierConfig.ts`) are already correct and will be reused.
