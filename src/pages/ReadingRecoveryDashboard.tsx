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
  ArrowRight,
  LogOut,
  PlayCircle,
  BarChart3,
  Loader2,
  BookMarked,
  Languages,
  Lightbulb,
  Eye,
  PenTool,
  RefreshCw,
  Star,
  Award,
  FileText,
} from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

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
  version: string;
  final_error_count: number | null;
  created_at: string;
}

interface ProgressItem {
  day_number: number;
  activity_title: string;
  completed_at: string | null;
}

// Activity categories with icons and colors
const categoryConfig: Record<string, { icon: typeof BookOpen; color: string; bgColor: string }> = {
  "Assessment": { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100" },
  "Phonics": { icon: Languages, color: "text-purple-600", bgColor: "bg-purple-100" },
  "Vocabulary": { icon: BookMarked, color: "text-green-600", bgColor: "bg-green-100" },
  "Reading": { icon: BookOpen, color: "text-orange-600", bgColor: "bg-orange-100" },
  "Comprehension": { icon: Lightbulb, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  "Fluency": { icon: TrendingUp, color: "text-pink-600", bgColor: "bg-pink-100" },
  "Review": { icon: RefreshCw, color: "text-slate-600", bgColor: "bg-slate-100" },
  "Writing": { icon: PenTool, color: "text-teal-600", bgColor: "bg-teal-100" },
};

// 21-Day Reading Recovery Roadmap based on the source document
const get21DayRoadmap = () => {
  return [
    // Week 1: Foundation Building
    { day: 1, title: "Pre-Assessment Diagnostic (Version A)", category: "Assessment", description: "Initial reading level assessment using grade-appropriate passage" },
    { day: 2, title: "Phonics Warm-up: Letter Sounds Review", category: "Phonics", description: "Review consonant and vowel sounds, blend practice" },
    { day: 3, title: "Sight Word Practice (Set 1)", category: "Vocabulary", description: "High-frequency words recognition and practice" },
    { day: 4, title: "Guided Reading Session 1", category: "Reading", description: "Supported oral reading with teacher feedback" },
    { day: 5, title: "Comprehension Strategy: Making Predictions", category: "Comprehension", description: "Using text clues to predict what happens next" },
    { day: 6, title: "Phonics: Blending & Segmenting Practice", category: "Phonics", description: "CVC words, digraphs, and blend patterns" },
    { day: 7, title: "Week 1 Review & Reflection", category: "Review", description: "Review progress, celebrate achievements, set Week 2 goals" },
    
    // Week 2: Building Skills
    { day: 8, title: "Sight Word Practice (Set 2)", category: "Vocabulary", description: "Next set of high-frequency words" },
    { day: 9, title: "Fluency Building: Repeated Reading", category: "Fluency", description: "Practice reading same passage for speed and accuracy" },
    { day: 10, title: "Mid-Point Assessment (Version B)", category: "Assessment", description: "Check progress with alternate passage" },
    { day: 11, title: "Comprehension Strategy: Asking Questions", category: "Comprehension", description: "Generate questions while reading (who, what, where, why)" },
    { day: 12, title: "Word Family Activities", category: "Phonics", description: "Word patterns and rhyming word families" },
    { day: 13, title: "Independent Reading Practice", category: "Reading", description: "Self-selected reading at appropriate level" },
    { day: 14, title: "Week 2 Review & Celebration", category: "Review", description: "Celebrate mid-point progress, recognize improvements" },
    
    // Week 3: Consolidation & Mastery
    { day: 15, title: "Vocabulary Building Games", category: "Vocabulary", description: "Interactive vocabulary activities and word games" },
    { day: 16, title: "Fluency: Expression & Phrasing", category: "Fluency", description: "Reading with appropriate expression and pauses" },
    { day: 17, title: "Comprehension Strategy: Summarizing", category: "Comprehension", description: "Identifying main ideas and retelling" },
    { day: 18, title: "Guided Reading Session 3", category: "Reading", description: "Advanced passage with comprehension focus" },
    { day: 19, title: "Writing Connection Activity", category: "Writing", description: "Connect reading to writing through response" },
    { day: 20, title: "Final Practice & Preparation", category: "Review", description: "Prepare for post-assessment, review strategies" },
    { day: 21, title: "Post-Assessment (Version C) & Celebration", category: "Assessment", description: "Final assessment and progress celebration" },
  ];
};

// Celebration milestones from the document
const celebrationMilestones = [
  { id: "decoding", label: "Decoding Milestone", description: "Reduced reading errors by 50% or more", icon: Target },
  { id: "literal", label: "Literal Comprehension", description: "Achieved 80%+ on literal questions", icon: Eye },
  { id: "inferential", label: "Inferential Comprehension", description: "Achieved 70%+ on inferential questions", icon: Lightbulb },
  { id: "analytical", label: "Analytical Comprehension", description: "Achieved 70%+ on analytical questions", icon: Star },
  { id: "overall", label: "Overall Comprehension", description: "Achieved 75%+ on total comprehension", icon: Award },
  { id: "confidence", label: "Reading Confidence", description: "Student voluntarily reads for pleasure", icon: BookOpen },
];

const ReadingRecoveryDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const rr = t.readingRecovery;
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
          .select("id, student_name, grade_band, passage_title, version, final_error_count, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (diagnosticData) {
          setDiagnostics(diagnosticData as DiagnosticResult[]);
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
    if (errorCount === null) return { tier: rr.notAssessed, color: "bg-muted", textColor: "text-muted-foreground" };
    if (errorCount <= 3) return { tier: rr.tier1, color: "bg-emerald-500", textColor: "text-emerald-700", label: rr.tier1Label };
    if (errorCount <= 7) return { tier: rr.tier2, color: "bg-amber-500", textColor: "text-amber-700", label: rr.tier2Label };
    return { tier: rr.tier3, color: "bg-red-500", textColor: "text-red-700", label: rr.tier3Label };
    return { tier: rr.tier3, color: "bg-red-500", textColor: "text-red-700", label: rr.tier3Label };
  };

  const getVersionLabel = (version: string) => {
    switch (version) {
      case 'A': return rr.preAssessment;
      case 'B': return rr.midPoint;
      case 'C': return rr.postAssessment;
      default: return version;
    }
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

  const roadmapActivities = get21DayRoadmap();

  // Determine which week we're in
  const currentWeek = Math.ceil((completedDays + 1) / 7);

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
              <span className="font-bold text-foreground">{rr.programmeTitle}</span>
              <p className="text-xs text-muted-foreground">{rr.learningHub}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-700 border-emerald-200"
              onClick={() => navigate("/reading-recovery/diagnostic")}
            >
              <PlayCircle className="mr-1 h-4 w-4" />
              {rr.newAssessment}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" />
              {rr.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {rr.welcomeBack}, {enrollment?.student_name}!
          </h1>
          <p className="text-muted-foreground">
            {rr.trackProgress}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${latestTier?.color || 'bg-muted'}`}>
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{rr.currentTier}</p>
                  <p className="text-xl font-bold">{latestTier?.tier || rr.notAssessed}</p>
                  {latestTier?.label && (
                    <p className={`text-xs ${latestTier.textColor}`}>{latestTier.label}</p>
                  )}
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
                  <p className="text-sm text-muted-foreground">{rr.assessments}</p>
                  <p className="text-xl font-bold">{diagnostics.length} / 3</p>
                  <p className="text-xs text-muted-foreground">{rr.prePostMid}</p>
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
                  <p className="text-sm text-muted-foreground">{rr.daysCompleted}</p>
                  <p className="text-xl font-bold">{completedDays} / 21</p>
                  <p className="text-xs text-muted-foreground">{rr.week} {currentWeek}</p>
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
                  <p className="text-sm text-muted-foreground">{rr.enrolledSince}</p>
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
                      {rr.recoveryBlueprint}
                    </CardTitle>
                    <CardDescription>
                      {rr.blueprintDesc}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    {progressPercent}% {rr.complete}
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
                    const categoryStyle = categoryConfig[activity.category] || categoryConfig["Review"];
                    const IconComponent = categoryStyle.icon;
                    
                    return (
                      <div
                        key={activity.day}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                          isCompleted
                            ? "bg-emerald-50 border-emerald-200"
                            : isCurrent
                            ? "bg-amber-50 border-amber-300 shadow-sm"
                            : "bg-muted/30 border-muted"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-amber-500 text-white"
                            : categoryStyle.bgColor + " " + categoryStyle.color
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{activity.day}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold ${
                              isCompleted ? "text-emerald-700" : isCurrent ? "text-amber-700" : "text-foreground"
                            }`}>
                              {activity.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={`text-xs ${categoryStyle.bgColor} ${categoryStyle.color} border-0`}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {activity.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        {isCurrent && (
                          <Button 
                            size="sm" 
                            className="bg-amber-500 hover:bg-amber-600 flex-shrink-0"
                            onClick={() => {
                              // For assessment days, go to diagnostic
                              if (activity.category === "Assessment") {
                                navigate("/reading-recovery/diagnostic");
                              } else {
                                toast.info("Activity content coming soon!");
                              }
                            }}
                          >
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
            {/* Assessment Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {rr.assessmentTracker}
                </CardTitle>
                <CardDescription>
                  {rr.assessmentTrackerDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diagnostics.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      {rr.noPastResults}
                    </p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => navigate("/reading-recovery/diagnostic")}
                    >
                      {rr.startAssessment}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnostics.slice(0, 5).map((diagnostic) => {
                      const tierInfo = getTierFromErrors(diagnostic.final_error_count);
                      return (
                        <div
                          key={diagnostic.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/reading-recovery/results/${diagnostic.id}`)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{diagnostic.passage_title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getVersionLabel(diagnostic.version)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(diagnostic.created_at)}
                              </span>
                            </div>
                          </div>
                          <Badge className={`${tierInfo.color} text-white`}>
                            {tierInfo.tier}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Celebration Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  {rr.celebrationMilestones}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {celebrationMilestones.slice(0, 4).map((milestone) => {
                    const MilestoneIcon = milestone.icon;
                    // TODO: Calculate actual milestone achievement
                    const isAchieved = false;
                    
                    return (
                      <div
                        key={milestone.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          isAchieved ? "bg-amber-50 border border-amber-200" : "bg-muted/30"
                        }`}
                      >
                        <div className={`p-1.5 rounded-full ${
                          isAchieved ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          <MilestoneIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isAchieved ? "text-amber-700" : "text-muted-foreground"}`}>
                            {milestone.label}
                          </p>
                        </div>
                        {isAchieved && (
                          <CheckCircle2 className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
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
