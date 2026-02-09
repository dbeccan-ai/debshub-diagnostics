import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    // Create client with user's JWT for authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch attempt details with test and user info
    const { data: attempt, error: attemptError } = await serviceClient
      .from("test_attempts")
      .select(`
        *,
        tests (name, test_type),
        profiles (full_name)
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      console.error("Attempt fetch error:", attemptError);
      throw new Error("Test attempt not found");
    }

    // Verify user ownership
    if (attempt.user_id !== user.id) {
      console.error("Ownership check failed:", { attemptUserId: attempt.user_id, authUserId: user.id });
      return new Response(
        JSON.stringify({ error: "You do not have permission to access this certificate" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Determine tier badge color - Green for Tier 1, Yellow for Tier 2, Red for Tier 3
    const tierColors: { [key: string]: { border: string; bg: string; text: string; primary: string } } = {
      "Tier 1": { border: "#22c55e", bg: "#dcfce7", text: "#166534", primary: "#22c55e" }, // Green
      "Tier 2": { border: "#eab308", bg: "#fef9c3", text: "#854d0e", primary: "#eab308" }, // Yellow
      "Tier 3": { border: "#ef4444", bg: "#fee2e2", text: "#991b1b", primary: "#ef4444" }, // Red
    };

    const tierColor = tierColors[attempt.tier || "Tier 3"];

    // Generate certificate HTML
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      border: 15px solid ${tierColor.border};
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }
    .tagline {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }
    .title {
      text-align: center;
      font-size: 48px;
      color: ${tierColor.text};
      margin: 30px 0;
      font-weight: bold;
    }
    .subtitle {
      text-align: center;
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    .content {
      line-height: 2;
      font-size: 18px;
      color: #333;
    }
    .tier-badge {
      display: inline-block;
      background: ${tierColor.bg};
      color: ${tierColor.text};
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      border: 2px solid ${tierColor.border};
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 10px;
    }
    .section-title {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
      font-size: 20px;
    }
    .list {
      margin: 10px 0;
      padding-left: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid ${tierColor.border};
    }
    .date {
      color: #666;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">D.E.Bs LEARNING ACADEMY</div>
      <div class="tagline">Unlocking Brilliance Through Learning</div>
    </div>
    
    <div class="title">Certificate of Achievement</div>
    <div class="subtitle">This certifies that</div>
    
    <div class="content">
      <p style="text-align: center; font-size: 32px; font-weight: bold; color: #333; margin: 20px 0;">
        ${attempt.profiles?.full_name || "Student"}
      </p>
      
      <p style="text-align: center; font-size: 18px; margin: 30px 0;">
        has successfully completed the <strong>${attempt.tests?.name}</strong><br>
        and achieved a score of <strong>${attempt.score}%</strong><br>
        earning placement in <span class="tier-badge">${attempt.tier}</span>
      </p>
      
      <div class="section">
        <div class="section-title">🌟 Areas of Strength</div>
        <ul class="list">
          ${(attempt.strengths || []).map((s: string) => `<li>${s}</li>`).join("")}
        </ul>
      </div>
      
      ${
        (attempt.weaknesses || []).length > 0
          ? `
      <div class="section">
        <div class="section-title">📚 Areas for Growth</div>
        <ul class="list">
          ${(attempt.weaknesses || []).map((w: string) => `<li>${w}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }
    </div>
    
    <div class="footer">
      <div class="date">Issued on ${new Date(attempt.completed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</div>
    </div>
  </div>
</body>
</html>
    `;

    // Store certificate in storage
    const fileName = `certificate-${attemptId}.html`;
    const { error: uploadError } = await serviceClient.storage
      .from("certificates")
      .upload(fileName, new Blob([certificateHTML], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Build the view URL using the edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const viewUrl = `${supabaseUrl}/functions/v1/view-certificate?attemptId=${attemptId}`;

    // Save certificate record
    const { error: certError } = await serviceClient.from("certificates").upsert({
      attempt_id: attemptId,
      student_name: attempt.profiles?.full_name || "Student",
      test_name: attempt.tests?.name || "Test",
      tier: attempt.tier || "Tier 3",
      strengths: attempt.strengths || [],
      weaknesses: attempt.weaknesses || [],
      certificate_url: viewUrl,
    });

    if (certError) {
      console.error("Certificate record error:", certError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificateUrl: viewUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
