// D.E.Bs TACHS Readiness Diagnostic — secure test engine.
// Actions: start, state, start_section, answer, next, submit_section, results, admin_list, admin_reset_test_mode
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BLUEPRINT_V1, SAMPLE_BANK, type BlueprintSection } from "./sample-bank.ts";
import { advanceAdaptive, bandFor, DISCLAIMER, maskEmail, needsGrading, sectionsShortOfTarget } from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const TEST_MODE_SECONDS = 120; // shortened per-section timer for admin TEST MODE
const TEST_MODE_ITEMS = 4; // shortened per-section item count for admin TEST MODE

type Client = ReturnType<typeof createClient>;

interface QuestionRow {
  id: string; code: string; section_key: string; skill: string; difficulty: number; stem: string;
  passage_id: string | null; passage_title: string | null; passage_text: string | null;
  visual: unknown; visual_alt: string | null; choices: { key: string; text?: string; visual?: unknown }[];
  correct_key: string; rationale: string | null;
}

const publicQuestion = (q: QuestionRow) => ({
  id: q.id, code: q.code, section_key: q.section_key, skill: q.skill, stem: q.stem,
  passage_id: q.passage_id, passage_title: q.passage_title, passage_text: q.passage_text,
  visual: q.visual, visual_alt: q.visual_alt, choices: q.choices,
});

/** Stable fingerprint of the shipped bank so content edits reseed idempotently. */
function bankFingerprint(): string {
  const src = JSON.stringify(SAMPLE_BANK.map((b) => [b.code, b.section_key, b.skill, b.difficulty, b.stem, b.correct_key, b.choices, b.visual ?? null, b.rationale]));
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return `bank:${h.toString(16)}:${SAMPLE_BANK.length}`;
}

async function ensureSeed(db: Client) {
  // Keep the active blueprint and the item bank in sync with the shipped pilot content (idempotent).
  const fp = bankFingerprint();
  const { data: bp } = await db.from("tachs_blueprints").select("notes").eq("version", BLUEPRINT_V1.version).maybeSingle();
  const { count } = await db.from("tachs_questions")
    .select("id", { count: "exact", head: true })
    .eq("blueprint_version", BLUEPRINT_V1.version).eq("is_active", true);
  if ((count ?? 0) === SAMPLE_BANK.length && (bp?.notes ?? "").includes(fp)) return;
  const rows = SAMPLE_BANK.map((b) => ({
    code: b.code, blueprint_version: BLUEPRINT_V1.version, section_key: b.section_key, skill: b.skill, difficulty: b.difficulty,
    stem: b.stem, passage_id: b.passage_id ?? null, passage_title: b.passage_title ?? null, passage_text: b.passage_text ?? null,
    visual: b.visual ?? null, visual_alt: b.visual_alt ?? null, choices: b.choices, correct_key: b.correct_key, rationale: b.rationale, is_active: true,
  }));
  const { error } = await db.from("tachs_questions").upsert(rows, { onConflict: "code" });
  if (error) { console.error("seed error", error); return; }
  // Retire any stale items that are no longer part of the shipped bank so exactly 200 stay active.
  const codes = SAMPLE_BANK.map((b) => b.code);
  await db.from("tachs_questions").update({ is_active: false }).eq("blueprint_version", BLUEPRINT_V1.version).eq("is_active", true).not("code", "in", `(${codes.map((c) => `"${c}"`).join(",")})`);
  await db.from("tachs_blueprints").upsert({
    version: BLUEPRINT_V1.version, name: BLUEPRINT_V1.name, is_active: true, sections: BLUEPRINT_V1.sections, notes: `${BLUEPRINT_V1.notes ?? ""} [${fp}]`.trim(),
  }, { onConflict: "version" });
}

async function isAdmin(db: Client, userId: string) {
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

async function loadAttempt(db: Client, attemptId: string, userId: string, admin: boolean) {
  const { data: attempt } = await db.from("tachs_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!attempt) return null;
  if (attempt.user_id !== userId && !admin) return null;
  return attempt;
}

const now = () => new Date();
const secondsBetween = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000));

/** Auto-submit any in-progress section whose deadline has passed. */
async function enforceDeadlines(db: Client, attemptId: string) {
  const { data: secs } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", attemptId).eq("status", "in_progress");
  for (const s of secs ?? []) {
    if (s.deadline_at && new Date(s.deadline_at) <= now()) await submitSection(db, attemptId, s, "timeout");
  }
}

async function sectionSummary(db: Client, section: any) {
  const { data: responses } = await db.from("tachs_responses").select("*").eq("section_id", section.id).order("position");
  const rs = responses ?? [];
  const answered = rs.filter((r) => r.selected_key != null);
  const correct = rs.filter((r) => r.is_correct === true);
  const skills: Record<string, { presented: number; answered: number; correct: number }> = {};
  for (const r of rs) {
    skills[r.skill] ??= { presented: 0, answered: 0, correct: 0 };
    skills[r.skill].presented++;
    if (r.selected_key != null) skills[r.skill].answered++;
    if (r.is_correct) skills[r.skill].correct++;
  }
  const timeUsed = section.time_used_seconds ?? (section.started_at ? secondsBetween(new Date(section.started_at), now()) : 0);
  const presented = rs.length;
  const avgDifficulty = presented ? rs.reduce((a, r) => a + r.difficulty, 0) / presented : 0;
  const maxDifficulty = rs.reduce((a, r) => Math.max(a, r.difficulty), 0);
  return {
    section_key: section.section_key,
    item_count: section.item_count,
    presented, answered: answered.length, correct: correct.length,
    accuracy: presented ? Math.round((correct.length / presented) * 100) : 0,
    time_limit_seconds: section.time_limit_seconds,
    time_used_seconds: timeUsed,
    pace_seconds_per_item: presented ? Math.round(timeUsed / presented) : 0,
    allotted_seconds_per_item: Math.round(section.time_limit_seconds / Math.max(1, section.item_count)),
    submit_reason: section.submit_reason,
    avg_difficulty: Math.round(avgDifficulty * 100) / 100,
    max_difficulty: maxDifficulty,
    difficulty_path: section.difficulty_path,
    skills,
  };
}

async function submitSection(db: Client, attemptId: string, section: any, reason: string) {
  if (section.status === "submitted") return section;
  const started = section.started_at ? new Date(section.started_at) : now();
  const deadline = section.deadline_at ? new Date(section.deadline_at) : now();
  const end = reason === "timeout" && deadline < now() ? deadline : now();
  const timeUsed = Math.min(section.time_limit_seconds, secondsBetween(started, end));
  const summary = await sectionSummary(db, { ...section, time_used_seconds: timeUsed, submit_reason: reason });
  const { data: updated } = await db.from("tachs_attempt_sections").update({
    status: "submitted", submitted_at: end.toISOString(), time_used_seconds: timeUsed, submit_reason: reason, summary,
  }).eq("id", section.id).eq("status", "in_progress").select("*").maybeSingle();
  // Advance attempt pointer / finish attempt
  const { data: all } = await db.from("tachs_attempt_sections").select("section_key, section_order, status").eq("attempt_id", attemptId).order("section_order");
  const nextSec = (all ?? []).find((s) => s.status !== "submitted");
  if (nextSec) {
    await db.from("tachs_attempts").update({ current_section_key: nextSec.section_key }).eq("id", attemptId);
  } else {
    await gradeAttempt(db, attemptId);
  }
  return updated ?? section;
}

/** Fire-and-forget parent/admin report email. Never blocks or fails grading. */
async function sendReportEmail(attemptId: string) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-tachs-results`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ attemptId }),
    });
    if (!res.ok) console.error("tachs email failed", res.status, await res.text());
  } catch (e) {
    console.error("tachs email error", e);
  }
}


async function gradeAttempt(db: Client, attemptId: string) {
  const { data: attempt } = await db.from("tachs_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!attempt) return null;
  if (!needsGrading(attempt)) return attempt.results; // idempotent
  const { data: sections } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", attemptId).order("section_order");
  const sectionSummaries = [];
  for (const s of sections ?? []) {
    sectionSummaries.push(s.summary ?? (await sectionSummary(db, s)));
  }
  const totalPresented = sectionSummaries.reduce((a, s) => a + s.presented, 0);
  const totalCorrect = sectionSummaries.reduce((a, s) => a + s.correct, 0);
  const totalTime = sectionSummaries.reduce((a, s) => a + (s.time_used_seconds ?? 0), 0);
  const overall = totalPresented ? Math.round((totalCorrect / totalPresented) * 100) : 0;
  const band = bandFor(overall);
  const skillRows: { section_key: string; skill: string; presented: number; correct: number; accuracy: number }[] = [];
  for (const s of sectionSummaries) {
    for (const [skill, v] of Object.entries(s.skills as Record<string, { presented: number; correct: number }>)) {
      skillRows.push({ section_key: s.section_key, skill, presented: v.presented, correct: v.correct, accuracy: v.presented ? Math.round((v.correct / v.presented) * 100) : 0 });
    }
  }
  const strengths = skillRows.filter((r) => r.presented >= 1 && r.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy).slice(0, 6);
  const gaps = skillRows.filter((r) => r.presented >= 1 && r.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy).slice(0, 6);
  const weakestSections = [...sectionSummaries].sort((a, b) => a.accuracy - b.accuracy).slice(0, 2).map((s) => s.section_key);
  const results = {
    version: 1,
    generated_at: now().toISOString(),
    overall_accuracy: overall,
    total_presented: totalPresented,
    total_correct: totalCorrect,
    total_time_seconds: totalTime,
    band: { key: band.key, label: band.label, color: band.color },
    next_steps: band.plan,
    focus_sections: weakestSections,
    sections: sectionSummaries,
    skills: skillRows,
    strengths, gaps,
    disclaimer: DISCLAIMER,
  };
  // Idempotent: only the transition out of in_progress writes results and triggers the email.
  const { data: finished } = await db.from("tachs_attempts")
    .update({ status: "completed", completed_at: now().toISOString(), results, current_section_key: null })
    .eq("id", attemptId).eq("status", "in_progress").select("id").maybeSingle();
  if (finished) {
    await db.from("tachs_attempt_events").insert({ attempt_id: attemptId, event_type: "graded", detail: { overall_accuracy: overall, band: band.key } });
    if (attempt.test_mode) {
      await db.from("tachs_attempts").update({ email_status: "skipped", email_error: "TEST MODE attempt: no parent email is sent." }).eq("id", attemptId);
    } else {
      await sendReportEmail(attemptId);
    }
  }
  return results;
}

/** Adaptive selection: honors skill quotas, without replacement, target difficulty with nearest fallback. */
async function pickNextQuestion(db: Client, attempt: any, section: any): Promise<QuestionRow | null> {
  const presented: string[] = section.presented_question_ids ?? [];
  const { data: pool } = await db.from("tachs_questions").select("*")
    .eq("blueprint_version", attempt.blueprint_version).eq("section_key", section.section_key).eq("is_active", true);
  const candidates = (pool ?? []).filter((q: QuestionRow) => !presented.includes(q.id)) as QuestionRow[];
  if (!candidates.length) return null;
  const quotas: Record<string, number> = section.quotas_remaining ?? {};
  const openSkills = new Set(Object.entries(quotas).filter(([, n]) => n > 0).map(([k]) => k));
  let bySkill = openSkills.size ? candidates.filter((q) => openSkills.has(q.skill)) : candidates;
  if (!bySkill.length) bySkill = candidates; // quotas exhausted for remaining pool: fall back
  const target = section.current_difficulty ?? 2;
  const order = [target, target === 2 ? 1 : 2, target === 3 ? 1 : 3].filter((v, i, a) => a.indexOf(v) === i);
  for (const d of order) {
    const atD = bySkill.filter((q) => q.difficulty === d);
    if (atD.length) return atD[Math.floor(Math.random() * atD.length)];
  }
  return bySkill[Math.floor(Math.random() * bySkill.length)];
}

async function presentQuestion(db: Client, attempt: any, section: any) {
  const q = await pickNextQuestion(db, attempt, section);
  if (!q) return null;
  const presented: string[] = [...(section.presented_question_ids ?? []), q.id];
  const quotas = { ...(section.quotas_remaining ?? {}) };
  if (quotas[q.skill] != null) quotas[q.skill] = Math.max(0, quotas[q.skill] - 1);
  const path = [...(section.difficulty_path ?? []), { position: presented.length, difficulty: q.difficulty, skill: q.skill }];
  await db.from("tachs_attempt_sections").update({ presented_question_ids: presented, quotas_remaining: quotas, difficulty_path: path }).eq("id", section.id);
  await db.from("tachs_responses").insert({
    attempt_id: attempt.id, section_id: section.id, question_id: q.id, position: presented.length, difficulty: q.difficulty, skill: q.skill,
  });
  return q;
}

async function buildState(db: Client, attempt: any) {
  const { data: sections } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", attempt.id).order("section_order");
  const { data: bp } = await db.from("tachs_blueprints").select("sections").eq("id", attempt.blueprint_id).single();
  const bpSections = (bp?.sections ?? []) as BlueprintSection[];
  const current = (sections ?? []).find((s) => s.section_key === attempt.current_section_key) ?? null;
  let questions: unknown[] = [];
  let responses: unknown[] = [];
  if (current && current.status === "in_progress") {
    const ids: string[] = current.presented_question_ids ?? [];
    if (ids.length) {
      const { data: qs } = await db.from("tachs_questions").select("*").in("id", ids);
      const map = new Map((qs ?? []).map((q: QuestionRow) => [q.id, q]));
      questions = ids.map((id) => map.get(id)).filter(Boolean).map((q) => publicQuestion(q as QuestionRow));
    }
    const { data: rs } = await db.from("tachs_responses").select("question_id, position, selected_key, is_flagged, time_spent_seconds").eq("section_id", current.id).order("position");
    responses = rs ?? [];
  }
  return {
    server_time: now().toISOString(),
    attempt: {
      id: attempt.id, status: attempt.status, test_mode: attempt.test_mode, grade_level: attempt.grade_level, parent_email: attempt.parent_email,
      current_section_key: attempt.current_section_key, started_at: attempt.started_at, completed_at: attempt.completed_at, blueprint_version: attempt.blueprint_version,
    },
    blueprint_sections: bpSections,
    sections: (sections ?? []).map((s) => ({
      id: s.id, section_key: s.section_key, section_order: s.section_order, status: s.status, item_count: s.item_count,
      time_limit_seconds: s.time_limit_seconds, started_at: s.started_at, deadline_at: s.deadline_at, submitted_at: s.submitted_at,
      presented_count: (s.presented_question_ids ?? []).length, break_after_seconds: s.break_after_seconds,
      answered_count: null,
    })),
    current_section: current ? { id: current.id, section_key: current.section_key, status: current.status, item_count: current.item_count, deadline_at: current.deadline_at, time_limit_seconds: current.time_limit_seconds, presented_count: (current.presented_question_ids ?? []).length } : null,
    questions, responses,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token || token === (Deno.env.get("SUPABASE_ANON_KEY") ?? "")) return json({ error: "Your session expired. Please sign in again — your progress is saved." }, 401);
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return json({ error: "Your session expired. Please sign in again — your progress is saved." }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const admin = await isAdmin(db, user.id);

    if (action === "start") {
      await ensureSeed(db);
      const testMode = !!body.testMode && admin;
      const gradeLevel = Number.isFinite(Number(body.gradeLevel)) ? Number(body.gradeLevel) : null;
      const parentEmail = typeof body.parentEmail === "string" ? body.parentEmail.trim().slice(0, 254) : null;
      if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) return json({ error: "Please enter a valid parent email." }, 400);
      const { data: existing } = await db.from("tachs_attempts").select("*").eq("user_id", user.id).eq("status", "in_progress").maybeSingle();
      if (existing) {
        await enforceDeadlines(db, existing.id);
        const { data: fresh } = await db.from("tachs_attempts").select("*").eq("id", existing.id).single();
        return json({ resumed: true, attemptId: existing.id, state: await buildState(db, fresh) });
      }
      const { data: bp } = await db.from("tachs_blueprints").select("*").eq("is_active", true).order("version", { ascending: false }).limit(1).maybeSingle();
      if (!bp) return json({ error: "No active TACHS blueprint." }, 500);
      const { data: profile } = await db.from("profiles").select("school_id, parent_email").eq("id", user.id).maybeSingle();
      if (parentEmail && profile && profile.parent_email !== parentEmail) await db.from("profiles").update({ parent_email: parentEmail }).eq("id", user.id);
      const sections = (bp.sections as BlueprintSection[]).sort((a, b) => a.order - b.order);
      // Normal mode never silently shrinks a section: verify the active bank covers every target first.
      const availability: Record<string, number> = {};
      for (const s of sections) {
        const { count } = await db.from("tachs_questions").select("id", { count: "exact", head: true }).eq("blueprint_version", bp.version).eq("section_key", s.key).eq("is_active", true);
        availability[s.key] = count ?? 0;
      }
      if (!testMode) {
        const short = sectionsShortOfTarget(sections, availability);
        if (short.length) {
          const detail = short.map((s) => `${s.key} (${s.available}/${s.target})`).join(", ");
          console.error("tachs-engine configuration error: bank short for", detail);
          return json({ error: `Configuration error: the TACHS question bank is incomplete for ${detail}. Please contact D.E.Bs support before starting.` }, 503);
        }
      }
      const { data: attempt, error: aErr } = await db.from("tachs_attempts").insert({
        user_id: user.id, school_id: profile?.school_id ?? null, blueprint_id: bp.id, blueprint_version: bp.version,
        grade_level: gradeLevel, parent_email: parentEmail ?? profile?.parent_email ?? null, test_mode: testMode, current_section_key: sections[0].key,
      }).select("*").single();
      if (aErr || !attempt) return json({ error: "Could not start the diagnostic." }, 500);
      const rows = sections.map((s) => ({
        attempt_id: attempt.id, section_key: s.key, section_order: s.order,
        item_count: testMode ? Math.max(1, Math.min(s.item_count, availability[s.key], TEST_MODE_ITEMS)) : s.item_count,
        time_limit_seconds: testMode ? TEST_MODE_SECONDS : s.time_minutes * 60,
        quotas_remaining: s.skill_quotas, break_after_seconds: (testMode ? Math.min(1, s.break_after_minutes) : s.break_after_minutes) * 60,
      }));
      await db.from("tachs_attempt_sections").insert(rows);
      return json({ resumed: false, attemptId: attempt.id, state: await buildState(db, attempt) });
    }

    const attemptId = String(body.attemptId ?? "");
    if (!attemptId) return json({ error: "attemptId required" }, 400);

    if (action === "admin_list") {
      if (!admin) return json({ error: "Forbidden" }, 403);
      const { data } = await db.from("tachs_attempts")
        .select("id, user_id, grade_level, status, test_mode, started_at, completed_at, results, blueprint_version, parent_email, email_status, email_sent_at, email_attempts, email_error, profiles(full_name, username)")
        .order("created_at", { ascending: false }).limit(300);
      return json({ attempts: data ?? [] });
    }

    if (action === "admin_detail") {
      if (!admin) return json({ error: "Forbidden" }, 403);
      const id = String(body.attemptId ?? "");
      const { data: a } = await db.from("tachs_attempts").select("*, profiles(full_name, username)").eq("id", id).maybeSingle();
      if (!a) return json({ error: "Attempt not found" }, 404);
      const { data: secs } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", id).order("section_order");
      const { data: rs } = await db.from("tachs_responses").select("*").eq("attempt_id", id).order("position");
      const ids = [...new Set((rs ?? []).map((r) => r.question_id))];
      const { data: qs } = ids.length ? await db.from("tachs_questions").select("id, code, section_key, stem, correct_key, rationale, choices").in("id", ids) : { data: [] };
      const { data: events } = await db.from("tachs_attempt_events").select("*").eq("attempt_id", id).order("created_at", { ascending: false });
      const qMap = new Map((qs ?? []).map((q) => [q.id, q]));
      const secMap = new Map((secs ?? []).map((s) => [s.id, s.section_key]));
      const audit = (rs ?? []).map((r) => ({
        section_key: secMap.get(r.section_id), position: r.position, code: qMap.get(r.question_id)?.code,
        stem: qMap.get(r.question_id)?.stem, skill: r.skill, difficulty: r.difficulty,
        selected_key: r.selected_key, correct_key: qMap.get(r.question_id)?.correct_key, is_correct: r.is_correct,
        is_flagged: r.is_flagged, time_spent_seconds: r.time_spent_seconds, presented_at: r.presented_at, answered_at: r.answered_at,
      }));
      return json({ attempt: a, sections: secs ?? [], audit, events: events ?? [] });
    }

    if (action === "admin_resend_email") {
      if (!admin) return json({ error: "Forbidden" }, 403);
      const id = String(body.attemptId ?? "");
      const { data: a } = await db.from("tachs_attempts").select("id, status").eq("id", id).maybeSingle();
      if (!a) return json({ error: "Attempt not found" }, 404);
      if (a.status !== "completed") return json({ error: "The report can only be sent after the diagnostic is completed." }, 409);
      await db.from("tachs_attempt_events").insert({ attempt_id: id, actor_id: user.id, event_type: "email_resend_requested", detail: {} });
      await sendReportEmail(id);
      const { data: after } = await db.from("tachs_attempts").select("email_status, email_error, email_sent_at, email_attempts").eq("id", id).single();
      return json({ ok: true, email: after });
    }

    if (action === "admin_reopen") {
      if (!admin) return json({ error: "Forbidden" }, 403);
      const id = String(body.attemptId ?? "");
      const sectionKey = typeof body.sectionKey === "string" ? body.sectionKey : null;
      const { data: a } = await db.from("tachs_attempts").select("*").eq("id", id).maybeSingle();
      if (!a) return json({ error: "Attempt not found" }, 404);
      const { data: secs } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", id).order("section_order");
      const target = sectionKey ? (secs ?? []).find((s) => s.section_key === sectionKey) : (secs ?? []).find((s) => s.status === "submitted");
      if (!target) return json({ error: "No submitted section to reopen." }, 400);
      // Clear the responses for that section so it can be retaken from a clean state.
      await db.from("tachs_responses").delete().eq("section_id", target.id);
      await db.from("tachs_attempt_sections").update({
        status: "not_started", started_at: null, deadline_at: null, submitted_at: null, time_used_seconds: null,
        submit_reason: null, summary: null, presented_question_ids: [], difficulty_path: [], current_difficulty: 2,
        streak_correct: 0, streak_incorrect: 0,
      }).eq("id", target.id);
      await db.from("tachs_attempts").update({
        status: "in_progress", completed_at: null, results: null, current_section_key: target.section_key,
        reopened_at: now().toISOString(), reopened_by: user.id, email_status: "pending", email_error: null,
      }).eq("id", id);
      await db.from("tachs_attempt_events").insert({
        attempt_id: id, actor_id: user.id, event_type: "attempt_reopened",
        detail: { section_key: target.section_key, previous_results: a.results ?? null },
      });
      return json({ ok: true, section_key: target.section_key });
    }


    const attempt = await loadAttempt(db, attemptId, user.id, admin);
    if (!attempt) return json({ error: "Attempt not found" }, 404);
    await enforceDeadlines(db, attempt.id);
    const { data: freshAttempt } = await db.from("tachs_attempts").select("*").eq("id", attempt.id).single();

    if (action === "state") return json({ state: await buildState(db, freshAttempt) });

    if (action === "results") {
      if (freshAttempt.status !== "completed") return json({ error: "Results are available after all sections are submitted." }, 409);
      const results = freshAttempt.results ?? (await gradeAttempt(db, attempt.id));
      const { data: rs } = await db.from("tachs_responses").select("question_id, section_id, position, selected_key, is_correct, difficulty, skill, time_spent_seconds").eq("attempt_id", attempt.id).order("position");
      const ids = (rs ?? []).map((r) => r.question_id);
      const { data: qs } = ids.length ? await db.from("tachs_questions").select("id, code, section_key, skill, difficulty, stem, correct_key, rationale, choices").in("id", ids) : { data: [] };
      const { data: secs } = await db.from("tachs_attempt_sections").select("id, section_key").eq("attempt_id", attempt.id);
      const secMap = new Map((secs ?? []).map((s) => [s.id, s.section_key]));
      const qMap = new Map((qs ?? []).map((q) => [q.id, q]));
      const review = (rs ?? []).map((r) => {
        const q = qMap.get(r.question_id);
        return { section_key: secMap.get(r.section_id), position: r.position, skill: r.skill, difficulty: r.difficulty, selected_key: r.selected_key, is_correct: r.is_correct, correct_key: q?.correct_key, rationale: q?.rationale, stem: q?.stem, choices: q?.choices, time_spent_seconds: r.time_spent_seconds };
      });
      // Email delivery status with a masked address (full address stays admin-only).
      const maskedEmail = maskEmail(freshAttempt.parent_email);
      return json({
        results, review,
        attempt: { id: freshAttempt.id, grade_level: freshAttempt.grade_level, test_mode: freshAttempt.test_mode, completed_at: freshAttempt.completed_at, started_at: freshAttempt.started_at, user_id: freshAttempt.user_id },
        email: { status: freshAttempt.email_status ?? "pending", sent_at: freshAttempt.email_sent_at ?? null, masked_to: maskedEmail },
      });
    }

    if (freshAttempt.status !== "in_progress") return json({ error: "This attempt is already completed.", state: await buildState(db, freshAttempt) }, 409);
    if (freshAttempt.user_id !== user.id && !freshAttempt.test_mode) return json({ error: "Only the student may take this attempt." }, 403);

    const { data: current } = await db.from("tachs_attempt_sections").select("*").eq("attempt_id", attempt.id).eq("section_key", freshAttempt.current_section_key).maybeSingle();
    if (!current) return json({ error: "No active section." }, 409);

    if (action === "start_section") {
      if (current.status === "not_started") {
        const startAt = now();
        const deadline = new Date(startAt.getTime() + current.time_limit_seconds * 1000);
        const { data: started } = await db.from("tachs_attempt_sections").update({ status: "in_progress", started_at: startAt.toISOString(), deadline_at: deadline.toISOString() }).eq("id", current.id).select("*").single();
        await presentQuestion(db, freshAttempt, started);
      }
      return json({ state: await buildState(db, freshAttempt) });
    }

    if (current.status !== "in_progress") return json({ error: "Section is not in progress.", state: await buildState(db, freshAttempt) }, 409);

    if (action === "answer") {
      const questionId = String(body.questionId ?? "");
      const selectedKey = body.selectedKey == null ? null : String(body.selectedKey).slice(0, 4);
      const flagged = body.flagged;
      const timeSpent = Math.max(0, Math.min(3600, Number(body.timeSpentSeconds ?? 0) || 0));
      const { data: resp } = await db.from("tachs_responses").select("*").eq("section_id", current.id).eq("question_id", questionId).maybeSingle();
      if (!resp) return json({ error: "Question not presented in this section." }, 400);
      const { data: q } = await db.from("tachs_questions").select("correct_key").eq("id", questionId).single();
      const patch: Record<string, unknown> = { time_spent_seconds: (resp.time_spent_seconds ?? 0) + timeSpent };
      if (typeof flagged === "boolean") patch.is_flagged = flagged;
      if (selectedKey !== undefined && body.selectedKey !== undefined) {
        patch.selected_key = selectedKey;
        patch.is_correct = selectedKey == null ? null : selectedKey === q?.correct_key;
        patch.answered_at = selectedKey == null ? null : now().toISOString();
      }
      await db.from("tachs_responses").update(patch).eq("id", resp.id);
      return json({ ok: true, server_time: now().toISOString() });
    }

    if (action === "next") {
      // Advance adaptivity using the most recently presented item, then present the next one.
      const presented: string[] = current.presented_question_ids ?? [];
      if (presented.length >= current.item_count) return json({ done: true, state: await buildState(db, freshAttempt) });
      const lastId = presented[presented.length - 1];
      const { data: last } = await db.from("tachs_responses").select("is_correct, position").eq("section_id", current.id).eq("question_id", lastId).maybeSingle();
      const adapted = advanceAdaptive(
        { difficulty: current.current_difficulty, streakCorrect: current.streak_correct, streakIncorrect: current.streak_incorrect },
        last?.is_correct ?? null,
      );
      const sc = adapted.streakCorrect, si = adapted.streakIncorrect, diff = adapted.difficulty, transition = adapted.transition;
      const path = [...(current.difficulty_path ?? [])];
      if (transition && path.length) path[path.length - 1] = { ...path[path.length - 1], transition };
      const { data: updated } = await db.from("tachs_attempt_sections").update({ streak_correct: sc, streak_incorrect: si, current_difficulty: diff, difficulty_path: path }).eq("id", current.id).select("*").single();
      const q = await presentQuestion(db, freshAttempt, updated);
      if (!q) {
        // Bank exhausted: shrink the section to what was presented so progress is consistent.
        await db.from("tachs_attempt_sections").update({ item_count: presented.length }).eq("id", current.id);
        return json({ done: true, state: await buildState(db, freshAttempt) });
      }
      return json({ done: false, state: await buildState(db, freshAttempt) });
    }

    if (action === "submit_section") {
      await submitSection(db, attempt.id, current, "student");
      const { data: after } = await db.from("tachs_attempts").select("*").eq("id", attempt.id).single();
      return json({ state: await buildState(db, after), completed: after.status === "completed" });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("tachs-engine error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
