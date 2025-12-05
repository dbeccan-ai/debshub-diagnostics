import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Skill inference patterns
const skillPatterns: [RegExp, string][] = [
  [/round(ed|ing)?/i, 'Rounding'],
  [/multipli|×|times/i, 'Multiplication'],
  [/divid|÷|quotient/i, 'Division'],
  [/fraction|\/\d/i, 'Fractions'],
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
  [/place\s+value|digit.*place/i, 'Place Value'],
];

function inferSkillFromQuestion(question: any): string {
  const text = `${question.question || question.question_text || ''} ${question.section || ''}`.toLowerCase();
  if (question.topic && question.topic !== 'general') return formatSkillName(question.topic);
  if (question.skill_tag && question.skill_tag !== 'general') return formatSkillName(question.skill_tag);
  for (const [pattern, skill] of skillPatterns) {
    if (pattern.test(text)) return skill;
  }
  return 'General Math';
}

function formatSkillName(skill: string): string {
  return skill.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).trim();
}

function normalizeQuestions(rawQuestions: any): any[] {
  if (!rawQuestions) return [];
  if (Array.isArray(rawQuestions)) {
    if (rawQuestions[0]?.question || rawQuestions[0]?.question_text || rawQuestions[0]?.id) {
      return rawQuestions.map(normalizeQuestion);
    }
    if (rawQuestions[0]?.questions) {
      return rawQuestions.flatMap((section: any) => (section.questions || []).map(normalizeQuestion));
    }
    if (rawQuestions[0]?.sections) {
      return rawQuestions.flatMap((item: any) =>
        (item.sections || []).flatMap((section: any) => (section.questions || []).map(normalizeQuestion))
      );
    }
  }
  if (rawQuestions.sections) {
    return rawQuestions.sections.flatMap((section: any) => (section.questions || []).map(normalizeQuestion));
  }
  return [];
}

function normalizeQuestion(q: any): any {
  const normalized = {
    id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
    question: q.question || q.question_text || '',
    type: q.type || 'multiple-choice',
    topic: q.topic || q.skill_tag || '',
  };
  normalized.topic = inferSkillFromQuestion({ ...q, ...normalized });
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

    // Check admin/teacher role
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

    const { attemptId } = await req.json();
    
    if (!attemptId) {
      return new Response(
        JSON.stringify({ error: 'attemptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Finalizing grading for attempt ${attemptId} by ${user.id}`);

    // Fetch attempt with test and profile data
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('test_attempts')
      .select('*, tests(*), profiles:user_id(full_name, parent_email)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all responses
    const { data: responses, error: respError } = await supabaseAdmin
      .from('test_responses')
      .select('*')
      .eq('attempt_id', attemptId);

    if (respError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending reviews
    const pendingCount = responses?.filter(r => r.is_correct === null).length || 0;
    if (pendingCount > 0) {
      return new Response(
        JSON.stringify({ error: `${pendingCount} questions still need grading` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize questions for skill analysis
    const questions = normalizeQuestions(attempt.tests?.questions);
    
    // Build skill stats
    interface SkillStat { total: number; correct: number; percentage: number; }
    const skillStats: Record<string, SkillStat> = {};
    let correctCount = 0;
    let totalCount = 0;

    for (const response of responses || []) {
      const question = questions.find((q: any) => q.id === response.question_id);
      const skill = question?.topic || 'General Math';
      
      if (!skillStats[skill]) {
        skillStats[skill] = { total: 0, correct: 0, percentage: 0 };
      }
      
      skillStats[skill].total++;
      totalCount++;
      
      if (response.is_correct) {
        correctCount++;
        skillStats[skill].correct++;
      }
    }

    // Calculate percentages and categorize
    const mastered: string[] = [];
    const needsSupport: string[] = [];
    const developing: string[] = [];

    for (const [skill, stats] of Object.entries(skillStats)) {
      stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      if (stats.percentage >= 70) mastered.push(skill);
      else if (stats.percentage < 50) needsSupport.push(skill);
      else developing.push(skill);
    }

    const skillAnalysis = { mastered: mastered.sort(), needsSupport: needsSupport.sort(), developing: developing.sort(), skillStats };
    const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    const tier = score >= 80 ? 'Tier 1' : score >= 50 ? 'Tier 2' : 'Tier 3';

    console.log(`Finalized: ${correctCount}/${totalCount} = ${score.toFixed(1)}% (${tier})`);

    // Update the test attempt
    const { error: updateError } = await supabaseAdmin
      .from('test_attempts')
      .update({
        score: Math.round(score * 100) / 100,
        correct_answers: correctCount,
        total_questions: totalCount,
        tier,
        strengths: mastered.slice(0, 5),
        weaknesses: needsSupport.slice(0, 5),
        skill_analysis: skillAnalysis
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email to parent
    let emailSent = false;
    let emailError = null;
    
    const parentEmail = attempt.profiles?.parent_email;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (parentEmail && resendApiKey) {
      const tierColors: { [key: string]: { primary: string; secondary: string } } = {
        'Tier 1': { primary: '#10b981', secondary: '#d1fae5' },
        'Tier 2': { primary: '#f59e0b', secondary: '#fef3c7' },
        'Tier 3': { primary: '#ef4444', secondary: '#fee2e2' },
      };
      const tierColor = tierColors[tier];

      // Fetch certificate
      const { data: certificate } = await supabaseAdmin
        .from('certificates')
        .select('certificate_url')
        .eq('attempt_id', attemptId)
        .maybeSingle();

      const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${tierColor.primary}; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .tier-badge { display: inline-block; background: ${tierColor.secondary}; color: ${tierColor.primary}; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .score-box { background: ${tierColor.secondary}; border-left: 4px solid ${tierColor.primary}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .section { margin: 25px 0; }
    .section h3 { color: #667eea; margin-bottom: 10px; }
    .list { list-style-type: none; padding: 0; }
    .list li { padding: 8px 0; padding-left: 25px; position: relative; }
    .list li:before { content: "✓"; position: absolute; left: 0; color: ${tierColor.primary}; }
    .button { display: inline-block; background: ${tierColor.primary}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
    .tier3-message { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>D.E.Bs LEARNING ACADEMY</h1>
      <p>Unlocking Brilliance Through Learning</p>
    </div>
    <div class="content">
      <h2>Final Test Results for ${attempt.profiles?.full_name}</h2>
      <p>Dear Parent,</p>
      <p>Your child's <strong>${attempt.tests?.name}</strong> has been fully graded. Here are the final results:</p>
      <div class="score-box">
        <h2 style="margin: 0; color: ${tierColor.primary};">Score: ${Math.round(score)}%</h2>
        <p>Tier Placement: <span class="tier-badge">${tier}</span></p>
      </div>
      ${mastered.length > 0 ? `
      <div class="section">
        <h3>🌟 Areas of Strength</h3>
        <ul class="list">${mastered.slice(0, 5).map(s => `<li>${s}</li>`).join('')}</ul>
      </div>` : ''}
      ${needsSupport.length > 0 ? `
      <div class="section">
        <h3>📚 Areas for Growth</h3>
        <ul class="list">${needsSupport.slice(0, 5).map(w => `<li>${w}</li>`).join('')}</ul>
      </div>` : ''}
      ${tier === 'Tier 3' ? `
      <div class="tier3-message">
        <strong>Recommendation:</strong> Based on the results, we strongly recommend additional support. 
        Consider booking a tutor with D.E.Bs LEARNING ACADEMY.
      </div>` : ''}
      ${certificate?.certificate_url ? `
      <p style="text-align: center;">
        <a href="${certificate.certificate_url}" class="button">View Certificate</a>
      </p>` : ''}
      <p>Contact us at 347-364-1906 or info@debslearnacademy.com with any questions.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} D.E.Bs LEARNING ACADEMY</p>
    </div>
  </div>
</body>
</html>`;

      try {
        const resend = new Resend(resendApiKey);
        const { error: sendError } = await resend.emails.send({
          from: 'D.E.Bs Learning Academy <onboarding@resend.dev>',
          to: [parentEmail],
          subject: `Final Results: ${attempt.tests?.name} - ${attempt.profiles?.full_name}`,
          html: emailHTML,
        });

        if (sendError) {
          console.error('Email error:', sendError);
          emailError = sendError.message;
        } else {
          emailSent = true;
          console.log(`Email sent to ${parentEmail}`);
          await supabaseAdmin
            .from('test_attempts')
            .update({ email_status: 'sent' })
            .eq('id', attemptId);
        }
      } catch (e: any) {
        console.error('Email exception:', e);
        emailError = e.message;
      }
    } else {
      console.log('Email skipped - no parent email or API key');
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score * 100) / 100,
        tier,
        skillAnalysis,
        emailSent,
        emailError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in finalize-grading:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
