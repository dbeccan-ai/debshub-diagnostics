

# Update Old Icon/Name in All Remaining Banners

## Problem
Four pages still use the old yellow gradient circle with "DEB" text instead of the new shield/chart icon image. These are pages that have their own custom headers rather than using the shared `DEBsHeader` component.

## Changes

### 1. `src/pages/SchoolDemo.tsx` (line 91-93)
Replace the yellow `<div>` circle with `<img src="/icon-512.png" alt="DEBs Learning Academy" className="h-9 w-9 rounded-full object-cover" />`

### 2. `src/pages/Dashboard.tsx` (line 345-347)
Same replacement — swap yellow circle div for the icon image.

### 3. `src/pages/Register.tsx` (line 169-171)
Same replacement — swap yellow circle div for the icon image (slightly larger: h-12 w-12).

### 4. `src/pages/Index.tsx` (line 33-35)
Same replacement — swap yellow circle div for the icon image.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SchoolDemo.tsx` | Replace yellow circle div with `<img>` icon |
| `src/pages/Dashboard.tsx` | Replace yellow circle div with `<img>` icon |
| `src/pages/Register.tsx` | Replace yellow circle div with `<img>` icon |
| `src/pages/Index.tsx` | Replace yellow circle div with `<img>` icon |

Four files, one-line edit each. No new dependencies.

