// Sends the preliminary D.E.Bs TACHS Readiness report to the confirmed parent/guardian
// email and to the D.E.Bs admin. Callable by the service role (from tachs-engine) or by an
// authenticated admin. Email failures are recorded and never block the completed result.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ADMIN_EMAIL = "dbeccan@debslearnacademy.com";
const APP_URL = "https://debshub-diagnostics.lovable.app";
const DISCLAIMER =
  "This is a preliminary D.E.Bs readiness result, not an official TACHS scaled score, percentile, admission decision, or scholarship prediction. D.E.Bs working allocation; the 130-minute total mirrors the published regular testing time. Section item counts and timing are not official TACHS specifications. D.E.Bs is not affiliated with, sponsored by, or endorsed by the TACHS program.";

const SECTION_LABELS: Record<string, string> = {
  reading: "Reading",
  written_expression: "Written Expression",
  mathematics: "Mathematics",
  figure_matrices: "Figure Matrices",
  paper_folding: "Paper Folding",
  figure_classification: "Figure Classification",
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const title = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const mmss = (sec: number) => `${Math.floor((sec ?? 0) / 60)} min ${String((sec ?? 0) % 60).padStart(2, "0")} sec`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  let attemptId = "";
  try {
    const body = await req.json();
    attemptId = String(body.attemptId ?? "");
  } catch {
    return json({ success: false, error: "Invalid request body" }, 400);
  }
  if (!attemptId) return json({ success: false, error: "attemptId is required" }, 400);

  // Authorization: service role key (internal call) or an authenticated admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ success: false, error: "Missing authorization header" }, 401);
  const isService = token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  if (!isService) {
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ success: false, error: "Forbidden" }, 403);
  }

  const { data: attempt } = await db.from("tachs_attempts")
    .select("*, profiles(full_name, parent_email)").eq("id", attemptId).maybeSingle();
  if (!attempt) return json({ success: false, error: "Attempt not found" }, 404);
  if (attempt.status !== "completed" || !attempt.results) {
    return json({ success: false, error: "Attempt is not completed yet" }, 409);
  }

  const results = attempt.results as Record<string, any>;
  const profile = (attempt as Record<string, any>).profiles ?? {};
  const fullName: string = profile.full_name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";
  const parentEmail: string | null = attempt.parent_email || profile.parent_email || null;
  const attemptNo = (attempt.email_attempts ?? 0) + 1;

  if (!parentEmail) {
    await db.from("tachs_attempts").update({
      email_status: "skipped", email_attempts: attemptNo, email_error: "No parent or guardian email on file.",
    }).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, event_type: "email_skipped", detail: { reason: "no_parent_email" } });
    return json({ success: false, skipped: true, error: "No parent or guardian email on file." });
  }

  const completed = attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const sections: any[] = results.sections ?? [];
  const sectionRows = sections.map((s) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${esc(SECTION_LABELS[s.section_key] ?? title(s.section_key))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${esc(s.correct)}/${esc(s.presented)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:600;">${esc(s.accuracy)}%</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${esc(mmss(s.time_used_seconds ?? 0))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${esc(s.pace_seconds_per_item)}s / item</td>
    </tr>`).join("");

  const list = (rows: any[], empty: string) =>
    rows?.length
      ? `<ul style="margin:6px 0 0 18px;padding:0;color:#334155;">${rows.map((r) => `<li>${esc(title(r.skill))} — ${esc(r.accuracy)}% (${esc(SECTION_LABELS[r.section_key] ?? title(r.section_key))})</li>`).join("")}</ul>`
      : `<p style="color:#64748b;margin:6px 0 0;">${esc(empty)}</p>`;

  const band = results.band ?? { label: "Preliminary", color: "#1C2D5A" };
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:#1C2D5A;color:#ffffff;padding:22px 24px;">
      <div style="font-size:13px;letter-spacing:1.4px;color:#FFDE59;font-weight:700;">D.E.Bs DIAGNOSTIC HUB</div>
      <h1 style="margin:6px 0 0;font-size:22px;">TACHS Readiness Diagnostic — Preliminary Report</h1>
      <div style="margin-top:6px;font-size:13px;color:#cbd5e1;">Pilot blueprint v${esc(attempt.blueprint_version)}</div>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 14px;color:#0f172a;">Hello, here is the preliminary readiness summary for <strong>${esc(firstName)}</strong>, completed on ${esc(completed)}.</p>
      <div style="border:2px solid ${esc(band.color)};border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Readiness band</div>
        <div style="font-size:22px;font-weight:700;color:${esc(band.color)};">${esc(band.label)}</div>
        <div style="margin-top:6px;color:#0f172a;">Overall accuracy: <strong>${esc(results.overall_accuracy)}%</strong> (${esc(results.total_correct)} of ${esc(results.total_presented)} items answered correctly)</div>
      </div>
      <h2 style="font-size:16px;color:#1C2D5A;margin:0 0 8px;">Section results</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f1f5f9;">
          <th align="left" style="padding:8px 10px;">Section</th><th style="padding:8px 10px;">Correct</th>
          <th style="padding:8px 10px;">Accuracy</th><th style="padding:8px 10px;">Time used</th><th style="padding:8px 10px;">Pace</th>
        </tr></thead><tbody>${sectionRows}</tbody>
      </table>
      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 0;">Strengths</h2>
      ${list(results.strengths ?? [], "No skill reached the strength threshold on this attempt.")}
      <h2 style="font-size:16px;color:#1C2D5A;margin:18px 0 0;">Priority gaps</h2>
      ${list(results.gaps ?? [], "No skill fell below the priority threshold on this attempt.")}
      <h2 style="font-size:16px;color:#1C2D5A;margin:22px 0 6px;">Next step</h2>
      <p style="margin:0;color:#334155;">${esc(results.next_steps)}</p>
      <p style="margin:22px 0;"><a href="${APP_URL}/tachs/results/${esc(attempt.id)}" style="background:#1C2D5A;color:#FFDE59;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;display:inline-block;">View the full report</a></p>
      <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;margin:0;">${esc(DISCLAIMER)}</p>
    </div>
  </div></body></html>`;

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { error } = await resend.emails.send({
      from: "D.E.Bs Diagnostic Hub <noreply@debslearnacademy.com>",
      to: [parentEmail],
      bcc: [ADMIN_EMAIL],
      subject: `TACHS Readiness Diagnostic — ${firstName}'s preliminary report`,
      html,
    });
    if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
    await db.from("tachs_attempts").update({
      email_status: "sent", email_attempts: attemptNo, email_sent_at: new Date().toISOString(), email_error: null,
    }).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, event_type: "email_sent", detail: { to: parentEmail, attempt: attemptNo } });
    return json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("send-tachs-results failed", message);
    await db.from("tachs_attempts").update({
      email_status: "failed", email_attempts: attemptNo, email_error: message.slice(0, 500),
    }).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, event_type: "email_failed", detail: { error: message.slice(0, 500), attempt: attemptNo } });
    return json({ success: false, error: "The report email could not be sent. The result is saved and can be resent." });
  }
});
