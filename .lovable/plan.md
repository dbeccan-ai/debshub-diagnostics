

# Custom Enrollment Landing Page

## What We're Building

A standalone, shareable enrollment page at `/enroll` that presents both **"Pay in Full"** and **"Payment Plan"** options side-by-side for any tier. This page can be linked directly from emails, decision letters, or shared as a URL (e.g., `debshub-diagnostics.lovable.app/enroll?tier=red`).

No login required -- parents simply click the link, see both options, and choose how to pay.

## Page Design

```text
+----------------------------------------------------------+
|  D.E.Bs LEARNING ACADEMY                                 |
|  Enrollment & Payment Options                            |
+----------------------------------------------------------+
|                                                          |
|  [Tier Badge: e.g. "Tier 3 - Intensive Intervention"]    |
|  Program: Intensive Intervention Plan                    |
|  Total Investment: $2,497                                |
|                                                          |
|  +------------------------+  +------------------------+  |
|  | OPTION A               |  | OPTION B               |  |
|  | Pay in Full            |  | Structured Tuition Plan |  |
|  |                        |  |                        |  |
|  | $2,497                 |  | 3 payments:            |  |
|  |                        |  | 1. Deposit: $1,249     |  |
|  | [Pay Now Button]       |  | 2. Before R1: $624     |  |
|  |                        |  | 3. Before R2: $624     |  |
|  |                        |  |                        |  |
|  |                        |  | [Pay Deposit Button]   |  |
|  +------------------------+  +------------------------+  |
|                                                          |
|  Questions? Contact info@debslearnacademy.com            |
+----------------------------------------------------------+
```

## URL Structure

- `/enroll?tier=green` -- Enrichment Pod ($597, 2-payment plan)
- `/enroll?tier=yellow` -- Skill Builder ($1,097, 2-payment plan)  
- `/enroll?tier=red` -- Intensive Intervention Single Subject ($2,497, 3-payment plan)
- `/enroll?tier=red&plan=dual` -- Intensive Intervention Dual Subject ($3,997, 3-payment plan)

## Technical Details

### 1. New Page: `src/pages/Enroll.tsx`

- Reads `tier` and optional `plan` from URL query parameters
- Uses existing `PAYMENT_PLANS`, `TIER_LABELS`, `TIER_CTAS`, and `CTA_STYLES` from `tierConfig.ts`
- Displays two cards side-by-side (stacked on mobile):
  - **Option A**: Pay in Full with a single Stripe payment link button
  - **Option B**: Structured Tuition Plan with installment breakdown table and individual payment links for each installment
- Branded with D.E.Bs header and academy styling
- No authentication required -- fully public page
- Falls back to a "Contact Us" message if an invalid tier is provided

### 2. New Route in `src/App.tsx`

- Add `<Route path="/enroll" element={<Enroll />} />`

### 3. No Changes to `tierConfig.ts`

- All pricing, payment URLs, and installment data already exist in the config -- the new page simply reads from it

### Key Behaviors

- For **Tier 3 (red)**, the "Pay in Full" card links to the full consultation booking for context, while each installment row has its own "Pay Now" Stripe link
- For **Tiers 1 and 2**, the "Pay in Full" card uses the existing CTA payment link, and Option B shows the 2-installment split
- The `?plan=dual` parameter on Tier 3 switches between single-subject ($2,497) and dual-subject ($3,997) pricing
- Responsive layout: side-by-side on desktop, stacked on mobile

