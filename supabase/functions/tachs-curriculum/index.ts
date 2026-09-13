// ADMIN-ONLY TACHS curriculum generator. Read-only: never writes to attempts, orders, reports or events.
// The admin role is validated server-side BEFORE any attempt detail is read or returned. Students and
// parents receive 403. The general generate-curriculum endpoint's ownership rules are intentionally untouched.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildTachsCurriculum } from "../_shared/tachs-curriculum.ts";
import { PROGRAM_KEYS, type TachsProgramKey } from "../_shared/tachs-programs.ts";
import { defaultParentReportContent } from "../_shared/tachs-report.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token || token === (Deno.env.get("SUPABASE_ANON_KEY") ?? "")) return json({ error: "Unauthorized" }, 401);
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // Admin role check comes first — before the attempt id is even parsed.
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const attemptId = String(body.attemptId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(attemptId)) return json({ error: "attemptId must be a UUID." }, 400);
    const override = body.programKey == null ? null : String(body.programKey);
    if (override && !PROGRAM_KEYS.includes(override as TachsProgramKey)) return json({ error: "Unknown program." }, 400);

    const { data: a, error } = await db.from("tachs_attempts")
      .select("id, status, grade_level, results, parent_report_content, profiles!tachs_attempts_user_id_fkey(full_name)")
      .eq("id", attemptId).maybeSingle();
    if (error) return json({ error: `Could not read the attempt: ${error.message}` }, 500);
    if (!a) return json({ error: "Attempt not found" }, 404);
    if (a.status !== "completed" || !a.results) return json({ error: "A curriculum can be generated only after the diagnostic is completed." }, 409);

    const saved = (a.parent_report_content as Record<string, unknown> | null)?.recommended_program_key;
    const programKey = (override ?? (typeof saved === "string" && PROGRAM_KEYS.includes(saved as TachsProgramKey) ? saved : defaultParentReportContent(a.results).recommended_program_key)) as TachsProgramKey;
    const studentName = ((a as Record<string, any>).profiles?.full_name as string | undefined) ?? "Student";
    const curriculum = buildTachsCurriculum({ results: a.results as Record<string, unknown>, programKey, studentName, gradeLevel: a.grade_level ?? null });
    return json({ curriculum, source: "engine" });
  } catch (e) {
    console.error("tachs-curriculum", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
