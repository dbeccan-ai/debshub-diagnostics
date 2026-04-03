

# Update DEBsHeader with New Icon

## What's Changing
Replace the plain yellow circle with "DEB" text in the header with the actual uploaded shield/chart icon image, and ensure the name reads "D.E.Bs LEARNING ACADEMY" consistently.

## Changes

### `src/components/DEBsHeader.tsx`
- Replace the `<div>` circle containing "DEB" text with an `<img>` tag pointing to `/icon-512.png`
- Style the image as a 40x40 rounded element to match the current layout
- Keep all other header functionality (subtitle, rightContent) unchanged

| File | Change |
|------|--------|
| `src/components/DEBsHeader.tsx` | Replace text circle with `<img src="/icon-512.png">` |

Single file, single edit. No new dependencies.

