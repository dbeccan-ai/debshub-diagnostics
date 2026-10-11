import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OWNER_CONTEXT_ATTEMPTS, type StaffReportContext } from "../../supabase/functions/_shared/general-report-context";

import { toast } from "sonner";
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp, FileText, BookOpen, Share2, AlertTriangle } from "lucide-react";
import { DiagnosticEvidenceReport, EvidenceUnavailable, useDiagnosticReport } from "@/components/DiagnosticEvidenceReport";
import { formatReportDate, parentTierLabel } from "@/lib/diagnosticReport";
import { getTierFromScore, TIER_LABELS } from "@/lib/tierConfig";
import { RecommendedNextStepPanel, PlacementPathwayCard } from "@/components/TierComponents";

interface SkillStat {
  total: number;
  correct: number;
  percentage: number;
  questionIds: string[];
}

interface SkillAnalysis {
  mastered: string[];
  needsSupport: string[];
  developing: string[];
  skillStats: Record<string, SkillStat>;
}

interface TestAttempt {
  id: string;
  user_id: string;
  score: number | null;
  tier: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  completed_at: string | null;
  grade_level: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  skill_analysis: SkillAnalysis | null;
  follow_up_id: string | null;
  tests: {
    name: string;
    test_type: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

const Results = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gradeInput, setGradeInput] = useState("");
  const [ownerPlan, setOwnerPlan] = useState(false);
  const [reportContext, setReportContext] = useState<StaffReportContext | null>(null);
  const scopedContext = reportContext?.attemptId === attemptId ? reportContext : null;
  const { state: evidence, retry: retryEvidence } = useDiagnosticReport(attemptId, scopedContext);
  const [followUpInfo, setFollowUpInfo] = useState<{
    label: string;
    baselineScore: number | null;
    baselineDate: string | null;
  } | null>(null);

  const fetchResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view results");
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      const isAdmin = !!roleData;
      setIsAdmin(isAdmin);

      let query = supabase
        .from("test_attempts")
        .select(`
          id, user_id, score, tier, total_questions, correct_answers, completed_at,
          grade_level, strengths, weaknesses, skill_analysis, follow_up_id,
          tests:test_id (name, test_type),
          profiles:user_id (full_name)
        `)
        .eq("id", attemptId);
      
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      const loaded = data as unknown as TestAttempt;
      setAttempt(loaded);

      if (loaded.follow_up_id) {
        const { data: fu } = await supabase
          .from("follow_up_assessments")
          .select("checkpoint_label, source:source_attempt_id (score, completed_at)")
          .eq("id", loaded.follow_up_id)
          .maybeSingle();
        if (fu) {
          const src = fu.source as unknown as { score: number | null; completed_at: string | null } | null;
          setFollowUpInfo({
            label: fu.checkpoint_label as string,
            baselineScore: src?.score ?? null,
            baselineDate: src?.completed_at ?? null,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      toast.error("Could not load test results");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attemptId) fetchResults();
  }, [attemptId, navigate]);

  const handleDownload = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });
      const { data, error } = await supabase.functions.invoke("generate-result-download", {
        body: { attemptId, format: "pdf", reportContext: scopedContext },
      });
      if (error) throw new Error(error.message);
      const htmlContent = data?.html;
      if (!htmlContent) throw new Error("Could not generate result");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
      toast.success("Result opened! Use Print > Save as PDF to download.", { id: "pdf-download" });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download. Please try again.", { id: "pdf-download" });
    }
  };

  const handleTeacherCopy = async () => {
    try {
      toast.loading("Generating teacher copy...", { id: "teacher-copy" });
      const { data, error } = await supabase.functions.invoke("generate-teacher-copy", {
        body: { attemptId, reportContext: scopedContext },
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied! Share with a parent or guardian.");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading results…</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Results not found</p>
      </div>
    );
  }

  // The verified evidence model (shared with the parent PDF/teacher copy) replaces the stored counts, skill blocks and
  // interpretations. While it is loading, unavailable or requires verification, only the recorded score is shown,
  // clearly labelled, and no skill breakdown or tier interpretation is presented.
  const model = evidence.status === "ready" ? evidence.report : null;
  const verified = model && model.verification.state === "verified" ? model : null;
  const overallScore = verified?.score.pct ?? attempt.score ?? 0;
  const overallTier = getTierFromScore(overallScore);
  const tierCfg = TIER_LABELS[overallTier];
  const prioritySkills = verified ? verified.priority.map((s) => s.skill) : [];
  const developingSkills = verified ? verified.developing.map((s) => s.skill) : [];
  const isELA = verified ? verified.subject === "ela" : attempt.tests?.test_type === "ela";
  const scoreCaption = verified
    ? verified.score.basis
    : model
      ? "Recorded score — scoring details require verification"
      : evidence.status === "loading"
        ? "Recorded score — checking against saved answers…"
        : "Recorded score — not re-checked against saved answers";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="text-xs">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button size="sm" variant="outline" onClick={handleTeacherCopy} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <FileText className="mr-2 h-4 w-4" /> Teacher Copy
            </Button>
            <Button size="sm" onClick={handleDownload} className="bg-slate-900 text-white hover:bg-slate-800">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {isAdmin && <section className="mb-6 space-y-3 print:hidden" aria-label="Staff assessment context">
          <h2 className="font-semibold">Staff-confirmed enrolled grade</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div><Label htmlFor="confirmed-grade">Current enrolled grade (0 = Kindergarten)</Label><Input id="confirmed-grade" type="number" min={0} max={12} value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} className="w-48" /></div>
            <Button variant="outline" onClick={() => {
              const grade = Number(gradeInput);
              if (!gradeInput || !Number.isInteger(grade) || grade < 0 || grade > 12) { toast.error("Enter a grade from 0 to 12"); return; }
              setReportContext({ attemptId: attempt.id, studentId: attempt.user_id, enrolledGrade: grade, ownerConfirmedStartingPlan: ownerPlan });
            }}>Confirm report context</Button>
          </div>
          {OWNER_CONTEXT_ATTEMPTS.includes(attempt.id) && attempt.profiles?.full_name === "Tejani Thomas" && <div className="flex items-center gap-2"><Checkbox id="owner-plan" checked={ownerPlan} onCheckedChange={(v) => setOwnerPlan(v === true)} /><Label htmlFor="owner-plan">Use Dahalia Beccan’s confirmed Grade 6 / Grade 5 starting plan and individual attendance schedule</Label></div>}
          <p className="text-sm text-muted-foreground">Confirmation applies to this open report and its downloads only. After reopening, confirm again; shared links do not carry this context. The original assessment grade is unchanged.</p>
        </section>}
        {/* Score Overview */}
        <Card className="mb-6 border-slate-200">
          <CardHeader className="text-center pb-2">
            {verified ? (
              <div className="mb-2 flex flex-col items-center gap-2">
                <Badge className={`text-lg px-4 py-1 ${tierCfg.badgeClass}`}>{tierCfg.badge}</Badge>
                <p className="text-xs font-medium">{parentTierLabel(verified?.score.tier ?? null)}</p>
              </div>
            ) : (
              <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" /> Tier shown once the score is verified
              </div>
            )}
            <CardTitle className="text-3xl font-bold text-slate-900">
              {overallScore}%
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">{scoreCaption}</p>
            {verified?.coverage.state === "incomplete" && (
              <p className="mt-1 text-sm font-medium text-red-700">Required work incomplete — score reflects recorded scored items only.</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{attempt.profiles?.full_name}</p>
                <p className="text-xs text-slate-500">Student Name</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{attempt.tests?.name}</p>
                <p className="text-xs text-slate-500">Test Type</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              <div>
                <p className="text-lg font-semibold text-slate-700">Grade {attempt.grade_level}</p>
                <p className="text-xs text-slate-500">Assessed grade (test level)</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  {formatReportDate(attempt.completed_at)}
                </p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>

            {model?.assessmentContext && <section className="mt-4 space-y-2" aria-label="Assessment context">
              <h2 className="font-semibold">Assessment context</h2>
              <p>Current enrolled grade: {model.enrolledGrade === 0 ? "Kindergarten" : `Grade ${model.enrolledGrade}`}.<br />Diagnostic starting level: Grade {model.assessedGrade}.</p>
              {model.assessmentContext.explanation && <p>{model.assessmentContext.explanation}</p>}
              {!model.assessmentContext.explanation && <><p>{model.assessmentContext.coverage}</p><p>{model.assessmentContext.purpose}</p></>}
            </section>}
            {followUpInfo && followUpInfo.baselineScore !== null && (
              <div className="mt-4 rounded-lg border-2 border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-bold text-sky-900">
                  {followUpInfo.label} — Progress Comparison
                </p>
                <div className="mt-2 flex items-center justify-center gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-700">{followUpInfo.baselineScore}%</p>
                    <p className="text-xs text-slate-500">
                      Baseline
                      {followUpInfo.baselineDate
                        ? ` · ${formatReportDate(followUpInfo.baselineDate)}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-xl text-slate-400">→</span>
                  <div>
                    <p className="text-2xl font-bold text-sky-800">{overallScore}%</p>
                    <p className="text-xs text-slate-500">This follow-up</p>
                  </div>
                  <div
                    className={`rounded-md px-3 py-1 text-sm font-bold ${
                      overallScore - followUpInfo.baselineScore >= 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {overallScore - followUpInfo.baselineScore >= 0 ? "+" : ""}
                    {Math.round((overallScore - followUpInfo.baselineScore) * 10) / 10} pts
                  </div>
                </div>
              </div>
            )}

            {/* Insight box for overall score */}
            

            {/* Desktop CTA after score summary */}
            {verified && <div className="mt-4 print:hidden">
              <RecommendedNextStepPanel
                overallScore={overallScore}
                attemptId={attemptId}
                onNavigate={navigate}
                subject={isELA ? "ELA" : "Math"}
                studentName={attempt.profiles?.full_name || undefined}
                prioritySkills={prioritySkills}
                developingSkills={developingSkills}
              />
            </div>}
          </CardContent>
        </Card>

        {verified && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-700">{verified.counts.correct}</p>
                <p className="text-xs text-emerald-600">Fully correct{verified.counts.partial ? ` (+${verified.counts.partial} partial)` : ""}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-center">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{verified.counts.incorrect}</p>
                <p className="text-xs text-red-600">Incorrect (of {verified.counts.scored} scored)</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{verified.skills.filter((s) => s.scoredItems > 0).length}</p>
                <p className="text-xs text-amber-600">Skills with scored evidence</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Single source of skill evidence: the shared report model (replaces stored skill_analysis blocks). */}
        <div className="mb-6">
          {model ? <DiagnosticEvidenceReport report={model} /> : <EvidenceUnavailable state={evidence} onRetry={retryEvidence} />}
        </div>

        {/* Placement Pathway */}
        <div className="mb-6">
          {verified && <PlacementPathwayCard overallScore={overallScore} />}
        </div>

        {/* Generate Curriculum CTA */}
        {attemptId && (
          <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 mb-6 print:hidden">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="bg-sky-100 rounded-full p-3 flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-sky-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sky-900 text-base mb-1">
                    📚 AI-Generated {isELA ? "ELA" : "Math"} Curriculum
                  </h3>
                  <p className="text-sm text-sky-700 mb-3">
                    Get a personalized {verified?.score.tier === "Tier 3" ? "15-week" : "4-week"} learning plan and practice questions built around your child's specific{" "}
                    {prioritySkills.length > 0 ? (
                      <span>
                        priority areas:{" "}
                        <strong>{prioritySkills.slice(0, 3).join(", ")}{prioritySkills.length > 3 ? ` +${prioritySkills.length - 3} more` : ""}</strong>
                      </span>
                    ) : (
                      "performance data"
                    )}
                    .
                  </p>
                  <Button
                    className="bg-sky-700 hover:bg-sky-800 text-white"
                    onClick={() => navigate(`/curriculum/${attemptId}`)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate Personalized Curriculum
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Explanation & Next Steps */}
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
              {verified ? `Understanding Your ${tierCfg.badge} Placement` : "Placement"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            {verified ? (
              <div className={`p-4 rounded-lg border ${tierCfg.borderClass} ${tierCfg.bgClass}`}>
                <p className={`font-bold text-base ${tierCfg.textClass} mb-1`}>{parentTierLabel(verified?.score.tier ?? null)}</p>
                <p className={`text-sm ${tierCfg.textClass}`}>{verified.tierExplanation}</p>
              </div>
            ) : (
              <p className="text-sm">A placement explanation is shown once the score has been verified against the saved answers.</p>
            )}
            
            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="font-bold text-[#1C2D5A] mb-1 text-sm">D.E.Bs LEARNING ACADEMY LLC</p>
              <p className="text-xs italic text-slate-500 mb-1">Unlocking Brilliance Through Learning</p>
              <p className="text-xs text-slate-600">
                📧 <a href="mailto:info@debslearnacademy.com" className="text-blue-600 underline hover:text-blue-800">info@debslearnacademy.com</a>{" "}
                | 📞 <a href="tel:+13473641906" className="text-blue-600 underline hover:text-blue-800">347-364-1906</a>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">🌐 <a href="https://www.debslearnacademy.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">www.debslearnacademy.com</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA (mobile repeat) */}
        <div className="print:hidden sm:hidden mb-6">
          {verified && <RecommendedNextStepPanel
            overallScore={overallScore}
            attemptId={attemptId}
            onNavigate={navigate}
            subject={isELA ? "ELA" : "Math"}
            prioritySkills={prioritySkills}
            developingSkills={developingSkills}
          />}
        </div>
      </main>
    </div>
  );
};

export default Results;
