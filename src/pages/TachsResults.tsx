import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tachsApi, formatClock, SECTION_NAMES, skillLabel, PACING_LABEL, REPORT_STATUS_LABEL, type TachsResultsResponse } from "@/lib/tachs";

/**
 * Parent / student preliminary report.
 * Server-sanitized: this page only ever receives section-level raw accuracy and pacing,
 * observations, and a working band labelled as pending consultant review. No question text,
 * selected answers, answer keys, rationales or raw adaptive paths are sent to non-admins.
 * All icons are text/CSS so print and PDF output never contain broken SVG tokens.
 */
export default function TachsResults() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TachsResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInternal, setShowInternal] = useState(false);

  useEffect(() => {
    tachsApi.results(attemptId).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load results."));
  }, [attemptId]);

  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="max-w-md"><CardHeader><CardTitle>Results unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/dashboard")}>Dashboard</Button></CardContent></Card></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Preparing your report…</div>;

  const { report, attempt, email, viewer, report_status: reportStatus } = data;
  const completedOn = new Date(attempt.completed_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const deliveryNote = attempt.test_mode ? null
    : reportStatus === "sent" && email?.status === "sent"
      ? `The reviewed preliminary report was emailed to ${email.masked_to ?? "the parent/guardian on file"}${email.sent_at ? ` on ${new Date(email.sent_at).toLocaleDateString()}` : ""}.`
      : "Preliminary results are pending consultant review. D.E.Bs will follow up with the reviewed report and study plan.";

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <SEO title="TACHS Preliminary Report | D.E.Bs" description="Preliminary TACHS readiness results pending consultant review." path={`/tachs/results/${attemptId}`} noIndex />
      <style>{`@media print { .no-print { display: none !important; } .print-break { break-inside: avoid; } body { font-size: 12px; } table { width: 100%; border-collapse: collapse; } th, td { border-bottom: 1px solid #cbd5e1; padding: 6px 8px; } }`}</style>
      {attempt.test_mode && <div aria-hidden className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"><span className="rotate-[-25deg] text-6xl font-black text-destructive/15">TEST MODE</span></div>}

      <header className="border-b bg-card no-print">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">&larr; Dashboard</Button>
            <h1 className="text-xl font-bold text-primary">TACHS Preliminary Report</h1>
            {attempt.test_mode && <Badge variant="destructive">TEST MODE</Badge>}
            {viewer === "admin" && <Badge variant="outline">Admin viewing parent preview</Badge>}
          </div>
          <div className="flex gap-2">
            {viewer === "admin" && <Button variant="outline" onClick={() => navigate(`/admin/tachs/${attemptId}`)}>Internal report</Button>}
            <Button onClick={() => window.print()}>Print</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <section className="print-break rounded-lg border bg-muted/40 p-4 text-sm" role="note">
          <strong>Preliminary, non-official results — pending consultant interpretation.</strong> {report?.pending_interpretation}
        </section>
        {deliveryNote && <p className="text-sm text-muted-foreground" role="status">{deliveryNote}</p>}

        {report && (
          <>
            <section className="grid gap-4 md:grid-cols-3 print-break">
              <Card className="md:col-span-2">
                <CardHeader><CardDescription>Student summary</CardDescription><CardTitle className="text-xl">Raw accuracy: {report.overall_accuracy}%</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>{report.total_correct} of {report.total_presented} presented items answered correctly · {formatClock(report.total_time_seconds)} total working time</p>
                  <p className="text-muted-foreground">{attempt.grade_level ? `Grade ${attempt.grade_level} · ` : ""}Completed {completedOn}{report.blueprint_version != null ? ` · Pilot blueprint v${report.blueprint_version}` : ""}</p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2"><CardDescription className="text-xs uppercase tracking-wide">{report.working_band?.interpretation ?? "Pending consultant review"}</CardDescription>
                  <CardTitle className="text-lg" style={report.working_band ? { color: report.working_band.color } : undefined}>{report.working_band?.label ?? "Not yet interpreted"}</CardTitle></CardHeader>
                <CardContent className="text-xs text-muted-foreground">Working label based only on overall raw accuracy. Not an admission prediction.</CardContent>
              </Card>
            </section>

            <section className="print-break">
              <h2 className="text-xl font-bold mb-3">Section results — raw accuracy and pacing</h2>
              <Card>
                <Table>
                  <TableCaption className="text-left px-4">Correct items, raw accuracy, time used and pacing for each section.</TableCaption>
                  <TableHeader><TableRow><TableHead scope="col">Section</TableHead><TableHead scope="col" className="text-right">Correct</TableHead><TableHead scope="col" className="text-right">Accuracy</TableHead><TableHead scope="col" className="text-right">Time used</TableHead><TableHead scope="col">Pacing</TableHead><TableHead scope="col">Ended by</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {report.sections.map((s) => (
                      <TableRow key={s.section_key}>
                        <TableCell className="font-medium" scope="row">{s.label}</TableCell>
                        <TableCell className="text-right">{s.correct} of {s.presented}</TableCell>
                        <TableCell className="text-right font-semibold">{s.accuracy}%</TableCell>
                        <TableCell className="text-right">{formatClock(s.time_used_seconds)} of {formatClock(s.time_limit_seconds)}</TableCell>
                        <TableCell>{PACING_LABEL[s.pacing]} ({s.pace_seconds_per_item}s per item)</TableCell>
                        <TableCell>{s.ended_by === "timer" ? "Timer" : "Student"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </section>

            <section className="print-break">
              <Card>
                <CardHeader><CardTitle className="text-lg">Observations</CardTitle><CardDescription>Based on section-level accuracy and pacing only.</CardDescription></CardHeader>
                <CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{report.observations.map((o, i) => <li key={i}>{o}</li>)}</ul></CardContent>
              </Card>
            </section>

            <section className="print-break">
              <Card className="border-primary">
                <CardHeader><CardTitle className="text-lg">Pending consultant interpretation</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>A D.E.Bs consultant reviews every attempt — including pacing and item-level patterns — before the interpreted report and study plan are shared. D.E.Bs will follow up with the reviewed report and plan.</p>
                  <p className="text-xs text-muted-foreground">{report.disclaimer}</p>
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {viewer === "admin" && data.results && (
          <section className="no-print space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Internal (admin-only) detail</h2>
              <Badge variant="outline">{REPORT_STATUS_LABEL[reportStatus]}</Badge>
              <Button size="sm" variant="outline" onClick={() => setShowInternal((v) => !v)}>{showInternal ? "Hide" : "Show"} item review</Button>
            </div>
            {data.carryover?.flagged && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{data.carryover.note}</p>}
            {showInternal && (
              <Card>
                <Table>
                  <TableCaption className="text-left px-4">Item-level review with answer keys and rationales. Never shared with parents or students.</TableCaption>
                  <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Skill</TableHead><TableHead>Chosen</TableHead><TableHead>Key</TableHead><TableHead>Rationale</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(data.review ?? []).map((it, i) => (
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
            )}
          </section>
        )}
      </main>
    </div>
  );
}
