import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  attemptIsEntitled, unconsumedEntitlement, pendingOrder, tachsQuote, verifySessionAgainstOrder, integrationIdentifier, grossUpCents, checkStripeAccount, EXPECTED_STRIPE_ACCOUNT_ID,
} from "../supabase/functions/_shared/tachs-payment.ts";

const USER = "11111111-1111-1111-1111-111111111111";
const order = (over: Partial<Parameters<typeof unconsumedEntitlement>[0][number]> = {}) => ({
  id: "order-1", user_id: USER, attempt_id: null, exam_type: "tachs", payment_status: "completed", total_cents: tachsQuote().total_cents, currency: "usd", source: "stripe", ...over,
});
const attempt = (over: Partial<Parameters<typeof attemptIsEntitled>[0]> = {}) => ({
  id: "a1", user_id: USER, test_mode: false, access_source: "unentitled", status: "in_progress", ...over,
});

describe("pricing", () => {
  it("uses $175 base plus the same gross-up formula as create-checkout", () => {
    const q = tachsQuote();
    expect(q.net_cents).toBe(17500);
    expect(q.total_cents).toBe(Math.ceil(((175 + 0.30) / (1 - 0.029)) * 100));
    expect(q.fee_cents).toBe(q.total_cents - 17500);
    expect(grossUpCents(99)).toBe(Math.ceil(((99 + 0.30) / (1 - 0.029)) * 100));
    const src = readFileSync("supabase/functions/create-checkout/index.ts", "utf8");
    expect(src).toMatch(/Math\.ceil\(\(\(net \+ 0\.30\) \/ \(1 - 0\.029\)\) \* 100\)/);
  });
  it("never enables automatic tax or fixed payment_method_types", () => {
    const src = readFileSync("supabase/functions/create-tachs-checkout/index.ts", "utf8");
    expect(src).not.toMatch(/automatic_tax/);
    expect(src).not.toMatch(/payment_method_types/);
    expect(src).toMatch(/name: TACHS_PRODUCT_NAME/);
    expect(readFileSync("supabase/functions/_shared/tachs-payment.ts", "utf8")).toMatch(/"D\.E\.Bs TACHS Readiness Diagnostic"/);
  });
});

describe("student gating", () => {
  it("student cannot start unpaid (no entitlement)", () => {
    expect(unconsumedEntitlement([])).toBeNull();
    expect(unconsumedEntitlement([order({ payment_status: "pending" })])).toBeNull();
    expect(attemptIsEntitled(attempt())).toBe(false);
  });
  it("completed TACHS payment unlocks TACHS only once", () => {
    expect(unconsumedEntitlement([order()])?.id).toBe("order-1");
    expect(unconsumedEntitlement([order({ attempt_id: "a1" })])).toBeNull();
    expect(attemptIsEntitled(attempt({ access_source: "paid" }))).toBe(true);
  });
  it("a PSAT/SAT or other diagnostic payment does not unlock TACHS", () => {
    expect(unconsumedEntitlement([order({ exam_type: "psat" }), order({ id: "o2", exam_type: "sat" }), order({ id: "o3", exam_type: "math_diagnostic" })])).toBeNull();
  });
  it("admin TEST MODE and explicit admin grant work; legacy preserved", () => {
    expect(attemptIsEntitled(attempt({ test_mode: true }))).toBe(true);
    expect(attemptIsEntitled(attempt({ access_source: "admin_grant" }))).toBe(true);
    expect(attemptIsEntitled(attempt({ access_source: "legacy" }))).toBe(true);
    expect(unconsumedEntitlement([order({ payment_status: "granted", source: "admin_grant", total_cents: 0 })])?.source).toBe("admin_grant");
  });
  it("pending orders are reused rather than duplicated", () => {
    expect(pendingOrder([order({ payment_status: "pending" })])?.id).toBe("order-1");
    expect(pendingOrder([order()])).toBeNull();
  });
  it("engine enforces entitlement server-side on attempt actions and start", () => {
    const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
    expect(engine).toMatch(/if \(!admin && !attemptIsEntitled\(attempt\)\) return json\(\{ error: PAYMENT_REQUIRED_MSG, payment_required: true \}, 402\)/);
    expect(engine).toMatch(/const testMode = !!body\.testMode && admin;/);
    expect(engine).toMatch(/action === "admin_grant_access"[\s\S]*?if \(!admin\) return json\(\{ error: "Forbidden" \}, 403\)/);
  });
});

describe("Stripe session verification", () => {
  const o = order({ payment_status: "pending" });
  const good = () => ({
    id: "cs_test", payment_status: "paid", currency: "usd", amount_total: o.total_cents, amount_subtotal: o.total_cents,
    total_details: { amount_discount: 0 }, payment_intent: "pi_1",
    metadata: { exam_type: "tachs", user_id: USER, order_id: o.id },
  });
  it("accepts a matching paid session", () => {
    const r = verifySessionAgainstOrder(good(), o, USER);
    expect(r).toEqual({ ok: true, amount_paid_cents: o.total_cents, payment_intent_id: "pi_1" });
  });
  it("rejects unpaid, wrong exam, wrong user, wrong order", () => {
    expect(verifySessionAgainstOrder({ ...good(), payment_status: "unpaid" }, o, USER)).toMatchObject({ ok: false });
    expect(verifySessionAgainstOrder({ ...good(), metadata: { ...good().metadata, exam_type: "psat" } }, o, USER)).toMatchObject({ ok: false, reason: "Session is not a TACHS payment" });
    expect(verifySessionAgainstOrder(good(), o, "other-user")).toMatchObject({ ok: false });
    expect(verifySessionAgainstOrder({ ...good(), metadata: { ...good().metadata, order_id: "x" } }, o, USER)).toMatchObject({ ok: false, reason: "Session does not match this order" });
  });
  it("rejects amount and currency mismatches", () => {
    expect(verifySessionAgainstOrder({ ...good(), amount_total: 100, amount_subtotal: 100 }, o, USER)).toMatchObject({ ok: false, reason: "Amount mismatch" });
    expect(verifySessionAgainstOrder({ ...good(), amount_total: o.total_cents - 1 }, o, USER)).toMatchObject({ ok: false, reason: "Amount mismatch" });
    expect(verifySessionAgainstOrder({ ...good(), currency: "cad" }, o, USER)).toMatchObject({ ok: false, reason: "Currency mismatch" });
  });
  it("allows a Stripe promotion-code discount when totals reconcile", () => {
    const r = verifySessionAgainstOrder({ ...good(), amount_total: o.total_cents - 1000, total_details: { amount_discount: 1000 } }, o, USER);
    expect(r).toMatchObject({ ok: true, amount_paid_cents: o.total_cents - 1000 });
  });
  it("verification is idempotent (pure check + guarded pending->completed transition)", () => {
    expect(verifySessionAgainstOrder(good(), o, USER)).toEqual(verifySessionAgainstOrder(good(), o, USER));
    const src = readFileSync("supabase/functions/verify-tachs-payment/index.ts", "utf8");
    expect(src).toMatch(/\.eq\("payment_status", "pending"\)/);
    expect(src).toMatch(/alreadyVerified: true/);
  });
  it("builds an integration identifier with an 8-letter suffix", () => {
    expect(integrationIdentifier(() => 0)).toBe("debs_tachs_AAAAAAAA");
    expect(integrationIdentifier()).toMatch(/^debs_tachs_[A-Z]{8}$/);
  });
});

describe("designated Stripe account", () => {
  it("accepts only the owner-designated account id", () => {
    expect(EXPECTED_STRIPE_ACCOUNT_ID).toBe("acct_1SUg5a1qBeNCFEYA");
    expect(checkStripeAccount({ id: EXPECTED_STRIPE_ACCOUNT_ID })).toEqual({ ok: true, accountId: EXPECTED_STRIPE_ACCOUNT_ID });
  });
  it("rejects a different or unverifiable account", () => {
    expect(checkStripeAccount({ id: "acct_OTHER123" })).toMatchObject({ ok: false });
    expect(checkStripeAccount({ id: "" })).toMatchObject({ ok: false });
    expect(checkStripeAccount(null)).toMatchObject({ ok: false });
  });
  it("both payment functions block with 503 before touching a session", () => {
    for (const f of ["create-tachs-checkout", "verify-tachs-payment"]) {
      const src = readFileSync(`supabase/functions/${f}/index.ts`, "utf8");
      expect(src).toMatch(/checkStripeAccount\(account\)/);
      expect(src).toMatch(/if \(!accountCheck\.ok\) \{[\s\S]*?503\);/);
      const guardAt = src.indexOf("accountCheck.ok");
      expect(guardAt).toBeGreaterThan(-1);
      expect(src.indexOf("checkout.sessions")).toBeGreaterThan(guardAt);
    }
  });
});
