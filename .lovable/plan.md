
# Make ENROLL7 Cover Both Test Prices ($99 and $120)

## The Problem
The ENROLL7 coupon currently has a fixed `discount_amount` of $99 in the database. Parents who paid $120 for a Grades 7-12 test should get a $120 credit, not just $99.

## The Solution
Two small changes — no new pages, no UI changes, no Stripe changes needed:

### 1. Update the Database Coupon
Change `ENROLL7`'s `discount_amount` from a fixed $99 to `NULL`. The edge function will then determine the correct credit dynamically based on the student's grade level.

We also need to update the validation trigger to allow NULL discount amounts (since NULL means "dynamic pricing" not "free").

### 2. Update the Redeem-Coupon Edge Function
Add logic so that when `ENROLL7` is redeemed (or any coupon with `discount_amount = NULL` and a special flag), the function looks up the `grade_level` from the test attempt and applies the correct amount:
- Grades 1-6: $99 credit
- Grades 7-12: $120 credit

The updated logic in the edge function will be:

```
// If discount_amount is set, use it directly
// If not set AND coupon code is ENROLL7, determine from grade_level
if (coupon.discount_amount) {
  discountAmount = coupon.discount_amount;
} else if (coupon.code === 'ENROLL7') {
  // Look up grade from the test attempt
  discountAmount = attempt.grade_level >= 7 ? 120 : 99;
} else {
  // No discount_amount = free (existing behavior for DATA40 etc.)
  isFree = true;
}
```

### 3. Update the Validation Trigger
The existing trigger enforces that `discount_amount` must be between $99 and $198. We need to allow `NULL` values to pass through (they already should since the trigger checks `NEW.discount_amount IS NOT NULL`, but we'll verify).

## What Changes

| File/Resource | Change |
|---|---|
| Database migration | Set ENROLL7 `discount_amount` to NULL |
| `supabase/functions/redeem-coupon/index.ts` | Add grade-based pricing logic for ENROLL7 |
| Test attempt query | Expand SELECT to include `grade_level` (currently only selects `id, user_id, payment_status`) |

## What Doesn't Change
- No UI changes
- No changes to the Enroll landing page
- No Stripe configuration changes
- No changes to `tierConfig.ts`
- DATA40 and bundle coupons continue working as before

## Technical Details

### Database Migration SQL
```sql
UPDATE public.coupons SET discount_amount = NULL WHERE code = 'ENROLL7';
```

### Edge Function Update (redeem-coupon)
- Expand the attempt query to also select `grade_level`
- Replace the flat `discountAmount` logic with grade-aware branching for ENROLL7
- Update the success message to show the correct credited amount
