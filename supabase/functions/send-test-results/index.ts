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
    const { attemptId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch attempt details with all related data
    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .select(`
        *,
        tests (name, test_type),
        profiles (full_name, parent_email, grade_level)
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new Error("Test attempt not found");
    }

    const parentEmail = attempt.profiles?.parent_email;
    if (!parentEmail) {
      throw new Error("Parent email not found");
    }

    // Fetch certificate
    const { data: certificate } = await supabaseClient
      .from("certificates")
      .select("certificate_url")
      .eq("attempt_id", attemptId)
      .single();

    // Determine tier colors for email styling
    const tierColors: { [key: string]: { primary: string; secondary: string } } = {
      "Tier 1": { primary: "#10b981", secondary: "#d1fae5" }, // Green
      "Tier 2": { primary: "#f59e0b", secondary: "#fef3c7" }, // Yellow
      "Tier 3": { primary: "#ef4444", secondary: "#fee2e2" }, // Red
    };

    const tierColor = tierColors[attempt.tier || "Tier 3"];

    // Generate email HTML
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: ${tierColor.primary};
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .tier-badge {
      display: inline-block;
      background: ${tierColor.secondary};
      color: ${tierColor.primary};
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 16px;
      margin: 10px 0;
    }
    .score-box {
      background: ${tierColor.secondary};
      border-left: 4px solid ${tierColor.primary};
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .score-box h2 {
      margin: 0 0 10px 0;
      color: ${tierColor.primary};
    }
    .section {
      margin: 25px 0;
    }
    .section h3 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .list {
      list-style-type: none;
      padding: 0;
    }
    .list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    .list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${tierColor.primary};
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background: ${tierColor.primary};
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .tier3-message {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>D.E.Bs LEARNING ACADEMY</h1>
      <p>Unlocking Brilliance Through Learning</p>
    </div>
    
    <div class="content">
      <h2>Test Results for ${attempt.profiles?.full_name}</h2>
      
      <p>Dear Parent,</p>
      
      <p>Your child has completed the <strong>${attempt.tests?.name}</strong>. Here are the results:</p>
      
      <div class="score-box">
        <h2>Score: ${attempt.score}%</h2>
        <p>Tier Placement: <span class="tier-badge">${attempt.tier}</span></p>
      </div>
      
      ${
        (attempt.strengths || []).length > 0
          ? `
      <div class="section">
        <h3>🌟 Areas of Strength</h3>
        <ul class="list">
          ${(attempt.strengths || []).map((s: string) => `<li>${s}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
      
      ${
        (attempt.weaknesses || []).length > 0
          ? `
      <div class="section">
        <h3>📚 Areas for Growth</h3>
        <ul class="list">
          ${(attempt.weaknesses || []).map((w: string) => `<li>${w}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
      
      ${
        attempt.tier === "Tier 3"
          ? `
      <div class="tier3-message">
        <strong>Recommendation:</strong> Based on the results, we strongly recommend additional support. 
        Consider booking a tutor with D.E.Bs LEARNING ACADEMY to help your child improve in the identified areas.
      </div>
      `
          : ""
      }
      
      ${
        certificate?.certificate_url
          ? `
      <p style="text-align: center;">
        <a href="${certificate.certificate_url}" class="button">
          View Certificate
        </a>
      </p>
      `
          : ""
      }
      
      <p>Thank you for choosing D.E.Bs LEARNING ACADEMY. If you have any questions about these results, 
      please don't hesitate to contact us.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} D.E.Bs LEARNING ACADEMY</p>
      <p>This email was sent automatically. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { error: emailError } = await resend.emails.send({
      from: "D.E.Bs Learning Academy <onboarding@resend.dev>",
      to: [parentEmail],
      subject: `Test Results: ${attempt.tests?.name} - ${attempt.profiles?.full_name}`,
      html: emailHTML,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw emailError;
    }

    console.log(`Email sent successfully to ${parentEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
