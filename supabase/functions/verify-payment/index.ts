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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role for updating payment status
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Use anon key for user auth
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get request body
    const { sessionId, attemptId } = await req.json();
    if (!sessionId || !attemptId) throw new Error("Session ID and Attempt ID are required");
    logStep("Request body", { sessionId, attemptId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      metadata: session.metadata 
    });

    // Verify session metadata matches
    if (session.metadata?.attempt_id !== attemptId) {
      throw new Error("Session does not match attempt");
    }
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      logStep("Payment not completed", { status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get amount paid
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    logStep("Payment verified", { amountPaid });

    // Update test attempt with service role (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from("test_attempts")
      .update({ 
        payment_status: "completed",
        amount_paid: amountPaid
      })
      .eq("id", attemptId)
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Update error", { error: updateError.message });
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }

    // Create payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        attempt_id: attemptId,
        amount: amountPaid,
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        currency: session.currency || "usd"
      });

    if (paymentError) {
      logStep("Payment record error", { error: paymentError.message });
      // Don't throw - payment was successful, just logging failed
    }

    logStep("Payment status updated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified and recorded" 
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
