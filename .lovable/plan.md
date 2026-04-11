

# Make Login Accessible on Mobile Portrait

## Problem
The Login and Get Started buttons in the navbar are hidden on screens below 640px (`hidden sm:inline-flex`). On a phone in portrait mode, users have no way to navigate to the login page.

## Fix

**File: `src/pages/Index.tsx`**

Add a mobile hamburger menu or simply make the Login button always visible on mobile. The simplest and cleanest approach: show a compact Login icon/button on mobile, and add a mobile menu toggle for navigation links.

Specifically:
1. Remove `hidden sm:` from the Login link so it always shows (keep it compact with just the text or a user icon on small screens)
2. Add a simple mobile hamburger menu (using Sheet or a toggle) that reveals the nav links + Get Started on small screens

This is a minimal change — just ensuring the auth entry point is always reachable regardless of orientation.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Make Login button visible on all screen sizes; add mobile nav menu for other links |

