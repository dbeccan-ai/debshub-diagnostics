
# Fix Plan: ELA Reading Passages + Stripe Fee Pass-Through

## Issue 1: Reading Passages Not Showing in Section 2

**Root Cause:** The `TakeELATest.tsx` component flattens all questions from sections and subsections but **never renders the `passage` or `passage_title` fields** from the JSON data. Section II (Reading Comprehension) in the ELA test JSON stores the passage at the section level (e.g., `"passage_title": "The Forgotten Garden"`, `"passage": "In the heart of a bustling city..."`), but the test UI jumps straight to the questions without displaying the reading material students need to answer them.

**Fix:** Modify `TakeELATest.tsx` to:
1. Track which section/subsection each question belongs to during the flattening step, preserving any `passage` and `passage_title` associated with it.
2. When rendering a question that has an associated passage, display the passage title and full text above the question in a styled, scrollable card.
3. The passage should remain visible while the student answers all questions tied to that passage.

This means updating the `Question` interface to include optional `passage` and `passage_title` fields, and attaching them during the flatten loop from the parent section/subsection data. Section 1's `Part B: Reading Comprehension` (e.g., Grade 5's "The Amazing Octopus") also has passages at the subsection level, so both structures will be handled.

---

## Issue 2: Stripe Fees Charged to You Instead of the Customer

**Root Cause:** The `create-checkout/index.ts` function correctly grosses up the price for **individual test purchases** (lines 94-96: `grossAmount = Math.ceil(((netAmount + 0.30) / (1 - 0.029)) * 100)`), but the **Bundle price** (line 90) uses a fixed Stripe Price ID (`price_1T4PAs1qBeNCFEYAElvrmXgp`) which was likely created at the flat $199 amount without the gross-up. This means Stripe deducts its 2.9% + $0.30 fee from the $199, and you only receive ~$192.93.

Additionally, the Tier 3 enrollment payment links created in recent sessions were created at the exact dollar amounts ($1,499, $2,499, etc.) without fee gross-up applied.

**Fix:** Update `create-checkout/index.ts` to apply the same gross-up formula to the bundle price instead of using a fixed Stripe Price ID. Use `price_data` with a dynamically calculated `unit_amount`:
- Bundle net = $199 --> Gross = ceil(((199 + 0.30) / (1 - 0.029)) * 100) = $20,524 cents ($205.24)

For Tier 3 payment links: these are Stripe-hosted payment links (not created via the edge function), so the fee pass-through must be handled by creating new Stripe prices with the grossed-up amounts. However, since those use `allow_promotion_codes` on Stripe-hosted pages, the simplest approach is to update the prices on those payment links to include the gross-up. I will create corrected Stripe products/prices for each Tier 3 amount.

---

## Technical Steps

### Step 1: Fix passage rendering in TakeELATest.tsx
- Extend the `Question` interface with optional `passage?: string` and `passage_title?: string`
- During the flatten loop (lines 39-51), attach `passage` and `passage_title` from the parent section or subsection to each question
- In the render (around line 286), check if `currentQ.passage` exists and render it in a bordered, scrollable panel above the question card

### Step 2: Fix Stripe bundle fee pass-through
- In `create-checkout/index.ts`, replace the fixed `BUNDLE_PRICE_ID` approach with dynamic `price_data` using the gross-up formula for the $199 bundle
- Apply the same formula: `grossAmount = Math.ceil(((199 + 0.30) / (1 - 0.029)) * 100)` = 20524 cents ($205.24)

### Step 3: Create corrected Tier 3 Stripe prices (grossed-up)
- For each Tier 3 amount ($1,499 deposit, $749 installment, $2,499 deposit, $1,249 installment, $2,997 full, $4,997 full), create new grossed-up prices
- Update `tierConfig.ts` payment links to point to new payment links with corrected amounts
- Gross-up amounts:
  - $749 --> $772.07
  - $999 --> $1,029.75
  - $1,249 --> $1,286.40
  - $1,499 --> $1,543.74
  - $2,497 --> $2,571.55
  - $2,499 --> $2,573.61
  - $2,997 --> $3,086.29
  - $3,997 --> $4,115.74
  - $4,997 --> $5,145.19

### Step 4: Deploy and test
- Deploy updated `create-checkout` edge function
- Verify passage rendering on a Grade 6+ ELA test (Section II has a standalone passage)
- Verify passage rendering on Grade 5 Part B (subsection-level passage)
