import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Target, Users, Shield } from "lucide-react";

type Tier = "Tier 1" | "Tier 2" | "Tier 3";
type TestStatus = "In Progress" | "Completed" | "Payment Pending";

interface DashboardAttempt {
  id: string;
  test_id: string;
  grade_level: number | null;
  completed_at: string | null;
  created_at: string | null;
  payment_status: "pending" | "completed" | null;
  score: number | null;
  tier: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  certificate_url?: string | null;
  tests?: {
    id: string;
    name: string;
    duration_minutes?: number | null;
    is_paid?: boolean | null;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string>("there");
  const [attempts, setAttempts] = useState<DashboardAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        // 1) Make sure user is signed in
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(userError);
        }

        if (!user) {
          toast.error("Please sign in to view your dashboard.");
          navigate("/auth");
          return;
        }

        // 2) Get profile for greeting (full_name or fallback)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
        }

        const nameFromProfile = profileData?.full_name || user.email || "there";
        setProfileName(nameFromProfile);

        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);

        // 3) Load all this user's test attempts + linked test info
        const { data: attemptsData, error: attemptsError } = await supabase
          .from("test_attempts")
          .select(
            `
            id,
            test_id,
            grade_level,
            completed_at,
            created_at,
            payment_status,
            score,
            tier,
            total_questions,
            correct_answers,
            tests:test_id (
              id,
              name,
              duration_minutes,
              is_paid
            )
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (attemptsError) {
          console.error("Attempts error:", attemptsError);
          toast.error("Could not load your diagnostic history.");
          return;
        }

        // 4) Fetch certificate URLs for completed attempts
        const completedAttemptIds = (attemptsData || [])
          .filter((a: any) => a.completed_at)
          .map((a: any) => a.id);

        let certificateMap: Record<string, string> = {};
        if (completedAttemptIds.length > 0) {
          const { data: certsData } = await supabase
            .from("certificates")
            .select("attempt_id, certificate_url")
            .in("attempt_id", completedAttemptIds);

          if (certsData) {
            certificateMap = certsData.reduce((acc: Record<string, string>, cert) => {
              if (cert.certificate_url) {
                acc[cert.attempt_id] = cert.certificate_url;
              }
              return acc;
            }, {});
          }
        }

        // Merge certificate URLs into attempts
        const attemptsWithCerts = (attemptsData || []).map((a: any) => ({
          ...a,
          certificate_url: certificateMap[a.id] || null,
        }));

        setAttempts(attemptsWithCerts as DashboardAttempt[]);
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Something went wrong loading your dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const completedAttempts = attempts.filter((a) => a.completed_at);
  const inProgressAttempts = attempts.filter((a) => !a.completed_at && a.payment_status === "completed");
  const pendingPaymentAttempts = attempts.filter((a) => a.payment_status === "pending" && !a.completed_at);

  const getStatus = (attempt: DashboardAttempt): TestStatus => {
    if (attempt.completed_at) return "Completed";
    if (attempt.payment_status === "pending") return "Payment Pending";
    return "In Progress";
  };

  const statusBadgeColor = (status: TestStatus) => {
    switch (status) {
      case "Completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
      case "In Progress":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "Payment Pending":
        return "border-sky-200 bg-sky-50 text-sky-800";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  const handlePrimaryAction = (attempt: DashboardAttempt) => {
    const status = getStatus(attempt);

    if (status === "Payment Pending") {
      navigate(`/checkout/${attempt.id}`);
      return;
    }

    if (status === "In Progress") {
      navigate(`/test/${attempt.id}`);
      return;
    }

    if (status === "Completed") {
      navigate(`/results/${attempt.id}`);
    }
  };

  const handleDownload = async (attempt: DashboardAttempt) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });

      const { data, error } = await supabase.functions.invoke("generate-result-download", {
        body: { attemptId: attempt.id, format: "pdf" },
      });

      if (error) throw new Error(error.message);

      // Use the HTML content directly from the response
      const htmlContent = data?.html;
      if (!htmlContent) throw new Error("Could not generate result");

      // Open HTML content directly in a new window using a data URL
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success("Result opened! Use Print > Save as PDF to download.", { id: "pdf-download" });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download. Please try again.", { id: "pdf-download" });
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatScore = (attempt: DashboardAttempt) => {
    if (attempt.score == null) return "—";
    return `${attempt.score}%`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading your diagnostic dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 text-xs font-bold text-slate-900">
              DEB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">D.E.Bs LEARNING ACADEMY</div>
              <div className="text-[11px] text-slate-500">DEBs Diagnostic Hub</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                onClick={() => navigate("/admin/pending-reviews")}
              >
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-xs font-semibold text-slate-700"
              onClick={() => navigate("/tests")}
            >
              New diagnostic
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Greeting + quick actions */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back, {profileName}.</h1>
            <p className="mt-1 text-sm text-slate-500">
              This is your diagnostic home base — see tests in progress, completed results, and what each tier means.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
              onClick={() => navigate("/tests")}
            >
              Start a new test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 text-xs font-semibold text-slate-700"
              onClick={() => navigate("/")}
            >
              Back to info page
            </Button>
          </div>
        </div>

        {/* Top stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-medium text-slate-800">Diagnostics completed</CardTitle>
                <CardDescription className="text-[11px]">
                  Finished tests with full reports and tier placement.
                </CardDescription>
              </div>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{completedAttempts.length}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-medium text-slate-800">Tests in progress</CardTitle>
                <CardDescription className="text-[11px]">
                  You can pause and resume within the test windows.
                </CardDescription>
              </div>
              <Target className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{inProgressAttempts.length}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-medium text-slate-800">Students / account</CardTitle>
                <CardDescription className="text-[11px]">
                  Right now this dashboard shows all attempts under your login.
                </CardDescription>
              </div>
              <Users className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {attempts.length > 0 ? 1 : 0}
                <span className="ml-1 text-xs font-normal text-slate-400">profile</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main layout: My tests + Tiers explainer */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* My tests */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">My diagnostic tests</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  These are the tests associated with your account — finished, in-progress, or waiting on payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                {attempts.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                    You don’t have any diagnostic attempts yet. Start with a Math, ELA, or Observation test to see your
                    results here.
                  </div>
                )}

                {attempts.map((attempt) => {
                  const test = attempt.tests;
                  const status = getStatus(attempt);
                  const tierLabel = attempt.tier as Tier | null;

                  return (
                    <div
                      key={attempt.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{test?.name || "Diagnostic Test"}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {attempt.grade_level ? `Grade ${attempt.grade_level} · ` : ""}
                          {tierLabel && (
                            <span
                              className={`ml-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${
                                tierLabel === "Tier 1"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : tierLabel === "Tier 2"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : "border-red-200 bg-red-50 text-red-800"
                              }`}
                            >
                              {tierLabel}
                            </span>
                          )}
                          {attempt.score != null && (
                            <span className="ml-2 font-medium text-slate-700">Score: {formatScore(attempt)}</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {attempt.completed_at
                            ? `Completed · ${formatDate(attempt.completed_at)}`
                            : `Started · ${formatDate(attempt.created_at)}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <Badge
                          variant="outline"
                          className={`border px-2 py-0.5 text-[11px] ${statusBadgeColor(status)}`}
                        >
                          {status}
                        </Badge>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className={`h-7 px-3 text-[11px] ${
                              status === "In Progress"
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : status === "Payment Pending"
                                  ? "bg-sky-500 text-white hover:bg-sky-600"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                            onClick={() => handlePrimaryAction(attempt)}
                          >
                            {status === "In Progress"
                              ? "Resume test"
                              : status === "Payment Pending"
                                ? "Complete payment"
                                : "View summary"}
                          </Button>

                          {status === "Completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
                              onClick={() => handleDownload(attempt)}
                            >
                              Download result
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Tiers explainer */}
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">What your tiers actually mean</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Every diagnostic attempt ends with a Tier, so you know how much support is really needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-[11px]">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-emerald-800">Tier 1 · Minimal Support</span>
                    <span className="text-emerald-700">4-Week Pod</span>
                  </div>
                  <p className="text-emerald-900/80">
                    Small, fixable gaps. Short pod, lighter practice, and a mastery check before exit.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-amber-800">Tier 2 · Some Struggle</span>
                    <span className="text-amber-700">10-Week Pod</span>
                  </div>
                  <p className="text-amber-900/80">
                    Noticeable gaps. Longer pod, deeper practice, and a mid-pod mock diagnostic to check progress.
                  </p>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-red-800">Tier 3 · Needs a Lot</span>
                    <span className="text-red-700">15-Week Pod</span>
                  </div>
                  <p className="text-red-900/80">
                    Significant gaps. Intensive pod, weekly 1:1 check-ins, and monthly full diagnostics before exit.
                  </p>
                </div>

                <p className="pt-1 text-[11px] text-slate-500">
                  When you’re ready, these pod tiers plug directly into your DEBs programs — but the dashboard itself
                  always stays focused on clear diagnostic data first.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
