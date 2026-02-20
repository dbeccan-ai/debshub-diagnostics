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

    // Check if user is admin or teacher
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

    const { responseId, isCorrect, attemptId } = await req.json();
    
    if (!responseId || isCorrect === undefined || !attemptId) {
      return new Response(
        JSON.stringify({ error: 'responseId, isCorrect, and attemptId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Grading response ${responseId} as ${isCorrect ? 'correct' : 'incorrect'} by ${user.id}`);

    // Update the response
    const { error: updateError } = await supabaseAdmin
      .from('test_responses')
      .update({ is_correct: isCorrect })
      .eq('id', responseId)
      .eq('attempt_id', attemptId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recalculate scores for the attempt
    const { data: allResponses, error: respError } = await supabaseAdmin
      .from('test_responses')
      .select('is_correct')
      .eq('attempt_id', attemptId);

    if (respError) {
      console.error('Fetch responses error:', respError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count graded responses
    const gradedResponses = allResponses.filter(r => r.is_correct !== null);
    const correctCount = gradedResponses.filter(r => r.is_correct === true).length;
    const totalGraded = gradedResponses.length;
    const pendingCount = allResponses.length - totalGraded;

    const score = totalGraded > 0 ? (correctCount / totalGraded) * 100 : 0;
    // Correct thresholds: Tier 1 = 85%+, Tier 2 = 66–84%, Tier 3 = ≤65%
    const tier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';

    // Update attempt with new scores
    const { error: attemptUpdateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: totalGraded,
        tier
      })
      .eq('id', attemptId);

    if (attemptUpdateError) {
      console.error('Attempt update error:', attemptUpdateError);
    }

    console.log(`Updated attempt ${attemptId}: ${correctCount}/${totalGraded} = ${score.toFixed(1)}% (${tier}), ${pendingCount} pending`);

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        tier,
        correctCount,
        totalGraded,
        pendingCount
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
