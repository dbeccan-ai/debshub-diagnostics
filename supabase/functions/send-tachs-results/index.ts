// D.E.Bs TACHS emails to the confirmed parent/guardian only.
//   kind = "acknowledgment"  — sent automatically on completion. Contains NO results.
//   kind = "parent_report"   — the sanitized preliminary report. Only after an admin has moved the
//                              report to "approved" (or is re-sending a "sent" report). Never
//                              contains question text, answers, keys, rationales or adaptive paths.
// Callable by the service role (from tachs-engine) or by an authenticated admin.
// Email failures are recorded and never block the completed result.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { acknowledgmentEmailHtml, canSendParentReport, findForbiddenParentKeys, parentReportEmailHtml, parentReportView } from "../_shared/tachs-report.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  let attemptId = "", kind = "";
  try {
    const body = await req.json();
    attemptId = String(body.attemptId ?? "");
    kind = String(body.kind ?? "acknowledgment");
  } catch {
    return json({ success: false, error: "Invalid request body" }, 400);
  }
  if (!attemptId) return json({ success: false, error: "attemptId is required" }, 400);
  if (kind !== "acknowledgment" && kind !== "parent_report") return json({ success: false, error: "Unknown email kind" }, 400);

  // Authorization: service role key (internal call) or an authenticated admin.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ success: false, error: "Missing authorization header" }, 401);
  const isService = token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  let actorId: string | null = null;
  if (!isService) {
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ success: false, error: "Forbidden" }, 403);
    actorId = user.id;
  }

  const { data: attempt } = await db.from("tachs_attempts")
    .select("*, profiles!tachs_attempts_user_id_fkey(full_name, parent_email)").eq("id", attemptId).maybeSingle();
  if (!attempt) return json({ success: false, error: "Attempt not found" }, 404);
  if (attempt.status !== "completed") return json({ success: false, error: "Attempt is not completed yet" }, 409);

  const profile = (attempt as Record<string, any>).profiles ?? {};
  const fullName: string = profile.full_name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";
  const parentEmail: string | null = attempt.parent_email || profile.parent_email || null;
  const completedOn = fmtDate(attempt.completed_at);
  const isAck = kind === "acknowledgment";
  // Column set differs per kind so the acknowledgment never overwrites the parent-report record.
  const statusCol = isAck ? "ack_email_status" : "email_status";
  const sentAtCol = isAck ? "ack_email_sent_at" : "email_sent_at";
  const errorCol = isAck ? "ack_email_error" : "email_error";
  const attemptNo = (attempt.email_attempts ?? 0) + 1;

  if (!parentEmail) {
    const patch: Record<string, unknown> = { [statusCol]: "skipped", [errorCol]: "No parent or guardian email on file." };
    if (!isAck) patch.email_attempts = attemptNo;
    await db.from("tachs_attempts").update(patch).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, actor_id: actorId, event_type: isAck ? "ack_email_skipped" : "email_skipped", detail: { reason: "no_parent_email" } });
    return json({ success: false, skipped: true, error: "No parent or guardian email on file." });
  }

  let html: string, subject: string;
  if (isAck) {
    html = acknowledgmentEmailHtml({ firstName, completedOn });
    subject = `TACHS Readiness Diagnostic — ${firstName}'s assessment was received`;
  } else {
    // Server-side gate: the parent report goes out only after admin approval, regardless of caller.
    if (!canSendParentReport(attempt.report_status ?? "draft")) {
      return json({ success: false, error: "The parent report has not been approved by an administrator yet." }, 409);
    }
    const report = parentReportView(attempt.results as Record<string, unknown>);
    if (!report) return json({ success: false, error: "No stored results to report." }, 409);
    const leaked = findForbiddenParentKeys(report);
    if (leaked.length) return json({ success: false, error: `Report blocked: contains restricted fields (${leaked.join(", ")}).` }, 500);
    html = parentReportEmailHtml({ firstName, gradeLevel: attempt.grade_level ?? null, completedOn, attemptId: attempt.id, report, blueprintVersion: attempt.blueprint_version ?? null });
    subject = `TACHS Readiness Diagnostic — ${firstName}'s reviewed preliminary report`;
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // Parent/guardian only — staff review the report inside the authenticated admin dashboard.
    const { error } = await resend.emails.send({
      from: "D.E.Bs Diagnostic Hub <noreply@debslearnacademy.com>",
      to: [parentEmail],
      subject,
      html,
    });
    if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
    const patch: Record<string, unknown> = { [statusCol]: "sent", [sentAtCol]: new Date().toISOString(), [errorCol]: null };
    if (!isAck) { patch.email_attempts = attemptNo; patch.report_status = "sent"; patch.report_sent_at = new Date().toISOString(); }
    await db.from("tachs_attempts").update(patch).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, actor_id: actorId, event_type: isAck ? "ack_email_sent" : "email_sent", detail: { to: parentEmail, kind, attempt: isAck ? undefined : attemptNo } });
    return json({ success: true, kind });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("send-tachs-results failed", kind, message);
    const patch: Record<string, unknown> = { [statusCol]: "failed", [errorCol]: message.slice(0, 500) };
    if (!isAck) patch.email_attempts = attemptNo;
    await db.from("tachs_attempts").update(patch).eq("id", attemptId);
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, actor_id: actorId, event_type: isAck ? "ack_email_failed" : "email_failed", detail: { error: message.slice(0, 500), kind } });
    return json({ success: false, error: "The email could not be sent. The result is saved and can be resent." });
  }
});
