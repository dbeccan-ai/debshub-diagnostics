import { supabase } from "@/integrations/supabase/client";

export type TachsSectionKey =
  | "reading" | "written_expression" | "mathematics"
  | "figure_matrices" | "paper_folding" | "figure_classification";

export interface TachsBlueprintSection {
  key: TachsSectionKey; name: string; order: number; item_count: number; time_minutes: number;
  calculator: boolean; break_after_minutes: number; description: string; skill_quotas: Record<string, number>;
}

export interface TachsChoice { key: string; text?: string; visual?: unknown }
export interface TachsQuestion {
  id: string; code: string; section_key: TachsSectionKey; skill: string; stem: string;
  passage_id: string | null; passage_title: string | null; passage_text: string | null;
  visual: unknown | null; visual_alt: string | null; choices: TachsChoice[];
}
export interface TachsResponseLite { question_id: string; position: number; selected_key: string | null; is_flagged: boolean; time_spent_seconds: number }

export interface TachsSectionState {
  id: string; section_key: TachsSectionKey; section_order: number; status: "not_started" | "in_progress" | "submitted";
  item_count: number; time_limit_seconds: number; started_at: string | null; deadline_at: string | null; submitted_at: string | null;
  presented_count: number; break_after_seconds: number;
}

export interface TachsState {
  server_time: string;
  attempt: { id: string; status: "in_progress" | "completed"; test_mode: boolean; grade_level: number | null; parent_email: string | null; current_section_key: TachsSectionKey | null; started_at: string; completed_at: string | null; blueprint_version: number };
  blueprint_sections: TachsBlueprintSection[];
  sections: TachsSectionState[];
  current_section: { id: string; section_key: TachsSectionKey; status: string; item_count: number; deadline_at: string | null; time_limit_seconds: number; presented_count: number } | null;
  questions: TachsQuestion[];
  responses: TachsResponseLite[];
}

export interface TachsSkillRow { section_key: TachsSectionKey; skill: string; presented: number; correct: number; accuracy: number }
export interface TachsSectionSummary {
  section_key: TachsSectionKey; item_count: number; presented: number; answered: number; correct: number; accuracy: number;
  time_limit_seconds: number; time_used_seconds: number; pace_seconds_per_item: number; allotted_seconds_per_item: number;
  submit_reason: string | null; avg_difficulty: number; max_difficulty: number;
  difficulty_path: { position: number; difficulty: number; skill: string; transition?: "up" | "down" }[];
  skills: Record<string, { presented: number; answered: number; correct: number }>;
}
export interface TachsResults {
  overall_accuracy: number; total_presented: number; total_correct: number; total_time_seconds: number;
  band: { key: string; label: string; color: string }; next_steps: string; focus_sections: TachsSectionKey[];
  sections: TachsSectionSummary[]; skills: TachsSkillRow[]; strengths: TachsSkillRow[]; gaps: TachsSkillRow[]; disclaimer: string; generated_at: string;
  blueprint_version?: number;
  math_readiness?: { key: "foundation" | "grade8" | "algebra1"; label: string; presented: number; correct: number; accuracy: number }[] | null;
  evidence?: TachsEvidence | null;
}
export interface TachsDifficultyRow { level: number; presented: number; correct: number; accuracy: number }
export interface TachsEvidence {
  by_difficulty: TachsDifficultyRow[];
  sections: { section_key: TachsSectionKey; by_difficulty: TachsDifficultyRow[]; ceiling: { level: number | null; basis: string } }[];
  skills: { section_key: TachsSectionKey; skill: string; presented: number; correct: number; accuracy: number; low_sample: boolean }[];
  groups: { key: string; label: string; presented: number; correct: number; accuracy: number; low_sample: boolean }[];
  min_sample: number;
  note: string;
}
export interface TachsAuditItem {
  code: string; section_key: TachsSectionKey; skill: string; difficulty: number; strand: string | null; stem: string;
  passage_id: string | null; passage_title: string | null; visual: unknown; visual_alt: string | null; choices: TachsChoice[]; correct_key: string; rationale: string;
}
export interface TachsResultsResponse {
  viewer: "student" | "admin";
  report: TachsParentReport | null;
  report_status: TachsReportStatus;
  results?: TachsResults; review?: TachsReviewItem[]; carryover?: TachsCarryover;
  attempt: { id: string; grade_level: number | null; test_mode: boolean; completed_at: string; started_at: string; user_id: string; blueprint_version: number };
  email?: { status: string; sent_at: string | null; masked_to: string | null; ack_status?: string };
}
export interface TachsReviewItem {
  section_key: TachsSectionKey; position: number; skill: string; difficulty: number; selected_key: string | null; is_correct: boolean | null;
  correct_key?: string; rationale?: string; stem?: string; choices?: TachsChoice[]; time_spent_seconds: number; code?: string;
}

export const SECTION_NAMES: Record<TachsSectionKey, string> = {
  reading: "Reading", written_expression: "Written Expression", mathematics: "Mathematics",
  figure_matrices: "Figure Matrices", paper_folding: "Paper Folding", figure_classification: "Figure Classification",
};

const SKILL_LABEL_OVERRIDES: Record<string, string> = {
  size_position_partwhole: "Size, Position & Part-Whole", partwhole: "Part-Whole", part_whole: "Part-Whole",
  two_rule_integration: "Two-Rule Integration", vocabulary_in_context: "Vocabulary in Context", main_idea: "Main Idea",
};
export const skillLabel = (s: string) =>
  SKILL_LABEL_OVERRIDES[s] ?? s.replace(/partwhole/g, "part-whole").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bPart-whole\b/g, "Part-Whole");

export type TachsReportStatus = "draft" | "reviewed" | "approved" | "sent";
export const REPORT_STATUS_LABEL: Record<TachsReportStatus, string> = { draft: "Draft — awaiting review", reviewed: "Reviewed — awaiting approval", approved: "Approved — ready to send", sent: "Sent to parent" };
export interface TachsParentSection {
  section_key: TachsSectionKey; label: string; item_count: number; presented: number; answered: number; correct: number; accuracy: number;
  time_limit_seconds: number; time_used_seconds: number; pace_seconds_per_item: number; allotted_seconds_per_item: number;
  pacing: "rushed" | "on_pace" | "slow"; ended_by: "student" | "timer";
}
export interface TachsParentReport {
  kind: "parent_preliminary"; overall_accuracy: number; total_presented: number; total_correct: number; total_time_seconds: number;
  sections: TachsParentSection[]; observations: string[];
  working_band: { label: string; color: string; interpretation: string } | null;
  pending_interpretation: string; disclaimer: string; blueprint_version: number | null; generated_at: string | null;
}
export interface TachsCarryover { v2r: number; v2w: number; flagged: boolean; note: string | null }
export const PACING_LABEL: Record<TachsParentSection["pacing"], string> = { rushed: "Faster than allotted", on_pace: "Within allotted pace", slow: "Slower than allotted" };

export class TachsError extends Error {
  status: number; state?: TachsState;
  constructor(message: string, status: number, state?: TachsState) { super(message); this.status = status; this.state = state; }
}

async function call<T>(payload: Record<string, unknown>, retry = true): Promise<T> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new TachsError("Please sign in to continue.", 401);
  if (session.expires_at && session.expires_at * 1000 - Date.now() < 60_000) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) session = data.session;
  }
  const { data, error } = await supabase.functions.invoke("tachs-engine", {
    body: payload,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    let status = 500; let message = error.message || "Request failed"; let state: TachsState | undefined;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      status = ctx.status;
      try { const j = await ctx.json(); message = j.error ?? message; state = j.state; } catch { /* ignore */ }
    }
    if (status === 401 && retry) {
      const { data: r } = await supabase.auth.refreshSession();
      if (r.session) return call<T>(payload, false);
    }
    throw new TachsError(message, status, state);
  }
  if (data?.error) throw new TachsError(data.error, 400, data.state);
  return data as T;
}

export const tachsApi = {
  access: () => call<TachsAccess>({ action: "access" }),
  start: (opts: { gradeLevel?: number | null; parentEmail?: string | null; testMode?: boolean }) =>
    call<{ resumed: boolean; attemptId: string; state: TachsState }>({ action: "start", ...opts }),
  state: (attemptId: string) => call<{ state: TachsState }>({ action: "state", attemptId }),
  startSection: (attemptId: string) => call<{ state: TachsState }>({ action: "start_section", attemptId }),
  answer: (attemptId: string, questionId: string, patch: { selectedKey?: string | null; flagged?: boolean; timeSpentSeconds?: number }) =>
    call<{ ok: true; server_time: string }>({ action: "answer", attemptId, questionId, ...patch }),
  next: (attemptId: string) => call<{ done: boolean; state: TachsState }>({ action: "next", attemptId }),
  submitSection: (attemptId: string) => call<{ state: TachsState; completed: boolean }>({ action: "submit_section", attemptId }),
  results: (attemptId: string) => call<TachsResultsResponse>({ action: "results", attemptId }),
  adminList: () => call<{ attempts: TachsAdminAttempt[]; orders: TachsOrder[] }>({ action: "admin_list", attemptId: "admin" }),
  adminDetail: (attemptId: string) =>
    call<{ attempt: TachsAdminAttempt; sections: TachsAdminSection[]; audit: TachsAuditRow[]; events: TachsAttemptEvent[]; carryover: TachsCarryover; parent_preview: TachsParentReport | null }>({ action: "admin_detail", attemptId }),
  adminReportTransition: (attemptId: string, to: TachsReportStatus, notes?: string) =>
    call<{ ok: true; report: { report_status: TachsReportStatus; email_status?: string | null; email_error?: string | null; email_sent_at?: string | null; report_notes?: string | null } }>({ action: "admin_report_transition", attemptId, to, notes }),
  adminResendEmail: (attemptId: string) =>
    call<{ ok: true; email: { email_status: string | null; email_error: string | null; email_sent_at: string | null; email_attempts: number | null } }>({ action: "admin_resend_email", attemptId }),
  adminReopen: (attemptId: string, sectionKey?: string) =>
    call<{ ok: true; section_key: string }>({ action: "admin_reopen", attemptId, sectionKey }),
  adminSearchUsers: (query: string) =>
    call<{ users: { id: string; full_name: string | null; username: string | null; parent_email: string | null }[] }>({ action: "admin_search_users", attemptId: "admin", query }),
  adminContentAudit: (version?: number) =>
    call<{ items: TachsAuditItem[]; version: number }>({ action: "admin_content_audit", attemptId: "admin", version }),
  adminGrantAccess: (targetUserId: string, reason: string) =>
    call<{ ok: true; order: TachsOrder }>({ action: "admin_grant_access", attemptId: "admin", targetUserId, reason }),
};

/** Payment / entitlement helpers (Stripe-hosted Checkout, one-time). */
export interface TachsQuote { net_cents: number; fee_cents: number; total_cents: number; currency: string }
export interface TachsAccess {
  admin: boolean; quote: TachsQuote; entitled: boolean; entitlement_source: string | null; pending_order_id: string | null;
  in_progress: { id: string; grade_level: number | null; entitled: boolean } | null;
}
export interface TachsOrder {
  id: string; user_id: string; attempt_id: string | null; source: string; payment_status: string;
  net_amount_cents: number; fee_cents: number; total_cents: number; amount_paid_cents: number | null; currency: string;
  stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null; verified_at: string | null; created_at: string;
  granted_by: string | null; grant_reason: string | null;
  profiles?: { full_name: string | null; username: string | null; parent_email: string | null } | null;
}
export const TACHS_PRICE_LABEL = "$175 + processing fee";
export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function paymentCall<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new TachsError("Please sign in to continue.", 401);
  const { data, error } = await supabase.functions.invoke(fn, { body, headers: { Authorization: `Bearer ${session.access_token}` } });
  if (error) {
    let message = error.message || "Request failed"; let status = 500;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") { status = ctx.status; try { const j = await ctx.json(); message = j.error ?? j.message ?? message; } catch { /* ignore */ } }
    throw new TachsError(message, status);
  }
  if (data?.error) throw new TachsError(data.error, 400);
  return data as T;
}
export const tachsPayments = {
  quote: () => paymentCall<{ alreadyEntitled: boolean; quote: TachsQuote; order?: { id: string; payment_status: string; net_cents: number; fee_cents: number; total_cents: number; currency: string } }>("create-tachs-checkout", { mode: "quote" }),
  session: () => paymentCall<{ alreadyEntitled: boolean; url?: string; verifyPending?: boolean; sessionId?: string; order?: { id: string } }>("create-tachs-checkout", { mode: "session" }),
  verify: (sessionId: string, orderId: string) =>
    paymentCall<{ success: boolean; alreadyVerified?: boolean; message?: string; order?: { id: string; total_cents: number; amount_paid_cents: number | null } }>("verify-tachs-payment", { sessionId, orderId }),
};

export interface TachsAdminAttempt {
  id: string; user_id: string; grade_level: number | null; status: "in_progress" | "completed";
  test_mode: boolean; started_at: string; completed_at: string | null; blueprint_version: number;
  parent_email: string | null; email_status: string | null; email_sent_at: string | null;
  email_attempts: number | null; email_error: string | null; results: TachsResults | null;
  report_status?: TachsReportStatus | null; report_reviewed_at?: string | null; report_approved_at?: string | null; report_sent_at?: string | null; report_notes?: string | null;
  ack_email_status?: string | null; ack_email_sent_at?: string | null;
  reopened_at?: string | null; access_source?: string; order_id?: string | null; order?: TachsOrder | null;
  profiles?: { full_name: string | null; username: string | null } | null;
}
export interface TachsAdminSection {
  id: string; section_key: TachsSectionKey; section_order: number; status: string; item_count: number;
  time_limit_seconds: number; time_used_seconds: number | null; submitted_at: string | null; submit_reason: string | null;
  current_difficulty: number; difficulty_path: { position: number; difficulty: number; skill: string; transition?: "up" | "down" }[] | null;
}
export interface TachsAuditRow {
  section_key: TachsSectionKey; position: number; code?: string; stem?: string; skill: string; difficulty: number;
  selected_key: string | null; correct_key?: string; rationale?: string | null; is_correct: boolean | null; is_flagged: boolean;
  time_spent_seconds: number; presented_at: string; answered_at: string | null;
}
export interface TachsAttemptEvent {
  id: string; attempt_id: string; actor_id: string | null; event_type: string;
  detail: Record<string, unknown> | null; created_at: string;
}

export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60); const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

// ---------- Admin direct reads (backward-compatible fallback) ----------
// The engine's admin_list / admin_detail can fail on older deployments (ambiguous profiles embed after the
// report-workflow migration). These read the same immutable rows straight from the database under the
// admin-only RLS policies; non-admins get zero rows. Nothing here writes.
import { buildAuditRows, carryoverSummary, type ListLoad } from "@/lib/tachsAdminHelpers";

export interface TachsAdminDetail {
  attempt: TachsAdminAttempt; sections: TachsAdminSection[]; audit: TachsAuditRow[]; events: TachsAttemptEvent[];
  carryover?: TachsCarryover; parent_preview?: TachsParentReport | null; source: "engine" | "direct";
}

async function profilesById(ids: string[]) {
  if (!ids.length) return new Map<string, { full_name: string | null; username: string | null; parent_email: string | null }>();
  const { data } = await supabase.from("profiles").select("id, full_name, username, parent_email").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, { full_name: p.full_name, username: p.username, parent_email: p.parent_email }]));
}

export const tachsAdminDirect = {
  async list(): Promise<{ attempts: TachsAdminAttempt[]; orders: TachsOrder[] }> {
    const [{ data: attempts, error: e1 }, { data: orders, error: e2 }] = await Promise.all([
      supabase.from("tachs_attempts").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("tachs_orders").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (e1) throw new TachsError(`Could not read TACHS attempts: ${e1.message}`, 500);
    if (e2) throw new TachsError(`Could not read TACHS orders: ${e2.message}`, 500);
    const profs = await profilesById([...new Set([...(attempts ?? []).map((a) => a.user_id), ...(orders ?? []).map((o) => o.user_id)])]);
    const ords: TachsOrder[] = (orders ?? []).map((o) => ({ ...(o as unknown as TachsOrder), profiles: profs.get(o.user_id) ?? null }));
    const byId = new Map(ords.map((o) => [o.id, o]));
    const atts: TachsAdminAttempt[] = (attempts ?? []).map((a) => ({
      ...(a as unknown as TachsAdminAttempt),
      profiles: profs.get(a.user_id) ?? null,
      order: a.order_id ? byId.get(a.order_id) ?? null : null,
    }));
    return { attempts: atts, orders: ords };
  },
  async detail(id: string): Promise<TachsAdminDetail> {
    const { data: a, error } = await supabase.from("tachs_attempts").select("*").eq("id", id).maybeSingle();
    if (error) throw new TachsError(`Could not read the attempt: ${error.message}`, 500);
    if (!a) throw new TachsError("Attempt not found", 404);
    const [{ data: secs }, { data: rs }, { data: events }, prof, { data: order }] = await Promise.all([
      supabase.from("tachs_attempt_sections").select("*").eq("attempt_id", id).order("section_order"),
      supabase.from("tachs_responses").select("*").eq("attempt_id", id).order("position"),
      supabase.from("tachs_attempt_events").select("*").eq("attempt_id", id).order("created_at", { ascending: false }),
      profilesById([a.user_id]),
      a.order_id ? supabase.from("tachs_orders").select("*").eq("id", a.order_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const ids = [...new Set((rs ?? []).map((r) => r.question_id))];
    const { data: qs } = ids.length ? await supabase.from("tachs_questions").select("id, code, section_key, stem, correct_key, rationale").in("id", ids) : { data: [] };
    const audit = buildAuditRows(
      (rs ?? []) as unknown as Parameters<typeof buildAuditRows>[0],
      (qs ?? []) as unknown as Parameters<typeof buildAuditRows>[1],
      (secs ?? []) as unknown as Parameters<typeof buildAuditRows>[2],
    );
    return {
      attempt: { ...(a as unknown as TachsAdminAttempt), profiles: prof.get(a.user_id) ?? null, order: (order as TachsOrder | null) ?? null },
      sections: (secs ?? []) as unknown as TachsAdminSection[],
      audit, events: (events ?? []) as unknown as TachsAttemptEvent[],
      carryover: carryoverSummary(audit.map((r) => r.code)), parent_preview: null, source: "direct",
    };
  },
};

/** Engine first; if it errors OR returns nothing while rows exist, fall back to the direct read. Errors are never disguised as empty data. */
export async function loadAdminAttempts(): Promise<ListLoad<TachsAdminAttempt> & { orders: TachsOrder[] }> {
  let engineErr: string | null = null;
  try {
    const r = await tachsApi.adminList();
    if ((r.attempts ?? []).length > 0) return { kind: "ok", source: "engine", attempts: r.attempts, orders: r.orders ?? [] };
  } catch (e) { engineErr = e instanceof Error ? e.message : "Engine request failed"; }
  try {
    const d = await tachsAdminDirect.list();
    return { kind: "ok", source: "direct", attempts: d.attempts, orders: d.orders };
  } catch (e) {
    const direct = e instanceof Error ? e.message : "Direct read failed";
    return { kind: "error", message: engineErr ? `${engineErr} · ${direct}` : direct, orders: [] };
  }
}

export async function loadAdminDetail(id: string): Promise<TachsAdminDetail> {
  try {
    const d = await tachsApi.adminDetail(id);
    return { ...d, source: "engine" };
  } catch (e) {
    // 404/500 from an older engine build: read the immutable snapshot directly.
    if (e instanceof TachsError && e.status === 403) throw e;
    return tachsAdminDirect.detail(id);
  }
}
