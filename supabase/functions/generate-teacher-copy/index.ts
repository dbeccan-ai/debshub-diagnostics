import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildDiagnosticReport } from "../_shared/diagnostic-report.ts";
import { renderTeacherCopyHtml } from "../_shared/diagnostic-report-html.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { attemptId } = await req.json();
    
    if (!attemptId) {
      return new Response(
        JSON.stringify({ error: 'Attempt ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating teacher copy for attempt ${attemptId}`);

    // Fetch test attempt with test data and responses
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('test_attempts')
      .select(`
        *,
        tests (*),
        profiles:user_id (full_name, parent_email)
      `)
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    const isAdmin = !!adminRole;

    // Answer keys / audit provenance are staff-only, never exposed to student owners.
    const { data: teacherRole } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "teacher").maybeSingle();
    const { data: visibleAttempt } = await supabaseUser.from("test_attempts").select("id").eq("id", attemptId).maybeSingle();
    if ((!isAdmin && !teacherRole) || !visibleAttempt) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Same read-only evidence model as the parent report (never writes scores, never regrades).
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('test_responses')
      .select('question_id, answer, is_correct, points_awarded, max_points')
      .eq('attempt_id', attemptId);
    if (responsesError) console.error('Error fetching responses:', responsesError);
    const { data: followUps } = await supabaseAdmin
      .from('follow_up_assessments')
      .select('week_number, status, unlock_date')
      .eq('source_attempt_id', attemptId);

    const report = buildDiagnosticReport({
      attempt,
      test: attempt.tests ?? { name: null, test_type: null, questions: null },
      responses: responses ?? [],
      studentName: attempt.profiles?.full_name,
      followUps: followUps ?? [],
    });
    const origin = req.headers.get('origin');
    const logoUrl = origin && /^https:\/\/[a-z0-9.-]+$/i.test(origin) ? `${origin}/icon-512.png` : 'https://debshub-diagnostics.lovable.app/icon-512.png';
    const html = renderTeacherCopyHtml(report, { responses: responses ?? [] }, { logoUrl });

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating teacher copy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

