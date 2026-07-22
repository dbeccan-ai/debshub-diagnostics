import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text, mode } = await req.json();
    if (!text || typeof text !== 'string' || text.length > 60) {
      return new Response(JSON.stringify({ error: 'invalid text' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const isLetter = mode === 'letter';
    const clean = text.trim();

    const instructions = isLetter
      ? `Say only the primary short phonetic sound (phoneme) for the letter "${clean}". Do NOT say the letter name. Say the sound clearly, slowly, and warmly, like a kindergarten teacher modeling for a child. Example: for "b" say "buh", for "a" say "ah".`
      : `Say the word "${clean}" at a slow, encouraging pace, clearly enunciating each sound, like a reading teacher modeling for a young student.`;

    const input = isLetter ? `${clean}.` : clean;

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) throw new Error('LOVABLE_API_KEY missing');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini-tts',
        input,
        voice: 'alloy',
        instructions,
        response_format: 'mp3',
        speed: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('TTS error', res.status, err);
      return new Response(JSON.stringify({ error: 'TTS failed', status: res.status, details: err }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (e) {
    console.error('phonics-speak error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
