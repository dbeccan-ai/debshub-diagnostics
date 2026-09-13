// Pure TACHS entitlement + payment verification logic (no Deno/Supabase imports so it is unit-testable).

export const TACHS_EXAM_TYPE = "tachs";
/** Non-secret: the only Stripe account the owner authorises for payment processing. */
export const EXPECTED_STRIPE_ACCOUNT_ID = "acct_1SUg5a1qBeNCFEYA";

export type AccountCheck = { ok: true; accountId: string } | { ok: false; reason: string };

/** Verifies a retrieved Stripe account identity matches the owner-designated account. */
export function checkStripeAccount(account: { id?: string | null } | null | undefined): AccountCheck {
  const id = account?.id ?? "";
  if (!id) return { ok: false, reason: "Payment configuration error: Stripe account identity could not be verified." };
  if (id !== EXPECTED_STRIPE_ACCOUNT_ID) {
    return { ok: false, reason: `Payment configuration error: Stripe account ${id} is not the authorised payment account.` };
  }
  return { ok: true, accountId: id };
}
export const TACHS_NET_CENTS = 17500; // $175.00 base price
export const TACHS_CURRENCY = "usd";
export const TACHS_PRODUCT_NAME = "D.E.Bs TACHS Readiness Diagnostic";

/** Same customer-paid Stripe processing-fee gross-up used by create-checkout: ceil(((net + 0.30) / (1 - 0.029)) * 100). */
export const grossUpCents = (netDollars: number) => Math.ceil(((netDollars + 0.30) / (1 - 0.029)) * 100);

export interface TachsQuote { net_cents: number; fee_cents: number; total_cents: number; currency: string }
export function tachsQuote(): TachsQuote {
  const total = grossUpCents(TACHS_NET_CENTS / 100);
  return { net_cents: TACHS_NET_CENTS, fee_cents: total - TACHS_NET_CENTS, total_cents: total, currency: TACHS_CURRENCY };
}

export interface OrderLike {
  id: string; user_id: string; attempt_id: string | null; exam_type: string; payment_status: string;
  total_cents: number; currency: string; source?: string;
}
export interface AttemptLike { id: string; user_id: string; test_mode: boolean; access_source: string; status: string }

/** An order that unlocks TACHS: paid via Stripe or explicitly granted by an admin. Never any other exam. */
export const orderIsEntitlement = (o: OrderLike) =>
  o.exam_type === TACHS_EXAM_TYPE && (o.payment_status === "completed" || o.payment_status === "granted");

/** First entitlement not yet consumed by an attempt. */
export const unconsumedEntitlement = <T extends OrderLike>(orders: T[]) =>
  orders.find((o) => orderIsEntitlement(o) && !o.attempt_id) ?? null;

export const pendingOrder = <T extends OrderLike>(orders: T[]) =>
  orders.find((o) => o.exam_type === TACHS_EXAM_TYPE && o.payment_status === "pending") ?? null;

/** Whether an attempt may be taken/viewed by its student. Admins are handled separately by the caller. */
export const attemptIsEntitled = (a: AttemptLike) =>
  a.test_mode === true || ["paid", "admin_grant", "legacy"].includes(a.access_source);

export interface SessionLike {
  id: string; payment_status: string | null; currency: string | null;
  amount_total: number | null; amount_subtotal: number | null;
  total_details?: { amount_discount?: number | null } | null;
  metadata?: Record<string, string> | null; payment_intent?: string | { id: string } | null;
}

export type VerifyOutcome = { ok: true; amount_paid_cents: number; payment_intent_id: string | null } | { ok: false; reason: string };

/** Server-side checks: paid, TACHS metadata, correct user + order, exact amount/currency (promo discounts allowed via Stripe totals). */
export function verifySessionAgainstOrder(session: SessionLike, order: OrderLike, userId: string): VerifyOutcome {
  if (session.payment_status !== "paid") return { ok: false, reason: "Payment not completed" };
  const m = session.metadata ?? {};
  if (m.exam_type !== TACHS_EXAM_TYPE) return { ok: false, reason: "Session is not a TACHS payment" };
  if (m.user_id !== userId || order.user_id !== userId) return { ok: false, reason: "Session does not belong to this user" };
  if (m.order_id !== order.id) return { ok: false, reason: "Session does not match this order" };
  if ((session.currency ?? "").toLowerCase() !== order.currency.toLowerCase()) return { ok: false, reason: "Currency mismatch" };
  const discount = session.total_details?.amount_discount ?? 0;
  const subtotal = session.amount_subtotal ?? session.amount_total ?? 0;
  const total = session.amount_total ?? 0;
  if (subtotal !== order.total_cents) return { ok: false, reason: "Amount mismatch" };
  if (total !== subtotal - discount) return { ok: false, reason: "Amount mismatch" };
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  return { ok: true, amount_paid_cents: total, payment_intent_id: pi };
}

/** 8 uppercase letters for the integration identifier suffix. */
export function integrationIdentifier(rand: () => number = Math.random) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 8; i++) s += letters[Math.floor(rand() * letters.length)];
  return `debs_tachs_${s}`;
}
