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
    // Correct thresholds: Tier 1 = 85%+, Tier 2 = 66–84%, Tier 3 = ≤65%
    const tier = score >= 85 ? 'Tier 1' : score >= 66 ? 'Tier 2' : 'Tier 3';

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
  // Spelling
  if (s.includes('spell') || s.includes('homophone') || s.includes('homograph') || s.includes('phonics') || s.includes('phoneme') || s.includes('syllable') || s.includes('word pattern')) return 'Spelling';
  // Grammar
  if (s.includes('grammar') || s.includes('punctuat') || s.includes('capitaliz') || s.includes('sentence') || s.includes('noun') || s.includes('verb') || s.includes('adjective') || s.includes('adverb') || s.includes('pronoun') || s.includes('preposition') || s.includes('tense') || s.includes('plural') || s.includes('singular') || s.includes('subject') || s.includes('predicate') || s.includes('convention') || s.includes('parts of speech') || s.includes('agreement') || s.includes('comma') || s.includes('apostrophe') || s.includes('possessive') || s.includes('contraction') || s.includes('modifier') || s.includes('conjunction') || s.includes('clause') || s.includes('article')) return 'Grammar';
  // Vocabulary
  if (s.includes('vocabulary') || s.includes('vocab') || s.includes('synonym') || s.includes('antonym') || s.includes('context clue') || s.includes('word meaning') || s.includes('word structure') || s.includes('prefix') || s.includes('suffix') || s.includes('root') || s.includes('sight word') || s.includes('rhym') || s.includes('vowel') || s.includes('consonant') || s.includes('blend') || s.includes('digraph') || s.includes('letter') || s.includes('sound') || s.includes('word part') || s.includes('compound word') || s.includes('figurative') || s.includes('idiom') || s.includes('connotation') || s.includes('denotation') || s.includes('multiple meaning') || s.includes('word choice') || s.includes('word relationship') || s.includes('definition') || s.includes('meaning')) return 'Vocabulary';
  // Reading Comprehension
  if (s.includes('comprehension') || s.includes('reading') || s.includes('passage') || s.includes('inference') || s.includes('main idea') || s.includes('character') || s.includes('setting') || s.includes('plot') || s.includes('theme') || s.includes('author') || s.includes('summariz') || s.includes('detail') || s.includes('sequence') || s.includes('cause') || s.includes('compare') || s.includes('tone') || s.includes('mood') || s.includes('genre') || s.includes('fiction') || s.includes('predict') || s.includes('text feature') || s.includes('text structure') || s.includes('text evidence') || s.includes('fact') || s.includes('opinion') || s.includes('point of view') || s.includes('fluency') || s.includes('poetry') || s.includes('story element')) return 'Reading Comprehension';
  // Writing
  if (s.includes('writ') || s.includes('essay') || s.includes('narrative') || s.includes('opinion') || s.includes('persuasive') || s.includes('argument') || s.includes('composition') || s.includes('paragraph') || s.includes('descriptive') || s.includes('procedural') || s.includes('prompt') || s.includes('draft')) return 'Writing';
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
    // Check for explicit topic/skill_tag first
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

// Format skill name for display (capitalize and clean up)
function formatSkillName(skill: string): string {
  return skill
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

// Normalize all questions from any test format into a flat array
function normalizeQuestions(questions: any, testType: string): any[] {
  if (!questions) return [];
  
  // Format: { sections: [ { section_title, questions: [...] }, ... ] }
  // This is the primary format used by Grade 4+ diagnostics stored in the DB
  if (typeof questions === 'object' && !Array.isArray(questions) && Array.isArray(questions.sections)) {
    return questions.sections.flatMap((section: any) =>
      (section.questions || []).map((q: any) => normalizeQuestion({
        ...q,
        section: section.section_title || section.name || section.title || q.section || ''
      }, testType))
    );
  }

  // Format: { all_diagnostics: [...] } — JSON file structure, grab matching grade
  if (typeof questions === 'object' && !Array.isArray(questions) && Array.isArray(questions.all_diagnostics)) {
    return questions.all_diagnostics.flatMap((diagnostic: any) =>
      (diagnostic.sections || []).flatMap((section: any) =>
        (section.questions || []).map((q: any) => normalizeQuestion({
          ...q,
          section: section.section_title || section.name || q.section || ''
        }, testType))
      )
    );
  }

  // Format: flat array of question objects or array of section objects
  if (Array.isArray(questions)) {
    // Array of section objects (each with a questions sub-array)
    if (questions.length > 0 && questions[0]?.questions && Array.isArray(questions[0].questions)) {
      return questions.flatMap((section: any) =>
        (section.questions || []).map((q: any) => normalizeQuestion({
          ...q,
          section: section.section_title || section.name || section.title || q.section || ''
        }, testType))
      );
    }
    // Flat array of question objects
    return questions.map((q: any) => normalizeQuestion(q, testType));
  }
  
  // Format: object with sections as keys: { "Section 1": [...], "Section 2": [...] }
  if (typeof questions === 'object') {
    return Object.entries(questions).flatMap(([sectionName, sectionQuestions]: [string, any]) => {
      if (Array.isArray(sectionQuestions)) {
        return sectionQuestions.map((q: any) => normalizeQuestion({ ...q, section: q.section || sectionName }, testType));
      }
      return [];
    });
  }
  
  return [];
}

// Normalize a single question
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