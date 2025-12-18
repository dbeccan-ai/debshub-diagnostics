import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  zh: "Mandarin Chinese",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, targetLanguage } = await req.json();

    if (!questions || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing questions or targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If target is English, return original
    if (targetLanguage === "en") {
      return new Response(
        JSON.stringify({ translatedQuestions: questions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const systemPrompt = `You are a professional translator specializing in educational content. 
Translate the following test questions from English to ${targetLangName}.

CRITICAL RULES:
1. Translate ONLY the text content (question text, options, section names)
2. PRESERVE the exact JSON structure, field names, and IDs
3. Keep mathematical expressions, numbers, and symbols unchanged
4. Maintain the educational accuracy and difficulty level
5. For multiple choice options (A, B, C, D), keep the letter prefixes unchanged
6. Return valid JSON only - no markdown, no explanations`;

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
          {
            role: "user",
            content: `Translate these test questions to ${targetLangName}. Return the same JSON structure with translated text:\n\n${JSON.stringify(questions, null, 2)}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No translation received from AI");
    }

    // Parse the translated JSON
    let translatedQuestions;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      translatedQuestions = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse translated content:", content);
      // Return original if parsing fails
      return new Response(
        JSON.stringify({ translatedQuestions: questions, parseError: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ translatedQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
