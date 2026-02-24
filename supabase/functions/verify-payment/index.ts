import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BNDL-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId, attemptId } = await req.json();
    if (!sessionId || !attemptId) throw new Error("Session ID and Attempt ID are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { paymentStatus: session.payment_status, metadata: session.metadata });

    if (session.metadata?.attempt_id !== attemptId) {
      throw new Error("Session does not match attempt");
    }
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    logStep("Payment verified", { amountPaid });

    // Update test attempt
    const { error: updateError } = await supabaseAdmin
      .from("test_attempts")
      .update({ payment_status: "completed", amount_paid: amountPaid })
      .eq("id", attemptId)
      .eq("user_id", user.id);

    if (updateError) throw new Error(`Failed to update payment status: ${updateError.message}`);

    // Create payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        attempt_id: attemptId,
        amount: amountPaid,
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        currency: session.currency || "usd",
      });
    if (paymentError) logStep("Payment record error", { error: paymentError.message });

    // Generate coupon for bundle purchases
    let couponCode: string | null = null;
    const isBundle = session.metadata?.bundle === "true";

    if (isBundle) {
      couponCode = generateCouponCode();
      logStep("Generating bundle coupon", { couponCode });

      const { error: couponError } = await supabaseAdmin
        .from("coupons")
        .insert({
          code: couponCode,
          max_uses: 1,
          current_uses: 0,
          is_active: true,
        });

      if (couponError) {
        logStep("Coupon creation error", { error: couponError.message });
        // Try with a different code if collision
        couponCode = generateCouponCode() + Math.floor(Math.random() * 10);
        await supabaseAdmin.from("coupons").insert({
          code: couponCode,
          max_uses: 1,
          current_uses: 0,
          is_active: true,
        });
      }

      logStep("Bundle coupon created", { couponCode });

      // Send coupon email
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-bundle-coupon`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            email: user.email,
            couponCode,
            studentName: user.user_metadata?.full_name || "Student",
          }),
        });
        logStep("Coupon email sent", { status: emailResponse.status });
      } catch (emailErr) {
        logStep("Coupon email failed (non-blocking)", { error: String(emailErr) });
      }
    }

    logStep("Payment status updated successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Payment verified and recorded",
      couponCode,
      isBundle,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
