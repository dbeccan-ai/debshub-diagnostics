import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp, RefreshCw, FileText, BookOpen, Share2 } from "lucide-react";
import ELASectionReport from "@/components/ELASectionReport";
import { getTierFromScore, TIER_LABELS, TIER_THRESHOLDS } from "@/lib/tierConfig";
import {
  TierStatusBadge,
  SkillRow,
  RecommendedNextStepPanel,
  PlacementPathwayCard,
  TierClassificationBlocks,
  InsightBox,
} from "@/components/TierComponents";

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
  score: number | null;
  tier: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  completed_at: string | null;
  grade_level: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  skill_analysis: SkillAnalysis | null;
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
  const [regrading, setRegrading] = useState(false);

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

      let query = supabase
        .from("test_attempts")
        .select(`
          id, score, tier, total_questions, correct_answers, completed_at,
          grade_level, strengths, weaknesses, skill_analysis,
          tests:test_id (name, test_type),
          profiles:user_id (full_name)
        `)
        .eq("id", attemptId);
      
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      setAttempt(data as unknown as TestAttempt);
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

  const handleRegrade = async () => {
    if (!attemptId) return;
    setRegrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regrade-test", {
        body: { attemptId },
      });
      if (error) throw new Error(error.message);
      toast.success("Skill analysis updated!");
      await fetchResults();
    } catch (err) {
      console.error("Regrade error:", err);
      toast.error("Failed to refresh skill analysis");
    } finally {
      setRegrading(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });
      const { data, error } = await supabase.functions.invoke("generate-result-download", {
        body: { attemptId, format: "pdf" },
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

  const rawSkillAnalysis = attempt.skill_analysis as Partial<SkillAnalysis> | null;
  const skillAnalysis: SkillAnalysis = {
    mastered: rawSkillAnalysis?.mastered || attempt.strengths || [],
    needsSupport: rawSkillAnalysis?.needsSupport || attempt.weaknesses || [],
    developing: rawSkillAnalysis?.developing || [],
    skillStats: rawSkillAnalysis?.skillStats || {}
  };

  const incorrectAnswers = (attempt.total_questions || 0) - (attempt.correct_answers || 0);
  const overallScore = attempt.score || 0;
  const overallTier = getTierFromScore(overallScore);
  const tierCfg = TIER_LABELS[overallTier];
  
  const skillKeys = Object.keys(skillAnalysis.skillStats);
  const hasOnlyGenericSkills = skillKeys.length > 0 && 
    skillKeys.every(key => key.toLowerCase().includes('general'));
  
  const hasSkillData = (skillKeys.length > 0 && !hasOnlyGenericSkills) || 
                       skillAnalysis.mastered.length > 0 || 
                       skillAnalysis.needsSupport.length > 0 ||
                       skillAnalysis.developing.length > 0;
  
  const needsSkillRefresh = !hasSkillData || hasOnlyGenericSkills;
  const isELA = attempt.tests?.test_type === "ela" || attempt.tests?.name?.toLowerCase().includes("ela");

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
        {/* Score Overview */}
        <Card className="mb-6 border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mb-2 flex flex-col items-center gap-2">
              <Badge className={`text-lg px-4 py-1 ${tierCfg.badgeClass}`}>
                {tierCfg.badge}
              </Badge>
              <p className="text-xs font-medium">{tierCfg.label}</p>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {attempt.score}%
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {attempt.correct_answers} of {attempt.total_questions} questions correct
            </p>
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
                <p className="text-xs text-slate-500">Grade Level</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : "—"}
                </p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>

            {/* Insight box for overall score */}
            <InsightBox score={overallScore} />

            {/* Desktop CTA after score summary */}
            <div className="mt-4 print:hidden">
              <RecommendedNextStepPanel
                overallScore={overallScore}
                attemptId={attemptId}
                onNavigate={navigate}
                subject={attempt.tests?.test_type === "ela" ? "ELA" : "Math"}
                prioritySkills={skillAnalysis.needsSupport}
                developingSkills={skillAnalysis.developing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-700">{attempt.correct_answers}</p>
              <p className="text-xs text-emerald-600">Correct</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{incorrectAnswers}</p>
              <p className="text-xs text-red-600">Incorrect</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{Object.keys(skillAnalysis.skillStats).length}</p>
              <p className="text-xs text-amber-600">Skills Tested</p>
            </CardContent>
          </Card>
        </div>

        {/* ELA: show only the ELA section report; non-ELA: show generic skill blocks */}
        {isELA ? (
          hasSkillData ? (
            <div className="mb-6">
              <ELASectionReport
                skillStats={skillAnalysis.skillStats}
                mastered={skillAnalysis.mastered}
                needsSupport={skillAnalysis.needsSupport}
                developing={skillAnalysis.developing}
                tier={attempt.tier}
                studentName={attempt.profiles?.full_name || "Student"}
                gradLevel={attempt.grade_level}
                completedAt={attempt.completed_at}
                score={attempt.score}
                totalQuestions={attempt.total_questions}
                correctAnswers={attempt.correct_answers}
                testName={attempt.tests?.name || "ELA Diagnostic"}
              />
            </div>
          ) : (
            <Card className="border-slate-200 mb-6">
              <CardContent className="pt-6 text-center text-sm text-slate-500">
                <p>ELA skill breakdown is not yet available for this result.</p>
                <Button size="sm" variant="outline" onClick={handleRegrade} disabled={regrading} className="mt-3 text-xs">
                  <RefreshCw className={`mr-2 h-3 w-3 ${regrading ? 'animate-spin' : ''}`} />
                  {regrading ? 'Refreshing...' : 'Generate ELA Breakdown'}
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          <>
            {/* Math / Generic: Classification blocks with new tier labels */}
            <div className="mb-6 space-y-4">
              {hasSkillData && (
                <>
                  {/* Build section-like data from individual skills for classification */}
                  {(() => {
                    const skillSections = Object.entries(skillAnalysis.skillStats).map(([skill, stats]) => ({
                      section: skill,
                      correct: stats.correct,
                      total: stats.total,
                      percent: stats.percentage,
                    }));
                    return skillSections.length > 0 ? <TierClassificationBlocks sections={skillSections} /> : null;
                  })()}
                </>
              )}

                {!hasSkillData && (
                  <>
                    {/* Fallback to old mastered/needsSupport arrays with new labels */}
                    {skillAnalysis.needsSupport.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-semibold text-red-800 mb-1 text-sm">🔴 Priority Intervention Required</p>
                        <p className="text-xs text-red-600 mb-3">Without structured intervention now, these gaps compound each year — affecting confidence and performance well into secondary school.</p>
                        <ul className="space-y-1">
                          {skillAnalysis.needsSupport.map((skill, idx) => (
                            <li key={idx} className="text-sm text-red-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {skillAnalysis.developing.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="font-semibold text-amber-800 mb-1 text-sm">🟡 Strengthening Zone</p>
                        <p className="text-xs text-amber-600 mb-3">This is the critical window — skills here respond quickly to targeted practice before gaps solidify.</p>
                        <ul className="space-y-1">
                          {skillAnalysis.developing.map((skill, idx) => (
                            <li key={idx} className="text-sm text-amber-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {skillAnalysis.mastered.length > 0 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="font-semibold text-emerald-800 mb-1 text-sm">🟢 Demonstrated Mastery</p>
                        <p className="text-xs text-emerald-600 mb-3">Strong foundation — maintain with enrichment challenges so mastery stays ahead as content advances.</p>
                        <ul className="space-y-1">
                          {skillAnalysis.mastered.map((skill, idx) => (
                            <li key={idx} className="text-sm text-emerald-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
            </div>

            {/* Skill-by-skill with status pills and action recommendations */}
            {Object.keys(skillAnalysis.skillStats).length > 0 && (
              <Card className="border-slate-200 mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800">Skill-by-Skill Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(skillAnalysis.skillStats).map(([skill, stats]) => (
                    <SkillRow key={skill} skill={skill} correct={stats.correct} total={stats.total} percentage={stats.percentage} />
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Skills Assessed card - only for non-ELA tests */}
        {!isELA && (
          <Card className="border-slate-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                <span>Skills Assessed in This Diagnostic</span>
                {needsSkillRefresh && (
                  <Button size="sm" variant="outline" onClick={handleRegrade} disabled={regrading} className="text-xs">
                    <RefreshCw className={`mr-2 h-3 w-3 ${regrading ? 'animate-spin' : ''}`} />
                    {regrading ? 'Refreshing...' : 'Refresh Skills'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              {hasSkillData ? (
                <>
                  <p>
                    This diagnostic test assessed your student's understanding of the following {Object.keys(skillAnalysis.skillStats).length || (skillAnalysis.mastered.length + skillAnalysis.needsSupport.length + skillAnalysis.developing.length)} skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(skillAnalysis.skillStats).length > 0 ? (
                      Object.keys(skillAnalysis.skillStats).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      [...skillAnalysis.mastered, ...skillAnalysis.developing, ...skillAnalysis.needsSupport].map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                          {skill}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 italic">
                  Click "Refresh Skills" to generate detailed skill analysis for this test attempt.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Placement Pathway */}
        <div className="mb-6">
          <PlacementPathwayCard overallScore={overallScore} />
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
                    Get a personalized 4-week learning plan and practice questions built around your child's specific{" "}
                    {skillAnalysis.needsSupport.length > 0 ? (
                      <span>
                        priority areas:{" "}
                        <strong>{skillAnalysis.needsSupport.slice(0, 3).join(", ")}{skillAnalysis.needsSupport.length > 3 ? ` +${skillAnalysis.needsSupport.length - 3} more` : ""}</strong>
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
              Understanding Your {tierCfg.badge} Placement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className={`p-4 rounded-lg border ${tierCfg.borderClass} ${tierCfg.bgClass}`}>
              <p className={`font-bold text-base ${tierCfg.textClass} mb-1`}>{tierCfg.label}</p>
              <p className={`text-sm ${tierCfg.textClass}`}>{tierCfg.helper}</p>
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="font-bold text-[#1C2D5A] mb-1 text-sm">Contact D.E.Bs LEARNING ACADEMY</p>
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
          <RecommendedNextStepPanel
            overallScore={overallScore}
            attemptId={attemptId}
            onNavigate={navigate}
            subject={isELA ? "ELA" : "Math"}
            prioritySkills={skillAnalysis.needsSupport}
            developingSkills={skillAnalysis.developing}
          />
        </div>
      </main>
    </div>
  );
};

export default Results;
