import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { STATUS_LABEL, parentSkillName, parentDomainName, parentNextStep, parentReportNotes, type DiagnosticReport } from "@/lib/diagnosticReport";

const STATUS_TEXT: Record<string, string> = { strength: "Strength", developing: "Developing", priority: "Support needed", not_scored: "Not assessed" };
const STATUS_CLASS: Record<string, string> = {
  strength: "bg-emerald-600", developing: "bg-amber-500", priority: "bg-red-600", not_scored: "bg-muted-foreground",
};

export type EvidenceState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; report: DiagnosticReport };

/** Loads the read-only evidence model (same as parent PDF). Never regrades or writes scores. */
export function useDiagnosticReport(attemptId: string | undefined) {
  const [state, setState] = useState<EvidenceState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((n) => n + 1), []);
  useEffect(() => {
    if (!attemptId) return;
    let alive = true;
    setState({ status: "loading" });
    supabase.functions
      .invoke("generate-result-download", { body: { attemptId, format: "json", mode: "model" } })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.report || !data.report.verification) setState({ status: "error", message: error?.message || "The verified analysis service did not return a report." });
        else setState({ status: "ready", report: data.report as DiagnosticReport });
      })
      .catch((e) => alive && setState({ status: "error", message: e?.message || "Network error" }));
    return () => { alive = false; };
  }, [attemptId, nonce]);
  return { state, retry };
}

export function EvidenceUnavailable({ state, onRetry }: { state: EvidenceState; onRetry: () => void }) {
  if (state.status === "loading")
    return (
      <Card><CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading verified skill analysis… Detailed results appear once the saved answers have been checked.
      </CardContent></Card>
    );
  if (state.status === "error")
    return (
      <Card className="border-destructive"><CardContent className="space-y-2 p-5">
        <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Verified skill analysis unavailable</p>
        <p className="text-sm">We couldn't load the analysis checked against the saved answers, so no skill breakdown or interpretation is shown. The score shown above is the recorded value and has not been re-checked.</p>
        <p className="text-xs text-muted-foreground">Details: {state.message}</p>
        <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw className="mr-2 h-3 w-3" /> Try again</Button>
      </CardContent></Card>
    );
  return null;
}

/** Presentational evidence report. Pass a loaded model; or pass attemptId for a standalone self-loading panel. */
export function DiagnosticEvidenceReport({ attemptId, report: given }: { attemptId?: string; report?: DiagnosticReport }) {
  const { state, retry } = useDiagnosticReport(given ? undefined : attemptId);
  const report = given ?? (state.status === "ready" ? state.report : null);
  if (!report) return <EvidenceUnavailable state={state} onRetry={retry} />;

  if (report.verification.state === "requires_verification") {
    return (
      <Card className="border-destructive">
        <CardContent className="space-y-2 p-5">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Scoring details require verification</p>
          <p className="text-sm">No tier, skill breakdown or recommendations are shown until staff verify the evidence below.</p>
          <ul className="list-disc pl-5 text-sm">{report.verification.issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </CardContent>
      </Card>
    );
  }

  const c = report.counts;
  const cv = report.coverage;
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-base font-semibold">Evidence summary — {report.subjectLabel}</h3>
          <p className="text-sm text-muted-foreground">{report.score.basis}</p>
          <p className="mt-1 text-sm">
            {c.totalItems} questions · {c.correct} correct · {c.partial} partial · {c.incorrect} incorrect · {c.pending} awaiting review · {c.unanswered} no response
          </p>
          {parentReportNotes(report).map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}
        </div>
        {cv?.state === "incomplete" && (
          <div role="alert" className="rounded-md border border-destructive p-3 text-sm">
            <p className="font-semibold text-destructive">Required work incomplete</p>
            <p>{cv.statement} This score reflects recorded scored items only ({cv.answeredRequired} of {cv.requiredItems} required responses saved).</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{STATUS_LABEL.strength} · {STATUS_LABEL.developing} · {STATUS_LABEL.priority}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-1 pr-2">Skill</th><th className="pr-2">{report.subject === "ela" ? "Domain" : "Section"}</th><th className="pr-2">Evidence</th><th className="w-32 pr-2">Accuracy</th><th>Status / teaching</th></tr></thead>
            <tbody>
              {report.skills.map((s) => (
                <tr key={`${parentDomainName(s.domain)}-${s.skill}`} className="border-b align-top">
                  <td className="py-1 pr-2">{parentSkillName(s.skill)}</td>
                  <td className="pr-2">{parentDomainName(s.domain)}</td>
                  <td className="pr-2">{s.usesPoints ? `${s.earned}/${s.possible} pts` : `${s.correctItems}/${s.scoredItems}`}</td>
                  <td className="pr-2">
                    <span>{s.pct === null ? "—" : `${s.pct}%`}</span>
                    <div className="h-2 w-full rounded bg-muted"><div className={`h-2 rounded ${STATUS_CLASS[s.status]}`} style={{ width: `${s.pct ?? 0}%` }} /></div>
                  </td>
                  <td><span className="font-medium">{STATUS_TEXT[s.status]}</span><span className="block text-xs text-muted-foreground">{parentNextStep(s, report.subject)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm">{report.tierExplanation}</p>
        <p className="text-sm">
          <strong>{report.program.label}.</strong> Formal retests: {report.program.retests.map((r) => `Week ${r.week}`).join(", ")}.
        </p>
      </CardContent>
    </Card>
  );
}
