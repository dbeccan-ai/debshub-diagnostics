import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Trophy,
  Target,
  CheckCircle2,
  Circle,
  ArrowRight,
  LogOut,
  PlayCircle,
  BarChart3,
  Clock,
  User,
  Loader2,
} from "lucide-react";

interface Enrollment {
  id: string;
  student_name: string;
  parent_email: string;
  grade_level: number | null;
  enrolled_at: string;
}

interface DiagnosticResult {
  id: string;
  student_name: string;
  grade_band: string;
  passage_title: string;
  final_error_count: number | null;
  created_at: string;
}

interface ProgressItem {
  day_number: number;
  activity_title: string;
  completed_at: string | null;
}

const ReadingRecoveryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/reading-recovery/auth");
          return;
        }

        // Check enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from("reading_recovery_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (enrollmentError || !enrollmentData) {
          navigate("/reading-recovery/auth");
          return;
        }

        setEnrollment(enrollmentData);

        // Fetch diagnostics
        const { data: diagnosticData } = await supabase
          .from("reading_diagnostic_transcripts")
          .select("id, student_name, grade_band, passage_title, final_error_count, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (diagnosticData) {
          setDiagnostics(diagnosticData);
        }

        // Fetch progress
        const { data: progressData } = await supabase
          .from("reading_recovery_progress")
          .select("day_number, activity_title, completed_at")
          .eq("enrollment_id", enrollmentData.id)
          .order("day_number", { ascending: true });

        if (progressData) {
          setProgressItems(progressData);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/reading-recovery");
  };

  const getTierFromErrors = (errorCount: number | null) => {
    if (errorCount === null) return { tier: "Unknown", color: "bg-muted", textColor: "text-muted-foreground" };
    if (errorCount <= 3) return { tier: "Tier 1", color: "bg-emerald-500", textColor: "text-emerald-700" };
    if (errorCount <= 7) return { tier: "Tier 2", color: "bg-amber-500", textColor: "text-amber-700" };
    return { tier: "Tier 3", color: "bg-red-500", textColor: "text-red-700" };
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const completedDays = progressItems.filter(p => p.completed_at).length;
  const totalDays = 21;
  const progressPercent = Math.round((completedDays / totalDays) * 100);

  // Get the latest diagnostic result for tier
  const latestDiagnostic = diagnostics[0];
  const latestTier = latestDiagnostic ? getTierFromErrors(latestDiagnostic.final_error_count) : null;

  // Generate 21-day roadmap activities (sample activities based on tier)
  const get21DayRoadmap = () => {
    const activities = [
      { day: 1, title: "Initial Assessment Review", category: "Assessment" },
      { day: 2, title: "Phonics Warm-up Exercises", category: "Phonics" },
      { day: 3, title: "Sight Word Practice (Set 1)", category: "Vocabulary" },
      { day: 4, title: "Guided Reading Session 1", category: "Reading" },
      { day: 5, title: "Comprehension Strategy: Predicting", category: "Comprehension" },
      { day: 6, title: "Phonics: Blending Practice", category: "Phonics" },
      { day: 7, title: "Weekly Review & Reflection", category: "Review" },
      { day: 8, title: "Sight Word Practice (Set 2)", category: "Vocabulary" },
      { day: 9, title: "Fluency Building Exercise", category: "Fluency" },
      { day: 10, title: "Guided Reading Session 2", category: "Reading" },
      { day: 11, title: "Comprehension Strategy: Questioning", category: "Comprehension" },
      { day: 12, title: "Word Family Activities", category: "Phonics" },
      { day: 13, title: "Independent Reading Time", category: "Reading" },
      { day: 14, title: "Mid-Programme Check-in", category: "Assessment" },
      { day: 15, title: "Vocabulary Building Games", category: "Vocabulary" },
      { day: 16, title: "Fluency: Repeated Reading", category: "Fluency" },
      { day: 17, title: "Comprehension Strategy: Summarizing", category: "Comprehension" },
      { day: 18, title: "Guided Reading Session 3", category: "Reading" },
      { day: 19, title: "Writing Connection Activity", category: "Writing" },
      { day: 20, title: "Final Practice Session", category: "Review" },
      { day: 21, title: "Progress Assessment & Celebration", category: "Assessment" },
    ];
    return activities;
  };

  const roadmapActivities = get21DayRoadmap();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-sky-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/reading-recovery" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground">Reading Recovery</span>
              <p className="text-xs text-muted-foreground">Learning Hub</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-700 border-emerald-200"
              onClick={() => navigate("/reading-recovery/diagnostic")}
            >
              <PlayCircle className="mr-1 h-4 w-4" />
              New Assessment
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {enrollment?.student_name}!
          </h1>
          <p className="text-muted-foreground">
            Track your reading progress and continue your 21-day recovery journey.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                  <p className="text-xl font-bold">{latestTier?.tier || "Not assessed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessments</p>
                  <p className="text-xl font-bold">{diagnostics.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Completed</p>
                  <p className="text-xl font-bold">{completedDays} / 21</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Since</p>
                  <p className="text-xl font-bold">
                    {enrollment ? formatDate(enrollment.enrolled_at) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 21-Day Roadmap */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      21-Day Recovery Roadmap
                    </CardTitle>
                    <CardDescription>
                      Your personalized reading improvement journey
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-emerald-700">
                    {progressPercent}% Complete
                  </Badge>
                </div>
                <Progress value={progressPercent} className="mt-2" />
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <div className="space-y-3">
                  {roadmapActivities.map((activity) => {
                    const progress = progressItems.find(p => p.day_number === activity.day);
                    const isCompleted = progress?.completed_at;
                    const isCurrent = !isCompleted && activity.day === completedDays + 1;
                    
                    return (
                      <div
                        key={activity.day}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                          isCompleted
                            ? "bg-emerald-50 border-emerald-200"
                            : isCurrent
                            ? "bg-amber-50 border-amber-200"
                            : "bg-muted/30 border-muted"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{activity.day}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? "text-emerald-700" : isCurrent ? "text-amber-700" : "text-muted-foreground"}`}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.category}</p>
                        </div>
                        {isCurrent && (
                          <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                            Start
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Past Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Past Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostics.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      No assessments yet. Take your first diagnostic!
                    </p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => navigate("/reading-recovery/diagnostic")}
                    >
                      Start Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnostics.slice(0, 5).map((diagnostic) => {
                      const { tier, color } = getTierFromErrors(diagnostic.final_error_count);
                      return (
                        <div
                          key={diagnostic.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/reading-recovery/results/${diagnostic.id}`)}
                        >
                          <div>
                            <p className="font-medium text-sm">{diagnostic.passage_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(diagnostic.created_at)}
                            </p>
                          </div>
                          <Badge className={`${color} text-white`}>{tier}</Badge>
                        </div>
                      );
                    })}
                    {diagnostics.length > 5 && (
                      <Button
                        variant="link"
                        className="w-full text-sm"
                        onClick={() => {/* View all */}}
                      >
                        View all {diagnostics.length} assessments
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => navigate("/reading-recovery/diagnostic")}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Take New Assessment
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/reading-recovery")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Programme Info
                </Button>
                <Separator />
                <div className="text-xs text-muted-foreground text-center pt-2">
                  <p>Need help? Contact support</p>
                  <p className="font-medium">info@debslearnacademy.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReadingRecoveryDashboard;
