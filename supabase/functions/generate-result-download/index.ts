import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SkillStat {
  total: number;
  correct: number;
  percentage: number;
  questionIds: string[];
}

interface SkillAnalysis {
  mastered: string[];
  needsSupport: string[];
  developing: string[];
  skillStats: Record<string, SkillStat>;
}

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

    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch attempt details including skill_analysis
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

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    const isAdmin = !!adminRole;

    // Verify user ownership or admin access
    if (attempt.user_id !== user.id && !isAdmin) {
      console.error("Ownership check failed:", { attemptUserId: attempt.user_id, authUserId: user.id });
      return new Response(
        JSON.stringify({ error: "You do not have permission to download this result" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    if (!attempt.completed_at) {
      throw new Error("Test is not completed yet");
    }

    // Parse skill analysis with safe defaults
    const rawSkillAnalysis = attempt.skill_analysis || {};
    const skillAnalysis: SkillAnalysis = {
      mastered: rawSkillAnalysis.mastered || attempt.strengths || [],
      needsSupport: rawSkillAnalysis.needsSupport || attempt.weaknesses || [],
      developing: rawSkillAnalysis.developing || [],
      skillStats: rawSkillAnalysis.skillStats || {}
    };

    // Determine tier colors
    const tierColors: { [key: string]: { primary: string; border: string; bg: string; light: string } } = {
      "Tier 1": { primary: "#22c55e", border: "#22c55e", bg: "#dcfce7", light: "#f0fdf4" },
      "Tier 2": { primary: "#eab308", border: "#eab308", bg: "#fef9c3", light: "#fefce8" },
      "Tier 3": { primary: "#ef4444", border: "#ef4444", bg: "#fee2e2", light: "#fef2f2" },
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

    // Generate skill stats HTML
    const generateSkillStatsHtml = (stats: Record<string, SkillStat>) => {
      const entries = Object.entries(stats);
      if (entries.length === 0) return '';
      
      return entries.map(([skill, stat]) => {
        const barColor = stat.percentage >= 70 ? '#22c55e' : stat.percentage >= 50 ? '#eab308' : '#ef4444';
        return `
          <div class="skill-row">
            <div class="skill-name">${skill}</div>
            <div class="skill-bar-container">
              <div class="skill-bar" style="width: ${stat.percentage}%; background: ${barColor};"></div>
            </div>
            <div class="skill-score">${stat.correct}/${stat.total} (${stat.percentage}%)</div>
          </div>
        `;
      }).join('');
    };

    // Generate skill list HTML
    const generateSkillListHtml = (skills: string[], icon: string, colorClass: string) => {
      if (!skills || skills.length === 0) return '<p class="no-skills">No skills in this category</p>';
      return `<ul class="skill-list ${colorClass}">${skills.map(s => `<li>${icon} ${s}</li>`).join('')}</ul>`;
    };

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
      background: ${tierColor.light};
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
    
    /* Skill Analysis Styles */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .skills-card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e2e8f0;
    }
    .skills-card.mastered {
      border-left: 4px solid #22c55e;
    }
    .skills-card.developing {
      border-left: 4px solid #eab308;
    }
    .skills-card.needs-support {
      border-left: 4px solid #ef4444;
    }
    .skills-card-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .skills-card.mastered .skills-card-title { color: #16a34a; }
    .skills-card.developing .skills-card-title { color: #ca8a04; }
    .skills-card.needs-support .skills-card-title { color: #dc2626; }
    .skill-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .skill-list li {
      font-size: 13px;
      padding: 4px 0;
      color: #334155;
    }
    .skill-list.green li { color: #166534; }
    .skill-list.yellow li { color: #854d0e; }
    .skill-list.red li { color: #991b1b; }
    .no-skills {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
    }
    
    /* Skill Bar Styles */
    .skill-breakdown {
      margin: 20px 0;
    }
    .skill-row {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .skill-name {
      flex: 0 0 35%;
      font-size: 13px;
      font-weight: 500;
      color: #334155;
    }
    .skill-bar-container {
      flex: 1;
      height: 12px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      margin: 0 10px;
    }
    .skill-bar {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    .skill-score {
      flex: 0 0 80px;
      font-size: 12px;
      color: #64748b;
      text-align: right;
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
          skillAnalysis.mastered.length > 0
            ? `
        <div class="section">
          <div class="section-title">🌟 Skills Mastered</div>
          <ul class="list">
            ${skillAnalysis.mastered.map((s: string) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        `
            : ""
        }
        
        ${
          skillAnalysis.needsSupport.length > 0
            ? `
        <div class="section">
          <div class="section-title">📚 Skills Requiring Support</div>
          <ul class="list">
            ${skillAnalysis.needsSupport.map((w: string) => `<li>${w}</li>`).join("")}
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

  <!-- Page 2: Detailed Report with Skills Analysis -->
  <div class="report-page">
    <div class="header">
      <div class="logo">D.E.Bs LEARNING ACADEMY</div>
      <div class="tagline">Unlocking Brilliance Through Learning</div>
    </div>
    
    <div class="title">Detailed Skills Analysis Report</div>
    
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

    <!-- Skills Summary Grid -->
    <div class="skills-grid">
      <div class="skills-card mastered">
        <div class="skills-card-title">✅ Skills Mastered (70%+)</div>
        ${generateSkillListHtml(skillAnalysis.mastered, '✓', 'green')}
      </div>
      <div class="skills-card needs-support">
        <div class="skills-card-title">⚠️ Needs Additional Support (&lt;50%)</div>
        ${generateSkillListHtml(skillAnalysis.needsSupport, '✗', 'red')}
      </div>
    </div>
    
    ${skillAnalysis.developing.length > 0 ? `
    <div class="skills-card developing" style="margin-bottom: 15px;">
      <div class="skills-card-title">📈 Skills In Progress (50-69%)</div>
      ${generateSkillListHtml(skillAnalysis.developing, '→', 'yellow')}
    </div>
    ` : ''}

    <!-- Detailed Skill Breakdown -->
    ${Object.keys(skillAnalysis.skillStats || {}).length > 0 ? `
    <div class="report-section">
      <div class="report-title">📊 Skill-by-Skill Performance</div>
      <div class="skill-breakdown">
        ${generateSkillStatsHtml(skillAnalysis.skillStats)}
      </div>
    </div>
    ` : ''}

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
      ${skillAnalysis.needsSupport.length > 0 ? `
      <p class="report-text">
        <strong>Focus Areas:</strong> We recommend prioritizing these skills for additional practice: ${skillAnalysis.needsSupport.slice(0, 3).join(', ')}.
      </p>
      ` : ''}
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

    const fileName = `result-${attemptId}.html`;
    
    const { error: uploadError } = await supabaseClient.storage
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