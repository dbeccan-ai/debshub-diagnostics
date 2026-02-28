

# Plan: Hide Tier 3 Price + Add Account Pause for Non-Payment

## Part 1: Hide Tier 3 Price in Placement Pathway

The Placement Pathway table currently displays "$2,497--$4,997" for Tier 3. Since Tier 3 is consultation-only, the price should not be visible to parents.

**Changes:**

1. **`src/lib/tierConfig.ts`** -- Change the Tier 3 entry in `PLACEMENT_PATHWAY` to replace the price with a consultation-oriented label:
   - Change `price: "$2,497–$4,997"` to `price: "By Consultation"`

2. **`src/components/TierComponents.tsx`** -- In the `PlacementPathwayCard`, update the Investment column rendering so that when the row is Tier 3 (red), it does not show a dollar figure or "Payment plan available" -- just the "By Consultation" text.

---

## Part 2: Account Pause System for Non-Payment

To handle clients who miss their second (or third) installment payment, we need an account status system.

**Approach:**
- Add an `account_status` column to the `profiles` table (values: `active`, `paused`, `suspended`).
- Add a `pause_reason` column for admin notes.
- Create an admin UI action to pause/unpause accounts.
- When an account is paused, the student sees a "Your account is on hold" banner and cannot start new tests or access program content until payment is resolved.

**Database migration:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN pause_reason text;
```

**Code changes:**

1. **`src/pages/AdminAllResults.tsx` or `src/pages/AdminUserLogins.tsx`** -- Add a "Pause Account" / "Resume Account" toggle button next to each user row. This calls supabase to update `profiles.account_status`.

2. **Create a shared hook or utility** (`src/hooks/useAccountStatus.ts`) that fetches the current user's `account_status` from `profiles`. This is checked on the Dashboard and test-taking pages.

3. **`src/pages/Dashboard.tsx`** -- If `account_status === 'paused'`, show a prominent banner: "Your account is currently on hold. Please contact us to resolve your outstanding balance." Disable test-start buttons.

4. **`src/pages/TakeTest.tsx` and `src/pages/TakeELATest.tsx`** -- If account is paused, redirect to Dashboard with a toast message instead of allowing test access.

5. **RLS consideration** -- The existing profile UPDATE policy (`auth.uid() = id`) means only the user can update their own profile. We need an additional policy allowing admins to update any profile's `account_status`:
```sql
CREATE POLICY "Admins can update account status"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

---

## Summary

| Change | Files |
|--------|-------|
| Hide Tier 3 price | `tierConfig.ts`, `TierComponents.tsx` |
| Add account_status column | DB migration |
| Admin pause/resume UI | `AdminUserLogins.tsx` |
| Account status hook | New `useAccountStatus.ts` |
| Block paused users | `Dashboard.tsx`, `TakeTest.tsx`, `TakeELATest.tsx` |
| Admin RLS policy | DB migration |

