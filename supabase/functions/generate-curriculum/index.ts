import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { attemptId } = await req.json();
    if (!attemptId) {
      return new Response(JSON.stringify({ error: "Missing attemptId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the test attempt with skill analysis
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First try fetching by attemptId only (service role bypasses RLS)
    const { data: attempt, error: attemptError } = await adminClient
      .from("test_attempts")
      .select(`
        id,
        user_id,
        score,
        tier,
        grade_level,
        skill_analysis,
        strengths,
        weaknesses,
        tests:test_id (name, test_type),
        profiles:user_id (full_name)
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      console.error("Error fetching attempt:", attemptError);
      return new Response(JSON.stringify({ error: "Test attempt not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership OR admin role
    if (attempt.user_id !== user.id) {
      const { data: adminRole } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!adminRole) {
        return new Response(JSON.stringify({ error: "You do not have permission to access this attempt" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const skillAnalysis = attempt.skill_analysis as Record<string, unknown> || {};
    const needsSupport = (skillAnalysis.needsSupport as string[]) || (attempt.weaknesses as string[]) || [];
    const developing = (skillAnalysis.developing as string[]) || [];
    const mastered = (skillAnalysis.mastered as string[]) || (attempt.strengths as string[]) || [];
    const skillStats = (skillAnalysis.skillStats as Record<string, { correct: number; total: number; percentage: number }>) || {};

    // Handle the joined relations - they come as arrays
    const testsData = attempt.tests as unknown as { name: string; test_type: string } | { name: string; test_type: string }[] | null;
    const profilesData = attempt.profiles as unknown as { full_name: string } | { full_name: string }[] | null;
    
    const testName = Array.isArray(testsData) ? testsData[0]?.name : testsData?.name;
    const testType = Array.isArray(testsData) ? testsData[0]?.test_type : testsData?.test_type;
    const studentName = Array.isArray(profilesData) ? profilesData[0]?.full_name : profilesData?.full_name;
    const isELA = testType?.toLowerCase().includes("ela");
    const subjectLabel = isELA ? "ELA/English Language Arts" : "Math";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjectInstruction = isELA
      ? `\n\nCRITICAL: This is an ELA (English Language Arts) diagnostic. Generate ONLY reading, writing, grammar, vocabulary, and spelling content. Do NOT include any math content, math skills, or math terminology whatsoever. All practice questions must be ELA-focused.`
      : `\n\nThis is a Math diagnostic. Generate only math-related content and practice questions.`;

    const systemPrompt = `You are an expert educational curriculum designer for K-12 students specializing in ${subjectLabel}. Create personalized learning curricula based on diagnostic test results.

Your response must be valid JSON with this exact structure:
{
  "curriculum": {
    "title": "Personalized Learning Plan",
    "overview": "Brief overview of the curriculum",
    "weeks": [
      {
        "week": 1,
        "focus": "Main skill focus",
        "objectives": ["Objective 1", "Objective 2"],
        "activities": [
          {
            "name": "Activity name",
            "description": "Activity description",
            "duration": "15-20 minutes",
            "type": "practice|video|game|worksheet"
          }
        ],
        "assessmentGoal": "What student should achieve by end of week"
      }
    ]
  },
  "practiceQuestions": [
    {
      "skill": "Skill name",
      "difficulty": "easy|medium|hard",
      "question": "The question text",
      "type": "multiple_choice",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "hint": "A helpful hint"
    }
  ]
}

IMPORTANT: Do NOT use LaTeX notation anywhere in your response. Write all math expressions in plain text using / for fractions (e.g., "1/3 + 1/6" not "\\frac{1}{3}"). Use × for multiplication, ÷ for division, and standard symbols. The output is rendered in a web UI without a LaTeX renderer.
${subjectInstruction}

Generate 4 weeks of curriculum and 8-12 practice questions focused on the weak/developing skills.`;

    const userPrompt = `Create a personalized ${subjectLabel} curriculum for a Grade ${attempt.grade_level} student based on their ${testName || "diagnostic test"} results. This is a ${subjectLabel} diagnostic test.${isELA ? " Focus exclusively on reading comprehension, vocabulary, spelling, grammar, and writing skills. Do NOT include any math content." : ""}

Test Performance:
- Overall Score: ${attempt.score}%
- Tier: ${attempt.tier}

Skills Needing Support (below 50%):
${needsSupport.length > 0 ? needsSupport.map((s: string) => {
  const stats = skillStats[s];
  return `- ${s}${stats ? ` (${stats.correct}/${stats.total} correct, ${stats.percentage}%)` : ''}`;
}).join('\n') : 'None identified'}

Skills In Progress (50-69%):
${developing.length > 0 ? developing.map((s: string) => {
  const stats = skillStats[s];
  return `- ${s}${stats ? ` (${stats.correct}/${stats.total} correct, ${stats.percentage}%)` : ''}`;
}).join('\n') : 'None identified'}

Skills Mastered (70%+):
${mastered.length > 0 ? mastered.map((s: string) => {
  const stats = skillStats[s];
  return `- ${s}${stats ? ` (${stats.correct}/${stats.total} correct, ${stats.percentage}%)` : ''}`;
}).join('\n') : 'None identified'}

Focus the curriculum primarily on the skills needing support and in-progress skills. Create age-appropriate activities and practice questions for a Grade ${attempt.grade_level} student.`;

    console.log("Generating curriculum for attempt:", attemptId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate curriculum" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON from the response
    let curriculumData;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      curriculumData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", content);
      return new Response(JSON.stringify({ error: "Failed to parse curriculum data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Curriculum generated successfully for attempt:", attemptId);

    return new Response(JSON.stringify({
      success: true,
      studentName: studentName,
      testName: testName,
      gradeLevel: attempt.grade_level,
      tier: attempt.tier,
      score: attempt.score,
      ...curriculumData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const error = err as Error;
    console.error("Error in generate-curriculum:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
