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

// ELA skill inference patterns - ordered by specificity (most specific first)
const elaSkillPatterns: [RegExp, string][] = [
  // Spelling
  [/spell(ed|ing)?|spelled?\s+correctly|correct\s+spelling/i, 'Spelling'],
  // Grammar
  [/grammar|noun|verb|adjective|adverb|pronoun|preposition|tense|plural|singular|subject|predicate/i, 'Grammar'],
  [/punctuat|comma|period|apostrophe|quotation|exclamation|question\s+mark/i, 'Grammar'],
  [/sentence|fragment|run-on|compound|complex|capital\s+letter|uppercase|lowercase/i, 'Grammar'],
  [/more\s+than\s+one|circle\s+the\s+word\s+that\s+means/i, 'Grammar'],
  // Vocabulary
  [/vocabulary|meaning\s+of|word\s+means|define|definition|synonym|antonym/i, 'Vocabulary'],
  [/context\s+clue|prefix|suffix|root\s+word|word\s+part|sight\s+word/i, 'Vocabulary'],
  [/rhym|sound\s+alike|which\s+word\s+rhymes/i, 'Vocabulary'],
  [/vowel|consonant|beginning\s+sound|ending\s+sound|phonics|blend|digraph|syllable/i, 'Vocabulary'],
  [/which\s+letter|what\s+is\s+the.*sound|how\s+many\s+sounds/i, 'Vocabulary'],
  [/names\s+a\s+person|names\s+a\s+place|names\s+a\s+thing/i, 'Vocabulary'],
  // Reading Comprehension
  [/read.*answer|passage|comprehension|understand|what\s+is|who\s+is|where\s+do|what\s+do/i, 'Reading Comprehension'],
  [/main\s+idea|central\s+idea|detail|supporting/i, 'Reading Comprehension'],
  [/inference|infer|imply|suggest|conclude/i, 'Reading Comprehension'],
  [/author.?s?\s+purpose|point\s+of\s+view|narrator|perspective/i, 'Reading Comprehension'],
  [/theme|lesson|moral|cause\s+and\s+effect|compare|contrast/i, 'Reading Comprehension'],
  [/sequence|order\s+of\s+events|summary|summarize|retell/i, 'Reading Comprehension'],
  [/character|setting|plot|conflict|resolution|climax/i, 'Reading Comprehension'],
  [/figurative|metaphor|simile|personif|hyperbole|idiom/i, 'Reading Comprehension'],
  [/tone|mood|text\s+structure|fact\s+and\s+opinion|predict/i, 'Reading Comprehension'],
  [/fiction|nonfiction|genre|fable|myth|legend/i, 'Reading Comprehension'],
  [/text\s+feature|heading|caption|glossary|index/i, 'Reading Comprehension'],
  [/how\s+many\s+words|what\s+comes\s+at\s+the\s+end/i, 'Grammar'],
  [/write.*sentence|writing|essay|paragraph|compose/i, 'Grammar'],
];

// Map any ELA skill/tag to one of the 4 core categories
function mapToElaCoreSkill(skill: string): string {
  const s = skill.toLowerCase().replace(/[_-]/g, ' ');
  if (s.includes('spell')) return 'Spelling';
  if (s.includes('grammar') || s.includes('punctuat') || s.includes('capitaliz') || s.includes('sentence') || s.includes('noun') || s.includes('verb') || s.includes('adjective') || s.includes('adverb') || s.includes('pronoun') || s.includes('preposition') || s.includes('tense') || s.includes('plural') || s.includes('singular') || s.includes('subject') || s.includes('predicate') || s.includes('writing') || s.includes('convention')) return 'Grammar';
  if (s.includes('vocabulary') || s.includes('synonym') || s.includes('antonym') || s.includes('context clue') || s.includes('word meaning') || s.includes('prefix') || s.includes('suffix') || s.includes('root word') || s.includes('sight word') || s.includes('phonics') || s.includes('phonemic') || s.includes('rhym') || s.includes('vowel') || s.includes('consonant') || s.includes('blend') || s.includes('digraph') || s.includes('syllable') || s.includes('letter') || s.includes('sound') || s.includes('word part')) return 'Vocabulary';
  if (s.includes('comprehension') || s.includes('reading') || s.includes('passage') || s.includes('inference') || s.includes('main idea') || s.includes('character') || s.includes('setting') || s.includes('plot') || s.includes('theme') || s.includes('author') || s.includes('summariz') || s.includes('detail') || s.includes('sequence') || s.includes('cause') || s.includes('compare') || s.includes('figurative') || s.includes('tone') || s.includes('mood') || s.includes('genre') || s.includes('fiction') || s.includes('predict') || s.includes('text feature') || s.includes('text structure') || s.includes('fact') || s.includes('opinion') || s.includes('point of view') || s.includes('fluency') || s.includes('poetry')) return 'Reading Comprehension';
  return 'Reading Comprehension';
}

// Map ELA section titles to the 4 core skill categories
function mapElaSectionToSkill(section: string): string | null {
  const s = section.toLowerCase();
  if (s.includes('letter') || s.includes('sound') || s.includes('phonics') || s.includes('phonemic')) return 'Vocabulary';
  if (s.includes('grammar') || s.includes('language') || s.includes('convention') || s.includes('writing')) return 'Grammar';
  if (s.includes('spell')) return 'Spelling';
  if (s.includes('reading') || s.includes('comprehension') || s.includes('passage') || s.includes('literature') || s.includes('informational')) return 'Reading Comprehension';
  if (s.includes('vocabulary') || s.includes('word')) return 'Vocabulary';
  return null;
}

function inferSkillFromQuestion(question: any, testType: string): string {
  const questionText = question.question || question.question_text || '';
  const sectionName = question.section || '';
  const optionsText = (question.options || question.choices || []).join(' ');
  const text = `${questionText} ${sectionName} ${optionsText}`.toLowerCase();
  
  const isELA = testType?.toLowerCase().includes('ela') || testType?.toLowerCase().includes('english') || testType?.toLowerCase().includes('reading');
  
  if (!isELA) {
    if (question.topic && question.topic !== 'general') {
      return formatSkillName(question.topic);
    }
    if (question.skill_tag && question.skill_tag !== 'general') {
      return formatSkillName(question.skill_tag);
    }
    
    for (const [pattern, skill] of mathSkillPatterns) {
      if (pattern.test(text)) {
        return skill;
      }
    }
    
    if (question.section) {
      if (question.section.includes('Word Problem')) return 'Word Problems';
      return formatSkillName(question.section);
    }
    return 'General Math';
  }
  
  // ELA: Check explicit skill/topic field first and map to core category
  const explicitSkill = question.skill || question.topic || question.skill_tag || '';
  if (explicitSkill && explicitSkill !== 'general') {
    return mapToElaCoreSkill(explicitSkill);
  }
  
  // ELA: Try matching question text against patterns
  for (const [pattern, skill] of elaSkillPatterns) {
    if (pattern.test(text)) {
      return skill;
    }
  }
  
  // ELA: Fall back to section name mapping
  if (sectionName) {
    const mapped = mapElaSectionToSkill(sectionName);
    if (mapped) return mapped;
  }
  
  return 'Reading Comprehension';
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
    question: q.question || q.question_text || q.text || '',
    type: q.type || 'multiple-choice',
    options: q.options || q.choices || [],
    correct_answer: q.correct_answer || q.correctAnswer || '',
    section: q.section || '',
    topic: q.topic || q.skill_tag || q.skill || '',
    skill: q.skill || '',
  };
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
      
      if (stats.percentage >= 85) {
        mastered.push(skill);
      } else if (stats.percentage < 66) {
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
    const tier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';

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
