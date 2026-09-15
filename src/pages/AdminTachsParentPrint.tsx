import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { TachsHomeSupportPlan } from "@/components/TachsHomeSupportPlan";
import { loadAdminDetail, type TachsAdminDetail } from "@/lib/tachs";
import { pricingBreakdown, TACHS_PROGRAMS, usd2 } from "@/lib/tachsPrograms";
import { toast } from "sonner";

/**
 * Dedicated ADMIN-ONLY parent-report print surface. It renders only the server-approved
 * parent preview and deliberately has no diagnostic audit, workflow, email, or curriculum data.
 */
export default function AdminTachsParentPrint() {
  const { attemptId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TachsAdminDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("This page is for administrators only."); navigate("/dashboard"); return; }
      try { setDetail(await loadAdminDetail(attemptId)); }
      catch (e) { setError(e instanceof Error ? e.message : "Could not load the parent report."); }
    })();
  }, [attemptId, navigate]);

  useEffect(() => {
    if (!detail?.parent_preview || searchParams.get("print") !== "1" || autoPrinted.current) return;
    autoPrinted.current = true;
    const printWhenReady = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    };
    void printWhenReady();
  }, [detail, searchParams]);

  if (error) return <main className="min-h-screen p-8"><p role="alert">{error}</p></main>;
  if (!detail) return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  const report = detail.parent_preview;
  if (!report) return <main className="min-h-screen p-8"><p role="status">No parent-safe report is available for this completed attempt.</p></main>;

  const student = detail.attempt.profiles?.full_name ?? "Student";
  const completed = report.assessment_date ? new Date(report.assessment_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Not recorded";
  const program = report.program;
  const pricing = program.pricing ?? pricingBreakdown({
    regular_tuition_cents: program.total_cents,
    installment_count: TACHS_PROGRAMS[program.key]?.installments.count ?? 3,
    credit_applied: true,
    credit_expires_at: null,
  });
  const installmentWord = ["One", "Two", "Three", "Four", "Five", "Six"][pricing.installments.count - 1] ?? String(pricing.installments.count);

  return (
    <div className="min-h-screen bg-muted/30 py-6 print:bg-background print:py-0">
      <SEO title={`Print TACHS Parent Report — ${student} | D.E.Bs`} description="Parent-safe TACHS diagnostic report print view." path={`/admin/tachs/${attemptId}/parent-report/print`} noIndex />
      <style>{`
        @page { size: Letter portrait; margin: 0.55in; }
        @media print {
          html, body, #root { width: 100% !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
          body { font-size: 12pt !important; line-height: 1.35 !important; background: white !important; }
          body .parent-print-sheet, body .parent-print-sheet * { visibility: visible !important; }
          .parent-print-toolbar { display: none !important; }
          .parent-print-sheet { width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 auto !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; position: static !important; overflow: visible !important; }
          .parent-print-sheet table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
          .parent-print-sheet th, .parent-print-sheet td { white-space: normal !important; overflow-wrap: anywhere !important; padding: 5pt 7pt !important; }
          .parent-print-sheet h1, .parent-print-sheet h2, .parent-print-sheet h3 { break-after: avoid-page !important; page-break-after: avoid !important; }
          .print-keep, .parent-print-sheet tr, .parent-print-sheet li { break-inside: avoid-page !important; page-break-inside: avoid !important; }
          .print-section { break-before: auto !important; margin-top: 14pt !important; }
          .parent-print-sheet [data-testid="home-support-plan"] { border: 0 !important; box-shadow: none !important; }
          .parent-print-sheet [data-testid="home-support-plan"] > div { padding: 0 !important; }
          .parent-print-sheet [data-testid="home-support-plan"] .grid { display: block !important; }
          .parent-print-sheet [data-testid="home-support-plan"] .grid > div { margin-bottom: 8pt !important; break-inside: avoid-page !important; page-break-inside: avoid !important; }
        }
        @media print and (orientation: landscape) {
          .parent-print-sheet { width: 100% !important; max-width: none !important; }
        }
      `}</style>

      <div className="parent-print-toolbar mx-auto mb-4 flex max-w-[8.5in] items-center justify-between gap-3 px-4">
        <Button variant="outline" onClick={() => navigate(`/admin/tachs/${attemptId}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to report workspace</Button>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
      </div>

      <main className="parent-print-sheet mx-auto w-[calc(100%-2rem)] max-w-[8.5in] border bg-background px-[0.55in] py-[0.45in] text-[12pt] leading-relaxed shadow-sm" data-testid="parent-report-print-surface">
        <header className="print-keep border-b-2 border-primary pb-3">
          <p className="text-[10pt] font-bold uppercase text-primary">D.E.Bs LEARNING ACADEMY LLC</p>
          <h1 className="mt-1 text-[20pt] font-bold">{report.title}</h1>
          <p className="mt-2"><strong>{student}</strong>{detail.attempt.grade_level ? ` · Grade ${detail.attempt.grade_level}` : ""} · Assessment date: {completed}</p>
        </header>

        <section className="print-section print-keep" aria-labelledby="print-summary">
          <h2 id="print-summary" className="text-[15pt] font-bold">1. Student Summary</h2>
          <p className="mt-2">Overall score: <strong>{report.overall.accuracy}%</strong> · {report.overall.tier_badge} · {report.overall.tier_label}</p>
        </section>

        <section className="print-section" aria-labelledby="print-sections">
          <h2 id="print-sections" className="text-[15pt] font-bold">2. Section Results</h2>
          <table className="mt-2" data-testid="parent-print-section-table">
            <thead><tr className="border-b"><th className="w-[40%] text-left">Section</th><th className="w-[18%] text-left">Score</th><th className="w-[42%] text-left">D.E.Bs Tier</th></tr></thead>
            <tbody>{report.sections.map((section) => <tr key={section.section_key} className="border-b"><td>{section.label}</td><td>{section.accuracy}%</td><td>{section.tier_badge} · {section.tier_label}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="print-section print-keep" aria-labelledby="print-interpretation">
          <h2 id="print-interpretation" className="text-[15pt] font-bold">3. D.E.Bs Consultant Interpretation</h2>
          <p className="mt-2">{report.interpretation}</p>
          {report.priority_sections.length > 0 && <p className="mt-2"><strong>Priority areas:</strong> {report.priority_sections.join(", ")}.</p>}
        </section>

        <section className="print-section" aria-labelledby="print-plan">
          <h2 id="print-plan" className="text-[15pt] font-bold">4. Recommended Next-Step Plan</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">{report.plan.map((step, index) => <li key={index}>{step}</li>)}</ol>
          <p className="mt-2">{report.placement_note}</p>
        </section>

        {report.home_support && <section className="print-section" aria-labelledby="print-home"><h2 id="print-home" className="text-[15pt] font-bold">5. {report.home_support.title}</h2><div className="mt-2"><TachsHomeSupportPlan plan={report.home_support} /></div></section>}

        <section className="print-section" aria-labelledby="print-program">
          <h2 id="print-program" className="text-[15pt] font-bold">6. Recommended Program &amp; Pricing</h2>
          <div className="print-keep mt-2"><p><strong>{program.name}</strong></p><p>{program.schedule_label ?? `${program.duration_weeks} weeks · ${program.sessions_per_week} sessions per week`}</p></div>
          <table className="mt-2" data-testid="parent-print-pricing-table"><tbody>
            <tr className="border-b"><td>Regular tuition</td><td className="text-right">{usd2(pricing.regular_tuition_cents)}</td></tr>
            <tr className="border-b"><td>Diagnostic Enrollment Credit{pricing.credit_expires_at ? ` (enroll by ${new Date(pricing.credit_expires_at).toLocaleDateString()})` : ""}</td><td className="text-right">− {usd2(pricing.credit_cents)}</td></tr>
            <tr className="border-b font-semibold"><td>Tuition after credit</td><td className="text-right">{usd2(pricing.balance_cents)}</td></tr>
            <tr className="border-b font-semibold"><td>Pay in full, including processing</td><td className="text-right">{usd2(pricing.total_full_cents)}</td></tr>
            <tr className="border-b"><td>{installmentWord}-payment option, including processing</td><td className="text-right">{pricing.installments.count} × {usd2(pricing.installments.charge_each_cents)} ({usd2(pricing.installments.total_charged_cents)})</td></tr>
          </tbody></table>
          <p className="mt-2 text-[10pt]">{pricing.simple_note}</p>
          <div className="mt-3 grid grid-cols-2 gap-5"><div className="print-keep"><h3 className="font-bold">Focus</h3><ul className="list-disc pl-5">{program.focus.map((item, index) => <li key={index}>{item}</li>)}</ul></div><div className="print-keep"><h3 className="font-bold">What is included</h3><ul className="list-disc pl-5">{program.included.map((item, index) => <li key={index}>{item}</li>)}</ul></div></div>
        </section>

        <section className="print-section print-keep border-t pt-3" aria-labelledby="print-disclaimer"><h2 id="print-disclaimer" className="text-[12pt] font-bold">7. Please note</h2><p className="mt-1 text-[10pt]">{report.disclaimer}</p></section>
      </main>
    </div>
  );
}