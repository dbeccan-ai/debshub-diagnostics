import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tachsApi, type TachsResultsResponse, type TachsTierKey } from "@/lib/tachs";
import { TIER_LABELS } from "@/lib/tierConfig";

/**
 * Parent / student report: "TACHS Diagnostic Results & Recommended Plan".
 * Renders ONLY the released, server-whitelisted report: six section scores + D.E.Bs Tier, overall
 * score + Tier, the consultant interpretation, the next-step plan, the recommended program & price,
 * and the disclaimer. Before release the server returns no scores — only a "being prepared" message.
 * This component never receives item review, keys, rationales, bank/workflow data or timing.
 * Icons are text/CSS only so print output has no broken SVG tokens.
 */
function TierBadge({ tier, badge, label }: { tier: TachsTierKey; badge: string; label: string }) {
  const t = TIER_LABELS[tier];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${t.badgeClass}`}>{badge} · {label}</span>;
}

export default function TachsResults() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TachsResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tachsApi.results(attemptId).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load the report."));
  }, [attemptId]);

  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="max-w-md"><CardHeader><CardTitle>Report unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/dashboard")}>Dashboard</Button></CardContent></Card></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const completedOn = new Date(data.attempt.completed_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  if (!data.released && !data.report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <SEO title="TACHS Diagnostic Report | D.E.Bs" description="Your TACHS diagnostic report." path={`/tachs/results/${attemptId}`} noIndex />
        <Card className="max-w-lg" role="status">
          <CardHeader>
            <CardDescription>TACHS Diagnostic</CardDescription>
            <CardTitle className="text-2xl">Your reviewed report is being prepared</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{data.message}</p>
            <p className="text-muted-foreground">Assessment completed {completedOn}.</p>
            <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const r = data.report!;
  const overallTier = TIER_LABELS[r.overall.tier];
  const p = r.program;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <SEO title="TACHS Diagnostic Results & Recommended Plan | D.E.Bs" description="TACHS diagnostic results, D.E.Bs tiers, consultant interpretation and recommended plan." path={`/tachs/results/${attemptId}`} noIndex />
      <style>{`@media print { .no-print { display: none !important; } .print-break { break-inside: avoid; } body { font-size: 12px; } table { width: 100%; border-collapse: collapse; } th, td { border-bottom: 1px solid #cbd5e1; padding: 6px 8px; } }`}</style>

      <header className="border-b bg-card no-print">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 py-4 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">&larr; Dashboard</Button>
            <h1 className="text-xl font-bold text-primary">{r.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {data.preview && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Preview — not yet released to the family</span>}
            <Button onClick={() => window.print()}>Print / Save PDF</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <h1 className="hidden print:block text-2xl font-bold text-primary">{r.title}</h1>

        {/* 1. Student summary */}
        <section className="print-break" aria-labelledby="summary-h">
          <h2 id="summary-h" className="text-lg font-bold mb-3">1. Student Summary</h2>
          <Card className={`${overallTier.borderClass} ${overallTier.bgClass}`}>
            <CardHeader className="pb-2">
              <CardDescription>Overall score</CardDescription>
              <CardTitle className="text-4xl">{r.overall.accuracy}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <TierBadge tier={r.overall.tier} badge={r.overall.tier_badge} label={r.overall.tier_label} />
              <p className={overallTier.textClass}>{overallTier.helper}</p>
              <p className="text-muted-foreground">{data.attempt.grade_level ? `Grade ${data.attempt.grade_level} · ` : ""}Assessment date: {completedOn}</p>
            </CardContent>
          </Card>
        </section>

        {/* 2. Section results */}
        <section className="print-break" aria-labelledby="sections-h">
          <h2 id="sections-h" className="text-lg font-bold mb-3">2. Section Results</h2>
          <Card>
            <Table>
              <TableCaption className="text-left px-4">Score and D.E.Bs Tier for each of the six TACHS sections. Tier 1 = 85–100% Demonstrated Mastery · Tier 2 = 66–84% Strengthening Zone · Tier 3 = 0–65% Priority Intervention Required.</TableCaption>
              <TableHeader><TableRow><TableHead scope="col">Section</TableHead><TableHead scope="col" className="text-right">Score</TableHead><TableHead scope="col">D.E.Bs Tier</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.sections.map((s) => (
                  <TableRow key={s.section_key}>
                    <TableCell className="font-medium" scope="row">{s.label}</TableCell>
                    <TableCell className="text-right font-semibold">{s.accuracy}%</TableCell>
                    <TableCell><TierBadge tier={s.tier} badge={s.tier_badge} label={s.tier_label} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* 3. Consultant interpretation */}
        <section className="print-break" aria-labelledby="interp-h">
          <h2 id="interp-h" className="text-lg font-bold mb-3">3. D.E.Bs Consultant Interpretation</h2>
          <Card>
            <CardContent className="pt-6 text-sm leading-relaxed space-y-3">
              <p>{r.interpretation}</p>
              {r.priority_sections.length > 0 && <p><strong>Priority areas:</strong> {r.priority_sections.join(", ")}.</p>}
            </CardContent>
          </Card>
        </section>

        {/* 4. Next-step plan */}
        <section className="print-break" aria-labelledby="plan-h">
          <h2 id="plan-h" className="text-lg font-bold mb-3">4. Recommended Next-Step Plan</h2>
          <Card>
            <CardContent className="pt-6 text-sm space-y-3">
              <ol className="list-decimal pl-5 space-y-1.5">{r.plan.map((step, i) => <li key={i}>{step}</li>)}</ol>
              <p className="text-muted-foreground">{r.placement_note}</p>
            </CardContent>
          </Card>
        </section>

        {/* 5. Program & pricing */}
        <section className="print-break" aria-labelledby="program-h">
          <h2 id="program-h" className="text-lg font-bold mb-3">5. Recommended Program &amp; Pricing</h2>
          <Card className="border-primary border-2">
            <CardHeader>
              <CardDescription className="uppercase tracking-wide text-xs">Recommended service option</CardDescription>
              <CardTitle className="text-2xl">{p.name}</CardTitle>
              <p className="text-sm">{p.duration_weeks} weeks · {p.sessions_per_week} sessions per week · <strong className="text-base">{p.price_label}</strong> total</p>
              <p className="text-xs text-muted-foreground">Payment plan available: {p.installments_label}.</p>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-1">Focus</h3>
                <ul className="list-disc pl-5 space-y-1">{p.focus.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">What is included</h3>
                <ul className="list-disc pl-5 space-y-1">{p.included.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
              {p.honesty_note && <p className="md:col-span-2 text-muted-foreground">{p.honesty_note}</p>}
              <div className="md:col-span-2 flex flex-wrap gap-2 no-print">
                <Button asChild><a href={p.enrollment_call_url} target="_blank" rel="noopener noreferrer">Schedule Enrollment Call</a></Button>
                {p.payment_url ? <Button asChild variant="outline"><a href={p.payment_url}>Enroll now</a></Button> : <Button variant="outline" disabled title="Enrollment is completed with your consultant on the call">Enroll online — coming soon</Button>}
              </div>
              <p className="md:col-span-2 hidden print:block text-xs">Schedule your enrollment call: {p.enrollment_call_url}</p>
            </CardContent>
          </Card>
        </section>

        {/* 6. Disclaimer */}
        <section className="print-break" aria-labelledby="disc-h">
          <h2 id="disc-h" className="text-sm font-bold mb-2">6. Please note</h2>
          <p className="text-xs text-muted-foreground">{r.disclaimer}</p>
        </section>
      </main>
    </div>
  );
}
