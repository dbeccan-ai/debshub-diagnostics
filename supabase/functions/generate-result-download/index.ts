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

    // Determine tier colors - Green for Tier 1, Yellow for Tier 2, Red for Tier 3
    const tierColors: { [key: string]: { primary: string; border: string; bg: string } } = {
      "Tier 1": { primary: "#22c55e", border: "#22c55e", bg: "#dcfce7" }, // Green
      "Tier 2": { primary: "#eab308", border: "#eab308", bg: "#fef9c3" }, // Yellow
      "Tier 3": { primary: "#ef4444", border: "#ef4444", bg: "#fee2e2" }, // Red
    };

    const tierColor = tierColors[attempt.tier || "Tier 3"];

    // Calculate pie chart percentages
    const correctPercentage = attempt.score || 0;
    const incorrectPercentage = 100 - correctPercentage;
    
    // Tier-specific messaging
    const tierMessages: { [key: string]: { explanation: string; nextSteps: string } } = {
      "Tier 1": {
        explanation: "Congratulations! Your student has mastered the topics covered in this diagnostic test and is ready for advanced topics.",
        nextSteps: "Your child is performing above grade level. Continue challenging them with advanced materials and consider enrichment opportunities."
      },
      "Tier 2": {
        explanation: "Your student is performing at or near grade level and would benefit from targeted support in specific areas.",
        nextSteps: "Register for our 10-session support program. Your student will receive automatic diagnostic retries at sessions 5 and 10 to track progress and ensure continuous improvement."
      },
      "Tier 3": {
        explanation: "Your student is currently performing below grade level and needs strong, consistent support to build foundational skills.",
        nextSteps: "Register for our comprehensive 15-session support program. Your student will receive automatic diagnostic retries at sessions 7, 10, and 15 to monitor growth and adjust instruction as needed."
      }
    };

    const tierMessage = tierMessages[attempt.tier || "Tier 3"];

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
    .page {
      page-break-after: always;
      margin-bottom: 60px;
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
    
    /* Page 2 Styles */
    .report-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 25px;
      background: white;
      border: 2px solid ${tierColor.primary};
    }
    .pie-chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 15px 0;
      gap: 30px;
    }
    .pie-chart {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: conic-gradient(
        ${tierColor.primary} 0% ${correctPercentage}%,
        #ef4444 ${correctPercentage}% 100%
      );
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .legend-color.correct {
      background: ${tierColor.primary};
    }
    .legend-color.incorrect {
      background: #ef4444;
    }
    .report-section {
      margin: 15px 0;
      padding: 15px;
      background: ${tierColor.bg};
      border-radius: 6px;
      border-left: 4px solid ${tierColor.primary};
    }
    .report-title {
      font-size: 18px;
      font-weight: bold;
      color: ${tierColor.primary};
      margin-bottom: 10px;
    }
    .report-text {
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .next-steps-box {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 2px solid ${tierColor.primary};
      margin-top: 15px;
    }
    .next-steps-title {
      font-size: 16px;
      font-weight: bold;
      color: ${tierColor.primary};
      margin-bottom: 10px;
    }
    .stats-row {
      display: flex;
      justify-content: space-around;
      margin: 15px 0;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 26px;
      font-weight: bold;
      color: ${tierColor.primary};
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .contact-info {
      background: ${tierColor.bg};
      padding: 12px;
      border-radius: 6px;
      margin-top: 15px;
      text-align: center;
      font-size: 13px;
      color: #1e293b;
    }
    .contact-info strong {
      color: ${tierColor.primary};
      display: block;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <!-- Page 1: Certificate -->
  <div class="page">
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
  </div>

  <!-- Page 2: Detailed Report -->
  <div class="report-page">
    <div class="header">
      <div class="logo">D.E.Bs LEARNING ACADEMY</div>
      <div class="tagline">Unlocking Brilliance Through Learning</div>
    </div>
    
    <div class="title">Detailed Test Report</div>
    
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">${attempt.correct_answers || 0}</div>
        <div class="stat-label">Correct Answers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${(attempt.total_questions || 0) - (attempt.correct_answers || 0)}</div>
        <div class="stat-label">Incorrect Answers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${attempt.total_questions || 0}</div>
        <div class="stat-label">Total Questions</div>
      </div>
    </div>

    <div class="pie-chart-container">
      <div class="pie-chart"></div>
      <div class="pie-legend">
        <div class="legend-item">
          <div class="legend-color correct"></div>
          <span><strong>Correct:</strong> ${attempt.correct_answers || 0} (${correctPercentage}%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color incorrect"></div>
          <span><strong>Incorrect:</strong> ${(attempt.total_questions || 0) - (attempt.correct_answers || 0)} (${incorrectPercentage.toFixed(1)}%)</span>
        </div>
      </div>
    </div>

    <div class="report-section">
      <div class="report-title">Understanding Your ${attempt.tier} Placement</div>
      <p class="report-text">
        ${tierMessage.explanation}
      </p>
      <p class="report-text">
        <strong>What This Means:</strong> ${attempt.tier === "Tier 1" ? "Your student has demonstrated mastery" : attempt.tier === "Tier 2" ? "Your student shows solid understanding with room for growth" : "Your student needs focused support to build confidence and skills"}.
      </p>
    </div>

    <div class="next-steps-box">
      <div class="next-steps-title">📋 Recommended Next Steps</div>
      <p class="report-text">
        ${tierMessage.nextSteps}
      </p>
    </div>

    <div class="contact-info">
      <strong>Contact D.E.Bs LEARNING ACADEMY</strong>
      📧 Email: info@debslearnacademy.com | 📞 Phone: 347-364-1906<br>
      🌐 Website: www.debslearnacademy.com
    </div>

    <div class="footer">
      <div class="footer-text">
        D.E.Bs LEARNING ACADEMY – Unlocking Brilliance Through Learning
      </div>
      <div class="date">
        Report Generated: ${new Date().toLocaleDateString()}
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
