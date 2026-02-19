import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Download, Mail, Eye, Search, Filter, RefreshCw } from "lucide-react";
import { getTierFromScore, TIER_LABELS } from "@/lib/tierConfig";

interface TestAttempt {
  id: string;
  completed_at: string | null;
  score: number | null;
  tier: string | null;
  grade_level: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  email_status: string | null;
  profiles: {
    full_name: string;
    parent_email: string | null;
  } | null;
  tests: {
    name: string;
    test_type: string;
  } | null;
}

const AdminAllResults = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [testTypeFilter, setTestTypeFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please sign in to access this page.");
          navigate("/auth");
          return;
        }

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) {
          console.error("Role check error:", roleError);
        }

        if (!roleData) {
          setIsAdmin(false);
          toast.error("Admin access required.");
          return;
        }

        setIsAdmin(true);
        await fetchAttempts();
      } catch (err) {
        console.error("Admin page error:", err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoad();
  }, [navigate]);

  const fetchAttempts = async () => {
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("test_attempts")
      .select(`
        id,
        completed_at,
        score,
        tier,
        grade_level,
        total_questions,
        correct_answers,
        email_status,
        profiles:user_id (full_name, parent_email),
        tests:test_id (name, test_type)
      `)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (attemptsError) {
      console.error("Error fetching attempts:", attemptsError);
      toast.error("Could not load test results.");
      return;
    }

    setAttempts(attemptsData as TestAttempt[]);
    setFilteredAttempts(attemptsData as TestAttempt[]);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...attempts];

    // Search by student name
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by grade
    if (gradeFilter !== "all") {
      filtered = filtered.filter((a) => a.grade_level?.toString() === gradeFilter);
    }

    // Filter by test type
    if (testTypeFilter !== "all") {
      filtered = filtered.filter((a) => a.tests?.test_type === testTypeFilter);
    }

    // Filter by tier (derive from score)
    if (tierFilter !== "all") {
      const tierMap: Record<string, string> = { "Tier 1": "green", "Tier 2": "yellow", "Tier 3": "red" };
      filtered = filtered.filter((a) => a.score !== null && getTierFromScore(a.score) === tierMap[tierFilter]);
    }

    setFilteredAttempts(filtered);
  }, [searchTerm, gradeFilter, testTypeFilter, tierFilter, attempts]);

  const getTierFromAttempt = (score: number | null) => {
    if (score === null) return null;
    return getTierFromScore(score);
  };

  const getTierBadgeColor = (score: number | null) => {
    const t = getTierFromAttempt(score);
    switch (t) {
      case "green": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "yellow": return "bg-amber-100 text-amber-800 border-amber-200";
      case "red": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTierLabel = (score: number | null) => {
    if (score === null) return "N/A";
    return TIER_LABELS[getTierFromScore(score)].badge;
  };

  const getEmailStatusBadge = (status: string | null) => {
    switch (status) {
      case "sent":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Sent</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case "skipped":
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Skipped</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  const handleViewResults = (attemptId: string) => {
    navigate(`/results/${attemptId}`);
  };

  const handleDownload = async (attemptId: string) => {
    try {
      toast.loading("Generating download...", { id: "download" });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("generate-result-download", {
        body: { attemptId, format: "pdf" },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
      }

      toast.success("Download ready!", { id: "download" });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Could not generate download.", { id: "download" });
    }
  };

  const handleResendEmail = async (attemptId: string) => {
    try {
      toast.loading("Sending email...", { id: "resend" });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("send-test-results", {
        body: { attemptId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success("Email sent successfully!", { id: "resend" });
      await fetchAttempts(); // Refresh to update email status
    } catch (err) {
      console.error("Email error:", err);
      toast.error("Could not send email.", { id: "resend" });
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get unique values for filters
  const uniqueGrades = [...new Set(attempts.map((a) => a.grade_level).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));
  const uniqueTestTypes = [...new Set(attempts.map((a) => a.tests?.test_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading results...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-slate-600"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-semibold text-slate-900">All Student Results</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAttempts}
            className="text-slate-600"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-slate-900">{attempts.length}</div>
              <div className="text-xs text-slate-500">Total Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">
                {attempts.filter((a) => a.score !== null && getTierFromScore(a.score) === "green").length}
              </div>
              <div className="text-xs text-slate-500">Tier 1</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {attempts.filter((a) => a.score !== null && getTierFromScore(a.score) === "yellow").length}
              </div>
              <div className="text-xs text-slate-500">Tier 2</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {attempts.filter((a) => a.score !== null && getTierFromScore(a.score) === "red").length}
              </div>
              <div className="text-xs text-slate-500">Tier 3</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-1 h-4 w-4" />
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {uniqueGrades.map((grade) => (
                      <SelectItem key={grade} value={grade!.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    {uniqueTestTypes.map((type) => (
                      <SelectItem key={type} value={type!}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Test Results ({filteredAttempts.length})
            </CardTitle>
            <CardDescription>
              All completed diagnostic test attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAttempts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No results found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-medium text-slate-600">Student</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Test</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Grade</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Score</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Tier</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Date</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Email</th>
                      <th className="pb-3 text-right font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3">
                          <div className="font-medium text-slate-900">
                            {attempt.profiles?.full_name || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {attempt.profiles?.parent_email || "No email"}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-700">{attempt.tests?.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{attempt.tests?.test_type}</div>
                        </td>
                        <td className="py-3 text-slate-700">
                          {attempt.grade_level ? `Grade ${attempt.grade_level}` : "—"}
                        </td>
                        <td className="py-3">
                          <span className="font-medium text-slate-900">
                            {attempt.score !== null ? `${Math.round(attempt.score)}%` : "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {" "}({attempt.correct_answers}/{attempt.total_questions})
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={getTierBadgeColor(attempt.score)}>
                            {getTierLabel(attempt.score)}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-600">
                          {formatDate(attempt.completed_at)}
                        </td>
                        <td className="py-3">
                          {getEmailStatusBadge(attempt.email_status)}
                        </td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewResults(attempt.id)}
                              title="View Results"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(attempt.id)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendEmail(attempt.id)}
                              title="Resend Email"
                            >
                              <Mail className="h-4 w-4" />
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

export default AdminAllResults;
