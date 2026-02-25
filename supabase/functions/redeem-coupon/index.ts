import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-COUPON] ${step}${detailsStr}`);
};

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { code, attemptId } = await req.json();
    if (!code || !attemptId) throw new Error("Coupon code and attempt ID are required");
    logStep("Request body", { code, attemptId });

    // Get coupon
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      logStep("Invalid coupon", { error: couponError?.message });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Invalid or expired coupon code" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if coupon has expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      logStep("Coupon expired", { expires_at: coupon.expires_at });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "This coupon has expired" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Coupon found", { couponId: coupon.id, currentUses: coupon.current_uses, maxUses: coupon.max_uses });

    // Check if max uses reached
    if (coupon.current_uses >= coupon.max_uses) {
      logStep("Coupon limit reached");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "This coupon has reached its maximum usage limit" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user already used this coupon
    const { data: existingRedemption } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .single();

    if (existingRedemption) {
      logStep("User already used coupon");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "You have already used this coupon" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify attempt belongs to user
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select("id, user_id, payment_status")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (attemptError || !attempt) {
      logStep("Invalid attempt", { error: attemptError?.message });
      throw new Error("Invalid test attempt");
    }

    if (attempt.payment_status === "completed") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "This test has already been paid for" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create redemption record
    const { error: redemptionError } = await supabaseAdmin
      .from("coupon_redemptions")
      .insert({
        coupon_id: coupon.id,
        user_id: user.id,
        attempt_id: attemptId
      });

    if (redemptionError) {
      logStep("Redemption error", { error: redemptionError.message });
      throw new Error("Failed to redeem coupon");
    }

    // Increment coupon usage
    const { error: updateCouponError } = await supabaseAdmin
      .from("coupons")
      .update({ current_uses: coupon.current_uses + 1 })
      .eq("id", coupon.id);

    if (updateCouponError) {
      logStep("Update coupon error", { error: updateCouponError.message });
    }

    // Mark test attempt as paid (with $0)
    const { error: updateAttemptError } = await supabaseAdmin
      .from("test_attempts")
      .update({ 
        payment_status: "completed",
        amount_paid: 0
      })
      .eq("id", attemptId);

    if (updateAttemptError) {
      logStep("Update attempt error", { error: updateAttemptError.message });
      throw new Error("Failed to update payment status");
    }

    logStep("Coupon redeemed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Coupon applied successfully! Your test is now free." 
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
