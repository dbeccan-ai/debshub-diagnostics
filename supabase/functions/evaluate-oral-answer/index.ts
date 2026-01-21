import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationRequest {
  passageText: string;
  questionText: string;
  studentTranscript: string;
  questionType: 'literal' | 'inferential' | 'analytical';
}

interface EvaluationResponse {
  suggestedResult: 'correct' | 'incorrect' | 'unclear';
  confidence: number;
  rationale: string;
  expectedAnswer: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passageText, questionText, studentTranscript, questionType }: EvaluationRequest = await req.json();

    console.log('Evaluating oral answer:', { questionType, questionText, transcriptLength: studentTranscript?.length });

    // Validate inputs
    if (!passageText || !questionText || !studentTranscript) {
      return new Response(
        JSON.stringify({
          suggestedResult: 'unclear',
          confidence: 0,
          rationale: 'Missing required inputs for evaluation.',
          expectedAnswer: 'Unable to determine expected answer.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If transcript is too short or empty, mark as unclear
    if (studentTranscript.trim().length < 3) {
      return new Response(
        JSON.stringify({
          suggestedResult: 'unclear',
          confidence: 0,
          rationale: 'The student response was too short to evaluate.',
          expectedAnswer: 'A complete verbal response is needed.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      // Fallback to keyword matching for literal questions
      return fallbackEvaluation(passageText, questionText, studentTranscript, questionType);
    }

    const systemPrompt = `You are an expert reading comprehension evaluator. Your task is to grade a student's verbal response to a comprehension question.

CRITICAL RULES:
1. ONLY use the provided passage as the source of truth. Do NOT use outside knowledge.
2. Quote evidence directly from the passage when explaining your rationale.
3. Be fair but accurate - partial answers can be marked as correct if they demonstrate understanding.

QUESTION TYPE GUIDELINES:
- LITERAL: Mark correct if the student's answer matches facts stated directly in the passage or uses reasonable synonyms.
- INFERENTIAL: Mark correct if the student makes a reasonable inference supported by passage details. Mark incorrect if it contradicts passage evidence.
- ANALYTICAL: Mark correct if the student provides reasoning that connects evidence to their explanation. Mark unclear if the response is vague or partial.

You must respond with a JSON object with these exact fields:
{
  "suggestedResult": "correct" | "incorrect" | "unclear",
  "confidence": <number 0-100>,
  "rationale": "<1-2 sentences referencing passage evidence>",
  "expectedAnswer": "<short phrase(s) derived from passage that would be correct>"
}`;

    const userPrompt = `PASSAGE:
"""
${passageText}
"""

QUESTION (${questionType.toUpperCase()}):
"${questionText}"

STUDENT'S VERBAL RESPONSE (transcript):
"${studentTranscript}"

Evaluate whether this response is correct based ONLY on the passage. Return your evaluation as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error("AI gateway error:", response.status);
      return fallbackEvaluation(passageText, questionText, studentTranscript, questionType);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI response:', content);

    // Parse the JSON response
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const evaluation: EvaluationResponse = JSON.parse(jsonStr.trim());
      
      // Validate and normalize the response
      const validResults = ['correct', 'incorrect', 'unclear'];
      if (!validResults.includes(evaluation.suggestedResult)) {
        evaluation.suggestedResult = 'unclear';
      }
      if (typeof evaluation.confidence !== 'number' || evaluation.confidence < 0 || evaluation.confidence > 100) {
        evaluation.confidence = 50;
      }

      return new Response(JSON.stringify(evaluation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return fallbackEvaluation(passageText, questionText, studentTranscript, questionType);
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({
        suggestedResult: 'unclear',
        confidence: 0,
        rationale: 'An error occurred during evaluation. Please score manually.',
        expectedAnswer: 'Unable to determine.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback evaluation using keyword matching (for literal questions only)
function fallbackEvaluation(
  passageText: string, 
  questionText: string, 
  studentTranscript: string,
  questionType: string
): Response {
  // For non-literal questions, always return unclear in fallback mode
  if (questionType !== 'literal') {
    return new Response(
      JSON.stringify({
        suggestedResult: 'unclear',
        confidence: 0,
        rationale: `${questionType.charAt(0).toUpperCase() + questionType.slice(1)} questions require human evaluation.`,
        expectedAnswer: 'Please review the passage and evaluate manually.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Simple keyword extraction for literal questions
  const passageWords = passageText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const transcriptWords = studentTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Count matching significant words
  const matches = transcriptWords.filter(tw => passageWords.includes(tw));
  const matchRatio = matches.length / Math.max(transcriptWords.length, 1);

  let suggestedResult: 'correct' | 'incorrect' | 'unclear' = 'unclear';
  let confidence = 30;

  if (matchRatio >= 0.5 && matches.length >= 2) {
    suggestedResult = 'correct';
    confidence = Math.min(70, 40 + matches.length * 10);
  } else if (matchRatio < 0.2 || matches.length === 0) {
    suggestedResult = 'incorrect';
    confidence = 40;
  }

  return new Response(
    JSON.stringify({
      suggestedResult,
      confidence,
      rationale: `Keyword matching found ${matches.length} relevant terms from the passage. Human review recommended.`,
      expectedAnswer: 'Based on passage content - please verify manually.',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
