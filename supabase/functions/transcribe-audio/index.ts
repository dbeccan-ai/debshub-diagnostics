import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptionResult {
  transcript: string;
  wordTimings: Array<{ word: string; start: number; end: number }>;
  errors: {
    omissions: string[];
    substitutions: Array<{ expected: string; actual: string }>;
    insertions: string[];
  };
  suggestedErrorCount: number;
}

// Normalize text for comparison (lowercase, remove punctuation, trim)
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-—–]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// Compare transcript to original passage and detect errors
function compareTexts(originalText: string, transcriptText: string): TranscriptionResult["errors"] {
  const originalWords = normalizeText(originalText);
  const transcriptWords = normalizeText(transcriptText);
  
  const errors: TranscriptionResult["errors"] = {
    omissions: [],
    substitutions: [],
    insertions: [],
  };
  
  // Use Levenshtein-like comparison with word-level diff
  let origIndex = 0;
  let transIndex = 0;
  
  while (origIndex < originalWords.length || transIndex < transcriptWords.length) {
    const origWord = originalWords[origIndex];
    const transWord = transcriptWords[transIndex];
    
    if (!origWord && transWord) {
      // Extra words at the end = insertions
      errors.insertions.push(transWord);
      transIndex++;
    } else if (origWord && !transWord) {
      // Missing words at the end = omissions
      errors.omissions.push(origWord);
      origIndex++;
    } else if (origWord === transWord) {
      // Match - move both pointers
      origIndex++;
      transIndex++;
    } else {
      // Mismatch - check if it's a substitution, omission, or insertion
      // Look ahead to find the best match
      const lookAhead = 3;
      
      // Check if current transcript word matches a later original word (omission)
      let foundLaterMatch = false;
      for (let i = 1; i <= lookAhead && origIndex + i < originalWords.length; i++) {
        if (originalWords[origIndex + i] === transWord) {
          // Mark skipped words as omissions
          for (let j = 0; j < i; j++) {
            errors.omissions.push(originalWords[origIndex + j]);
          }
          origIndex += i;
          foundLaterMatch = true;
          break;
        }
      }
      
      if (!foundLaterMatch) {
        // Check if current original word matches a later transcript word (insertion)
        let foundInsertion = false;
        for (let i = 1; i <= lookAhead && transIndex + i < transcriptWords.length; i++) {
          if (transcriptWords[transIndex + i] === origWord) {
            // Mark extra words as insertions
            for (let j = 0; j < i; j++) {
              errors.insertions.push(transcriptWords[transIndex + j]);
            }
            transIndex += i;
            foundInsertion = true;
            break;
          }
        }
        
        if (!foundInsertion) {
          // It's a substitution
          errors.substitutions.push({ expected: origWord, actual: transWord });
          origIndex++;
          transIndex++;
        }
      }
    }
  }
  
  return errors;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
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

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const originalText = formData.get("originalText") as string;

    if (!audioFile || !originalText) {
      return new Response(JSON.stringify({ error: "Missing audio file or original text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert audio file to base64 (chunked to avoid stack overflow)
    const audioBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    
    // Process in chunks to avoid "Maximum call stack size exceeded"
    const chunkSize = 8192;
    let binaryString = "";
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const audioBase64 = btoa(binaryString);

    // Use Lovable AI Gateway with Gemini for transcription
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending audio for transcription...");

    // Use Gemini Flash for audio transcription
    const transcriptionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a precise speech-to-text transcription assistant. Your task is to transcribe audio of a child reading aloud. 
            
Transcribe EXACTLY what you hear, including:
- Mispronunciations (write what was actually said)
- Hesitations or repeated words
- Any words the child adds or skips

Return ONLY a JSON object in this exact format:
{
  "transcript": "the exact words spoken",
  "wordTimings": [{"word": "the", "start": 0.0, "end": 0.3}, ...]
}

Do not include any explanation, just the JSON.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this audio recording of a child reading the following passage. Return the transcription as JSON with the transcript and word timings.

Original passage (for context only - transcribe what you HEAR, not this text):
"${originalText}"`
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: audioFile.type.includes("webm") ? "webm" : "mp3"
                }
              }
            ]
          }
        ],
      }),
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Transcription API error:", transcriptionResponse.status, errorText);
      
      if (transcriptionResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (transcriptionResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const content = transcriptionData.choices?.[0]?.message?.content || "";
    
    console.log("Raw transcription response:", content);

    // Parse the JSON response
    let transcript = "";
    let wordTimings: Array<{ word: string; start: number; end: number }> = [];
    
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        transcript = parsed.transcript || "";
        wordTimings = parsed.wordTimings || [];
      } else {
        // If no JSON found, treat the whole content as transcript
        transcript = content;
      }
    } catch (parseError) {
      console.log("Could not parse as JSON, using raw content as transcript");
      transcript = content;
    }

    // Compare transcript with original text to detect errors
    const errors = compareTexts(originalText, transcript);
    const suggestedErrorCount = 
      errors.omissions.length + 
      errors.substitutions.length + 
      errors.insertions.length;

    const result: TranscriptionResult = {
      transcript,
      wordTimings,
      errors,
      suggestedErrorCount,
    };

    console.log("Transcription complete. Detected errors:", suggestedErrorCount);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
