import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkillStat {
  total: number;
  correct: number;
  percentage: number;
  questionIds: string[];
}

interface SkillAnalysis {
  mastered: string[];           // Skills with 70%+ correct
  needsSupport: string[];       // Skills with <50% correct
  developing: string[];         // Skills with 50-69% correct
  skillStats: Record<string, SkillStat>;  // Detailed per-skill stats
}

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

    // Check if user is admin (admins bypass payment requirement)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    const isAdmin = !!roleData;

    // Verify payment for paid tests (admins bypass)
    if (attempt.payment_status === 'pending' && !isAdmin) {
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
    const testType = test.test_type || test.name || '';
    const questions = normalizeQuestions(test.questions, testType);
    const isELA = testType.toLowerCase().includes('ela') || testType.toLowerCase().includes('english') || testType.toLowerCase().includes('reading');
    console.log(`Processing ${questions.length} questions for grading (type: ${testType})`);

    // Grade each answer with detailed skill tracking
    const gradedResponses: any[] = [];
    let correctCount = 0;
    const skillStats: Record<string, SkillStat> = {};

    for (const [questionId, answer] of Object.entries(answers)) {
      const question = questions.find((q: any) => q.id === questionId);
      
      if (!question) {
        console.warn(`Question ${questionId} not found in test`);
        continue;
      }

      const questionType = normalizeQuestionType(question.type);
      let isCorrect: boolean | null = null;

      // Auto-grade multiple choice questions only
      if (questionType === 'multiple-choice') {
        const correctAnswer = question.correct_answer || question.correctAnswer;
        const options = question.options || [];
        isCorrect = isAnswerCorrect(answer as string, correctAnswer, options);
        if (isCorrect) correctCount++;
      }
      // Written responses (word-problem, multi-step, short-answer, long-answer) 
      // stay null for manual review by admin

      // Track detailed skill performance (topic is already inferred during normalization)
      const skill = question.topic;
      
      if (!skillStats[skill]) {
        skillStats[skill] = { 
          total: 0, 
          correct: 0, 
          percentage: 0,
          questionIds: []
        };
      }
      
      skillStats[skill].total++;
      skillStats[skill].questionIds.push(questionId);
      
      // Only count as correct if explicitly true (not null)
      if (isCorrect === true) {
        skillStats[skill].correct++;
      }

      gradedResponses.push({
        attempt_id: attemptId,
        question_id: questionId,
        answer: answer as string,
        is_correct: isCorrect
      });
    }

    // Calculate percentages and categorize skills
    const mastered: string[] = [];
    const needsSupport: string[] = [];
    const developing: string[] = [];

    for (const [skill, stats] of Object.entries(skillStats)) {
      stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      
      if (stats.percentage >= 70) {
        mastered.push(skill);
      } else if (stats.percentage < 50) {
        needsSupport.push(skill);
      } else {
        developing.push(skill);
      }
    }

    // Build skill analysis object
    const skillAnalysis: SkillAnalysis = {
      mastered: mastered.sort(),
      needsSupport: needsSupport.sort(),
      developing: developing.sort(),
      skillStats
    };

    // Calculate overall score and tier
    const totalQuestions = questions.filter((q: any) => 
      normalizeQuestionType(q.type) === 'multiple-choice'
    ).length;
    
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const tier = score >= 80 ? 'Tier 1' : score >= 50 ? 'Tier 2' : 'Tier 3';

    console.log(`Grading complete: ${correctCount}/${totalQuestions} = ${score.toFixed(1)}% (${tier})`);
    console.log(`Skills mastered: ${mastered.length}, developing: ${developing.length}, needs support: ${needsSupport.length}`);

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

    // Update the test attempt with results including skill analysis
    const { error: updateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        tier,
        strengths: mastered.slice(0, 5),
        weaknesses: needsSupport.slice(0, 5),
        skill_analysis: skillAnalysis
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return detailed results
    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        correctAnswers: correctCount,
        totalQuestions,
        tier,
        strengths: mastered.slice(0, 5),
        weaknesses: needsSupport.slice(0, 5),
        skillAnalysis,
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

// Enhanced answer matching for multiple choice questions
function isAnswerCorrect(answer: string, correctAnswer: string, options: string[]): boolean {
  if (!answer || !correctAnswer) return false;
  
  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();
  
  // Direct match (both are same text or same letter)
  if (normalizedAnswer === normalizedCorrect) return true;
  
  // If correct answer is a letter (A, B, C, D)
  const letterIndex = ['a', 'b', 'c', 'd'].indexOf(normalizedCorrect);
  if (letterIndex !== -1 && options && options[letterIndex]) {
    // Get the option text at that index, strip any leading letter prefix like "A. " or "A) "
    const optionText = String(options[letterIndex]).replace(/^[A-Da-d][\.\)\s]+/i, '').trim().toLowerCase();
    
    // Compare student answer with the option text
    if (normalizedAnswer === optionText) return true;
    
    // Also check if student answer contains the option (partial match for longer text)
    const normalizedAnswerClean = normalizedAnswer.replace(/^[A-Da-d][\.\)\s]+/i, '').trim();
    if (normalizedAnswerClean === optionText) return true;
  }
  
  // If student answered with a letter
  const studentLetterIndex = ['a', 'b', 'c', 'd'].indexOf(normalizedAnswer);
  if (studentLetterIndex !== -1) {
    // Check if the letter matches the correct letter
    if (normalizedAnswer === normalizedCorrect) return true;
  }
  
  // Check if answer matches any option text and that option's index corresponds to correct letter
  if (options && options.length > 0) {
    for (let i = 0; i < options.length; i++) {
      const optionText = String(options[i]).replace(/^[A-Da-d][\.\)\s]+/i, '').trim().toLowerCase();
      const answerClean = normalizedAnswer.replace(/^[A-Da-d][\.\)\s]+/i, '').trim();
      
      if (answerClean === optionText || normalizedAnswer === optionText) {
        const answerLetter = ['a', 'b', 'c', 'd'][i];
        if (answerLetter === normalizedCorrect) return true;
        
        // Also check if correct answer is the full text of this option
        if (optionText === normalizedCorrect.replace(/^[A-Da-d][\.\)\s]+/i, '').trim()) return true;
      }
    }
  }
  
  return false;
}

// Math skill inference patterns
const mathSkillPatterns: [RegExp, string][] = [
  [/round(ed|ing)?/i, 'Rounding'],
  [/multipli|×|times/i, 'Multiplication'],
  [/divid|÷|quotient/i, 'Division'],
  [/fraction|\/\d/i, 'Fractions'],
  [/equivalent\s+fraction/i, 'Equivalent Fractions'],
  [/add.*fraction|fraction.*add|\+.*\d\/\d/i, 'Adding Fractions'],
  [/subtract.*fraction|fraction.*subtract|-.*\d\/\d/i, 'Subtracting Fractions'],
  [/multipl.*fraction|fraction.*multipl/i, 'Multiplying Fractions'],
  [/decimal|hundredths?|tenths?|\d\.\d/i, 'Decimals'],
  [/greater|less|compar/i, 'Comparing Numbers'],
  [/volume|cm³|cubic/i, 'Volume'],
  [/area|cm²|square\s+(cm|meter|inch|feet)/i, 'Area'],
  [/pattern|sequence|next\s+number/i, 'Patterns'],
  [/graph|bar|chart|frequency/i, 'Reading Graphs'],
  [/angle|°|degree|right\s+angle/i, 'Angles'],
  [/perimeter/i, 'Perimeter'],
  [/time|hour|minute|second|clock/i, 'Time'],
  [/money|\$|cent|dollar|spend|cost|price|buy/i, 'Money'],
  [/measurement|meter|centimeter|inch|feet|convert/i, 'Measurement'],
  [/order\s+of\s+operation|pemdas/i, 'Order of Operations'],
  [/place\s+value|digit.*place/i, 'Place Value'],
];

// ELA skill inference patterns
const elaSkillPatterns: [RegExp, string][] = [
  [/main\s+idea|central\s+idea/i, 'Main Idea'],
  [/detail|supporting\s+detail/i, 'Supporting Details'],
  [/inference|infer|imply|suggest|conclude/i, 'Making Inferences'],
  [/vocabulary|meaning\s+of|word\s+means|define|definition/i, 'Vocabulary'],
  [/context\s+clue/i, 'Context Clues'],
  [/synonym|antonym/i, 'Synonyms & Antonyms'],
  [/author.?s?\s+purpose|why\s+did\s+the\s+author|why.*write/i, "Author's Purpose"],
  [/point\s+of\s+view|narrator|perspective/i, 'Point of View'],
  [/tone|mood/i, 'Tone & Mood'],
  [/theme|lesson|moral/i, 'Theme'],
  [/cause\s+and\s+effect|because|result/i, 'Cause & Effect'],
  [/compare|contrast|similar|different/i, 'Compare & Contrast'],
  [/sequence|order\s+of\s+events|first.*then|chronolog/i, 'Sequence of Events'],
  [/summary|summarize|retell/i, 'Summarizing'],
  [/character\s+trait|character.*feel|character.*chang|protagonist|antagonist/i, 'Character Analysis'],
  [/setting|where.*story|when.*story/i, 'Setting'],
  [/plot|conflict|resolution|climax/i, 'Plot Structure'],
  [/figurative|metaphor|simile|personif|hyperbole|idiom|onomatopoeia/i, 'Figurative Language'],
  [/text\s+structure|organize/i, 'Text Structure'],
  [/fact\s+and\s+opinion|fact.*opinion/i, 'Fact & Opinion'],
  [/prefix|suffix|root\s+word|word\s+part/i, 'Word Parts'],
  [/grammar|noun|verb|adjective|adverb|pronoun|preposition/i, 'Grammar'],
  [/punctuat|comma|period|apostrophe|quotation/i, 'Punctuation'],
  [/sentence|fragment|run-on|compound|complex/i, 'Sentence Structure'],
  [/syllable|phonics|blend|digraph|vowel|consonant/i, 'Phonics'],
  [/fluency|reading\s+rate/i, 'Reading Fluency'],
  [/comprehension|understand|passage/i, 'Reading Comprehension'],
  [/spelling|spell/i, 'Spelling'],
  [/writing|essay|paragraph|compose/i, 'Writing'],
  [/rhym|poem|poetry|stanza|verse|sound.*alike/i, 'Poetry'],
  [/fiction|nonfiction|genre|fable|myth|legend/i, 'Genre Identification'],
  [/text\s+feature|heading|caption|glossary|index|table\s+of\s+contents/i, 'Text Features'],
  [/predict|what.*happen.*next/i, 'Predicting'],
];

function inferSkillFromQuestion(question: any, testType: string): string {
  const text = `${question.question || question.question_text || ''} ${question.section || ''}`.toLowerCase();
  
  // Check for explicit topic/skill_tag first
  if (question.topic && question.topic !== 'general') {
    return formatSkillName(question.topic);
  }
  if (question.skill_tag && question.skill_tag !== 'general') {
    return formatSkillName(question.skill_tag);
  }
  
  const isELA = testType?.toLowerCase().includes('ela') || testType?.toLowerCase().includes('english') || testType?.toLowerCase().includes('reading');
  const patterns = isELA ? elaSkillPatterns : mathSkillPatterns;
  
  // Infer from question content using primary patterns
  for (const [pattern, skill] of patterns) {
    if (pattern.test(text)) {
      return skill;
    }
  }
  
  // Also check fallback patterns
  const fallbackPatterns = isELA ? mathSkillPatterns : elaSkillPatterns;
  for (const [pattern, skill] of fallbackPatterns) {
    if (pattern.test(text)) {
      return skill;
    }
  }
  
  // Infer from section name
  if (question.section) {
    if (question.section.includes('Word Problem')) {
      return 'Word Problems';
    }
    return formatSkillName(question.section);
  }
  
  return isELA ? 'General ELA' : 'General Math';
}

// Format skill name for display (capitalize and clean up)
function formatSkillName(skill: string): string {
  return skill
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

// Normalize questions to a flat array
function normalizeQuestions(rawQuestions: any, testType: string): any[] {
  if (!rawQuestions) return [];
  
  const normalize = (q: any) => normalizeQuestion(q, testType);
  
  if (Array.isArray(rawQuestions)) {
    if (rawQuestions[0]?.question || rawQuestions[0]?.question_text || rawQuestions[0]?.id) {
      return rawQuestions.map(normalize);
    }
    if (rawQuestions[0]?.questions) {
      return rawQuestions.flatMap((section: any) => 
        (section.questions || []).map(normalize)
      );
    }
    if (rawQuestions[0]?.sections) {
      return rawQuestions.flatMap((item: any) =>
        (item.sections || []).flatMap((section: any) =>
          (section.questions || []).map(normalize)
        )
      );
    }
  }
  
  if (rawQuestions.sections) {
    return rawQuestions.sections.flatMap((section: any) =>
      (section.questions || []).map(normalize)
    );
  }
  
  return [];
}

// Normalize a single question
function normalizeQuestion(q: any, testType: string): any {
  const normalized = {
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
    question: q.question || q.question_text || '',
    type: q.type || 'multiple-choice',
    options: q.options || q.choices || [],
    correct_answer: q.correct_answer || q.correctAnswer || '',
    section: q.section || '',
    topic: q.topic || q.skill_tag || '',
    explanation: q.explanation || ''
  };
  // Infer skill after normalization using test type
  normalized.topic = inferSkillFromQuestion({ ...q, ...normalized }, testType);
  return normalized;
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