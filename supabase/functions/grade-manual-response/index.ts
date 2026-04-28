import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher']);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Admin or teacher access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { responseId, attemptId } = body;
    let { isCorrect, pointsAwarded, maxPoints, teacherComment } = body;

    if (!responseId || !attemptId) {
      return new Response(
        JSON.stringify({ error: 'responseId and attemptId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize: support legacy boolean-only callers, partial-credit callers, or both.
    const max = typeof maxPoints === 'number' && maxPoints > 0 ? maxPoints : 1;
    let earned: number;
    if (typeof pointsAwarded === 'number') {
      earned = Math.max(0, Math.min(max, pointsAwarded));
    } else if (typeof isCorrect === 'boolean') {
      earned = isCorrect ? max : 0;
    } else {
      return new Response(
        JSON.stringify({ error: 'Provide either pointsAwarded or isCorrect' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const finalIsCorrect = earned >= max;

    const updatePayload: Record<string, unknown> = {
      is_correct: finalIsCorrect,
      points_awarded: earned,
      max_points: max,
    };
    if (typeof teacherComment === 'string') {
      updatePayload.teacher_comment = teacherComment.trim() || null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('test_responses')
      .update(updatePayload)
      .eq('id', responseId)
      .eq('attempt_id', attemptId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recalculate scores using points_awarded / max_points (with boolean fallback)
    const { data: allResponses, error: respError } = await supabaseAdmin
      .from('test_responses')
      .select('is_correct, points_awarded, max_points')
      .eq('attempt_id', attemptId);

    if (respError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const graded = (allResponses || []).filter(r => r.is_correct !== null);
    const pendingCount = (allResponses || []).length - graded.length;
    let pointsEarned = 0;
    let pointsPossible = 0;
    let correctCount = 0;
    for (const r of graded) {
      const m = typeof r.max_points === 'number' && r.max_points > 0 ? r.max_points : 1;
      const e = typeof r.points_awarded === 'number' ? r.points_awarded : (r.is_correct ? m : 0);
      pointsEarned += e;
      pointsPossible += m;
      if (r.is_correct) correctCount++;
    }
    const score = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;
    const tier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';

    await supabaseAdmin
      .from('test_attempts')
      .update({
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: graded.length,
        tier,
      })
      .eq('id', attemptId);

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        tier,
        correctCount,
        totalGraded: graded.length,
        pendingCount,
        pointsEarned,
        pointsPossible,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in grade-manual-response:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
