import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Lock } from "lucide-react";
import { tachsApi, TACHS_PRICE_LABEL, type TachsAccess } from "@/lib/tachs";

interface Row { id: string; status: string; completed_at: string | null; started_at: string; test_mode: boolean; results: { overall_accuracy?: number; band?: { label: string } } | null }

/** Payment-aware CTA shared by the dashboard card and the Tests page card. */
export function tachsCta(access: TachsAccess | null): { label: string; to: string; locked: boolean } {
  if (!access) return { label: "Register / Sign in", to: "/auth?redirect=/tachs/start", locked: false };
  if (access.in_progress && (access.admin || access.in_progress.entitled)) return { label: "Resume", to: "/tachs/start", locked: false };
  if (access.admin || access.entitled) return { label: "Start", to: "/tachs/start", locked: false };
  return { label: access.pending_order_id ? "Complete payment" : "Pay & unlock", to: "/tachs/checkout", locked: true };
}

export default function TachsDashboardCard({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [access, setAccess] = useState<TachsAccess | null>(null);

  useEffect(() => {
    supabase.from("tachs_attempts").select("id, status, completed_at, started_at, test_mode, results")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setRows((data as Row[]) ?? []));
    tachsApi.access().then(setAccess).catch(() => setAccess(null));
  }, [userId]);

  const completed = rows.filter((r) => r.status === "completed");
  const cta = tachsCta(access);

  return (
    <Card className="mb-6 border-slate-200 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">TACHS Readiness Diagnostic</CardTitle>
            <Badge variant="secondary" className="text-[10px]">PILOT</Badge>
            {access?.admin ? <Badge variant="outline" className="text-[10px]">Admin access</Badge>
              : access && !cta.locked ? <Badge className="text-[10px] bg-green-600 text-white">Paid</Badge>
              : <Badge variant="outline" className="text-[10px]">{TACHS_PRICE_LABEL}</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/tachs")}>About</Button>
            <Button size="sm" onClick={() => navigate(cta.to)}>
              {cta.locked && <Lock className="mr-1 h-3.5 w-3.5" />}{cta.label}
            </Button>
          </div>
        </div>
        <CardDescription>Six timed adaptive sections with an immediate readiness report. Specialized high-school admissions diagnostic.</CardDescription>
      </CardHeader>
      {completed.length > 0 && (
        <CardContent className="pt-0 space-y-1 text-sm">
          {completed.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{new Date(r.completed_at!).toLocaleDateString()} {r.test_mode && <Badge variant="destructive" className="ml-1 text-[10px]">TEST</Badge>}</span>
              <span className="font-medium">{r.results?.overall_accuracy ?? "—"}% · {r.results?.band?.label ?? ""}</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate(`/tachs/results/${r.id}`)}>View report</Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
