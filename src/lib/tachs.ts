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
}
export interface TachsReviewItem {
  section_key: TachsSectionKey; position: number; skill: string; difficulty: number; selected_key: string | null; is_correct: boolean | null;
  correct_key?: string; rationale?: string; stem?: string; choices?: TachsChoice[]; time_spent_seconds: number;
}

export const SECTION_NAMES: Record<TachsSectionKey, string> = {
  reading: "Reading", written_expression: "Written Expression", mathematics: "Mathematics",
  figure_matrices: "Figure Matrices", paper_folding: "Paper Folding", figure_classification: "Figure Classification",
};

export const skillLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  results: (attemptId: string) => call<{ results: TachsResults; review: TachsReviewItem[]; attempt: { id: string; grade_level: number | null; test_mode: boolean; completed_at: string; started_at: string; user_id: string }; email?: { status: string; sent_at: string | null; masked_to: string | null } }>({ action: "results", attemptId }),
  adminList: () => call<{ attempts: TachsAdminAttempt[]; orders: TachsOrder[] }>({ action: "admin_list", attemptId: "admin" }),
  adminDetail: (attemptId: string) =>
    call<{ attempt: TachsAdminAttempt; sections: TachsAdminSection[]; audit: TachsAuditRow[]; events: TachsAttemptEvent[] }>({ action: "admin_detail", attemptId }),
  adminResendEmail: (attemptId: string) =>
    call<{ ok: true; email: { email_status: string | null; email_error: string | null; email_sent_at: string | null; email_attempts: number | null } }>({ action: "admin_resend_email", attemptId }),
  adminReopen: (attemptId: string, sectionKey?: string) =>
    call<{ ok: true; section_key: string }>({ action: "admin_reopen", attemptId, sectionKey }),
  adminSearchUsers: (query: string) =>
    call<{ users: { id: string; full_name: string | null; username: string | null; parent_email: string | null }[] }>({ action: "admin_search_users", attemptId: "admin", query }),
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
  selected_key: string | null; correct_key?: string; is_correct: boolean | null; is_flagged: boolean;
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
