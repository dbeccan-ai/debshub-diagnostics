import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CURRICULUM_SCHEMA_VERSION, TIER3_PLAN, DEFAULT_PROGRESSION_TARGET, tierFromScore, detectSubject, resolveGrades,
  buildStrandPlans, buildWeekSpecs, sessionInfo, finalizeWeek, validatePlan, buildBatchPrompt, gradeLabel,
  type WeekSpec, type IntensiveCurriculum,
} from "../_shared/general-curriculum.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

    const body = await req.json();
    const { attemptId } = body;
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

    // ── Tier 3: 12-week intensive plan + 3 optional extension weeks (schema v2) ──
    if (tierFromScore(attempt.score) === "Tier 3") {
      const subject = detectSubject(testType, testName);
      if (!subject) return json({ error: "This diagnostic's subject could not be determined from its test type, so a Math/ELA intervention plan cannot be generated." }, 422);

      // Staff (admin/teacher) may supply a confirmed enrolled grade; otherwise it stays unverified and is flagged.
      let confirmedEnrolledGrade: number | null = null;
      if (body.confirmedEnrolledGrade !== undefined && body.confirmedEnrolledGrade !== null) {
        const { data: staff } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "teacher"]);
        if (!staff?.length) return json({ error: "Only a teacher or admin can confirm the enrolled grade." }, 403);
        confirmedEnrolledGrade = Number(body.confirmedEnrolledGrade);
      }
      const grades = resolveGrades({ testedGrade: attempt.grade_level, confirmedEnrolledGrade });
      if (grades.anchor_grade === null) return json({ error: grades.notice }, 422);
      const strands = buildStrandPlans(grades.anchor_grade, { skillStats, needsSupport, developing, mastered });
      if (!strands.length) return json({ error: "No skill evidence is recorded for this attempt, so an individualized plan cannot be generated yet." }, 422);
      const specs = buildWeekSpecs(grades.anchor_grade, strands);
      const sessions = sessionInfo(null); // no session schedule is configured for the general pathway
      const firstName = (studentName || "Student").split(" ")[0];

      const callBatch = async (batch: WeekSpec[], avoid: string[]) => {
        let lastErrors: string[] = [];
        for (let attemptNo = 1; attemptNo <= 3; attemptNo++) {
          const { system, user: u } = buildBatchPrompt({ subject, studentFirstName: firstName, anchorLabel: gradeLabel(grades.anchor_grade!), testedLabel: grades.tested_grade !== null ? gradeLabel(grades.tested_grade) : null, strands, specs: batch, avoidPrompts: avoid, sessionsPerWeek: sessions.sessions_per_week });
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: system }, { role: "user", content: lastErrors.length ? `${u}\n\nYour previous answer was rejected for: ${lastErrors.slice(0, 15).join("; ")}. Fix every issue.` : u }], response_format: { type: "json_object" }, temperature: 0.6 }),
          });
          if (r.status === 429 || r.status === 402) throw Object.assign(new Error(r.status === 429 ? "Rate limit exceeded. Please try again in a moment." : "AI service credits depleted."), { status: r.status });
          if (!r.ok) { lastErrors = [`AI gateway status ${r.status}`]; await r.text(); continue; }
          const j = await r.json();
          if (j.choices?.[0]?.finish_reason === "length") { lastErrors = ["output was truncated; be more concise in explanations but keep all items"]; continue; }
          let parsed: any;
          try { const c = String(j.choices?.[0]?.message?.content ?? ""); parsed = JSON.parse((c.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? c).trim()); } catch { lastErrors = ["invalid JSON"]; continue; }
          const raws: any[] = Array.isArray(parsed?.weeks) ? parsed.weeks : [];
          const out = []; const errs: string[] = [];
          for (const spec of batch) {
            const f = finalizeWeek(raws.find((w) => Number(w?.week) === spec.week), spec, subject, sessions.sessions_per_week);
            if (f.week) out.push(f.week); else errs.push(...f.errors);
          }
          if (!errs.length) return out;
          lastErrors = errs;
          console.warn(`generate-curriculum batch weeks ${batch[0].week}-${batch.at(-1)!.week} attempt ${attemptNo} rejected: ${errs.length} issues`);
        }
        throw Object.assign(new Error(`Could not generate a complete plan for weeks ${batch[0].week}–${batch.at(-1)!.week} after 3 attempts. Nothing was saved; please try again.`), { status: 502 });
      };

      try {
        const batches: WeekSpec[][] = [];
        for (let i = 0; i < specs.length; i += TIER3_PLAN.batch_size_weeks) batches.push(specs.slice(i, i + TIER3_PLAN.batch_size_weeks));
        const results = await Promise.all(batches.map((b) => callBatch(b, [])));
        const plan: IntensiveCurriculum = {
          schemaVersion: CURRICULUM_SCHEMA_VERSION as 2, plan_type: "tier3_intensive", plan_label: TIER3_PLAN.label, subject,
          core_weeks: TIER3_PLAN.core_weeks, extension_weeks: TIER3_PLAN.extension_weeks, grades, sessions,
          progression_target: { ...DEFAULT_PROGRESSION_TARGET }, strands,
          overview: `${firstName}'s intensive ${subject === "ela" ? "ELA" : "Math"} plan rebuilds diagnosed prerequisite skills from ${specs[0].instructional_label} through ${gradeLabel(grades.anchor_grade)} application over 12 core weeks, with up to 3 optional extension weeks selected from the Week 12 reassessment. Grade phases are intended pacing; students progress only when checks show the progression target is met.`,
          weeks: results.flat(),
          formal_retests_note: "Weekly and phase checks are instructional checkpoints. Formal diagnostic retests (follow-up assessments) remain on their existing schedule and are separate.",
          limitations: ["No recorded checkpoint results yet: every week shows 'Awaiting evidence' until results are recorded.", "Covering three grade levels of prerequisites in 15 weeks is not guaranteed; the reassessment reports achieved skills and remaining gaps."],
        };
        // Cross-week duplicate check, with one bounded regeneration for offending batches.
        let planErrors = validatePlan(plan, specs);
        if (planErrors.length) {
          const bad = new Set(planErrors.map((m) => Number(m.match(/^Week (\d+)/)?.[1])).filter(Boolean));
          const avoid = plan.weeks.filter((w) => !bad.has(w.week)).flatMap((w) => w.items.map((i) => i.prompt));
          for (const [bi, b] of batches.entries()) if (b.some((s) => bad.has(s.week))) results[bi] = await callBatch(b, avoid);
          plan.weeks = results.flat();
          planErrors = validatePlan(plan, specs);
        }
        if (planErrors.length) return json({ error: `Generated plan failed validation (${planErrors.slice(0, 3).join("; ")}). Nothing was saved; please try again.` }, 502);
        return json({ success: true, studentName, testName, gradeLevel: attempt.grade_level, tier: "Tier 3", score: attempt.score, ...plan });
      } catch (e) {
        const err = e as Error & { status?: number };
        return json({ error: err.message }, err.status ?? 500);
      }
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
- Tier: ${(attempt.score || 0) >= 85 ? 'Tier 1' : (attempt.score || 0) >= 66 ? 'Tier 2' : 'Tier 3'}

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
      tier: (attempt.score || 0) >= 85 ? 'Tier 1' : (attempt.score || 0) >= 66 ? 'Tier 2' : 'Tier 3',
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
