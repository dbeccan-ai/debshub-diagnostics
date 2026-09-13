import { Card, CardContent } from "@/components/ui/card";
import type { TachsHomeSupportView } from "@/lib/tachs";

/**
 * Parent-safe At-Home Support Plan. Renders ONLY the server-whitelisted `home_support` view:
 * cadence, section-level actions, weekly routine, family guidance and the progress-check reminder.
 * Shared by the parent results page and the admin's exact parent preview. Text/CSS only (no SVG).
 */
export function TachsHomeSupportPlan({ plan }: { plan: TachsHomeSupportView }) {
  return (
    <Card data-testid="home-support-plan">
      <CardContent className="pt-6 text-sm space-y-4">
        <p><strong>Weekly cadence:</strong> {plan.cadence}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {plan.sections.map((s) => (
            <div key={s.label} className="rounded-md border p-3">
              <h3 className="font-semibold mb-1">{s.label}</h3>
              <ul className="list-disc pl-5 space-y-1">{s.actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          ))}
        </div>
        {plan.strengths_note && <p className="text-muted-foreground">{plan.strengths_note}</p>}
        <div>
          <h3 className="font-semibold mb-1">Simple weekly routine</h3>
          <ol className="list-decimal pl-5 space-y-1">{plan.weekly_routine.map((a, i) => <li key={i}>{a}</li>)}</ol>
        </div>
        <div>
          <h3 className="font-semibold mb-1">How families can help</h3>
          <ul className="list-disc pl-5 space-y-1">{plan.guidance.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
        <p><strong>Progress check:</strong> {plan.progress_check}</p>
      </CardContent>
    </Card>
  );
}
