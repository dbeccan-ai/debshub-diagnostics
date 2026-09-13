// Creates/reuses a pending TACHS order and (optionally) a Stripe-hosted Checkout Session for it.
// Body: { mode: "quote" | "session" }
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  TACHS_EXAM_TYPE, TACHS_PRODUCT_NAME, tachsQuote, unconsumedEntitlement, pendingOrder, integrationIdentifier,
} from "../_shared/tachs-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const log = (step: string, details?: unknown) => console.log(`[CREATE-TACHS-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Please sign in to continue." }, 401);
    const { data: { user }, error: authErr } = await db.auth.getUser(token);
    if (authErr || !user?.email) return json({ error: "Please sign in to continue." }, 401);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "session" ? "session" : "quote";
    log("start", { userId: user.id, mode });

    const { data: orders } = await db.from("tachs_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const all = orders ?? [];
    const quote = tachsQuote();

    if (unconsumedEntitlement(all)) return json({ alreadyEntitled: true, quote });

    // Reuse the single pending order per user (unique index enforces this) or create one.
    let order = pendingOrder(all);
    if (!order) {
      const { data: created, error } = await db.from("tachs_orders").insert({
        user_id: user.id, exam_type: TACHS_EXAM_TYPE, source: "stripe",
        net_amount_cents: quote.net_cents, fee_cents: quote.fee_cents, total_cents: quote.total_cents, currency: quote.currency,
        payment_status: "pending", integration_identifier: integrationIdentifier(),
      }).select("*").single();
      if (error || !created) {
        // Race: another request created it first.
        const { data: again } = await db.from("tachs_orders").select("*").eq("user_id", user.id).eq("payment_status", "pending").maybeSingle();
        if (!again) throw new Error(error?.message ?? "Could not create order");
        order = again;
      } else order = created;
    } else if (order.total_cents !== quote.total_cents) {
      // Keep the pending order aligned with the current server-side price.
      const { data: fixed } = await db.from("tachs_orders").update({
        net_amount_cents: quote.net_cents, fee_cents: quote.fee_cents, total_cents: quote.total_cents, currency: quote.currency, stripe_checkout_session_id: null,
      }).eq("id", order.id).select("*").single();
      if (fixed) order = fixed;
    }

    const publicOrder = { id: order.id, payment_status: order.payment_status, net_cents: order.net_amount_cents, fee_cents: order.fee_cents, total_cents: order.total_cents, currency: order.currency };
    if (mode === "quote") return json({ alreadyEntitled: false, order: publicOrder, quote });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Reuse a still-open session to avoid duplicate simultaneous sessions.
    if (order.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
        if (existing.status === "open" && existing.url && existing.amount_total === order.total_cents) {
          log("reusing open session", { sessionId: existing.id });
          return json({ alreadyEntitled: false, order: publicOrder, url: existing.url });
        }
        if (existing.status === "complete" && existing.payment_status === "paid") {
          return json({ alreadyEntitled: false, order: publicOrder, verifyPending: true, sessionId: existing.id });
        }
      } catch (e) { log("could not retrieve prior session", { error: String(e) }); }
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: order.currency,
          unit_amount: order.total_cents,
          product_data: {
            name: TACHS_PRODUCT_NAME,
            description: `Base price $${(order.net_amount_cents / 100).toFixed(2)} + processing fee $${(order.fee_cents / 100).toFixed(2)}. Six timed adaptive sections with an immediate readiness report.`,
          },
        },
      }],
      success_url: `${origin}/tachs/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/tachs/checkout?order_id=${order.id}&canceled=1`,
      metadata: {
        exam_type: TACHS_EXAM_TYPE, user_id: user.id, order_id: order.id,
        net_cents: String(order.net_amount_cents), fee_cents: String(order.fee_cents),
        integration_identifier: order.integration_identifier ?? integrationIdentifier(),
      },
    });
    await db.from("tachs_orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    log("session created", { sessionId: session.id, orderId: order.id });
    return json({ alreadyEntitled: false, order: publicOrder, url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
