import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { buildDiagnosticReport, buildSkillAnalysis, detectReportSubject, flattenTestItems } from "../_shared/diagnostic-report.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { attemptId, dryRun = true } = await req.json();
    
    if (!attemptId) {
      return new Response(
        JSON.stringify({ error: 'Attempt ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Re-grading test attempt ${attemptId} for user ${user.id}`);

    // Fetch the test attempt with test data and responses
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('test_attempts')
      .select('*, tests(*)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow access for the test owner or admins
    if (attempt.user_id !== user.id) {
      const { data: adminRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!adminRole) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized access' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch stored responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('test_responses')
      .select('*')
      .eq('attempt_id', attemptId);

    if (responsesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const test = attempt.tests;
    if (!test) {
      return new Response(
        JSON.stringify({ error: 'Test not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit/repair of DERIVED skill analysis only. Scores, answers, responses and test identity are never changed.
    const subject = detectReportSubject(test.test_type, test.name);
    const { items } = flattenTestItems(test.questions, subject);
    const report = buildDiagnosticReport({ attempt, test, responses: responses || [] });
    const proposed = buildSkillAnalysis(items, responses || [], subject);
    const comparison = {
      attemptId,
      subject,
      verification: report.verification,
      score: report.score,
      counts: report.counts,
      before: { skills: Object.keys(attempt.skill_analysis?.skillStats ?? {}), strengths: attempt.strengths ?? [], weaknesses: attempt.weaknesses ?? [] },
      after: { skills: Object.keys(proposed.skillStats), strengths: proposed.mastered.slice(0, 5), weaknesses: proposed.needsSupport.slice(0, 5) },
    };

    if (dryRun !== false) {
      return new Response(JSON.stringify({ success: true, dryRun: true, comparison, proposedSkillAnalysis: proposed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: applyAdmin } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!applyAdmin) {
      return new Response(JSON.stringify({ error: 'Only admins can apply a skill-analysis repair', comparison }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (report.verification.state !== 'verified') {
      return new Response(JSON.stringify({ error: 'Scoring details require verification; derived analysis was not changed.', comparison }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: updateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        strengths: proposed.mastered.slice(0, 5),
        weaknesses: proposed.needsSupport.slice(0, 5),
        // Previous derived analysis is preserved inside the record for audit.
        skill_analysis: { ...proposed, previous: attempt.skill_analysis ?? null, repaired_at: new Date().toISOString(), repaired_by: user.id },
      })
      .eq('id', attemptId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, dryRun: false, comparison, score: attempt.score, tier: attempt.tier, skillAnalysis: proposed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regrade-test:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
