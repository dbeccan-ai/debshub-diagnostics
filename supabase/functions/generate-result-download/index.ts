import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attemptId, format } = await req.json();

    if (!attemptId || !format) {
      throw new Error("Missing attemptId or format");
    }

    if (!["pdf", "png"].includes(format)) {
      throw new Error("Invalid format. Must be 'pdf' or 'png'");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch attempt details
    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .select(`
        *,
        tests (name, test_type),
        profiles (full_name)
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new Error("Test attempt not found");
    }

    if (!attempt.completed_at) {
      throw new Error("Test is not completed yet");
    }

    // Determine tier colors
    const tierColors: { [key: string]: { primary: string; border: string; bg: string } } = {
      "Tier 1": { primary: "#10b981", border: "#ffd700", bg: "#d1fae5" },
      "Tier 2": { primary: "#f59e0b", border: "#c0c0c0", bg: "#fef3c7" },
      "Tier 3": { primary: "#ef4444", border: "#cd7f32", bg: "#fee2e2" },
    };

    const tierColor = tierColors[attempt.tier || "Tier 3"];

    // Generate HTML for the result
    const resultHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      padding: 40px;
      background: white;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      border: 12px solid ${tierColor.border};
      padding: 60px 40px;
      background: linear-gradient(135deg, #ffffff 0%, ${tierColor.bg} 100%);
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid ${tierColor.primary};
      padding-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 10px;
    }
    .tagline {
      font-size: 14px;
      color: #64748b;
      font-style: italic;
    }
    .title {
      text-align: center;
      font-size: 28px;
      color: ${tierColor.primary};
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      margin: 30px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      margin: 10px 0;
      background: white;
      border-left: 4px solid ${tierColor.primary};
      border-radius: 4px;
    }
    .label {
      font-weight: bold;
      color: #475569;
    }
    .value {
      color: #1e293b;
      font-weight: 600;
    }
    .score-box {
      background: ${tierColor.bg};
      border: 3px solid ${tierColor.primary};
      padding: 30px;
      margin: 30px 0;
      border-radius: 10px;
      text-align: center;
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: ${tierColor.primary};
      margin-bottom: 10px;
    }
    .tier-badge {
      display: inline-block;
      background: ${tierColor.primary};
      color: white;
      padding: 10px 30px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 18px;
    }
    .section {
      margin: 25px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }
    .section-title {
      color: ${tierColor.primary};
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      border-bottom: 2px solid ${tierColor.bg};
      padding-bottom: 10px;
    }
    .list {
      list-style: none;
      padding: 0;
    }
    .list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      color: #334155;
    }
    .list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${tierColor.primary};
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid ${tierColor.bg};
    }
    .footer-text {
      color: #64748b;
      font-size: 12px;
    }
    .date {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">D.E.Bs LEARNING ACADEMY</div>
      <div class="tagline">Unlocking Brilliance Through Learning</div>
    </div>
    
    <div class="title">Test Result Certificate</div>
    
    <div class="content">
      <div class="info-row">
        <span class="label">Student Name:</span>
        <span class="value">${attempt.profiles?.full_name}</span>
      </div>
      <div class="info-row">
        <span class="label">Grade Level:</span>
        <span class="value">Grade ${attempt.grade_level || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="label">Test Type:</span>
        <span class="value">${attempt.tests?.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Date Completed:</span>
        <span class="value">${new Date(attempt.completed_at).toLocaleDateString()}</span>
      </div>
      
      <div class="score-box">
        <div class="score">${attempt.score}%</div>
        <div class="tier-badge">${attempt.tier}</div>
      </div>
      
      ${
        (attempt.strengths || []).length > 0
          ? `
      <div class="section">
        <div class="section-title">🌟 Areas of Strength</div>
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
      <div class="footer-text">
        This certificate is awarded to ${attempt.profiles?.full_name} for completing
        the ${attempt.tests?.name} with a score of ${attempt.score}% (${attempt.tier}).
      </div>
      <div class="date">
        Issued on ${new Date().toLocaleDateString()}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // For PNG format, we need to use a screenshot service or return HTML that client can convert
    // For PDF, we can use a PDF generation service
    // Since we're in a Deno environment, we'll return the HTML and let the client handle conversion
    // or we can use a third-party service

    // For now, let's return the HTML and instructions for the client to convert
    // A better approach would be to use Puppeteer or similar, but that's complex in edge functions

    // Alternative: Store the HTML and return a reference, let client convert using html2canvas/jsPDF
    const fileName = `result-${attemptId}.html`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("certificates")
      .upload(fileName, resultHTML, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from("certificates")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        html: resultHTML,
        url: publicUrl,
        format,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating result download:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
