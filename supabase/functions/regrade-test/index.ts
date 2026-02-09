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
  mastered: string[];
  needsSupport: string[];
  developing: string[];
  skillStats: Record<string, SkillStat>;
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
  [/inference|infer|imply|suggest/i, 'Making Inferences'],
  [/vocabulary|meaning\s+of|word\s+means|define|definition/i, 'Vocabulary'],
  [/context\s+clue/i, 'Context Clues'],
  [/synonym|antonym/i, 'Synonyms & Antonyms'],
  [/author.?s?\s+purpose|why\s+did\s+the\s+author/i, "Author's Purpose"],
  [/point\s+of\s+view|narrator|perspective/i, 'Point of View'],
  [/tone|mood/i, 'Tone & Mood'],
  [/theme|lesson|moral/i, 'Theme'],
  [/cause\s+and\s+effect|because|result/i, 'Cause & Effect'],
  [/compare|contrast|similar|different/i, 'Compare & Contrast'],
  [/sequence|order\s+of\s+events|first.*then|chronolog/i, 'Sequence of Events'],
  [/summary|summarize|retell/i, 'Summarizing'],
  [/character\s+trait|character.*feel|character.*chang/i, 'Character Analysis'],
  [/setting/i, 'Setting'],
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
  [/rhym|poem|poetry|stanza|verse/i, 'Poetry'],
  [/fiction|nonfiction|genre|fable|myth|legend/i, 'Genre Identification'],
  [/text\s+feature|heading|caption|glossary|index|table\s+of\s+contents/i, 'Text Features'],
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
  
  // Infer from question content
  for (const [pattern, skill] of patterns) {
    if (pattern.test(text)) {
      return skill;
    }
  }
  
  // Also check the other set as fallback
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

function formatSkillName(skill: string): string {
  return skill
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

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

function normalizeQuestion(q: any, testType: string): any {
  const normalized = {
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
    question: q.question || q.question_text || '',
    type: q.type || 'multiple-choice',
    options: q.options || q.choices || [],
    correct_answer: q.correct_answer || q.correctAnswer || '',
    section: q.section || '',
    topic: q.topic || q.skill_tag || '',
  };
  // Infer skill after normalization using test type
  normalized.topic = inferSkillFromQuestion({ ...q, ...normalized }, testType);
  return normalized;
}

function normalizeQuestionType(type: string): string {
  if (!type) return 'multiple-choice';
  const normalized = type.toLowerCase().replace(/[_\s]/g, '-');
  if (normalized.includes('multiple') || normalized.includes('choice')) {
    return 'multiple-choice';
  }
  return normalized;
}

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

    if (attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Normalize questions with skill inference using test type
    const testType = test.test_type || test.name || '';
    const questions = normalizeQuestions(test.questions, testType);
    const isELA = testType.toLowerCase().includes('ela') || testType.toLowerCase().includes('english') || testType.toLowerCase().includes('reading');
    const defaultSkill = isELA ? 'General ELA' : 'General Math';
    console.log(`Re-processing ${questions.length} questions with skill inference (type: ${testType})`);

    // Build skill stats from responses
    const skillStats: Record<string, SkillStat> = {};
    let correctCount = 0;
    let totalMC = 0;

    for (const response of responses || []) {
      const question = questions.find((q: any) => q.id === response.question_id);
      if (!question) continue;

      const skill = question.topic || defaultSkill;
      
      if (!skillStats[skill]) {
        skillStats[skill] = { 
          total: 0, 
          correct: 0, 
          percentage: 0,
          questionIds: []
        };
      }
      
      skillStats[skill].total++;
      skillStats[skill].questionIds.push(response.question_id);
      
      if (normalizeQuestionType(question.type) === 'multiple-choice') {
        totalMC++;
        if (response.is_correct) {
          correctCount++;
          skillStats[skill].correct++;
        }
      }
    }

    // Calculate percentages and categorize
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

    const skillAnalysis: SkillAnalysis = {
      mastered: mastered.sort(),
      needsSupport: needsSupport.sort(),
      developing: developing.sort(),
      skillStats
    };

    const score = totalMC > 0 ? (correctCount / totalMC) * 100 : 0;
    const tier = score >= 80 ? 'Tier 1' : score >= 50 ? 'Tier 2' : 'Tier 3';

    console.log(`Re-grade complete: ${correctCount}/${totalMC} = ${score.toFixed(1)}% (${tier})`);
    console.log(`Skills - mastered: ${mastered.length}, developing: ${developing.length}, needs support: ${needsSupport.length}`);

    // Update the test attempt with new skill analysis
    const { error: updateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: totalMC,
        tier,
        strengths: mastered.slice(0, 5),
        weaknesses: needsSupport.slice(0, 5),
        skill_analysis: skillAnalysis
      })
      .eq('id', attemptId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        tier,
        skillAnalysis
      }),
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
