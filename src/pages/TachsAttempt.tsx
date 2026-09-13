import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { tachsApi, TachsError, formatClock, SECTION_NAMES, type TachsState, type TachsQuestion } from "@/lib/tachs";
import { TachsVisual } from "@/components/TachsVisual";
import CalculatorTool from "@/components/tools/CalculatorTool";
import { ChevronLeft, ChevronRight, Flag, ListChecks, Calculator, Type, Highlighter, Coffee, Lock, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_LABEL = ["A", "B", "C", "D", "E"];

export default function TachsAttempt() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<TachsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0); // index within presented questions of current section
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [breakLeft, setBreakLeft] = useState<number | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);
  const offsetRef = useRef(0); // server_time - client now (ms)
  const questionShownAt = useRef<number>(Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyState = useCallback((s: TachsState) => {
    offsetRef.current = new Date(s.server_time).getTime() - Date.now();
    setState(s);
    const a: Record<string, string | null> = {}; const f: Record<string, boolean> = {};
    for (const r of s.responses) { a[r.question_id] = r.selected_key; f[r.question_id] = r.is_flagged; }
    setAnswers(a); setFlags(f);
  }, []);

  const load = useCallback(async () => {
    try {
      const { state: s } = await tachsApi.state(attemptId);
      applyState(s);
      if (s.attempt.status === "completed") navigate(`/tachs/results/${attemptId}`, { replace: true });
      else setIndex(Math.max(0, s.questions.length - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load attempt.");
    }
  }, [attemptId, applyState, navigate]);

  useEffect(() => { load(); }, [load]);

  // Server-anchored countdown
  const current = state?.current_section ?? null;
  useEffect(() => {
    if (!current?.deadline_at) return;
    const deadline = new Date(current.deadline_at).getTime();
    const tick = () => {
      const left = Math.round((deadline - (Date.now() + offsetRef.current)) / 1000);
      setRemaining(left);
      if (left <= 0) { load(); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [current?.deadline_at, current?.id, load]);

  // Break countdown
  useEffect(() => {
    if (breakLeft == null) return;
    if (breakLeft <= 0) { setBreakLeft(null); return; }
    const id = setTimeout(() => setBreakLeft((b) => (b == null ? null : b - 1)), 1000);
    return () => clearTimeout(id);
  }, [breakLeft]);

  const questions = state?.questions ?? [];
  const q: TachsQuestion | undefined = questions[index];
  const bpSection = useMemo(() => state?.blueprint_sections.find((b) => b.key === current?.section_key), [state, current]);
  const sectionState = useMemo(() => state?.sections.find((s) => s.id === current?.id), [state, current]);
  const sectionIdx = state ? state.sections.findIndex((s) => s.id === current?.id) : -1;
  const overallDone = state ? state.sections.reduce((a, s) => a + (s.status === "submitted" ? s.item_count : s.presented_count), 0) : 0;
  const overallTotal = state ? state.sections.reduce((a, s) => a + s.item_count, 0) : 1;

  useEffect(() => { questionShownAt.current = Date.now(); }, [q?.id]);

  const spentAndReset = () => { const s = Math.round((Date.now() - questionShownAt.current) / 1000); questionShownAt.current = Date.now(); return s; };

  const persist = useCallback((questionId: string, patch: { selectedKey?: string | null; flagged?: boolean }, immediate = false) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = () => tachsApi.answer(attemptId, questionId, { ...patch, timeSpentSeconds: spentAndReset() }).catch((e: TachsError) => {
      if (e.status === 401) toast.error(e.message); else if (e.state) applyState(e.state);
    });
    if (immediate) return run();
    saveTimer.current = setTimeout(run, 400);
  }, [attemptId, applyState]);

  const choose = (key: string) => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: key }));
    persist(q.id, { selectedKey: key });
  };
  const toggleFlag = () => {
    if (!q) return;
    const nf = !flags[q.id];
    setFlags((f) => ({ ...f, [q.id]: nf }));
    persist(q.id, { flagged: nf });
  };

  // When a section's timer expires the server auto-submits it, so in-flight calls come back 409
  // with the fresh state attached. Adopt that state quietly instead of showing an error.
  const handleSectionError = (e: unknown, fallback: string) => {
    const te = e as TachsError;
    if (te?.state) {
      applyState(te.state);
      setIndex(Math.max(0, te.state.questions.length - 1));
      setShowCalc(false);
      setReviewOpen(false);
      if (te.state.attempt.status === "completed") { navigate(`/tachs/results/${attemptId}`); return; }
      if (te.status === 409) { toast.info("Time was up for that section. Moving on."); return; }
    }
    toast.error(e instanceof Error ? e.message : fallback);
  };

  const goNext = async () => {
    if (!q || !current) return;
    if (index < questions.length - 1) { setIndex(index + 1); return; }
    if (questions.length >= current.item_count) { setReviewOpen(true); return; }
    setBusy(true);
    try {
      await persist(q.id, {}, true);
      const res = await tachsApi.next(attemptId);
      applyState(res.state);
      if (res.done) setReviewOpen(true); else setIndex(res.state.questions.length - 1);
    } catch (e) { handleSectionError(e, "Could not load next question."); }
    finally { setBusy(false); }
  };

  const startSection = async () => {
    setBusy(true);
    try { const { state: s } = await tachsApi.startSection(attemptId); applyState(s); setIndex(0); }
    catch (e) { handleSectionError(e, "Could not start section."); }
    finally { setBusy(false); }
  };

  const submitSection = async () => {
    setBusy(true); setConfirmSubmit(false); setReviewOpen(false);
    try {
      if (q) await persist(q.id, {}, true);
      const breakSecs = sectionState?.break_after_seconds ?? 0;
      const res = await tachsApi.submitSection(attemptId);
      applyState(res.state);
      setShowCalc(false);
      if (res.completed) { navigate(`/tachs/results/${attemptId}`); return; }
      if (breakSecs > 0) setBreakLeft(breakSecs);
    } catch (e) { handleSectionError(e, "Could not submit section."); }
    finally { setBusy(false); }
  };


  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md"><CardHeader><CardTitle>Unable to load</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
        <CardContent><Button onClick={() => navigate("/tachs/start")}>Back</Button></CardContent></Card>
    </div>
  );
  if (!state || !current) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const answeredCount = questions.filter((qq) => answers[qq.id]).length;
  const textSize = largeText ? "text-xl leading-relaxed" : "text-base";
  const watermark = state.attempt.test_mode;

  return (
    <div className={cn("min-h-screen bg-background relative", highlight && "tachs-highlight")}>
      <SEO title="TACHS Diagnostic in progress | D.E.Bs" description="Timed adaptive TACHS readiness diagnostic." path={`/tachs/attempt/${attemptId}`} noIndex />
      {watermark && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <span className="rotate-[-25deg] text-6xl font-black text-destructive/15 select-none">TEST MODE</span>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-2 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">TACHS Readiness</span>
              {watermark && <Badge variant="destructive" className="gap-1"><FlaskConical className="h-3 w-3" />TEST MODE</Badge>}
              <Badge variant="secondary">Section {sectionIdx + 1} of {state.sections.length}: {SECTION_NAMES[current.section_key]}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={largeText ? "default" : "outline"} size="sm" onClick={() => setLargeText((v) => !v)} aria-pressed={largeText} aria-label="Toggle large text"><Type className="h-4 w-4" /></Button>
              <Button variant={highlight ? "default" : "outline"} size="sm" onClick={() => setHighlight((v) => !v)} aria-pressed={highlight} aria-label="Toggle reading highlight"><Highlighter className="h-4 w-4" /></Button>
              {bpSection?.calculator && current.status === "in_progress" && (
                <Button variant={showCalc ? "default" : "outline"} size="sm" onClick={() => setShowCalc((v) => !v)} aria-pressed={showCalc}><Calculator className="h-4 w-4 mr-1" />Calculator</Button>
              )}
              {current.status === "in_progress" && (
                <div role="timer" aria-live="off" className={cn("font-mono text-lg font-bold tabular-nums px-3 py-1 rounded-md border", remaining <= 60 ? "text-destructive border-destructive" : "text-foreground")}>
                  {formatClock(remaining)}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div><div className="flex justify-between"><span>Section progress</span><span>{Math.min(questions.length, current.item_count)}/{current.item_count}</span></div>
              <Progress value={(Math.min(questions.length, current.item_count) / current.item_count) * 100} className="h-1.5" /></div>
            <div><div className="flex justify-between"><span>Overall</span><span>{overallDone}/{overallTotal}</span></div>
              <Progress value={(overallDone / overallTotal) * 100} className="h-1.5" /></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6">
        {breakLeft != null && (
          <Card className="mb-6 border-primary">
            <CardHeader><CardTitle className="flex items-center gap-2"><Coffee className="h-5 w-5" /> Optional break</CardTitle>
              <CardDescription>Stretch, breathe, get water. The next section starts only when you press Start.</CardDescription></CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="font-mono text-3xl font-bold">{formatClock(breakLeft)}</span>
              <Button variant="outline" onClick={() => setBreakLeft(null)}>Skip break</Button>
            </CardContent>
          </Card>
        )}

        {current.status === "not_started" && breakLeft == null && (
          <Card>
            <CardHeader>
              <CardTitle>{SECTION_NAMES[current.section_key]}</CardTitle>
              <CardDescription>{bpSection?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{current.item_count} items</Badge>
                <Badge variant="outline">{formatClock(current.time_limit_seconds)} minutes</Badge>
                <Badge variant="outline">{bpSection?.calculator ? "Calculator allowed" : "No calculator"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">The timer starts when you press Start and cannot be paused. You may move back and forth and flag items within this section until you submit or time expires.</p>
              <Button size="lg" onClick={startSection} disabled={busy}>Start {SECTION_NAMES[current.section_key]}</Button>
            </CardContent>
          </Card>
        )}

        {current.status === "in_progress" && q && (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {q.passage_text && (
                <Card className="max-h-72 overflow-y-auto">
                  <CardHeader className="pb-2"><CardTitle className="text-base">{q.passage_title ?? "Passage"}</CardTitle></CardHeader>
                  <CardContent className={cn("whitespace-pre-line", textSize)}>{q.passage_text}</CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardDescription>Question {index + 1} of {current.item_count} · {q.skill.replace(/_/g, " ")}</CardDescription>
                    <Button variant={flags[q.id] ? "default" : "outline"} size="sm" onClick={toggleFlag} aria-pressed={!!flags[q.id]}><Flag className="h-4 w-4 mr-1" />{flags[q.id] ? "Flagged" : "Flag"}</Button>
                  </div>
                  <CardTitle className={cn("font-medium whitespace-pre-line", textSize)}>{q.stem}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {q.visual ? <div className="rounded-md border p-3 bg-card overflow-x-auto"><TachsVisual spec={q.visual} alt={q.visual_alt} maxWidth={q.section_key === "paper_folding" ? 760 : 360} /></div> : null}
                  <div role="radiogroup" aria-label="Answer choices" className={cn("grid gap-2", q.choices.some((c) => c.visual) ? "sm:grid-cols-2" : "")}>
                    {q.choices.map((c, i) => {
                      const selected = answers[q.id] === c.key;
                      return (
                        <button
                          key={c.key} type="button" role="radio" aria-checked={selected}
                          onClick={() => choose(c.key)}
                          className={cn("flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected ? "border-primary bg-primary/10" : "hover:bg-muted")}
                        >
                          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold", selected && "bg-primary text-primary-foreground border-primary")}>{KEY_LABEL[i] ?? c.key}</span>
                          <span className={cn("flex-1", textSize)}>
                            {c.text}
                            {c.visual ? <TachsVisual spec={c.visual} alt={`Choice ${KEY_LABEL[i]}`} maxWidth={q.section_key === "paper_folding" ? 200 : 140} /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0 || busy}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
                <Button variant="ghost" onClick={() => setReviewOpen(true)}><ListChecks className="h-4 w-4 mr-1" />Review ({answeredCount}/{current.item_count})</Button>
                {index === questions.length - 1 && questions.length >= current.item_count ? (
                  <Button onClick={() => setConfirmSubmit(true)} disabled={busy}><Lock className="h-4 w-4 mr-1" />Submit section</Button>
                ) : (
                  <Button onClick={goNext} disabled={busy}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
                )}
              </div>
            </div>
            {showCalc && bpSection?.calculator && (
              <aside className="lg:sticky lg:top-28 h-fit" aria-label="Calculator"><CalculatorTool /></aside>
            )}
          </div>
        )}
      </main>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review: {SECTION_NAMES[current.section_key]}</DialogTitle>
            <DialogDescription>{answeredCount} of {current.item_count} answered. Tap a number to revisit. Unpresented items become available as you advance.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-8 gap-2">
            {questions.map((qq, i) => (
              <button key={qq.id} type="button" onClick={() => { setIndex(i); setReviewOpen(false); }}
                className={cn("h-9 rounded-md border text-sm font-semibold relative", answers[qq.id] ? "bg-primary/15 border-primary" : "bg-muted", i === index && "ring-2 ring-ring")}
                aria-label={`Question ${i + 1}${answers[qq.id] ? ", answered" : ", unanswered"}${flags[qq.id] ? ", flagged" : ""}`}>
                {i + 1}{flags[qq.id] && <Flag className="h-3 w-3 absolute -top-1 -right-1 text-destructive fill-current" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Keep working</Button>
            {questions.length >= current.item_count && <Button onClick={() => { setReviewOpen(false); setConfirmSubmit(true); }}>Submit section</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit {SECTION_NAMES[current.section_key]}?</DialogTitle>
            <DialogDescription>{answeredCount < current.item_count ? `${current.item_count - answeredCount} question(s) are unanswered. ` : ""}Once submitted, this section locks and cannot be reopened.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Go back</Button>
            <Button onClick={submitSection} disabled={busy}>Submit and lock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`.tachs-highlight [role="radio"]:hover, .tachs-highlight .whitespace-pre-line:hover { background: hsl(var(--accent)); }`}</style>
    </div>
  );
}
