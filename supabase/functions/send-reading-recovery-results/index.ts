import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      transcriptId, studentName, gradeBand, passageTitle,
      errorCount, tier, tierDescription, parentEmail, assessmentDate
    } = await req.json();

    if (!parentEmail || !transcriptId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tierColors: Record<string, { primary: string; secondary: string }> = {
      "Tier 1": { primary: "#10b981", secondary: "#d1fae5" },
      "Tier 2": { primary: "#f59e0b", secondary: "#fef3c7" },
      "Tier 3": { primary: "#ef4444", secondary: "#fee2e2" },
    };
    const tc = tierColors[tier] || tierColors["Tier 3"];

    const emailHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
.container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.header { background: ${tc.primary}; color: white; padding: 30px 20px; text-align: center; }
.header h1 { margin: 0; font-size: 24px; }
.content { padding: 40px 30px; }
.tier-badge { display: inline-block; background: ${tc.secondary}; color: ${tc.primary}; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
.score-box { background: ${tc.secondary}; border-left: 4px solid ${tc.primary}; padding: 20px; margin: 20px 0; border-radius: 5px; }
.section { margin: 25px 0; }
.section h3 { color: #667eea; margin-bottom: 10px; }
.footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>D.E.Bs LEARNING ACADEMY</h1>
    <p style="margin:10px 0 0;opacity:0.9;">Reading Recovery Programme Results</p>
  </div>
  <div class="content">
    <h2>Reading Assessment Results for ${studentName}</h2>
    <p>Dear Parent,</p>
    <p>Your child has completed a Reading Recovery diagnostic assessment. Here are the results:</p>
    <div class="score-box">
      <p><strong>Passage:</strong> ${passageTitle}</p>
      <p><strong>Grade Band:</strong> ${gradeBand}</p>
      <p><strong>Errors:</strong> ${errorCount ?? "N/A"}</p>
      <p><strong>Tier Placement:</strong> <span class="tier-badge">${tier}</span></p>
    </div>
    <div class="section">
      <h3>📊 What This Means</h3>
      <p>${tierDescription}</p>
    </div>
    ${tier === "Tier 3" ? `
    <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:5px;">
      <strong>Recommendation:</strong> Based on the results, we strongly recommend additional reading support. 
      Consider booking a tutor with D.E.Bs LEARNING ACADEMY to help your child improve.
    </div>` : ""}
    <p>Thank you for choosing D.E.Bs LEARNING ACADEMY. Contact us at 347-364-1906 or info@debslearnacademy.com with any questions.</p>
  </div>
  <div class="footer">
    <p>Assessment Date: ${assessmentDate}</p>
    <p>© ${new Date().getFullYear()} D.E.Bs LEARNING ACADEMY</p>
  </div>
</div></body></html>`;

    const resend = new Resend(resendApiKey);
    const { error: emailError } = await resend.emails.send({
      from: "D.E.Bs Learning Academy <noreply@debslearnacademy.com>",
      to: [parentEmail],
      subject: `Reading Recovery Results: ${studentName}`,
      html: emailHTML,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return new Response(JSON.stringify({ error: emailError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Reading Recovery results emailed to ${parentEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
