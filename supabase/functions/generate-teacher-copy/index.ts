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

    // Verify ownership
    if (attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('test_responses')
      .select('*')
      .eq('attempt_id', attemptId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    const responseMap = new Map((responses || []).map(r => [r.question_id, r]));
    
    // Normalize questions
    const questions = normalizeQuestions(attempt.tests?.questions || []);
    
    // Group questions by section
    const sections = groupQuestionsBySection(questions);

    // Generate HTML
    const html = generateTeacherCopyHTML({
      studentName: attempt.profiles?.full_name || 'Student',
      testName: attempt.tests?.name || 'Diagnostic Test',
      gradeLevel: attempt.grade_level,
      completedAt: attempt.completed_at,
      score: attempt.score,
      tier: attempt.tier,
      correctAnswers: attempt.correct_answers,
      totalQuestions: attempt.total_questions,
      sections,
      responseMap
    });

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

interface QuestionWithResponse {
  id: string;
  number: number;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  studentAnswer?: string;
  isCorrect?: boolean | null;
  section?: string;
}

function normalizeQuestions(rawQuestions: any): any[] {
  if (!rawQuestions) return [];
  
  if (Array.isArray(rawQuestions)) {
    if (rawQuestions[0]?.question || rawQuestions[0]?.question_text || rawQuestions[0]?.id) {
      return rawQuestions.map((q, i) => normalizeQuestion(q, i + 1));
    }
    
    if (rawQuestions[0]?.questions) {
      let num = 0;
      return rawQuestions.flatMap((section: any) => 
        (section.questions || []).map((q: any) => normalizeQuestion(q, ++num, section.section_title || section.title))
      );
    }
    
    if (rawQuestions[0]?.sections) {
      let num = 0;
      return rawQuestions.flatMap((item: any) =>
        (item.sections || []).flatMap((section: any) =>
          (section.questions || []).map((q: any) => normalizeQuestion(q, ++num, section.section_title || section.title))
        )
      );
    }
  }
  
  if (rawQuestions.sections) {
    let num = 0;
    return rawQuestions.sections.flatMap((section: any) =>
      (section.questions || []).map((q: any) => normalizeQuestion(q, ++num, section.section_title || section.title))
    );
  }
  
  return [];
}

function normalizeQuestion(q: any, num: number, section?: string): any {
  return {
    id: q.id || `q-${num}`,
    number: q.number || num,
    question: q.question || q.question_text || '',
    type: q.type || 'multiple_choice',
    options: q.options || q.choices || [],
    correctAnswer: q.correct_answer || q.correctAnswer || '',
    section: section || q.section || 'Questions'
  };
}

function groupQuestionsBySection(questions: any[]): Map<string, any[]> {
  const sections = new Map<string, any[]>();
  
  for (const q of questions) {
    const sectionName = q.section || 'Questions';
    if (!sections.has(sectionName)) {
      sections.set(sectionName, []);
    }
    sections.get(sectionName)!.push(q);
  }
  
  return sections;
}

function generateTeacherCopyHTML(data: {
  studentName: string;
  testName: string;
  gradeLevel: number | null;
  completedAt: string | null;
  score: number | null;
  tier: string | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  sections: Map<string, any[]>;
  responseMap: Map<string, any>;
}): string {
  const tierColor = data.tier === 'Tier 1' ? '#10b981' : data.tier === 'Tier 2' ? '#f59e0b' : '#ef4444';
  
  let sectionsHTML = '';
  let sectionNum = 0;
  
  for (const [sectionName, questions] of data.sections) {
    sectionNum++;
    const isShowYourWork = sectionName.toLowerCase().includes('word problem') || 
                           sectionName.toLowerCase().includes('show your work') ||
                           sectionName.toLowerCase().includes('multi-step');
    
    // Count section stats
    let sectionCorrect = 0;
    let sectionTotal = 0;
    let hasGradableQuestions = false;
    
    for (const q of questions) {
      const response = data.responseMap.get(q.id);
      if (response?.is_correct !== null && response?.is_correct !== undefined) {
        hasGradableQuestions = true;
        sectionTotal++;
        if (response.is_correct) sectionCorrect++;
      }
    }
    
    sectionsHTML += `
      <div class="section">
        <div class="section-header">
          <h2>${sectionName}</h2>
          ${hasGradableQuestions ? `<span class="section-score">${sectionCorrect}/${sectionTotal} correct</span>` : 
            `<span class="section-note">Requires Manual Review</span>`}
        </div>
        ${isShowYourWork ? `<div class="manual-review-notice">⚠️ This section contains open-ended responses that require teacher review and manual grading.</div>` : ''}
        <div class="questions">
    `;
    
    for (const q of questions) {
      const response = data.responseMap.get(q.id);
      const studentAnswer = response?.answer || 'No answer provided';
      const isCorrect = response?.is_correct;
      const isMultipleChoice = q.type?.toLowerCase().includes('multiple') || q.type?.toLowerCase().includes('choice');
      
      let answerClass = 'answer-pending';
      let answerIcon = '○';
      if (isCorrect === true) {
        answerClass = 'answer-correct';
        answerIcon = '✓';
      } else if (isCorrect === false) {
        answerClass = 'answer-incorrect';
        answerIcon = '✗';
      }
      
      sectionsHTML += `
        <div class="question ${answerClass}">
          <div class="question-header">
            <span class="question-number">Q${q.number}</span>
            <span class="status-icon">${answerIcon}</span>
          </div>
          <div class="question-text">${escapeHtml(q.question)}</div>
          
          ${isMultipleChoice && q.options?.length > 0 ? `
            <div class="options">
              ${q.options.map((opt: string, i: number) => {
                const optLetter = String.fromCharCode(65 + i);
                const isStudentChoice = studentAnswer === opt || studentAnswer === optLetter;
                const isCorrectOption = q.correctAnswer === opt || q.correctAnswer === optLetter;
                let optClass = '';
                if (isStudentChoice && isCorrectOption) optClass = 'option-correct';
                else if (isStudentChoice && !isCorrectOption) optClass = 'option-incorrect';
                else if (isCorrectOption) optClass = 'option-correct-answer';
                
                return `<div class="option ${optClass}">
                  <span class="option-letter">${optLetter}.</span>
                  <span class="option-text">${escapeHtml(opt)}</span>
                  ${isStudentChoice ? '<span class="student-choice">(Student\'s Answer)</span>' : ''}
                  ${isCorrectOption && !isStudentChoice ? '<span class="correct-mark">(Correct Answer)</span>' : ''}
                </div>`;
              }).join('')}
            </div>
          ` : `
            <div class="written-response">
              <div class="response-label">Student's Response:</div>
              <div class="response-content">${escapeHtml(studentAnswer)}</div>
              ${q.correctAnswer ? `
                <div class="correct-answer-box">
                  <div class="response-label">Expected Answer:</div>
                  <div class="correct-answer-text">${escapeHtml(q.correctAnswer)}</div>
                </div>
              ` : ''}
              <div class="grading-box">
                <span>Teacher Score:</span>
                <span class="score-box">_____ / _____</span>
              </div>
            </div>
          `}
        </div>
      `;
    }
    
    sectionsHTML += '</div></div>';
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teacher Copy - ${data.testName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, sans-serif; 
      font-size: 11pt;
      line-height: 1.4;
      color: #1e293b;
      padding: 0.5in;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${tierColor};
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header-left h1 { font-size: 18pt; color: #0f172a; margin-bottom: 5px; }
    .header-left p { font-size: 10pt; color: #64748b; }
    .header-right { text-align: right; }
    .score-box-large {
      background: ${tierColor}15;
      border: 2px solid ${tierColor};
      border-radius: 8px;
      padding: 10px 20px;
      text-align: center;
    }
    .score-box-large .tier { 
      font-size: 14pt; 
      font-weight: bold; 
      color: ${tierColor};
    }
    .score-box-large .score { 
      font-size: 24pt; 
      font-weight: bold; 
      color: #0f172a;
    }
    .score-box-large .details { font-size: 9pt; color: #64748b; }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item { text-align: center; }
    .info-item label { font-size: 8pt; color: #64748b; display: block; }
    .info-item value { font-size: 11pt; font-weight: 600; color: #0f172a; }
    
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: white;
      padding: 8px 15px;
      border-radius: 6px 6px 0 0;
    }
    .section-header h2 { font-size: 12pt; font-weight: 600; }
    .section-score { 
      background: #10b981; 
      padding: 3px 10px; 
      border-radius: 20px; 
      font-size: 9pt;
      font-weight: 600;
    }
    .section-note {
      background: #f59e0b;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
      color: #0f172a;
    }
    .manual-review-notice {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 8px 15px;
      font-size: 9pt;
    }
    
    .questions { border: 1px solid #e2e8f0; border-top: none; }
    .question {
      padding: 12px 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    .question:last-child { border-bottom: none; }
    .question-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .question-number {
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9pt;
    }
    .status-icon { font-size: 14pt; font-weight: bold; }
    .answer-correct .status-icon { color: #10b981; }
    .answer-incorrect .status-icon { color: #ef4444; }
    .answer-pending .status-icon { color: #94a3b8; }
    
    .question-text { 
      font-size: 10pt; 
      margin-bottom: 10px;
      color: #334155;
    }
    
    .options { margin-left: 20px; }
    .option {
      padding: 4px 8px;
      margin: 3px 0;
      border-radius: 4px;
      font-size: 10pt;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .option-letter { font-weight: 600; min-width: 20px; }
    .option-correct { background: #dcfce7; border: 1px solid #10b981; }
    .option-incorrect { background: #fee2e2; border: 1px solid #ef4444; }
    .option-correct-answer { background: #dcfce7; border: 1px dashed #10b981; }
    .student-choice { 
      font-size: 8pt; 
      color: #64748b; 
      font-style: italic;
      margin-left: auto;
    }
    .correct-mark { 
      font-size: 8pt; 
      color: #10b981; 
      font-weight: 600;
      margin-left: auto;
    }
    
    .written-response {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-top: 8px;
    }
    .response-label {
      font-size: 9pt;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .response-content {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 4px;
      min-height: 60px;
      font-size: 10pt;
      white-space: pre-wrap;
    }
    .correct-answer-box {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }
    .correct-answer-text {
      color: #10b981;
      font-weight: 500;
    }
    .grading-box {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10pt;
    }
    .score-box {
      font-family: monospace;
      font-size: 12pt;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    .footer strong { color: #0f172a; }
    
    @media print {
      body { padding: 0.25in; }
      .section { page-break-inside: avoid; }
      .question { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>📋 Teacher Review Copy</h1>
      <p>${data.testName} • Grade ${data.gradeLevel || 'N/A'}</p>
    </div>
    <div class="header-right">
      <div class="score-box-large">
        <div class="tier">${data.tier || 'Pending'}</div>
        <div class="score">${data.score !== null ? `${data.score}%` : 'N/A'}</div>
        <div class="details">${data.correctAnswers || 0}/${data.totalQuestions || 0} auto-graded</div>
      </div>
    </div>
  </div>
  
  <div class="info-grid">
    <div class="info-item">
      <label>Student Name</label>
      <value>${escapeHtml(data.studentName)}</value>
    </div>
    <div class="info-item">
      <label>Grade Level</label>
      <value>Grade ${data.gradeLevel || 'N/A'}</value>
    </div>
    <div class="info-item">
      <label>Test Date</label>
      <value>${data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'N/A'}</value>
    </div>
    <div class="info-item">
      <label>Auto-Graded Score</label>
      <value>${data.score !== null ? `${data.score}%` : 'Pending'}</value>
    </div>
  </div>
  
  ${sectionsHTML}
  
  <div class="footer">
    <p><strong>D.E.Bs LEARNING ACADEMY</strong> — Unlocking Brilliance Through Learning</p>
    <p>Phone: 347-364-1906 | Email: info@debslearnacademy.com</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
