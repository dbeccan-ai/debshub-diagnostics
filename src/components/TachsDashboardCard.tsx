import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface Row { id: string; status: string; completed_at: string | null; started_at: string; test_mode: boolean; results: { overall_accuracy?: number; band?: { label: string } } | null }

export default function TachsDashboardCard({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from("tachs_attempts").select("id, status, completed_at, started_at, test_mode, results")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [userId]);

  const inProgress = rows.find((r) => r.status === "in_progress");
  const completed = rows.filter((r) => r.status === "completed");

  return (
    <Card className="mb-6 border-slate-200 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">TACHS Readiness Diagnostic</CardTitle>
            <Badge variant="secondary" className="text-[10px]">PILOT</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/tachs")}>About</Button>
            <Button size="sm" onClick={() => navigate(inProgress ? `/tachs/attempt/${inProgress.id}` : "/tachs/start")}>
              {inProgress ? "Resume" : "Start"}
            </Button>
          </div>
        </div>
        <CardDescription>Six timed adaptive sections with an immediate readiness report.</CardDescription>
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
