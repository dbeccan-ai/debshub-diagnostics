import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { STATUS_LABEL, UNMAPPED_SKILL, type DiagnosticReport } from "@/lib/diagnosticReport";

const STATUS_TEXT: Record<string, string> = { strength: "Strength", developing: "Developing", priority: "Priority support", not_scored: "Not assessed" };
const STATUS_CLASS: Record<string, string> = {
  strength: "bg-emerald-600", developing: "bg-amber-500", priority: "bg-red-600", not_scored: "bg-muted-foreground",
};

/** Same evidence model as the parent PDF (read-only; never regrades or writes scores). */
export function DiagnosticEvidenceReport({ attemptId }: { attemptId: string }) {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.functions.invoke("generate-result-download", { body: { attemptId, format: "json", mode: "model" } })
      .then(({ data, error }) => { if (!alive) return; if (error || !data?.report) setFailed(true); else setReport(data.report); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [attemptId]);

  if (failed || !report) return null;

  if (report.verification.state === "requires_verification") {
    return (
      <Card className="border-destructive">
        <CardContent className="space-y-2 p-5">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Scoring details require verification</p>
          <ul className="list-disc pl-5 text-sm">{report.verification.issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </CardContent>
      </Card>
    );
  }

  const c = report.counts;
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-base font-semibold">Evidence summary — {report.subjectLabel}</h3>
          <p className="text-sm text-muted-foreground">{report.score.basis}</p>
          <p className="mt-1 text-sm">
            {c.totalItems} questions · {c.correct} correct · {c.partial} partial · {c.incorrect} incorrect · {c.pending} awaiting review · {c.unanswered} no response
          </p>
          {report.verification.notes.map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}
        </div>
        <p className="text-xs text-muted-foreground">{STATUS_LABEL.strength} · {STATUS_LABEL.developing} · {STATUS_LABEL.priority}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-1 pr-2">Skill</th><th className="pr-2">{report.subject === "ela" ? "Domain" : "Section"}</th><th className="pr-2">Evidence</th><th className="w-32 pr-2">Accuracy</th><th>Status</th></tr></thead>
            <tbody>
              {report.skills.map((s) => (
                <tr key={`${s.domain}-${s.skill}`} className="border-b align-top">
                  <td className="py-1 pr-2">{s.skill === UNMAPPED_SKILL ? "Unmapped items" : s.skill}{s.skillSource === "inferred" && <span className="block text-xs text-muted-foreground">inferred from wording</span>}</td>
                  <td className="pr-2">{s.domain}</td>
                  <td className="pr-2">{s.usesPoints ? `${s.earned}/${s.possible} pts` : `${s.correctItems}/${s.scoredItems}`}</td>
                  <td className="pr-2">
                    <span>{s.pct === null ? "—" : `${s.pct}%`}</span>
                    <div className="h-2 w-full rounded bg-muted"><div className={`h-2 rounded ${STATUS_CLASS[s.status]}`} style={{ width: `${s.pct ?? 0}%` }} /></div>
                  </td>
                  <td><span className="font-medium">{STATUS_TEXT[s.status]}</span>{s.evidenceNote && <span className="block text-xs text-muted-foreground">{s.evidenceNote}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm">
          <strong>{report.program.label}.</strong> Formal retests: {report.program.retests.map((r) => `Week ${r.week}`).join(", ")}.
        </p>
      </CardContent>
    </Card>
  );
}
