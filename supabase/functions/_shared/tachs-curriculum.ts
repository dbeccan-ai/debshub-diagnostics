// CONSULTANT-ONLY TACHS curriculum generator. Pure (no Deno/Supabase imports) so it is unit-testable
// and shared by the admin-only `tachs-curriculum` edge function and the admin page fallback.
//
// This module may read internal section + skill metrics because its output is served ONLY behind the
// admin role check (server-side) and rendered ONLY on the admin-guarded curriculum route. Nothing
// here is ever included in the parent page, parent email, parent print or the At-Home Support Plan.
// If a family-safe summary is ever needed it must go through a separate consultant-controlled publish step.

import { TACHS_PROGRAMS, TACHS_TIERS, tachsTierFor, programSessions, programHours, programScheduleLabel, type TachsProgramKey, type TachsTierKey } from "./tachs-programs.ts";
import { SECTION_LABELS, SECTION_ORDER, skillLabel } from "./tachs-report.ts";

export interface CurriculumSkill { skill: string; label: string; presented: number; correct: number; accuracy: number }
export interface CurriculumSectionProfile {
  section_key: string; label: string; accuracy: number; tier: TachsTierKey; tier_badge: string; priority_rank: number;
  weakest_skills: CurriculumSkill[]; strongest_skills: CurriculumSkill[];
}
export interface CurriculumAgendaBlock { block: string; minutes: number; detail: string }
export interface CurriculumSession {
  session: number; week: number; day_label: string; minutes: number; section_focus: string;
  objectives: string[]; agenda: CurriculumAgendaBlock[]; exit_check: string;
}
export interface CurriculumWeek {
  week: number; phase: string; focus_sections: string[]; focus_skills: string[]; objectives: string[];
  lesson_sequence: string[]; sessions: CurriculumSession[]; algebra_focus: string | null;
  independent_practice: string[]; home_reinforcement: string[]; progress_check: string | null;
}
export interface CurriculumMilestone { week: number; kind: "progress_check" | "final_reassessment"; description: string }
export interface TachsCurriculum {
  admin_only: true;
  visibility: "ADMIN ONLY — never sent to families";
  title: string; student_name: string; grade_level: number | null; generated_at: string;
  program: { key: TachsProgramKey; name: string; duration_weeks: number; sessions_per_week: number; session_minutes: number; total_sessions: number; total_hours: number; schedule_days: string[] | null; schedule_label: string; tier_badge: string };
  workbook_specifications: string[];
  overall_accuracy: number;
  section_profile: CurriculumSectionProfile[];
  priorities: string[]; strengths: string[];
  weeks: CurriculumWeek[];
  milestones: CurriculumMilestone[];
  consultant_notes: string[];
}

/** Progress-check weeks per program; the last entry is the final reassessment. */
export const CURRICULUM_MILESTONES: Record<TachsProgramKey, number[]> = {
  tachs_strategy: [3, 6],
  tachs_skill_builder: [4, 8, 10],
  tachs_intensive_phase1: [4, 8, 12, 16],
  tachs_8_week_intensive: [3, 6, 8],
};

/** Algebra I foundations sequence (grade 8 through introductory/mid Algebra I). Admin-only. */
export const ALGEBRA_SEQUENCE: string[] = [
  "Integer, fraction and rational-number operations; order of operations; properties of equality.",
  "Ratios, rates, proportional reasoning and percent change applied to multistep problems.",
  "Expressions: combining like terms, distributive property, evaluating and translating word phrases.",
  "One- and two-step equations, then multistep equations with variables on both sides.",
  "Inequalities: solving, reversing the sign, and representing solutions on a number line.",
  "Linear relationships: tables, slope as rate of change, intercepts, and graphing y = mx + b.",
  "Systems and modeling: writing an equation from a situation, substitution, and checking reasonableness.",
  "Exponents, scientific notation, radicals and an introduction to quadratic patterns; timed mixed review.",
];

const SECTION_RIGOR: Record<string, { rigor: string; moves: string[]; practice: string[]; home: string[] }> = {
  reading: {
    rigor: "Grade 8–9 literary, historical and informational passages with mature academic vocabulary.",
    moves: ["Model annotation for main idea, structure and tone on a complex passage", "Guided inference practice: claim → text evidence → reasoning", "Vocabulary-in-context routine: context clues, word parts, connotation"],
    practice: ["Two passages with 8–10 questions, all answers justified with a line reference", "Vocabulary log: 10 words in context with a sentence of the student's own"],
    home: ["One 15-minute passage set per practice day", "Read a nonfiction article and summarize its purpose in two sentences"],
  },
  written_expression: {
    rigor: "Passage editing and standalone conventions at grade 8 rigor: usage, punctuation, sentence structure, organization.",
    moves: ["Model an editing pass: read for meaning, then for conventions", "Sentence-combining and run-on/fragment repair with explicit rules", "Paragraph organization: topic sentence, order, transitions"],
    practice: ["Edit two short passages (8 items each) and state the rule behind every change", "Rewrite five flawed sentences; label the error type"],
    home: ["Edit one paragraph a day and explain each change aloud", "Maintain a confused-words list and check written work against it"],
  },
  mathematics: {
    rigor: "Grade 8 through introductory-to-mid Algebra I: integer and rational fluency, ratios/percents, linear equations and inequalities, functions and slope, geometry/measurement, data and probability, multistep modeling. No calculator.",
    moves: ["Worked examples with explicit reasoning for the target strand, then faded guided practice", "Error analysis of the student's own missed problems (misconception → correction)", "Multistep modeling: read, represent (table/equation/diagram), solve, check reasonableness"],
    practice: ["Mixed 20-item set (60% target strand, 40% spiral review) with every step shown", "Five multistep word problems with a written plan before calculating"],
    home: ["One 20–25-minute mixed set per practice day, no calculator", "Five estimation problems checked against exact answers"],
  },
  figure_matrices: {
    rigor: "Five-choice matrices with interacting transformations (rotation, reflection, shading, count, size, overlay) across rows and columns.",
    moves: ["Name-the-rule routine: identify each change across the row, then down the column", "Two-rule integration with think-alouds", "Elimination strategy under a per-item time target"],
    practice: ["12 matrices with the rules written in words before answering", "Re-do missed items and describe both rules that changed"],
    home: ["8–10 puzzles per practice day, rule spoken aloud before choosing"],
  },
  paper_folding: {
    rigor: "One- to three-fold sequences with diagonal folds, multiple punches and asymmetric folds, five choices.",
    moves: ["Physical folding and punching to build the mirror-image model", "Grid-based reflection drawing across each fold line in reverse order", "Prediction-then-check discipline under time"],
    practice: ["10 fold puzzles: draw the unfolded result before looking at choices", "Three physical folds recorded with a sketch of the prediction and the outcome"],
    home: ["Fold, punch, predict, unfold with real paper (2–3 times per practice day)"],
  },
  figure_classification: {
    rigor: "Five-choice classification with combined attributes: shape, count, shading, orientation/symmetry, internal structure, size/position/part-whole.",
    moves: ["State the shared rule in one sentence before viewing the choices", "Attribute checklists for multi-attribute rules", "Distractor analysis: why each wrong choice fails the rule"],
    practice: ["12 classification items with the shared rule written for each", "Sort-and-resort activity using two attributes"],
    home: ["8–10 puzzles per practice day, rule stated first", "'Odd one out' with drawn figures, explaining the rule"],
  },
};

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function skillsOf(results: Record<string, any>, sectionKey: string): CurriculumSkill[] {
  const sec = (Array.isArray(results?.sections) ? results.sections : []).find((s: any) => s?.section_key === sectionKey);
  const out: CurriculumSkill[] = [];
  const raw = sec?.skills && typeof sec.skills === "object" && !Array.isArray(sec.skills) ? sec.skills : {};
  for (const [skill, v] of Object.entries(raw as Record<string, any>)) {
    const presented = Number(v?.presented ?? 0), correct = Number(v?.correct ?? 0);
    if (presented > 0) out.push({ skill, label: skillLabel(skill), presented, correct, accuracy: Math.round((correct / presented) * 100) });
  }
  if (!out.length && Array.isArray(results?.skills)) {
    for (const r of results.skills) if (r?.section_key === sectionKey && Number(r.presented) > 0) out.push({ skill: r.skill, label: skillLabel(r.skill), presented: Number(r.presented), correct: Number(r.correct), accuracy: clampPct(r.accuracy) });
  }
  return out;
}

/** Ranks the six sections weakest-first and summarizes their skills (admin only). */
export function sectionProfile(results: Record<string, any>): CurriculumSectionProfile[] {
  const rows = SECTION_ORDER.map((key) => {
    const sec = (Array.isArray(results?.sections) ? results.sections : []).find((s: any) => s?.section_key === key);
    const accuracy = clampPct(sec?.accuracy ?? 0);
    const tier = tachsTierFor(accuracy);
    const skills = skillsOf(results, key);
    return {
      section_key: key, label: SECTION_LABELS[key], accuracy, tier, tier_badge: TACHS_TIERS[tier].badge, priority_rank: 0,
      weakest_skills: [...skills].sort((a, b) => a.accuracy - b.accuracy || b.presented - a.presented).slice(0, 3),
      strongest_skills: [...skills].sort((a, b) => b.accuracy - a.accuracy).slice(0, 2),
    };
  });
  const ranked = [...rows].sort((a, b) => a.accuracy - b.accuracy);
  ranked.forEach((r, i) => { r.priority_rank = i + 1; });
  return rows;
}

const targetFor = (accuracy: number) => Math.min(100, Math.max(accuracy + 10, tachsTierFor(accuracy) === "red" ? 70 : tachsTierFor(accuracy) === "yellow" ? 85 : 92));

/** 120- (or 60-) minute session agenda, scaled from the program's session length. */
function sessionAgenda(minutes: number, section: CurriculumSectionProfile, skillLabelText: string, rigor: string, move: string, timed: boolean): CurriculumAgendaBlock[] {
  const k = minutes / 120;
  const m = (base: number) => Math.max(5, Math.round((base * k) / 5) * 5);
  return [
    { block: "Objectives & warm-up", minutes: m(10), detail: `State the session target for ${section.label} — ${skillLabelText} — and complete a short retrieval warm-up from the previous session.` },
    { block: "Explicit instruction", minutes: m(30), detail: `${move} Rigor: ${rigor}` },
    { block: "Guided practice", minutes: m(25), detail: `Worked-together items in ${skillLabelText}, consultant fading support; every step verbalized and misconceptions corrected on the spot.` },
    { block: "Independent practice", minutes: m(25), detail: `Student works a 10–12 item ${skillLabelText} set alone; consultant circulates and records error types for the next session.` },
    { block: "Timed practice", minutes: m(20), detail: timed ? `Full section-pace set under the TACHS time target, followed by a pacing debrief.` : `Short 8-item set at a relaxed time target to begin building pace without losing accuracy.` },
    { block: "Exit check & assignment", minutes: m(10), detail: `4-item exit check, then assign the between-session practice and home reinforcement.` },
  ];
}

/**
 * Builds a structured program-aligned curriculum: Tier 1 = 6 weeks, Tier 2 = 10 weeks, Tier 3 = 16 weeks,
 * two consultant-led sessions per week. Weakest sections/skills get the most weeks; strengths are maintained.
 */
export function buildTachsCurriculum(input: { results: Record<string, any>; programKey: TachsProgramKey; studentName: string; gradeLevel: number | null; generatedAt?: string }): TachsCurriculum {
  const program = TACHS_PROGRAMS[input.programKey];
  const profile = sectionProfile(input.results);
  const byRank = [...profile].sort((a, b) => a.priority_rank - b.priority_rank);
  const weight = (s: CurriculumSectionProfile) => {
    const base = s.tier === "red" ? 3 : s.tier === "yellow" ? 2 : 1;
    // Mathematics (Algebra I foundations) carries the largest block of time whenever it is not yet mastered.
    return s.section_key === "mathematics" && s.tier !== "green" ? base + 1 : base;
  };
  const rotation: CurriculumSectionProfile[] = [];
  for (const s of byRank) for (let i = 0; i < weight(s); i++) rotation.push(s);
  const strengths = profile.filter((s) => s.tier === "green");
  const maintain = strengths.length ? strengths : [byRank[byRank.length - 1]];
  const milestones = CURRICULUM_MILESTONES[input.programKey];
  const finalWeek = program.duration_weeks;
  const weeks: CurriculumWeek[] = [];
  let skillCursor: Record<string, number> = {};

  for (let w = 1; w <= finalWeek; w++) {
    const frac = w / finalWeek;
    const phase = w === finalWeek ? "Final reassessment" : frac <= 0.4 ? "Foundations and accuracy" : frac <= 0.8 ? "Build and multistep application" : "Timed application and pacing";
    const primary = rotation[(w - 1) % rotation.length];
    const secondary = rotation[w % rotation.length].section_key === primary.section_key ? rotation[(w + 1) % rotation.length] : rotation[w % rotation.length];
    const keep = maintain[(w - 1) % maintain.length];
    const pick = (s: CurriculumSectionProfile) => {
      const pool = s.weakest_skills.length ? s.weakest_skills : [{ skill: s.section_key, label: `${s.label} (all strands)`, presented: 0, correct: 0, accuracy: s.accuracy }];
      const i = skillCursor[s.section_key] ?? 0; skillCursor[s.section_key] = i + 1;
      return pool[i % pool.length];
    };
    const sk1 = pick(primary), sk2 = pick(secondary);
    const r1 = SECTION_RIGOR[primary.section_key], r2 = SECTION_RIGOR[secondary.section_key];
    const timed = phase.startsWith("Timed");
    const isMilestone = milestones.includes(w);
    const isFinal = w === finalWeek;
    weeks.push({
      week: w, phase,
      focus_sections: [primary.label, secondary.label, `Maintain: ${keep.label}`],
      focus_skills: [`${primary.label} — ${sk1.label}`, `${secondary.label} — ${sk2.label}`],
      objectives: isFinal
        ? [`Complete the full-length six-section reassessment under exam timing.`, `Reach at least ${targetFor(clampPct(input.results?.overall_accuracy))}% overall and move every priority section up at least one tier from this diagnostic.`]
        : [
          `${primary.label}: score at least ${targetFor(sk1.accuracy)}% on a 10-item ${sk1.label} set${timed ? " under the section time target" : ""} (diagnostic: ${sk1.presented ? `${sk1.correct}/${sk1.presented}` : `${sk1.accuracy}%`}).`,
          `${secondary.label}: score at least ${targetFor(sk2.accuracy)}% on a 10-item ${sk2.label} set (diagnostic: ${sk2.presented ? `${sk2.correct}/${sk2.presented}` : `${sk2.accuracy}%`}).`,
          `${keep.label}: hold ${Math.max(85, keep.accuracy)}%+ on one short maintenance set.`,
        ],
      lesson_sequence: isFinal
        ? ["Session 1: full-length reassessment, sections 1–3 (timed, proctored by the consultant).", "Session 2: full-length reassessment, sections 4–6, then score review and next-step conference."]
        : [
          `Session 1 (${primary.label}): ${r1.moves[(w - 1) % r1.moves.length]}. Rigor: ${r1.rigor}`,
          `Session 2 (${secondary.label}): ${r2.moves[w % r2.moves.length]}.${timed ? " Close with a 10-minute timed set and pacing debrief." : " Close with error analysis of the week's independent practice."}`,
        ],
      independent_practice: isFinal ? ["Light review only: redo the two most recent error-analysis sets."] : [r1.practice[(w - 1) % r1.practice.length], r2.practice[w % r2.practice.length], `${keep.label}: one 10-item maintenance set.`],
      home_reinforcement: isFinal ? ["Rest, sleep and a light 10-minute refresher the day before each session."] : [r1.home[(w - 1) % r1.home.length], ...(r2.home.length ? [r2.home[w % r2.home.length]] : [])],
      sessions: (() => {
        const dayFor = (i: number) => program.schedule_days ? program.schedule_days[i % program.schedule_days.length] : `Session ${i + 1}`;
        const num = (i: number) => (w - 1) * program.sessions_per_week + i + 1;
        if (isFinal) return [primary, secondary].slice(0, program.sessions_per_week).map((_, i) => ({
          session: num(i), week: w, day_label: dayFor(i), minutes: program.session_minutes, section_focus: i === 0 ? "Full-length reassessment — sections 1–3" : "Full-length reassessment — sections 4–6",
          objectives: ["Complete the reassessment under exam timing with no coaching.", "Produce a section-by-section comparison against the diagnostic."],
          agenda: [
            { block: "Set-up & instructions", minutes: 10, detail: "Exam conditions, materials, timing rules explained." },
            { block: "Timed reassessment", minutes: program.session_minutes - 40, detail: i === 0 ? "Reading, Written Expression and Mathematics under section time limits." : "Figure Matrices, Paper Folding and Figure Classification under section time limits." },
            { block: "Scoring & review", minutes: 20, detail: "Immediate scoring and section-by-section comparison with the diagnostic." },
            { block: "Next steps", minutes: 10, detail: "Consultant records findings for the family summary (released only through the normal report workflow)." },
          ],
          exit_check: "Section-level score sheet completed and filed with the attempt record.",
        }));
        const pairs = [{ s: primary, sk: sk1, r: r1, move: r1.moves[(w - 1) % r1.moves.length] }, { s: secondary, sk: sk2, r: r2, move: r2.moves[w % r2.moves.length] }];
        return Array.from({ length: program.sessions_per_week }, (_, i) => {
          const pr = pairs[i % pairs.length];
          return {
            session: num(i), week: w, day_label: dayFor(i), minutes: program.session_minutes, section_focus: `${pr.s.label} — ${pr.sk.label}`,
            objectives: [
              `Score at least ${targetFor(pr.sk.accuracy)}% on the in-session ${pr.sk.label} set (diagnostic: ${pr.sk.presented ? `${pr.sk.correct}/${pr.sk.presented}` : `${pr.sk.accuracy}%`}).`,
              `Explain the reasoning for every item aloud without prompting.`,
              ...(pr.s.section_key === "mathematics" ? [`Apply the Algebra I focus of this week: ${ALGEBRA_SEQUENCE[(w - 1) % ALGEBRA_SEQUENCE.length]}`] : []),
              `Maintain ${keep.label} with a short spiral set.`,
            ],
            agenda: sessionAgenda(program.session_minutes, pr.s, pr.sk.label, pr.r.rigor, pr.move, timed),
            exit_check: `4-item exit check in ${pr.sk.label}; 3 of 4 correct moves the skill to spiral review, otherwise it repeats next session.`,
          };
        });
      })(),
      algebra_focus: isFinal ? null : ALGEBRA_SEQUENCE[(w - 1) % ALGEBRA_SEQUENCE.length],

      progress_check: isFinal
        ? "Final full-length reassessment compared section-by-section against this diagnostic; consultant prepares the family summary through the normal report approval workflow."
        : isMilestone ? `Timed progress check (week ${w}): two priority sections plus one strength section; compare to the diagnostic and re-weight the remaining weeks.` : null,
    });
  }

  return {
    admin_only: true,
    visibility: "ADMIN ONLY — never sent to families",
    title: `Personalized TACHS Curriculum — ${input.studentName}`,
    student_name: input.studentName, grade_level: input.gradeLevel, generated_at: input.generatedAt ?? new Date().toISOString(),
    program: {
      key: program.key, name: program.name, duration_weeks: program.duration_weeks, sessions_per_week: program.sessions_per_week,
      session_minutes: program.session_minutes, total_sessions: programSessions(program), total_hours: programHours(program),
      schedule_days: program.schedule_days ? [...program.schedule_days] : null, schedule_label: programScheduleLabel(program),
      tier_badge: TACHS_TIERS[program.tier].badge,
    },
    overall_accuracy: clampPct(input.results?.overall_accuracy),
    section_profile: profile,
    priorities: byRank.filter((s) => s.tier !== "green").map((s) => s.label),
    strengths: strengths.map((s) => s.label),
    weeks,
    milestones: milestones.map((wk) => ({ week: wk, kind: wk === finalWeek ? "final_reassessment" as const : "progress_check" as const, description: wk === finalWeek ? "Full-length reassessment and next-step conference." : "Timed progress check on priority sections plus one strength section." })),
    workbook_specifications: [
      `Build one workbook unit per week (${finalWeek} units) mirroring the weekly focus sections and skills listed in this document.`,
      `Each unit contains: a one-page skill explainer, 12 guided items, 12 independent items, one ${program.session_minutes >= 120 ? "20" : "10"}-minute timed set, and a 4-item exit check with an answer key on a separate page.`,
      "Mathematics units follow the Algebra I foundations sequence week by week and are written for no-calculator work.",
      "Ability units (Figure Matrices, Paper Folding, Figure Classification) use five answer choices; academic units use four.",
      "All items must be originally authored by D.E.Bs. Do not copy or adapt questions from any commercial TACHS prep book or released exam.",
      "Include a between-session home practice page per unit and a progress-check record sheet at each milestone week.",
    ],
    consultant_notes: [
      "Mathematics is taught at grade 8 through introductory-to-mid Algebra I rigor; ability sections use TACHS-style five-choice visual reasoning.",
      "Weeks are weighted toward the weakest sections (Tier 3 ×3, Tier 2 ×2, Tier 1 ×1, with Mathematics carrying an extra rotation whenever it is below mastery) while each week keeps one strength section active.",
      "Skill-level targets, diagnostic counts and this document are internal. Share only the approved parent report and At-Home Support Plan with families.",
    ],
  };
}
