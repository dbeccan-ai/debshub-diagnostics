import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, Users } from "lucide-react";
import {
  pairPrePost,
  toCohortCsvRow,
  toCsv,
  type TranscriptMetricRow,
} from "@/lib/readingRecoveryMetrics";

interface EnrollmentRow {
  id: string;
  user_id: string;
  student_name: string;
  grade_level: number | null;
  school_id: string | null;
  enrolled_at: string;
  version_a_completed_at: string | null;
  version_b_completed_at: string | null;
  version_c_completed_at: string | null;
}

interface ProgressRow {
  enrollment_id: string;
  day_number: number;
  completed_at: string | null;
}

const AdminReadingRecoveryCohort = () => {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptMetricRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = !!roles?.some((r) => r.role === "admin");
    const isTeacher = !!roles?.some((r) => r.role === "teacher");
    if (!isAdmin && !isTeacher) { setAllowed(false); setLoading(false); return; }
    setAllowed(true);

    const [{ data: enr, error: e1 }, { data: tr, error: e2 }, { data: pr, error: e3 }] = await Promise.all([
      supabase.from("reading_recovery_enrollments")
        .select("id, user_id, student_name, grade_level, school_id, enrolled_at, version_a_completed_at, version_b_completed_at, version_c_completed_at")
        .order("enrolled_at", { ascending: false }),
      supabase.from("reading_diagnostic_transcripts")
        .select("id, user_id, student_id, school_id, student_name, version, final_error_count, wcpm, reading_duration_seconds, created_at, completion_status")
        .order("created_at", { ascending: true }),
      supabase.from("reading_recovery_progress")
        .select("enrollment_id, day_number, completed_at"),
    ]);

    if (e1 || e2 || e3) {
      console.error(e1 || e2 || e3);
      toast.error("Could not load cohort data.");
    }
    setEnrollments((enr as EnrollmentRow[]) ?? []);
    setTranscripts((tr as TranscriptMetricRow[]) ?? []);
    setProgress((pr as ProgressRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [navigate]);

  const roster = useMemo(() => enrollments.map((e) => {
    const studentTranscripts = transcripts.filter((t) => t.user_id === e.user_id);
    const pair = pairPrePost(studentTranscripts);
    const daysCompleted = progress.filter((p) => p.enrollment_id === e.id && p.completed_at).length;
    const latest = studentTranscripts[studentTranscripts.length - 1];
    return { enrollment: e, pair, daysCompleted, latest, transcriptCount: studentTranscripts.length };
  }), [enrollments, transcripts, progress]);

  const exportCsv = () => {
    // De-identified export: no names, emails, or user ids.
    const rows = transcripts.map((t, i) => toCohortCsvRow(t, i));
    if (rows.length === 0) { toast.info("No transcript data to export."); return; }
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reading-recovery-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("De-identified cohort CSV downloaded.");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm font-medium text-slate-600">Loading...</p></div>;
  if (allowed === false) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md"><CardHeader><CardTitle className="text-red-600">Access Denied</CardTitle></CardHeader>
        <CardContent><Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button></CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-slate-600">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <Users className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-semibold text-slate-900">Reading Recovery Cohort</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1 h-4 w-4" /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-900">{enrollments.length}</div><div className="text-xs text-slate-500">Enrolled Students</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{roster.filter(r => r.pair).length}</div><div className="text-xs text-slate-500">Pre/Post Pairs</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-sky-600">{transcripts.filter(t => t.wcpm != null).length}</div><div className="text-xs text-slate-500">Timed Readings (WCPM)</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{enrollments.filter(e => e.version_c_completed_at).length}</div><div className="text-xs text-slate-500">Completed Post-Test</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Roster ({roster.length})</CardTitle>
            <CardDescription>Live progress, assessment versions, and pre/post pairing per student</CardDescription>
          </CardHeader>
          <CardContent>
            {roster.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No enrollments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-medium text-slate-600">Student</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Grade</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Days Done</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Pre (A)</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Mid (B)</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Post (C)</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Error Δ</th>
                      <th className="pb-3 text-left font-medium text-slate-600">WCPM Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(({ enrollment: e, pair, daysCompleted, transcriptCount }) => (
                      <tr key={e.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 font-medium text-slate-900">{e.student_name}</td>
                        <td className="py-3 text-slate-700">{e.grade_level === 0 ? "K" : e.grade_level ?? "—"}</td>
                        <td className="py-3 text-slate-700">{daysCompleted}/21</td>
                        <td className="py-3">{e.version_a_completed_at ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Done</Badge> : <Badge variant="outline" className="bg-slate-100 text-slate-500">—</Badge>}</td>
                        <td className="py-3">{e.version_b_completed_at ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Done</Badge> : <Badge variant="outline" className="bg-slate-100 text-slate-500">—</Badge>}</td>
                        <td className="py-3">{e.version_c_completed_at ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Done</Badge> : <Badge variant="outline" className="bg-slate-100 text-slate-500">—</Badge>}</td>
                        <td className="py-3">
                          {pair?.errorDelta != null ? (
                            <span className={pair.errorDelta < 0 ? "font-semibold text-emerald-700" : pair.errorDelta > 0 ? "font-semibold text-red-700" : "text-slate-600"}>
                              {pair.errorDelta > 0 ? "+" : ""}{pair.errorDelta}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3">
                          {pair?.wcpmDelta != null ? (
                            <span className={pair.wcpmDelta > 0 ? "font-semibold text-emerald-700" : pair.wcpmDelta < 0 ? "font-semibold text-red-700" : "text-slate-600"}>
                              {pair.wcpmDelta > 0 ? "+" : ""}{pair.wcpmDelta}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminReadingRecoveryCohort;
