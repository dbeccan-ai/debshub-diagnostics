import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PendingReviewAttempt {
  id: string;
  completed_at: string | null;
  score: number | null;
  tier: string | null;
  grade_level: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  profiles: {
    full_name: string;
    parent_email: string | null;
  } | null;
  tests: {
    name: string;
    test_type: string;
  } | null;
  pending_review_count?: number;
}

const AdminPendingReviews = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<PendingReviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

        // Fetch all completed test attempts that need review
        // We'll identify these by checking if they have non-MC questions
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
            profiles:user_id (full_name, parent_email),
            tests:test_id (name, test_type)
          `)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });

        if (attemptsError) {
          console.error("Error fetching attempts:", attemptsError);
          toast.error("Could not load pending reviews.");
          return;
        }

        // Get responses for each attempt to count pending reviews
        const attemptsWithReviewCount = await Promise.all(
          (attemptsData || []).map(async (attempt: any) => {
            // Get responses with is_correct = null (pending review)
            const { data: responses, error: respError } = await supabase
              .from("test_responses")
              .select("id, is_correct")
              .eq("attempt_id", attempt.id)
              .is("is_correct", null);

            if (respError) {
              console.error("Error fetching responses:", respError);
            }

            return {
              ...attempt,
              pending_review_count: responses?.length || 0
            };
          })
        );

        // Filter to only show attempts with pending reviews
        const pendingAttempts = attemptsWithReviewCount.filter(
          (a) => a.pending_review_count > 0
        );

        setAttempts(pendingAttempts as PendingReviewAttempt[]);
      } catch (err) {
        console.error("Admin page error:", err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoad();
  }, [navigate]);

  const handleViewTeacherCopy = async (attemptId: string) => {
    try {
      toast.loading("Generating teacher copy...", { id: "teacher-copy" });

      const { data, error } = await supabase.functions.invoke("generate-teacher-copy", {
        body: { attemptId },
      });

      if (error) throw new Error(error.message);

      const htmlContent = data?.html;
      if (!htmlContent) throw new Error("Could not generate teacher copy");

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }

      toast.success("Teacher copy opened!", { id: "teacher-copy" });
    } catch (err) {
      console.error("Teacher copy error:", err);
      toast.error("Failed to generate teacher copy.", { id: "teacher-copy" });
    }
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "Tier 1": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Tier 2": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Tier 3": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredAttempts = attempts.filter((attempt) => {
    const search = searchTerm.toLowerCase();
    const studentName = attempt.profiles?.full_name?.toLowerCase() || "";
    const testName = attempt.tests?.name?.toLowerCase() || "";
    return studentName.includes(search) || testName.includes(search);
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Checking admin access...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-600">You need admin privileges to view this page.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-slate-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Pending Manual Reviews</h1>
              <p className="text-xs text-slate-500">Tests with written responses awaiting grading</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            Admin View
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{attempts.length}</p>
                <p className="text-xs text-amber-600">Tests Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-slate-500" />
              <div>
                <p className="text-2xl font-bold text-slate-700">
                  {attempts.reduce((sum, a) => sum + (a.pending_review_count || 0), 0)}
                </p>
                <p className="text-xs text-slate-500">Total Questions to Grade</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">—</p>
                <p className="text-xs text-emerald-600">Reviewed Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by student name or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Pending Reviews List */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Tests Requiring Manual Grading
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              These tests contain written responses (word problems, show your work) that need teacher review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {filteredAttempts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-500">No tests are currently pending manual review.</p>
              </div>
            ) : (
              filteredAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {attempt.profiles?.full_name || "Unknown Student"}
                      </span>
                      <Badge className={`text-xs ${getTierColor(attempt.tier)}`}>
                        {attempt.tier || "Pending"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">
                      {attempt.tests?.name || "Diagnostic Test"} • Grade {attempt.grade_level || "N/A"}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Completed: {formatDate(attempt.completed_at)}</span>
                      <span>Auto-graded: {attempt.correct_answers}/{attempt.total_questions}</span>
                      <span className="text-amber-600 font-medium">
                        {attempt.pending_review_count} questions to review
                      </span>
                    </div>
                    {attempt.profiles?.parent_email && (
                      <div className="text-xs text-slate-400 mt-1">
                        Parent: {attempt.profiles.parent_email}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/results/${attempt.id}`)}
                      className="text-xs"
                    >
                      View Results
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewTeacherCopy(attempt.id)}
                      className="text-xs"
                    >
                      <FileText className="mr-2 h-3 w-3" />
                      Teacher Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/admin/grade/${attempt.id}`)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Grade Now
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPendingReviews;
