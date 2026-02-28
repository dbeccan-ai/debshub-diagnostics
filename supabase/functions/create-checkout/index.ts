import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Gross-up formula: customer pays Stripe fees
const grossUp = (net: number) => Math.ceil(((net + 0.30) / (1 - 0.029)) * 100);

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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { attemptId, bundle } = await req.json();
    if (!attemptId) throw new Error("Attempt ID is required");
    logStep("Request body", { attemptId, bundle });

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("test_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .single();

    if (attemptError || !attempt) {
      throw new Error("Test attempt not found or access denied");
    }
    logStep("Attempt found", { attemptId: attempt.id, gradeLevel: attempt.grade_level });

    const { data: testData } = await supabaseAdmin
      .from("tests")
      .select("name, test_type")
      .eq("id", attempt.test_id)
      .single();

    if (attempt.payment_status === "completed") {
      throw new Error("This test has already been paid for");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const testName = testData?.name || "Diagnostic Test";
    const isBundle = bundle === true;

    let lineItems;
    if (isBundle) {
      // Bundle net = $199 → gross up so Stripe fees are on customer
      const bundleGross = grossUp(199);
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: { name: "Diagnostic Bundle (Math + ELA)", description: "Both Math and ELA diagnostic tests" },
          unit_amount: bundleGross,
        },
        quantity: 1,
      }];
      logStep("Bundle checkout", { net: 199, gross: bundleGross });
    } else {
      // Individual test pricing with fee gross-up
      const gradeLevel = attempt.grade_level || 5;
      const netAmount = gradeLevel <= 6 ? 99 : 120;
      const grossAmount = grossUp(netAmount);
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: { name: testName, description: `Grade ${gradeLevel} diagnostic test` },
          unit_amount: grossAmount,
        },
        quantity: 1,
      }];
      logStep("Individual checkout", { gradeLevel, netAmount, grossAmount });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/verify-payment?session_id={CHECKOUT_SESSION_ID}&attempt_id=${attemptId}`,
      cancel_url: `${origin}/checkout/${attemptId}${isBundle ? "?bundle=true" : ""}`,
      metadata: {
        attempt_id: attemptId,
        user_id: user.id,
        grade_level: (attempt.grade_level || 5).toString(),
        bundle: isBundle ? "true" : "false",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
