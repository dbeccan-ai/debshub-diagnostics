// Verifies a Stripe Checkout Session for a TACHS order server-side and records the entitlement (idempotent).
// Body: { sessionId, orderId }
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { verifySessionAgainstOrder, checkStripeAccount } from "../_shared/tachs-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const log = (step: string, details?: unknown) => console.log(`[VERIFY-TACHS-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Please sign in to continue." }, 401);
    const { data: { user }, error: authErr } = await db.auth.getUser(token);
    if (authErr || !user) return json({ error: "Please sign in to continue." }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 200) : "";
    const orderId = typeof body.orderId === "string" ? body.orderId.slice(0, 64) : "";
    if (!sessionId || !orderId) return json({ error: "Session ID and order ID are required." }, 400);

    const { data: order } = await db.from("tachs_orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
    if (!order) return json({ error: "Order not found." }, 404);

    // Idempotent: already verified for this same session.
    if (order.payment_status === "completed" && order.stripe_checkout_session_id === sessionId) {
      return json({ success: true, alreadyVerified: true, order: publicOrder(order) });
    }
    if (order.payment_status === "granted") return json({ success: true, alreadyVerified: true, order: publicOrder(order) });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    log("session", { id: session.id, payment_status: session.payment_status, amount_total: session.amount_total });

    const outcome = verifySessionAgainstOrder(session as never, order, user.id);
    if (!outcome.ok) {
      if (outcome.reason === "Payment not completed") return json({ success: false, message: outcome.reason });
      log("rejected", { reason: outcome.reason });
      return json({ success: false, message: outcome.reason }, 409);
    }

    // Atomic transition pending -> completed. If it lost a race, the other request already recorded it.
    const { data: updated } = await db.from("tachs_orders").update({
      payment_status: "completed", amount_paid_cents: outcome.amount_paid_cents,
      stripe_checkout_session_id: session.id, stripe_payment_intent_id: outcome.payment_intent_id,
      verified_at: new Date().toISOString(),
    }).eq("id", order.id).eq("payment_status", "pending").select("*").maybeSingle();

    if (!updated) {
      const { data: again } = await db.from("tachs_orders").select("*").eq("id", order.id).single();
      if (again?.payment_status === "completed") return json({ success: true, alreadyVerified: true, order: publicOrder(again) });
      return json({ success: false, message: "Order could not be updated." }, 409);
    }
    log("verified", { orderId: order.id });
    return json({ success: true, order: publicOrder(updated) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});

function publicOrder(o: Record<string, unknown>) {
  return {
    id: o.id, payment_status: o.payment_status, net_cents: o.net_amount_cents, fee_cents: o.fee_cents, total_cents: o.total_cents,
    amount_paid_cents: o.amount_paid_cents, currency: o.currency, verified_at: o.verified_at,
  };
}
