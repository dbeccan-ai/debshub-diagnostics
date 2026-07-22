import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Primary short phoneme approximations for single letters
const LETTER_SOUNDS: Record<string, string[]> = {
  a: ['a', 'ah', 'aa', 'æ', 'ay', 'apple'],
  b: ['b', 'buh', 'bee', 'bh'],
  c: ['c', 'kuh', 'k', 'see', 'cuh'],
  d: ['d', 'duh', 'dee'],
  e: ['e', 'eh', 'ee', 'egg'],
  f: ['f', 'fuh', 'ef', 'ff'],
  g: ['g', 'guh', 'jee'],
  h: ['h', 'huh', 'aitch', 'hh'],
  i: ['i', 'ih', 'eye', 'igloo'],
  j: ['j', 'juh', 'jay'],
  k: ['k', 'kuh', 'kay'],
  l: ['l', 'luh', 'el', 'll'],
  m: ['m', 'muh', 'em', 'mm'],
  n: ['n', 'nuh', 'en', 'nn'],
  o: ['o', 'oh', 'ah', 'octopus'],
  p: ['p', 'puh', 'pee'],
  q: ['q', 'kwuh', 'cue', 'kw'],
  r: ['r', 'ruh', 'ar', 'rr'],
  s: ['s', 'suh', 'ess', 'ss'],
  t: ['t', 'tuh', 'tee'],
  u: ['u', 'uh', 'you', 'umbrella'],
  v: ['v', 'vuh', 'vee'],
  w: ['w', 'wuh', 'double-u'],
  x: ['x', 'ks', 'ex'],
  y: ['y', 'yuh', 'why'],
  z: ['z', 'zuh', 'zee', 'zed'],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s']/g, '').trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const target = String(form.get('target') ?? '').trim();
    const mode = String(form.get('mode') ?? 'word');
    const dayNumber = form.get('day_number') ? Number(form.get('day_number')) : null;
    const enrollmentId = (form.get('enrollment_id') as string) || null;

    if (!audio || !target) {
      return new Response(JSON.stringify({ error: 'missing audio or target' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) throw new Error('LOVABLE_API_KEY missing');

    const up = new FormData();
    up.append('file', audio, (audio as File).name || 'clip.webm');
    up.append('model', 'openai/gpt-4o-transcribe');

    const sttRes = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: up,
    });

    if (!sttRes.ok) {
      const err = await sttRes.text();
      console.error('STT error', sttRes.status, err);
      return new Response(JSON.stringify({ error: 'STT failed', status: sttRes.status, details: err }), {
        status: sttRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sttJson = await sttRes.json();
    const heardRaw: string = sttJson.text ?? '';
    const heard = normalize(heardRaw);
    const tgt = normalize(target);

    let correct = false;
    if (mode === 'letter' && tgt.length === 1) {
      const accepted = LETTER_SOUNDS[tgt] ?? [tgt];
      const firstToken = heard.split(/\s+/)[0] ?? '';
      correct = accepted.some(a => firstToken === a || heard.includes(a));
    } else {
      // word match: exact, contained, or within Levenshtein tolerance
      if (heard === tgt) correct = true;
      else if (heard.split(/\s+/).includes(tgt)) correct = true;
      else {
        const tol = tgt.length <= 4 ? 1 : tgt.length <= 7 ? 2 : 3;
        correct = levenshtein(heard.replace(/\s+/g, ''), tgt) <= tol;
      }
    }

    // Log attempt (best-effort; requires auth header)
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anon = Deno.env.get('SUPABASE_ANON_KEY');
        if (supabaseUrl && anon) {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { Authorization: authHeader, apikey: anon },
          });
          if (userRes.ok) {
            const user = await userRes.json();
            if (user?.id) {
              await fetch(`${supabaseUrl}/rest/v1/phonics_attempts`, {
                method: 'POST',
                headers: {
                  Authorization: authHeader,
                  apikey: anon,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({
                  user_id: user.id,
                  enrollment_id: enrollmentId,
                  day_number: dayNumber,
                  target,
                  mode,
                  correct,
                  heard: heardRaw.slice(0, 200),
                }),
              });
            }
          }
        }
      }
    } catch (logErr) {
      console.error('log attempt failed', logErr);
    }

    return new Response(JSON.stringify({ correct, heard: heardRaw, target }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('phonics-check error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
