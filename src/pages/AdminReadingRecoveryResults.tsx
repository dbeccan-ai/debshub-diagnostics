import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Filter, RefreshCw, Eye, BookOpen } from "lucide-react";

interface ReadingTranscript {
  id: string;
  student_name: string;
  grade_band: string;
  passage_title: string;
  version: string;
  final_error_count: number | null;
  completion_status: string | null;
  assessment_duration_seconds: number | null;
  admin_name: string | null;
  admin_email: string | null;
  created_at: string;
  assessment_completed_at: string | null;
  user_id: string;
}

const AdminReadingRecoveryResults = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [transcripts, setTranscripts] = useState<ReadingTranscript[]>([]);
  const [filtered, setFiltered] = useState<ReadingTranscript[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [gradeBandFilter, setGradeBandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/auth"); return; }

        const { data: roleData } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", user.id).eq("role", "admin").maybeSingle();

        if (!roleData) { setIsAdmin(false); return; }
        setIsAdmin(true);
        await fetchTranscripts();
      } catch { toast.error("Something went wrong."); }
      finally { setLoading(false); }
    };
    init();
  }, [navigate]);

  const fetchTranscripts = async () => {
    const { data, error } = await supabase
      .from("reading_diagnostic_transcripts")
      .select("id, student_name, grade_band, passage_title, version, final_error_count, completion_status, assessment_duration_seconds, admin_name, admin_email, created_at, assessment_completed_at, user_id")
      .order("created_at", { ascending: false });

    if (error) { console.error(error); toast.error("Could not load results."); return; }
    setTranscripts(data as ReadingTranscript[]);
    setFiltered(data as ReadingTranscript[]);
  };

  useEffect(() => {
    let f = [...transcripts];
    if (searchTerm) f = f.filter(t => t.student_name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (gradeBandFilter !== "all") f = f.filter(t => t.grade_band === gradeBandFilter);
    if (statusFilter !== "all") f = f.filter(t => (t.completion_status || "incomplete") === statusFilter);
    setFiltered(f);
  }, [searchTerm, gradeBandFilter, statusFilter, transcripts]);

  const getTierFromErrors = (errors: number | null) => {
    if (errors === null) return null;
    if (errors <= 3) return "Tier 1";
    if (errors <= 7) return "Tier 2";
    return "Tier 3";
  };

  const getTierBadge = (errors: number | null) => {
    const tier = getTierFromErrors(errors);
    const colors: Record<string, string> = {
      "Tier 1": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "Tier 2": "bg-amber-100 text-amber-800 border-amber-200",
      "Tier 3": "bg-red-100 text-red-800 border-red-200",
    };
    if (!tier) return <Badge variant="outline" className="bg-slate-100 text-slate-600">N/A</Badge>;
    return <Badge variant="outline" className={colors[tier]}>{tier}</Badge>;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const uniqueGradeBands = [...new Set(transcripts.map(t => t.grade_band))].sort();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm font-medium text-slate-600">Loading...</p></div>;
  if (isAdmin === false) return (
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
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-semibold text-slate-900">Reading Recovery Results</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTranscripts}><RefreshCw className="mr-1 h-4 w-4" /> Refresh</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-900">{transcripts.length}</div><div className="text-xs text-slate-500">Total Assessments</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{transcripts.filter(t => t.completion_status === "completed").length}</div><div className="text-xs text-slate-500">Completed</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{transcripts.filter(t => (t.completion_status || "incomplete") !== "completed").length}</div><div className="text-xs text-slate-500">Incomplete</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-600">{new Set(transcripts.map(t => t.user_id)).size}</div><div className="text-xs text-slate-500">Unique Students</div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search by student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={gradeBandFilter} onValueChange={setGradeBandFilter}>
                  <SelectTrigger className="w-[150px]"><Filter className="mr-1 h-4 w-4" /><SelectValue placeholder="Grade Band" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {uniqueGradeBands.map(gb => <SelectItem key={gb} value={gb}>{gb}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment Results ({filtered.length})</CardTitle>
            <CardDescription>All Reading Recovery diagnostic assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No results found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-medium text-slate-600">Student</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Passage</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Grade Band</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Version</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Errors</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Tier</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Duration</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Status</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Date</th>
                      <th className="pb-3 text-right font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3">
                          <div className="font-medium text-slate-900">{t.student_name}</div>
                          {t.admin_name && <div className="text-xs text-slate-500">Admin: {t.admin_name}</div>}
                        </td>
                        <td className="py-3 text-slate-700">{t.passage_title}</td>
                        <td className="py-3 text-slate-700">{t.grade_band}</td>
                        <td className="py-3 text-slate-700">{t.version}</td>
                        <td className="py-3 font-medium text-slate-900">{t.final_error_count ?? "—"}</td>
                        <td className="py-3">{getTierBadge(t.final_error_count)}</td>
                        <td className="py-3 text-slate-600">{formatDuration(t.assessment_duration_seconds)}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={t.completion_status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                            {t.completion_status === "completed" ? "Completed" : "Incomplete"}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-600">{formatDate(t.created_at)}</td>
                        <td className="py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/reading-recovery/results/${t.id}`)} title="View Results">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
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

export default AdminReadingRecoveryResults;
