import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Trophy, BarChart3, CheckCircle2, XCircle, Calendar, User, Download, Mail, Loader2, Target, MessageSquare, Brain } from "lucide-react";
import { toast } from "sonner";
import { 
  getPassage, 
  interpretationGuide, 
  type Passage 
} from "@/data/reading-recovery-content";

interface QuestionResult {
  id: string;
  number: number;
  level: 'literal' | 'inferential' | 'analytical';
  text: string;
  correct: boolean;
  transcript?: { text?: string } | null;
}

interface ComprehensionSummary {
  literal: { correct: number; total: number };
  inferential: { correct: number; total: number };
  analytical: { correct: number; total: number };
  total: { correct: number; total: number };
}

interface DiagnosticResult {
  id: string;
  student_name: string;
  grade_band: string;
  version: string;
  passage_title: string;
  transcript: string | null;
  detected_errors: any;
  confirmed_errors: any;
  final_error_count: number | null;
  created_at: string;
  user_id: string;
}

const ReadingRecoveryResults = () => {
  const { transcriptId } = useParams<{ transcriptId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchResult = async () => {
      if (!transcriptId) {
        toast.error("Invalid result ID");
        navigate("/reading-recovery/dashboard");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to view results");
          navigate("/reading-recovery/auth?redirect=/reading-recovery/results/" + transcriptId);
          return;
        }

        // Check admin role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        const userIsAdmin = !!roleData;
        if (isMounted) setIsAdmin(userIsAdmin);

        // Admins can view any result; regular users only their own
        let query = supabase
          .from("reading_diagnostic_transcripts")
          .select("*")
          .eq("id", transcriptId);

        if (!userIsAdmin) {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query.single();

        if (error || !data) {
          toast.error("Result not found");
          navigate(userIsAdmin ? "/admin/reading-recovery-results" : "/reading-recovery/dashboard");
          return;
        }

        if (!isMounted) return;
        setResult(data as DiagnosticResult);

        // Load the passage for context
        const p = getPassage(data.grade_band, data.version as "A" | "B" | "C");
        setPassage(p || null);
      } catch (err) {
        console.error("Error fetching result:", err);
        toast.error("Failed to load result");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/reading-recovery/auth");
      }
    });

    fetchResult();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [transcriptId, navigate]);

  const calculateTier = (errorCount: number | null, confirmedErrors?: any) => {
    if (errorCount === null) return { tier: "Unknown", color: "bg-muted" };

    // Extract comprehension data if available
    const summary: ComprehensionSummary | null = confirmedErrors?.comprehensionSummary || null;
    const totalQ = summary?.total?.total ?? 0;
    const correctQ = summary?.total?.correct ?? 0;
    const comprehensionPct = totalQ > 0 ? (correctQ / totalQ) * 100 : null;

    // Tier based on BOTH fluency (errors) AND comprehension
    // A student must pass BOTH dimensions to reach Tier 1
    const fluencyTier = errorCount <= 3 ? 1 : errorCount <= 7 ? 2 : 3;
    const comprehensionTier = comprehensionPct === null ? 1
      : comprehensionPct >= 70 ? 1
      : comprehensionPct >= 50 ? 2
      : 3;

    // Use the WORSE of the two tiers (most support needed)
    const effectiveTier = Math.max(fluencyTier, comprehensionTier);

    if (effectiveTier === 1) return { tier: "Tier 1", color: "bg-emerald-500" };
    if (effectiveTier === 2) return { tier: "Tier 2", color: "bg-amber-500" };
    return { tier: "Tier 3", color: "bg-red-500" };
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case "Tier 1":
        return "Excellent mastery – Student demonstrates strong reading fluency and comprehension.";
      case "Tier 2":
        return "Good progress – Student shows understanding but needs targeted practice in specific areas.";
      case "Tier 3":
        return "Needs support – Student requires significant intervention and guided reading practice.";
      default:
        return "Unable to determine tier from available data.";
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateResultHTML = (res: DiagnosticResult, tierInfo: { tier: string; color: string }) => {
    const tierColors: Record<string, { border: string; bg: string; text: string }> = {
      "Tier 1": { border: "#22c55e", bg: "#dcfce7", text: "#166534" },
      "Tier 2": { border: "#eab308", bg: "#fef9c3", text: "#854d0e" },
      "Tier 3": { border: "#ef4444", bg: "#fee2e2", text: "#991b1b" },
    };
    const tc = tierColors[tierInfo.tier] || tierColors["Tier 3"];

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body { margin: 0; padding: 40px; font-family: Georgia, serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.cert { max-width: 800px; margin: 0 auto; background: white; padding: 60px; border: 15px solid ${tc.border}; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.header { text-align: center; margin-bottom: 40px; }
.logo { font-size: 36px; font-weight: bold; color: #667eea; }
.tagline { font-size: 14px; color: #666; font-style: italic; }
.title { text-align: center; font-size: 42px; color: ${tc.text}; margin: 30px 0; font-weight: bold; }
.name { text-align: center; font-size: 32px; font-weight: bold; color: #333; margin: 20px 0; }
.tier-badge { display: inline-block; background: ${tc.bg}; color: ${tc.text}; padding: 8px 20px; border-radius: 20px; font-weight: bold; border: 2px solid ${tc.border}; }
.section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 10px; }
.section-title { font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 20px; }
.footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid ${tc.border}; color: #666; }
</style></head><body>
<div class="cert">
  <div class="header"><div class="logo">D.E.Bs LEARNING ACADEMY</div><div class="tagline">Reading Recovery Programme</div></div>
  <div class="title">Reading Assessment Results</div>
  <div class="name">${res.student_name}</div>
  <p style="text-align:center;font-size:18px;margin:30px 0;">
    Passage: <strong>${res.passage_title}</strong> · Grade Band: <strong>${res.grade_band}</strong><br>
    Errors: <strong>${res.final_error_count ?? "N/A"}</strong> · Placement: <span class="tier-badge">${tierInfo.tier}</span>
  </p>
  <div class="section">
    <div class="section-title">📊 Tier Summary</div>
    <p>${getTierDescription(tierInfo.tier)}</p>
  </div>
  <div class="section">
    <div class="section-title">📚 Recommendations</div>
    <ul>
      ${tierInfo.tier === "Tier 1" ? "<li>Continue with grade-level reading materials</li><li>Introduce more challenging vocabulary</li><li>Encourage independent reading time</li>" : ""}
      ${tierInfo.tier === "Tier 2" ? "<li>Focus on identified weak areas</li><li>Use guided reading sessions (15-20 min daily)</li><li>Practice comprehension strategies</li>" : ""}
      ${tierInfo.tier === "Tier 3" ? "<li>Daily one-on-one reading sessions</li><li>Focus on phonics and decoding fundamentals</li><li>Use leveled readers below current grade</li><li>Consider professional reading intervention</li>" : ""}
    </ul>
  </div>
  <div class="footer">Assessed on ${formatDate(res.created_at)}</div>
</div></body></html>`;
  };

  const handleDownload = () => {
    if (!result) return;
    setDownloading(true);
    try {
      const { tier } = calculateTier(result.final_error_count, result.confirmed_errors);
      const html = generateResultHTML(result, { tier, color: "" });
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("Result opened! Use Print > Save as PDF to download.");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to generate download.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!result) return;
    setEmailing(true);
    try {
      // Get the student's parent email from their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("parent_email, full_name")
        .eq("id", result.user_id)
        .single();

      const parentEmail = profile?.parent_email;
      if (!parentEmail) {
        toast.error("No parent email found for this student.");
        setEmailing(false);
        return;
      }

      const { tier } = calculateTier(result.final_error_count, result.confirmed_errors);

      const { error } = await supabase.functions.invoke("send-reading-recovery-results", {
        body: {
          transcriptId: result.id,
          studentName: result.student_name,
          gradeBand: result.grade_band,
          passageTitle: result.passage_title,
          errorCount: result.final_error_count,
          tier,
          tierDescription: getTierDescription(tier),
          parentEmail,
          assessmentDate: formatDate(result.created_at),
        },
      });

      if (error) throw error;
      toast.success(`Results emailed to ${parentEmail}`);
    } catch (err) {
      console.error("Email error:", err);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-muted-foreground">Result not found</p>
      </div>
    );
  }

  const { tier, color } = calculateTier(result.final_error_count, result.confirmed_errors);

  const getVersionLabel = (version: string) => {
    if (version === "A") return "Pre-Test";
    if (version === "B") return "Mid-Test";
    if (version === "C") return "Post-Test";
    return version;
  };

  const getNextStepsForVersion = (version: string, tierLabel: string) => {
    if (version === "A") {
      return {
        title: "What Happens Next? — Pre-Test Complete",
        description: "This Pre-Test establishes a baseline for the student's reading ability. Based on these results, a personalized 21-day Reading Recovery curriculum will be generated.",
        steps: [
          "A personalized 21-day Reading Recovery curriculum has been created based on these results",
          "The student should complete the daily roadmap activities on the Reading Recovery Dashboard",
          "After 10 days of practice, the Mid-Test (Version B) will unlock automatically",
          "The Mid-Test will measure progress and adjust the curriculum as needed",
        ],
        highlight: tierLabel === "Tier 3" 
          ? "⚠️ This student needs intensive support. Please ensure daily one-on-one reading sessions are scheduled."
          : tierLabel === "Tier 2"
          ? "📚 This student is progressing but needs targeted practice in specific areas before the Mid-Test."
          : "🌟 Great start! Continue with enrichment activities to maintain this level.",
      };
    }
    if (version === "B") {
      return {
        title: "What Happens Next? — Mid-Test Complete",
        description: "This Mid-Test measures the student's progress after the first phase of the Reading Recovery programme. Results are compared against the Pre-Test baseline.",
        steps: [
          "Compare these results with the Pre-Test to identify areas of improvement",
          "Continue with the remaining roadmap activities on the Reading Recovery Dashboard",
          "After 10 more days of practice, the Post-Test (Version C) will unlock",
          "The Post-Test will provide the final assessment of the recovery programme",
        ],
        highlight: "📊 Compare with Pre-Test results to track the student's reading growth over the first 10 days.",
      };
    }
    return {
      title: "Programme Complete — Post-Test Results",
      description: "This Post-Test is the final assessment of the Reading Recovery programme. It measures the student's overall growth from the Pre-Test baseline through the full 21-day programme.",
      steps: [
        "Compare these results with both the Pre-Test and Mid-Test to see the full growth trajectory",
        "If the student is now Tier 1, the recovery programme is considered successful",
        "If additional support is needed, consider re-enrolling the student for another cycle",
        "Download and share this final report with parents and school administration",
      ],
      highlight: tierLabel === "Tier 1"
        ? "🎉 Congratulations! The student has achieved mastery. The Reading Recovery programme was successful!"
        : "📋 The programme is complete. Review the growth trajectory to determine if another cycle is recommended.",
    };
  };

  const versionLabel = getVersionLabel(result.version);
  const nextSteps = getNextStepsForVersion(result.version, tier);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(isAdmin ? "/admin/reading-recovery-results" : "/reading-recovery/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                DEB
              </div>
              <div>
                <span className="font-bold text-foreground">{versionLabel} Results</span>
                <p className="text-xs text-muted-foreground">{result.student_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Results Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Score Circle */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center`}>
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 text-xs">{versionLabel}</Badge>
                  <h2 className="text-2xl font-bold text-foreground">{result.student_name}</h2>
                  <Badge className={`${color} text-white text-lg px-4 py-1 mt-2`}>
                    {tier}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    Assessment Date
                  </div>
                  <div className="font-semibold mt-1">{formatDate(result.created_at)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BookOpen className="w-4 h-4" />
                    Grade Band
                  </div>
                  <div className="font-semibold mt-1">Grades {result.grade_band}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Errors
                  </div>
                  <div className="font-semibold mt-1">{result.final_error_count ?? "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Tier Summary</h3>
            <p className="text-muted-foreground">{getTierDescription(tier)}</p>
          </CardContent>
        </Card>

        {/* Download & Email Actions — Prominent */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Share & Download Results
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download this result as a PDF or send it directly to the parent's email address.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} disabled={downloading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download as PDF
              </Button>
              {isAdmin && (
                <Button onClick={handleSendEmail} disabled={emailing} variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                  {emailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Email Results to Parent
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Stage Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              {nextSteps.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-800">{nextSteps.description}</p>
            
            {/* Progress Timeline */}
            <div className="flex items-center gap-2 py-3">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${result.version === "A" ? "bg-primary text-primary-foreground" : "bg-emerald-100 text-emerald-700"}`}>
                <CheckCircle2 className="w-3 h-3" /> Pre-Test
              </div>
              <div className="h-0.5 w-8 bg-muted-foreground/30" />
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${result.version === "B" ? "bg-primary text-primary-foreground" : result.version === "C" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {result.version === "B" || result.version === "C" ? <CheckCircle2 className="w-3 h-3" /> : null} Mid-Test
              </div>
              <div className="h-0.5 w-8 bg-muted-foreground/30" />
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${result.version === "C" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {result.version === "C" ? <CheckCircle2 className="w-3 h-3" /> : null} Post-Test
              </div>
            </div>

            {/* Highlight message */}
            <div className="bg-white border border-blue-200 rounded-lg p-4 text-sm font-medium text-blue-900">
              {nextSteps.highlight}
            </div>

            {/* Steps */}
            <div>
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Next Steps:</h4>
              <ol className="space-y-2">
                {nextSteps.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-blue-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Passage Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Passage: {result.passage_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <Badge variant="outline">Grade Band: {result.grade_band}</Badge>
              <Badge variant="outline">Assessment: {versionLabel}</Badge>
              {passage && (
                <>
                  <Badge variant="outline">Word Count: {passage.metadata.wordCount}</Badge>
                  <Badge variant="outline">Lexile: {passage.metadata.lexile}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Why This Tier? */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Why This Tier?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fluency row */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Oral Reading Fluency</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Errors Found</div>
                  <div className="text-2xl font-bold text-foreground">{result.final_error_count ?? 0}</div>
                </div>
                <div className="text-center flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground mb-1">Fluency Rule</div>
                  <div className="text-sm font-medium">≤3 errors = Strong<br/>4–7 errors = Developing<br/>&gt;7 errors = Needs Support</div>
                </div>
                <div className={`border-2 rounded-lg p-3 text-center ${
                  (result.final_error_count ?? 99) <= 3 ? "border-emerald-300 bg-emerald-50" 
                  : (result.final_error_count ?? 99) <= 7 ? "border-amber-300 bg-amber-50" 
                  : "border-red-300 bg-red-50"}`}>
                  <div className="text-xs text-muted-foreground mb-1">Fluency Rating</div>
                  <div className="text-lg font-bold">
                    {(result.final_error_count ?? 99) <= 3 ? "✅ Strong" : (result.final_error_count ?? 99) <= 7 ? "⚠️ Developing" : "❌ Needs Support"}
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehension row */}
            {result.confirmed_errors?.comprehensionSummary && (() => {
              const summary = result.confirmed_errors.comprehensionSummary as ComprehensionSummary;
              const pct = summary.total.total > 0 ? Math.round((summary.total.correct / summary.total.total) * 100) : 0;
              return (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Reading Comprehension</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Questions Correct</div>
                      <div className="text-2xl font-bold text-foreground">{summary.total.correct}/{summary.total.total}</div>
                    </div>
                    <div className="text-center flex flex-col justify-center">
                      <div className="text-xs text-muted-foreground mb-1">Comprehension Rule</div>
                      <div className="text-sm font-medium">≥70% = Strong<br/>50–69% = Developing<br/>&lt;50% = Needs Support</div>
                    </div>
                    <div className={`border-2 rounded-lg p-3 text-center ${
                      pct >= 70 ? "border-emerald-300 bg-emerald-50"
                      : pct >= 50 ? "border-amber-300 bg-amber-50"
                      : "border-red-300 bg-red-50"}`}>
                      <div className="text-xs text-muted-foreground mb-1">Comprehension ({pct}%)</div>
                      <div className="text-lg font-bold">
                        {pct >= 70 ? "✅ Strong" : pct >= 50 ? "⚠️ Developing" : "❌ Needs Support"}
                      </div>
                    </div>
                  </div>
                  {/* Breakdown by level */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    {(['literal','inferential','analytical'] as const).map((level) => {
                      const lData = summary[level];
                      const lPct = lData.total > 0 ? Math.round((lData.correct / lData.total) * 100) : 0;
                      return (
                        <div key={level} className="border rounded-lg p-2">
                          <div className="text-xs text-muted-foreground capitalize mb-1">{level}</div>
                          <div className="font-semibold">{lData.correct}/{lData.total}</div>
                          <div className={`text-xs font-medium ${lPct >= 70 ? "text-emerald-600" : lPct >= 50 ? "text-amber-600" : "text-red-600"}`}>{lPct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Final Placement */}
            <div className={`border-2 rounded-lg p-4 text-center ${tier === "Tier 1" ? "border-emerald-300 bg-emerald-50" : tier === "Tier 2" ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50"}`}>
              <div className="text-sm text-muted-foreground mb-1">Overall Placement (worst of fluency + comprehension)</div>
              <div className="text-3xl font-bold">{tier}</div>
            </div>
          </CardContent>
        </Card>

        {/* Full Question & Answer Breakdown */}
        {result.confirmed_errors?.questionResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Comprehension Question Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(result.confirmed_errors.questionResults as QuestionResult[]).map((q) => (
                  <div key={q.id} className={`border rounded-lg p-4 ${q.correct ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase text-muted-foreground bg-muted rounded px-2 py-0.5">{q.level}</span>
                          <span className="text-xs text-muted-foreground">Q{q.number}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{q.text}</p>
                        {q.transcript?.text && (
                          <div className="mt-2 flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground italic">"{q.transcript.text}"</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {q.correct
                          ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          : <XCircle className="w-6 h-6 text-red-500" />
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>21-Day Recovery Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tier === "Tier 1" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">Enrichment Focus</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Continue with grade-level reading materials</li>
                    <li>• Introduce more challenging vocabulary</li>
                    <li>• Encourage independent reading time</li>
                    <li>• Explore different genres and text types</li>
                  </ul>
                </div>
              )}
              {tier === "Tier 2" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Targeted Practice</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Focus on identified weak areas</li>
                    <li>• Use guided reading sessions (15-20 min daily)</li>
                    <li>• Practice comprehension strategies</li>
                    <li>• Build vocabulary through context clues</li>
                  </ul>
                </div>
              )}
              {tier === "Tier 3" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Intensive Support</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Daily one-on-one reading sessions</li>
                    <li>• Focus on phonics and decoding fundamentals</li>
                    <li>• Use leveled readers below current grade</li>
                    <li>• Build sight word recognition</li>
                    <li>• Consider professional reading intervention</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => navigate(isAdmin ? "/admin/reading-recovery-results" : "/reading-recovery/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isAdmin ? "Back to Admin Results" : "Back to Dashboard"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/reading-recovery/diagnostic")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Start New Assessment
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReadingRecoveryResults;
