

# Upgrade Demo Test Results to Full Report

## Problem
The current demo test results view is a bare-bones score card + simple skill list. The actual Results page (`Results.tsx`) is the key differentiator — it includes tier badges, insight boxes, skill-by-skill performance bars, placement pathway, recommended next steps with CTAs, and curriculum preview. Principals need to see this full report to understand the product's value.

## Solution
Replace the simplified results section in `DemoTest.tsx` with the full report layout that mirrors `Results.tsx`, reusing the existing `TierComponents` (InsightBox, TierStatusBadge, SkillRow, TierClassificationBlocks, PlacementPathwayCard, RecommendedNextStepPanel).

## Changes — `src/pages/DemoTest.tsx` only

Rewrite the `if (submitted)` results block to include:

1. **Score Overview Card** — Tier badge, percentage, correct/total, student name placeholder ("Demo Student"), test name, grade level, date — matching Results.tsx layout
2. **InsightBox** — Emotional urgency box driven by score tier
3. **RecommendedNextStepPanel** — Tier-specific CTA panel (consultation / skill builder / enrichment)
4. **Quick Stats Row** — 3 colored cards: Correct, Incorrect, Skills Tested
5. **TierClassificationBlocks** — Grouped skill sections by tier color
6. **SkillRow breakdown** — Per-skill performance bars with status pills and action text
7. **PlacementPathwayCard** — Shows all 3 tiers with the student's tier highlighted
8. **Curriculum Preview Card** — Static preview showing what a personalized curriculum looks like (with a "This is a demo preview" note)
9. **Tier Explanation Card** — Understanding your placement + contact info
10. **"Back to Demo" and "Retake" buttons** remain at bottom

All data is computed locally from the 5-question answers — no database or auth calls. Imports are added for `TierStatusBadge`, `SkillRow`, `RecommendedNextStepPanel`, `PlacementPathwayCard`, `TierClassificationBlocks`, `InsightBox` from `TierComponents`, and `getTierFromScore`, `TIER_LABELS` from `tierConfig`.

No new files. No database changes. Single file edit.

