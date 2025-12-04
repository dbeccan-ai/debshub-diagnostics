import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token to verify identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
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

    console.log(`Fetching questions for attempt ${attemptId} by user ${user.id}`);

    // Verify the user owns this test attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('test_attempts')
      .select('*, tests(*)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      console.error('Attempt fetch error:', attemptError);
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (attempt.user_id !== user.id) {
      console.error(`User ${user.id} tried to access attempt owned by ${attempt.user_id}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to test attempt' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify test is not already completed
    if (attempt.completed_at) {
      return new Response(
        JSON.stringify({ error: 'Test already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment is completed for paid tests
    if (attempt.payment_status === 'pending') {
      return new Response(
        JSON.stringify({ error: 'Payment required before accessing test' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const test = attempt.tests;
    if (!test) {
      return new Response(
        JSON.stringify({ error: 'Test not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strip correct_answer from all questions before returning
    const questions = test.questions;
    const sanitizedQuestions = sanitizeQuestions(questions);

    console.log(`Returning ${countQuestions(sanitizedQuestions)} sanitized questions for test ${test.name}`);

    return new Response(
      JSON.stringify({
        test: {
          id: test.id,
          name: test.name,
          description: test.description,
          duration_minutes: test.duration_minutes,
          is_paid: test.is_paid,
          test_type: test.test_type,
          questions: sanitizedQuestions
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-test-questions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Recursively remove correct_answer from questions
function sanitizeQuestions(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeQuestions(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      // Skip correct_answer and correctAnswer fields
      if (key === 'correct_answer' || key === 'correctAnswer') {
        continue;
      }
      sanitized[key] = sanitizeQuestions(data[key]);
    }
    return sanitized;
  }
  
  return data;
}

// Count questions in various formats
function countQuestions(data: any): number {
  if (Array.isArray(data)) {
    // Check if it's a flat array of questions
    if (data[0]?.question || data[0]?.question_text) {
      return data.length;
    }
    // Check if it's sections with questions
    if (data[0]?.questions) {
      return data.reduce((sum: number, section: any) => sum + (section.questions?.length || 0), 0);
    }
    // Check for sections array inside
    if (data[0]?.sections) {
      return data.reduce((sum: number, item: any) => 
        sum + item.sections.reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0), 0);
    }
  }
  
  if (data?.sections) {
    return data.sections.reduce((sum: number, section: any) => sum + (section.questions?.length || 0), 0);
  }
  
  return 0;
}
