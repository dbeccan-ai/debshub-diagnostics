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

    const { attemptId, answers } = await req.json();
    
    if (!attemptId || !answers) {
      return new Response(
        JSON.stringify({ error: 'Attempt ID and answers required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Grading test attempt ${attemptId} by user ${user.id}`);

    // Fetch the test attempt with the test data (including correct answers)
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
      console.error(`User ${user.id} tried to grade attempt owned by ${attempt.user_id}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to test attempt' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already completed
    if (attempt.completed_at) {
      return new Response(
        JSON.stringify({ error: 'Test already graded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment for paid tests
    if (attempt.payment_status === 'pending') {
      return new Response(
        JSON.stringify({ error: 'Payment required before grading' }),
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

    // Normalize questions to a flat array with correct answers
    const questions = normalizeQuestions(test.questions);
    console.log(`Processing ${questions.length} questions for grading`);

    // Grade each answer
    const gradedResponses: any[] = [];
    let correctCount = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> = {};

    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questions.find((q: any) => q.id === questionId);
      
      if (!question) {
        console.warn(`Question ${questionId} not found in test`);
        continue;
      }

      const questionType = normalizeQuestionType(question.type);
      let isCorrect: boolean | null = null;

      // Only auto-grade multiple choice questions
      if (questionType === 'multiple-choice') {
        const correctAnswer = question.correct_answer || question.correctAnswer;
        isCorrect = answer === correctAnswer;
        if (isCorrect) correctCount++;
      }

      // Track topic performance
      const topic = question.topic || question.skill_tag || 'general';
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }
      topicPerformance[topic].total++;
      if (isCorrect) topicPerformance[topic].correct++;

      gradedResponses.push({
        attempt_id: attemptId,
        question_id: questionId,
        answer: answer as string,
        is_correct: isCorrect
      });
    }

    // Calculate score and tier
    const totalQuestions = questions.filter((q: any) => 
      normalizeQuestionType(q.type) === 'multiple-choice'
    ).length;
    
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const tier = score >= 80 ? 'Tier 1' : score >= 50 ? 'Tier 2' : 'Tier 3';

    // Analyze strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    for (const [topic, performance] of Object.entries(topicPerformance)) {
      const topicScore = performance.total > 0 ? (performance.correct / performance.total) * 100 : 0;
      if (topicScore >= 70) {
        strengths.push(topic);
      } else if (topicScore < 50) {
        weaknesses.push(topic);
      }
    }

    console.log(`Grading complete: ${correctCount}/${totalQuestions} = ${score.toFixed(1)}% (${tier})`);

    // Save all responses
    const { error: responseError } = await supabaseAdmin
      .from('test_responses')
      .insert(gradedResponses);

    if (responseError) {
      console.error('Error saving responses:', responseError);
      return new Response(
        JSON.stringify({ error: 'Failed to save responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the test attempt with results
    const { error: updateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        tier,
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5)
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        correctAnswers: correctCount,
        totalQuestions,
        tier,
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5),
        isPaid: test.is_paid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in grade-test:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Normalize questions to a flat array
function normalizeQuestions(rawQuestions: any): any[] {
  if (!rawQuestions) return [];
  
  // Handle array of questions
  if (Array.isArray(rawQuestions)) {
    // Check if it's a flat array of questions
    if (rawQuestions[0]?.question || rawQuestions[0]?.question_text || rawQuestions[0]?.id) {
      return rawQuestions.map(normalizeQuestion);
    }
    
    // Check if it's sections with questions
    if (rawQuestions[0]?.questions) {
      return rawQuestions.flatMap((section: any) => 
        (section.questions || []).map(normalizeQuestion)
      );
    }
    
    // Check for nested structure like diagnostic-tests.json
    if (rawQuestions[0]?.sections) {
      return rawQuestions.flatMap((item: any) =>
        (item.sections || []).flatMap((section: any) =>
          (section.questions || []).map(normalizeQuestion)
        )
      );
    }
  }
  
  // Handle object with sections
  if (rawQuestions.sections) {
    return rawQuestions.sections.flatMap((section: any) =>
      (section.questions || []).map(normalizeQuestion)
    );
  }
  
  return [];
}

// Normalize a single question
function normalizeQuestion(q: any): any {
  return {
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
    question: q.question || q.question_text || '',
    type: q.type || 'multiple-choice',
    options: q.options || q.choices || [],
    correct_answer: q.correct_answer || q.correctAnswer || '',
    topic: q.topic || q.skill_tag || 'general',
    explanation: q.explanation || ''
  };
}

// Normalize question type
function normalizeQuestionType(type: string): string {
  if (!type) return 'multiple-choice';
  const normalized = type.toLowerCase().replace(/[_\s]/g, '-');
  if (normalized.includes('multiple') || normalized.includes('choice')) {
    return 'multiple-choice';
  }
  if (normalized.includes('word') || normalized.includes('problem')) {
    return 'word-problem';
  }
  if (normalized.includes('multi') && normalized.includes('step')) {
    return 'multi-step';
  }
  if (normalized.includes('short')) {
    return 'short-answer';
  }
  if (normalized.includes('long') || normalized.includes('essay')) {
    return 'long-answer';
  }
  return normalized;
}
