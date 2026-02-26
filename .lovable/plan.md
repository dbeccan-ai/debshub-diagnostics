

# Payment Pricing Updates: Tier 3 Upper Range, ENROLL7 on Stripe, and Dual Diagnostic Credit

## Overview

Three pricing issues to fix:

1. **Tier 3 Grades 7-12 pricing** -- currently shows $2,497 (single) / $3,997 (dual) for all grades. Grades 7-12 should be $2,997 / $4,997.
2. **ENROLL7 not showing on Stripe checkout** -- it only exists as an in-app coupon. Need to create Stripe promotion codes so parents see the promo field on Stripe payment pages.
3. **New dual-diagnostic credit code** -- parents who took both Math and ELA tests get $198 credit (grades 1-6) or $229 credit (grades 7-12) toward enrollment.

---

## Part 1: Tier 3 Grade-Based Pricing

### What changes

**`src/lib/tierConfig.ts`** -- Add grade-band variants for Tier 3:

| Plan | Grades 1-6 | Grades 7-12 |
|------|-----------|-------------|
| Single Subject | $2,497 | $2,997 |
| Dual Subject | $3,997 | $4,997 |

- Add new payment plan entries: `red_single_upper`, `red_dual_upper` with correct installment amounts
- Update `PLACEMENT_PATHWAY` to show price ranges

**Stripe** -- Create 4 new products + prices for the upper-range installments:
- Single Subject 7-12: Deposit $1,499 (50%), Installments $749 each (25%)
- Dual Subject 7-12: Deposit $2,499 (50%), Installments $1,249 each (25%)
- Create payment links with `allow_promotion_codes: true`

**`src/pages/Enroll.tsx`** -- Parse a new `band` query parameter (`1-6` or `7-12`):
- `/enroll?tier=red&plan=single&band=7-12` shows $2,997
- `/enroll?tier=red&plan=dual&band=7-12` shows $4,997
- Default to lower range (1-6) if no band specified

---

## Part 2: ENROLL7 on Stripe Payment Pages

### The problem
ENROLL7 only exists in the app database. Parents cannot enter it on Stripe-hosted checkout pages because no Stripe promotion code exists.

### Solution
Create **two Stripe promotion codes** (since Stripe coupons are fixed-amount):
- **ENROLL7** -- $99 off (for grades 1-6 enrollment payments)
- **ENROLL7PLUS** -- $120 off (for grades 7-12 enrollment payments)

Alternatively, create a single $99 Stripe coupon with code ENROLL7 and a second $120 coupon with code ENROLL7-120. The results page and decision letter would provide the correct code based on the student's grade.

Also add `allow_promotion_codes: true` to the `create-checkout` edge function so parents can enter promo codes during diagnostic test checkout as well.

---

## Part 3: Dual Diagnostic Credit Code

### What it does
Parents who completed both the Math and ELA diagnostics get a combined credit toward enrollment:
- Grades 1-6: **$198** credit
- Grades 7-12: **$229** credit

### Implementation

**Database** -- Create a new coupon row:
- Code: `ENROLL7-DUAL` (or similar name you prefer)
- `discount_amount`: NULL (dynamic, like ENROLL7)
- `max_uses`: 100
- `expires_at`: 7 days from creation

**`supabase/functions/redeem-coupon/index.ts`** -- Extend the dynamic pricing logic:
```
if (coupon.code === 'ENROLL7') {
  discountAmount = grade >= 7 ? 120 : 99;
} else if (coupon.code === 'ENROLL7-DUAL') {
  discountAmount = grade >= 7 ? 229 : 198;
}
```

**Stripe** -- Create two more promotion codes for the enrollment payment links:
- **ENROLL7DUAL** -- $198 off
- **ENROLL7DUAL-PLUS** -- $229 off

**Validation trigger** -- Already allows NULL `discount_amount`, so no change needed. The $198 and $229 values also both fall within the existing $99-$198 range check (need to raise the upper bound to $229).

**Database migration**: Update the validation trigger to allow up to $229:
```sql
-- Raise upper bound from $198 to $229
CREATE OR REPLACE FUNCTION public.validate_coupon_discount() ...
  IF NEW.discount_amount IS NOT NULL AND (NEW.discount_amount < 99 OR NEW.discount_amount > 229) THEN
```

---

## Summary of All Changes

| Area | Change |
|------|--------|
| `src/lib/tierConfig.ts` | Add `red_single_upper` and `red_dual_upper` payment plans with Grades 7-12 pricing |
| `src/pages/Enroll.tsx` | Parse `band` query param to select correct payment plan |
| `supabase/functions/create-checkout/index.ts` | Add `allow_promotion_codes: true` to Stripe session |
| `supabase/functions/redeem-coupon/index.ts` | Add `ENROLL7-DUAL` dynamic pricing logic ($198/$229) |
| Stripe | Create upper-range Tier 3 products/prices + payment links |
| Stripe | Create promotion codes: ENROLL7 ($99), ENROLL7-120 ($120), ENROLL7DUAL ($198), ENROLL7DUAL-229 ($229) |
| Database | Insert ENROLL7-DUAL coupon row |
| Database | Update validation trigger upper bound to $229 |

### What doesn't change
- Tier 1 and Tier 2 pricing (unchanged)
- DATA40 and bundle coupon logic (unchanged)
- Results pages and certificate generation

