import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { buildDiagnosticReport } from "../_shared/diagnostic-report.ts";
import { renderDiagnosticReportHtml } from "../_shared/diagnostic-report-html.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attemptId, format, mode } = await req.json();

    if (!attemptId || !format) {
      throw new Error("Missing attemptId or format");
    }

    if (!["pdf", "png", "json"].includes(format)) {
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
        tests (name, test_type, questions, updated_at),
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

    // Read-only evidence model (never writes scores, never regrades).
    const { data: responses } = await supabaseClient
      .from("test_responses")
      .select("question_id, answer, is_correct, points_awarded, max_points")
      .eq("attempt_id", attemptId);
    const { data: followUps } = await supabaseClient
      .from("follow_up_assessments")
      .select("week_number, status, unlock_date")
      .eq("source_attempt_id", attemptId);

    const report = buildDiagnosticReport({
      attempt,
      test: attempt.tests ?? { name: null, test_type: null, questions: null },
      responses: responses ?? [],
      studentName: attempt.profiles?.full_name,
      followUps: followUps ?? [],
    });
    // Strip answer keys / item text before returning the model to the browser.
    const publicReport = { ...report, items: report.items.map(({ id, position, section, domain, skill, skillSource, scoring, outcome, earned, possible }) => ({ id, position, section, domain, skill, skillSource, scoring, outcome, earned, possible })) };

    if (mode === "model" || format === "json") {
      return new Response(JSON.stringify({ success: true, report: publicReport }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const origin = req.headers.get("origin");
    const logoUrl = origin && /^https:\/\/[a-z0-9.-]+$/i.test(origin) ? `${origin}/icon-512.png` : "https://debshub-diagnostics.lovable.app/icon-512.png";
    const resultHTML = renderDiagnosticReportHtml(report, { logoUrl });

    const fileName = `result-${attemptId}.html`;
    const { error: uploadError } = await supabaseClient.storage
      .from("certificates")
      .upload(fileName, resultHTML, { contentType: "text/html", upsert: true });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    const { data: { publicUrl } } = supabaseClient.storage.from("certificates").getPublicUrl(fileName);

    // Keep the certificate record consistent with the verified evidence model (tier + subject-correct skills).
    // Skipped when scoring requires verification, so an unverified report never refreshes a certificate.
    if (report.verification.state === "verified" && report.score.tier) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      await supabaseClient.from("certificates").upsert({
        attempt_id: attemptId,
        student_name: attempt.profiles?.full_name || "Student",
        test_name: attempt.tests?.name || "Test",
        tier: report.score.tier,
        strengths: report.strengths.slice(0, 5).map((s) => s.skill),
        weaknesses: report.priorityFocus.map((s) => s.skill),
        certificate_url: `${supabaseUrl}/functions/v1/view-certificate?attemptId=${attemptId}`,
      }, { onConflict: "attempt_id" });
    }

    return new Response(
      JSON.stringify({ success: true, html: resultHTML, url: publicUrl, format, report: publicReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating result download:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
