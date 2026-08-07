import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarClock, Lock, PlayCircle, TrendingUp } from "lucide-react";
import {
  FollowUpAssessment,
  formatUnlockDate,
  isUnlocked,
  startFollowUpAttempt,
} from "@/lib/followUps";

interface Row extends FollowUpAssessment {
  tests?: { name: string } | null;
  source?: { score: number | null } | null;
  result?: { score: number | null; completed_at: string | null } | null;
}

export const FollowUpAssessmentsCard = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("follow_up_assessments")
        .select(
          `*, tests:test_id (name),
           source:source_attempt_id (score),
           result:result_attempt_id (score, completed_at)`
        )
        .eq("student_id", studentId)
        .neq("status", "cancelled")
        .order("week_number", { ascending: true });

      if (error) console.error("follow-ups load error", error);
      setRows((data as unknown as Row[]) || []);
      setLoading(false);
    };
    if (studentId) load();
  }, [studentId]);

  const handleStart = async (row: Row) => {
    try {
      setStarting(row.id);
      const attemptId = await startFollowUpAttempt(row);
      navigate(`/test/${attemptId}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not start the follow-up assessment.");
    } finally {
      setStarting(null);
    }
  };

  if (loading || rows.length === 0) return null;

  return (
    <Card className="mb-6 border-sky-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-sky-600" />
          Follow-Up Assessments
        </CardTitle>
        <CardDescription>
          Scheduled progress retakes of your original diagnostic — no payment required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          const unlocked = isUnlocked(row);
          const done = !!row.result?.completed_at;
          const before = row.source?.score ?? null;
          const after = row.result?.score ?? null;

          return (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{row.checkpoint_label}</p>
                  {done ? (
                    <Badge className="bg-emerald-600 text-white">Completed</Badge>
                  ) : unlocked ? (
                    <Badge className="bg-sky-600 text-white">Available now</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600">
                      Unlocks {formatUnlockDate(row.unlock_date)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {row.tests?.name || "Diagnostic"}
                  {row.grade_level ? ` · Grade ${row.grade_level}` : ""}
                </p>
                {done && before !== null && after !== null && (
                  <p className="mt-1 flex items-center gap-1 text-sm font-medium text-emerald-700">
                    <TrendingUp className="h-4 w-4" />
                    {before}% → {after}% ({after - before >= 0 ? "+" : ""}
                    {Math.round((after - before) * 10) / 10} pts)
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {done ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/results/${row.result_attempt_id}`)}
                  >
                    View Results
                  </Button>
                ) : unlocked ? (
                  <Button
                    className="bg-sky-600 hover:bg-sky-700"
                    disabled={starting === row.id}
                    onClick={() => handleStart(row)}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {starting === row.id ? "Starting..." : "Start Follow-Up — Free"}
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    Locked
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default FollowUpAssessmentsCard;
