

# Payment Plan Options by Tier

## Summary
- **Tier 1 and Tier 2**: Two-payment plan (50% deposit + 50% final payment), shown directly in the app alongside the "Pay in Full" option.
- **Tier 3**: Three-payment plan (50% / 25% / 25%), sent privately via admin links only (not shown in the app since Tier 3 is invitation-only).

## Payment Breakdown

| Tier | Full Price | Option A (Full) | Option B - Payment 1 | Option B - Payment 2 | Option B - Payment 3 |
|------|-----------|----------------|----------------------|----------------------|----------------------|
| Tier 1 (Enrichment Pod) | $597 | $597 | $299 (50%) | $298 (50%) | -- |
| Tier 2 (Skill Builder) | $1,097 | $1,097 | $549 (50%) | $548 (50%) | -- |
| Tier 3 Single Subject | $2,497 | $2,497 | $1,249 (50%) | $624 (25%) | $624 (25%) |
| Tier 3 Dual Subject | $3,997 | $3,997 | $1,999 (50%) | $999 (25%) | $999 (25%) |

## Stripe Setup
Create 8 new Stripe prices:
- Tier 1: $299, $298
- Tier 2: $549, $548
- Tier 3 Single: $1,249, $624, $624
- Tier 3 Dual: $1,999, $999, $999

## Implementation Steps

### 1. Create Stripe Prices
Use Stripe tools to create all 8 installment prices as one-time payments.

### 2. Update `src/lib/tierConfig.ts`
Add a `PAYMENT_PLANS` config object:

```typescript
export const PAYMENT_PLANS = {
  green: {
    fullPrice: 597,
    installments: [
      { label: "Deposit (50%)", amount: 299, paymentUrl: "..." },
      { label: "Final Payment (50%)", amount: 298, paymentUrl: "..." },
    ],
  },
  yellow: {
    fullPrice: 1097,
    installments: [
      { label: "Deposit (50%)", amount: 549, paymentUrl: "..." },
      { label: "Final Payment (50%)", amount: 548, paymentUrl: "..." },
    ],
  },
  red_single: {
    fullPrice: 2497,
    installments: [
      { label: "Deposit (50%)", amount: 1249, paymentUrl: "..." },
      { label: "Before Retest 1 (25%)", amount: 624, paymentUrl: "..." },
      { label: "Before Retest 2 (25%)", amount: 624, paymentUrl: "..." },
    ],
  },
  red_dual: {
    fullPrice: 3997,
    installments: [
      { label: "Deposit (50%)", amount: 1999, paymentUrl: "..." },
      { label: "Before Retest 1 (25%)", amount: 999, paymentUrl: "..." },
      { label: "Before Retest 2 (25%)", amount: 999, paymentUrl: "..." },
    ],
  },
};
```

### 3. Update `src/components/TierComponents.tsx`

**PlacementPathwayCard**: For Tier 1 and Tier 2 rows, add a small "Payment plan available" note under the price. Clicking "Enroll" will still go to the full-price link.

**RecommendedNextStepPanel**: For Tier 1 and Tier 2, add a collapsible section below the primary CTA:
- Toggle between "Option A -- Paid in Full" and "Option B -- Payment Plan"
- Option B shows a table with Deposit and Final Payment amounts, each with its own payment link button
- Tier 3 remains unchanged (consultation button only; admin handles installment links privately)

### 4. Update `PLACEMENT_PATHWAY` in tierConfig
Add a `planAvailable` flag to Tier 1 and Tier 2 entries so the pathway table can show the payment plan note.

## Files Modified
- `src/lib/tierConfig.ts` -- Add `PAYMENT_PLANS` config
- `src/components/TierComponents.tsx` -- Add payment plan toggle UI for Tier 1/2 in `RecommendedNextStepPanel` and a note in `PlacementPathwayCard`

## No Database Changes
Payment tracking is handled through Stripe. The Tier 3 installment links are for admin use only and stored in the config for reference.

