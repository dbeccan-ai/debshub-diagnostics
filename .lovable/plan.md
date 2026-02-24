

## Bundle Pricing ($199 ELA + Math) + Tier 3 Invitation-Only Changes

### Overview

Three major changes:
1. A **$199 Diagnostic Bundle** (ELA + Math) that auto-generates a coupon for the second test after payment
2. **Tier 3 becomes invitation-only** -- the CTA links to a consultation booking page instead of direct payment
3. **Stripe products** created for Tier 3 pricing (Single Subject $2,497 / Dual Subject $3,997) with payment links provided for manual use in parent decision letters

---

### Part 1: $199 Diagnostic Bundle

**New Stripe Product**: Create a "Diagnostic Bundle (ELA + Math)" product at $199 in Stripe.

**New "Bundle" option on the Tests page** (`src/pages/Tests.tsx`):
- Add a third card alongside Math and ELA: "Diagnostic Bundle -- ELA + Math" for $199 (saves vs. buying separately)
- When clicked, the flow creates a test attempt for the first subject (user picks Math or ELA first) and routes to checkout

**Updated Checkout page** (`src/pages/Checkout.tsx`):
- Detect bundle purchases (passed via query param or stored in test attempt metadata)
- Show "$199.00 -- Diagnostic Bundle (ELA + Math)" instead of individual pricing

**Updated `create-checkout` edge function**:
- Accept a `bundle: true` flag in the request body
- When bundle is true, use the $199 Stripe price ID and set `metadata.bundle = "true"` on the checkout session

**New edge function: `generate-bundle-coupon`**:
- Called after successful bundle payment verification
- Generates a unique 8-character coupon code (e.g., `BNDL-XXXX`)
- Inserts into the `coupons` table with `max_uses: 1`, linked to the user
- Returns the coupon code

**Updated `verify-payment` edge function**:
- After confirming bundle payment, call the coupon generation logic inline
- Store the generated coupon code in the response

**Updated Verify Payment page** (`src/pages/VerifyPayment.tsx`):
- For bundle payments: display the coupon code prominently on the success screen
- Show instructions: "Use this code to take your second diagnostic test for free"
- Include a "Copy Code" button

**Email the coupon** via the existing `send-test-results` edge function pattern:
- After bundle payment, send an email to the parent with the coupon code using Resend

**Database**: Add a `bundle_coupon_code` column to `coupons` table metadata or use the existing coupon system as-is (the auto-generated coupon is a standard coupon with max_uses=1).

---

### Part 2: Tier 3 -- Invitation Only

**Update `src/lib/tierConfig.ts`**:
- Change the Tier 3 (red) CTA:
  - Primary label: "Book a Consultation" (instead of "Book Tier 3 Intensive Intervention Plan")
  - Primary URL: `https://calendar.app.google/dHKRRWnqASeUpp4cA` (Google Calendar link)
  - Add subtitle text: "Tier 3 support is by invitation only. Book a consultation to discuss your child's needs."

- Update `PLACEMENT_PATHWAY` for Tier 3:
  - Change price display to "By Invitation" or "$2,497+" 
  - Change the Enroll button to "Book Consultation" linking to the Google Calendar

**Update `src/components/TierComponents.tsx`**:
- In `RecommendedNextStepPanel`: for Tier 3, the primary button opens the consultation link instead of a Stripe payment link
- Add a note below: "Tier 3 Intensive Intervention is by invitation only following a consultation."

---

### Part 3: Stripe Products for Tier 3

**Create two Stripe products** using the Stripe tools:
1. **Single Subject Tier 3 Intensive Intervention** -- $2,497
2. **Dual Subject Tier 3 Intensive Intervention** -- $3,997

**Create Stripe Payment Links** for each product so you can include them in parent decision letters manually.

These links will NOT be shown in the app (Tier 3 is invitation-only). They are for your use in communications with parents after consultation.

---

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/Tests.tsx` | Add Bundle card option with $199 pricing |
| `src/pages/Checkout.tsx` | Handle bundle flag, show $199 bundle price |
| `supabase/functions/create-checkout/index.ts` | Accept `bundle` flag, use bundle Stripe price, set bundle metadata |
| `supabase/functions/verify-payment/index.ts` | Generate coupon code for bundle payments, return it in response |
| `src/pages/VerifyPayment.tsx` | Display coupon code for bundle payments with copy button |
| `src/lib/tierConfig.ts` | Update Tier 3 CTA to consultation link, update placement pathway |
| `src/components/TierComponents.tsx` | Tier 3 button opens consultation link, add "invitation only" note |

**New files:**
| File | Purpose |
|------|---------|
| `supabase/functions/send-bundle-coupon/index.ts` | Email the auto-generated coupon to parent via Resend |

**Database migration:**
- No new tables needed -- the existing `coupons` and `coupon_redemptions` tables handle auto-generated bundle coupons

**Stripe products to create:**
1. Diagnostic Bundle (ELA + Math) -- $199 one-time
2. Single Subject Tier 3 Intensive Intervention -- $2,497 one-time  
3. Dual Subject Tier 3 Intensive Intervention -- $3,997 one-time

**Edge functions to deploy:** `create-checkout`, `verify-payment`, `send-bundle-coupon`

