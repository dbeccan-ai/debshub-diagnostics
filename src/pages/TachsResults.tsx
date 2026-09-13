import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tachsApi, formatClock, SECTION_NAMES, skillLabel, type TachsResults as Results, type TachsReviewItem } from "@/lib/tachs";
import { Printer, ArrowLeft, TrendingUp, TrendingDown, Minus, FlaskConical } from "lucide-react";

const BAND_ORDER = [
  { key: "ready", label: "Ready", range: "85%+" },
  { key: "approaching", label: "Approaching Readiness", range: "70–84%" },
  { key: "developing", label: "Developing", range: "55–69%" },
  { key: "foundational", label: "Foundational Support Needed", range: "below 55%" },
];

export default function TachsResults() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ results: Results; review: TachsReviewItem[]; attempt: { test_mode: boolean; grade_level: number | null; completed_at: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tachsApi.results(attemptId).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load results."));
  }, [attemptId]);

  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="max-w-md"><CardHeader><CardTitle>Results unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/dashboard")}>Dashboard</Button></CardContent></Card></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Preparing your report…</div>;

  const { results: r, review, attempt } = data;
  const pace = (s: { pace_seconds_per_item: number; allotted_seconds_per_item: number }) =>
    s.pace_seconds_per_item > s.allotted_seconds_per_item * 1.15 ? "Slow" : s.pace_seconds_per_item < s.allotted_seconds_per_item * 0.6 ? "Rushed" : "On pace";

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <SEO title="TACHS Readiness Report | D.E.Bs" description="Preliminary TACHS readiness results." path={`/tachs/results/${attemptId}`} noIndex />
      <style>{`@media print { .no-print { display: none !important; } .print-break { break-inside: avoid; } body { font-size: 12px; } }`}</style>
      {attempt.test_mode && <div aria-hidden className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"><span className="rotate-[-25deg] text-6xl font-black text-destructive/15">TEST MODE</span></div>}

      <header className="border-b bg-card no-print">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} aria-label="Dashboard"><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-xl font-bold text-primary">TACHS Readiness Report</h1>
            {attempt.test_mode && <Badge variant="destructive"><FlaskConical className="h-3 w-3 mr-1" />TEST MODE</Badge>}
          </div>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        <section className="rounded-lg border p-4 text-sm bg-muted/40 print-break">
          <strong>Preliminary, non-official results.</strong> {r.disclaimer}
        </section>

        <section className="grid gap-4 md:grid-cols-3 print-break">
          <Card className="md:col-span-1">
            <CardHeader><CardDescription>Readiness band</CardDescription>
              <CardTitle className="text-2xl" style={{ color: r.band.color }}>{r.band.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-black">{r.overall_accuracy}%</div>
              <p className="text-sm text-muted-foreground mt-1">{r.total_correct} of {r.total_presented} items correct · {formatClock(r.total_time_seconds)} total</p>
              {attempt.grade_level && <p className="text-xs text-muted-foreground mt-1">Grade {attempt.grade_level} · {new Date(attempt.completed_at).toLocaleDateString()}</p>}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-lg">Four readiness bands</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              {BAND_ORDER.map((b) => (
                <div key={b.key} className={`rounded-md border p-2 ${b.key === r.band.key ? "border-primary bg-primary/10 font-semibold" : ""}`}>
                  {b.label}<div className="text-xs text-muted-foreground font-normal">{b.range}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="print-break">
          <h2 className="text-xl font-bold mb-3">Section performance and pacing</h2>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Accuracy</TableHead><TableHead className="text-right">Correct</TableHead><TableHead className="text-right">Time used</TableHead><TableHead>Pacing</TableHead><TableHead>Ended by</TableHead><TableHead className="text-right">Peak level</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.sections.map((s) => (
                  <TableRow key={s.section_key}>
                    <TableCell className="font-medium">{SECTION_NAMES[s.section_key]}</TableCell>
                    <TableCell className="min-w-[140px]"><div className="flex items-center gap-2"><Progress value={s.accuracy} className="h-2 w-24" /><span>{s.accuracy}%</span></div></TableCell>
                    <TableCell className="text-right">{s.correct}/{s.presented}</TableCell>
                    <TableCell className="text-right">{formatClock(s.time_used_seconds)} / {formatClock(s.time_limit_seconds)}</TableCell>
                    <TableCell>{pace(s)} ({s.pace_seconds_per_item}s/item)</TableCell>
                    <TableCell className="capitalize">{s.submit_reason ?? "—"}</TableCell>
                    <TableCell className="text-right">{["", "Easy", "Medium", "Hard"][s.max_difficulty] ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 print-break">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Strengths</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.strengths.length === 0 && <p className="text-muted-foreground">No skill reached 80% yet; see gaps for a starting plan.</p>}
              {r.strengths.map((s) => <div key={s.section_key + s.skill} className="flex justify-between"><span>{skillLabel(s.skill)} <span className="text-muted-foreground">· {SECTION_NAMES[s.section_key]}</span></span><span className="font-semibold">{s.accuracy}%</span></div>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Gaps to close</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.gaps.length === 0 && <p className="text-muted-foreground">No skill fell below 60%. Keep practising pacing.</p>}
              {r.gaps.map((s) => <div key={s.section_key + s.skill} className="flex justify-between"><span>{skillLabel(s.skill)} <span className="text-muted-foreground">· {SECTION_NAMES[s.section_key]}</span></span><span className="font-semibold">{s.accuracy}%</span></div>)}
            </CardContent>
          </Card>
        </section>

        <section className="print-break">
          <h2 className="text-xl font-bold mb-3">Skill metrics</h2>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Skill</TableHead><TableHead className="text-right">Items</TableHead><TableHead className="text-right">Correct</TableHead><TableHead className="text-right">Accuracy</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.skills.map((s) => <TableRow key={s.section_key + s.skill}><TableCell>{SECTION_NAMES[s.section_key]}</TableCell><TableCell>{skillLabel(s.skill)}</TableCell><TableCell className="text-right">{s.presented}</TableCell><TableCell className="text-right">{s.correct}</TableCell><TableCell className="text-right">{s.accuracy}%</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="print-break">
          <h2 className="text-xl font-bold mb-3">Adaptive path</h2>
          <p className="text-sm text-muted-foreground mb-3">Each section started at medium difficulty. Arrows show where two correct (up) or two incorrect (down) answers changed the level.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {r.sections.map((s) => (
              <Card key={s.section_key}><CardHeader className="pb-2"><CardTitle className="text-base">{SECTION_NAMES[s.section_key]} <span className="text-muted-foreground font-normal text-sm">avg level {s.avg_difficulty}</span></CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-1">
                  {s.difficulty_path.map((p) => (
                    <span key={p.position} title={`Q${p.position}: ${skillLabel(p.skill)}`} className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs border ${p.difficulty === 3 ? "bg-primary/20" : p.difficulty === 1 ? "bg-muted" : ""}`}>
                      {p.position}·{["", "E", "M", "H"][p.difficulty]}
                      {p.transition === "up" ? <TrendingUp className="h-3 w-3" /> : p.transition === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3 opacity-30" />}
                    </span>
                  ))}
                </CardContent></Card>
            ))}
          </div>
        </section>

        <section className="print-break">
          <Card className="border-primary">
            <CardHeader><CardTitle className="text-lg">Next-step plan</CardTitle>
              <CardDescription>Focus sections: {r.focus_sections.map((k) => SECTION_NAMES[k]).join(" and ")}</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{r.next_steps}</p>
              {r.gaps.length > 0 && (
                <ol className="list-decimal pl-5 space-y-1">
                  {r.gaps.slice(0, 4).map((g, i) => <li key={g.skill + i}><strong>{skillLabel(g.skill)}</strong> ({SECTION_NAMES[g.section_key]}): two 20-minute practice sessions per week for the next three weeks, then re-check with a timed mini-set.</li>)}
                </ol>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="print-break">
          <h2 className="text-xl font-bold mb-3">Item review</h2>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Skill</TableHead><TableHead>Your answer</TableHead><TableHead>Correct</TableHead><TableHead>Why</TableHead></TableRow></TableHeader>
              <TableBody>
                {review.map((it, i) => (
                  <TableRow key={i} className={it.is_correct ? "" : it.selected_key ? "bg-destructive/5" : "bg-muted/40"}>
                    <TableCell>{it.position}</TableCell>
                    <TableCell>{it.section_key ? SECTION_NAMES[it.section_key] : ""}</TableCell>
                    <TableCell>{skillLabel(it.skill)}</TableCell>
                    <TableCell>{it.selected_key ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{it.correct_key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">{it.rationale}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>
    </div>
  );
}
