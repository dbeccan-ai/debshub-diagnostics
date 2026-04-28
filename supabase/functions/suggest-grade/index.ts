import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Suggestion {
  suggestedPoints: number;
  maxPoints: number;
  rationale: string;
  suggestedComment: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: 'AI suggestions are not configured (missing LOVABLE_API_KEY).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role')
      .eq('user_id', user.id).in('role', ['admin', 'teacher']);
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin or teacher access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const {
      questionText = '',
      expectedAnswer = '',
      studentAnswer = '',
      skillTag = 'General',
      maxPoints,
    } = await req.json();

    if (!questionText || !studentAnswer) {
      return new Response(JSON.stringify({ error: 'questionText and studentAnswer are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'You are an experienced K-12 teacher grading a short-answer or extended-response question. ' +
              'Award partial credit fairly. Be encouraging but accurate. ' +
              'Decide an appropriate maxPoints (1 for closed/short, 2 for short-answer, 3 for extended response) unless one is supplied. ' +
              'Return ONLY a tool call.'
          },
          {
            role: 'user',
            content:
              `Skill: ${skillTag}\n\nQuestion:\n${questionText}\n\nExpected answer / rubric:\n${expectedAnswer || '(none provided)'}\n\nStudent answer:\n${studentAnswer}\n\n` +
              (typeof maxPoints === 'number' && maxPoints > 0 ? `Use maxPoints = ${maxPoints}.` : 'Choose an appropriate maxPoints.')
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'grade_answer',
            description: 'Suggest a partial-credit grade for a student answer.',
            parameters: {
              type: 'object',
              properties: {
                suggestedPoints: { type: 'number', description: 'Points to award (>= 0, <= maxPoints).' },
                maxPoints: { type: 'number', description: 'Total points possible.' },
                rationale: { type: 'string', description: 'One short sentence explaining the score for the teacher.' },
                suggestedComment: { type: 'string', description: '1-2 sentences of feedback addressed to the student.' },
              },
              required: ['suggestedPoints', 'maxPoints', 'rationale', 'suggestedComment'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'grade_answer' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in Workspace → Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'AI suggestion failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: 'AI returned no suggestion' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parsed: Suggestion = JSON.parse(toolCall.function.arguments);
    const safeMax = Math.max(1, Math.round(parsed.maxPoints || 1));
    const safePts = Math.max(0, Math.min(safeMax, Number(parsed.suggestedPoints) || 0));

    return new Response(JSON.stringify({
      suggestedPoints: safePts,
      maxPoints: safeMax,
      rationale: String(parsed.rationale || '').slice(0, 400),
      suggestedComment: String(parsed.suggestedComment || '').slice(0, 600),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('suggest-grade error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
