import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Printer } from "lucide-react";
import type { IntensiveCurriculum, IntensiveWeek, PracticeItem } from "@/lib/generalCurriculum";
import { progressionStatus, gradeLabel, type RetestEvidence } from "@/lib/generalCurriculum";

const RETEST_STATUS = (e?: RetestEvidence) => !e || e.status === "not_scheduled" ? "unavailable (not scheduled for this attempt)"
  : e.status === "completed" ? (e.score !== null ? `completed — ${e.score}%` : "completed — result unavailable")
  : e.status === "cancelled" ? "cancelled" : `pending${e.unlock_date ? ` (unlocks ${e.unlock_date})` : ""}`;

const STATUS_LABEL = { ready_to_progress: "Ready to progress", needs_reteaching: "Needs reteaching", awaiting_evidence: "Awaiting evidence" } as const;

export function IntensiveCurriculumView({ plan, isStaff, onConfirmGrade }: { plan: IntensiveCurriculum; isStaff: boolean; onConfirmGrade: (g: number) => void }) {
  const [open, setOpen] = useState<number[]>([1]);
  const [practiceWeek, setPracticeWeek] = useState(1);
  const [target, setTarget] = useState(plan.progression_target.accuracy_pct);
  const [gradeInput, setGradeInput] = useState("");
  const week = plan.weeks.find((w) => w.week === practiceWeek)!;

  return (
    <div className="space-y-6">
      {plan.grades.notice && (
        <Card className="border-amber-300 bg-amber-50 print:border-0">
          <CardContent className="flex flex-col gap-3 pt-6 text-sm text-amber-900">
            <p className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{plan.grades.notice}</p>
            {isStaff && (
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <span>Confirm enrolled grade (0 = K):</span>
                <Input className="w-24 bg-background" type="number" min={0} max={12} value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} />
                <Button size="sm" disabled={gradeInput === ""} onClick={() => onConfirmGrade(Number(gradeInput))}>Confirm &amp; regenerate</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">{plan.plan_label}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{plan.overview}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p><strong>Anchor grade:</strong> {plan.weeks[11]?.enrolled_or_anchor_label} {plan.grades.enrolled_verified ? "(enrolled, confirmed)" : "(provisional — enrolled grade not verified)"}</p>
            {plan.grades.tested_grade !== null && <p><strong>Assessment grade:</strong> {plan.grades.tested_grade === 0 ? "Kindergarten" : `Grade ${plan.grades.tested_grade}`}</p>}
            <p><strong>Core weeks:</strong> {plan.core_weeks} · <strong>Optional extension weeks:</strong> {plan.extension_weeks}</p>
            <p><strong>Session frequency:</strong> {plan.sessions.frequency_label}</p>
            <p className="sm:col-span-2"><strong>Sessions:</strong> {plan.sessions.total_label}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <span><strong>Progression target</strong> (instructional, not a diagnostic tier cutoff): independent accuracy</span>
            <Input className="w-20" type="number" min={50} max={100} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
            <span>% on {plan.progression_target.distinct_checks} different checks, including a later retention check. Writing is scored with the rubric.</span>
          </div>
          <p className="hidden print:block">Progression target: {target}% independent accuracy on {plan.progression_target.distinct_checks} different checks including a retention check.</p>
          <div data-testid="formal-retests" className="rounded-md border p-3">
            <p className="font-semibold">Formal retests (part of the full 15-week pathway)</p>
            <ul className="list-disc pl-5">
              {(plan.formal_retests ?? []).map((r) => (
                <li key={r.week}><strong>Week {r.week} {r.label}:</strong> {r.purpose} <span className="text-muted-foreground">— {RETEST_STATUS(r.evidence)}</span></li>
              ))}
            </ul>
            <p className="text-muted-foreground">{plan.formal_retests_note}</p>
          </div>
          <div>
            <p className="font-semibold">Starting points by skill</p>
            <ul className="list-disc pl-5">
              {plan.strands.map((s) => <li key={s.skill}>{s.skill}: {s.status === "mastered" ? "already demonstrated — review only" : s.start_confirmed ? `starts at ${gradeLabel(s.start_grade!)} (confirmed)` : "starting grade provisional — needs instructor confirmation"} <span className="text-muted-foreground">({s.evidence_note})</span></li>)}
            </ul>
          </div>
          <Button variant="outline" size="sm" className="print:hidden" onClick={() => { setOpen(plan.weeks.map((w) => w.week)); setTimeout(() => window.print(), 50); }}><Printer className="mr-2 h-4 w-4" />Print plan</Button>
        </CardContent>
      </Card>

      <h2 className="flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5" />{plan.plan_label}</h2>
      {plan.weeks.map((w) => (
        <WeekCard key={w.week} w={w} target={target} expanded={open.includes(w.week)} toggle={() => setOpen((o) => (o.includes(w.week) ? o.filter((x) => x !== w.week) : [...o, w.week]))} />
      ))}

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Weekly practice</CardTitle>
          <div className="flex flex-wrap gap-1 pt-2">
            {plan.weeks.map((w) => (
              <Button key={w.week} size="sm" variant={w.week === practiceWeek ? "default" : "outline"} onClick={() => setPracticeWeek(w.week)}>
                W{w.week}{w.is_extension ? "*" : ""}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">* optional extension week · Week {week.week}: {week.phase_label} · {week.instructional_label}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {week.reading_passage && <Passage title={week.reading_passage.title} text={week.reading_passage.text} />}
          {week.items.map((it, i) => <ItemCard key={`${week.week}-${it.id}`} item={it} n={i + 1} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function WeekCard({ w, expanded, toggle, target }: { w: IntensiveWeek; expanded: boolean; toggle: () => void; target: number }) {
  const status = progressionStatus([], { accuracy_pct: target, distinct_checks: 2, requires_retention_check: true });
  return (
    <Card className="break-inside-avoid-page">
      <button className="w-full text-left" onClick={toggle}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="mb-1 flex flex-wrap gap-1">
                <Badge variant={w.is_extension ? "outline" : "secondary"}>{w.is_extension ? "Optional extension" : "Core"}</Badge>
                <Badge variant="outline">{w.instructional_label}</Badge>
                <Badge variant="outline">{STATUS_LABEL[status]}</Badge>
                {w.formal_retest && <Badge>Formal {w.formal_retest.label}</Badge>}
              </div>
              <CardTitle className="text-base">Week {w.week}: {w.focus}</CardTitle>
              <p className="text-xs text-muted-foreground">{w.phase_label} · toward {w.enrolled_or_anchor_label}</p>
            </div>
            <span className="print:hidden">{expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</span>
          </div>
        </CardHeader>
      </button>
      {expanded && (
        <CardContent className="space-y-3 text-sm">
          <p><strong>Priority skills:</strong> {w.priority_skills.map((p) => `${p.skill} (${p.grade_label})`).join("; ")}</p>
          <p><strong>Why it matters next:</strong> {w.prerequisite_connection}</p>
          {w.extension_selection && <p><strong>How the teacher selects targets:</strong> {w.extension_selection}</p>}
          <List title="Objectives" items={w.objectives} />
          <List title="Prerequisite check" items={w.prerequisite_check} />
          <p><strong>Teaching explanation:</strong> {w.teaching_explanation}</p>
          <div className="rounded-md border p-3">
            <p className="font-semibold">Worked example</p>
            <p>{w.worked_example.problem}</p>
            <ol className="list-decimal pl-5">{w.worked_example.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <p><strong>Answer:</strong> {w.worked_example.answer}</p>
          </div>
          <p><strong>Guided practice:</strong> {w.guided_practice_notes}</p>
          <p><strong>Independent practice:</strong> {w.independent_practice_notes}</p>
          <List title="Cumulative review" items={w.cumulative_review} />
          {w.sessions && <List title="Sessions this week" items={w.sessions.map((s) => `Session ${s.session}: ${s.focus}`)} />}
          <div className="rounded-md bg-muted p-3">
            <p className="font-semibold">Home practice (~{w.home_practice.minutes} min)</p>
            <p>{w.home_practice.directions}</p>
            <ul className="list-disc pl-5">{w.home_practice.activities.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          {w.formal_retest && (
            <div className="rounded-md border-2 border-primary p-3">
              <p className="font-semibold">Week {w.formal_retest.week} formal {w.formal_retest.label} (already scheduled)</p>
              <p>{w.formal_retest.purpose}</p>
              <p><strong>Teacher directions:</strong> {w.formal_retest.teacher_directions}</p>
            </div>
          )}
          <p><strong>{w.checkpoint.label} (instructional):</strong> {w.checkpoint.description}</p>
          <p><strong>Assessment goal:</strong> {w.checkpoint.assessment_goal}</p>
          <p><strong>Retention check:</strong> {w.retention_check}</p>
          <p><strong>If reteaching is needed:</strong> {w.reteaching_directions}</p>
          <p className="text-xs text-muted-foreground">Status changes only when checkpoint results are recorded. Viewing this week or its practice does not count as evidence.</p>
        </CardContent>
      )}
    </Card>
  );
}

const List = ({ title, items }: { title: string; items: string[] }) => (
  <div><p className="font-semibold">{title}</p><ul className="list-disc pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
);
const Passage = ({ title, text }: { title: string; text: string }) => (
  <div className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-sm"><p className="font-semibold">{title}</p><p className="whitespace-pre-line">{text}</p></div>
);

function ItemCard({ item, n }: { item: PracticeItem; n: number }) {
  const [sel, setSel] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState(false);
  const letters = useMemo(() => ["A", "B", "C", "D", "E"], []);
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="mb-1 flex gap-1"><Badge variant="secondary" className="capitalize">{item.role}</Badge><Badge variant="outline">{item.skill}</Badge></div>
      {item.passage && <Passage title="Read" text={item.passage} />}
      <p className="font-medium">{n}. {item.prompt}</p>
      {item.type === "multiple_choice" && (
        <div className="mt-2 grid gap-1">
          {item.options!.map((o, i) => (
            <Button key={i} variant={sel === letters[i] ? "default" : "outline"} size="sm" className="h-auto justify-start whitespace-normal text-left" onClick={() => !shown && setSel(letters[i])}>{letters[i]}. {o}</Button>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setHint(true)}>Hint</Button>
        <Button size="sm" variant="secondary" disabled={item.type === "multiple_choice" && !sel} onClick={() => setShown(true)}>{item.type === "multiple_choice" ? "Check answer" : "Show answer"}</Button>
      </div>
      {hint && <p className="mt-1 text-muted-foreground">💡 {item.hint}</p>}
      {shown && (
        <div className="mt-2 rounded bg-muted p-2">
          {item.type === "multiple_choice" && <p className="font-semibold">{sel === item.correct_answer ? "Correct!" : `Not quite — answer: ${item.correct_answer}`}</p>}
          {item.type === "short_answer" && <p className="font-semibold">Answer: {item.correct_answer}</p>}
          {item.type === "writing" && (
            <>
              <p><strong>Exemplar:</strong> {item.exemplar}</p>
              <ul className="list-disc pl-5">{item.rubric?.map((r, i) => <li key={i}><strong>{r.criterion}:</strong> {r.levels}</li>)}</ul>
            </>
          )}
          <p>{item.explanation}</p>
        </div>
      )}
    </div>
  );
}
