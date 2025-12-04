import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp } from "lucide-react";

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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to view results");
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("test_attempts")
          .select(`
            id,
            score,
            tier,
            total_questions,
            correct_answers,
            completed_at,
            grade_level,
            strengths,
            weaknesses,
            skill_analysis,
            tests:test_id (name, test_type),
            profiles:user_id (full_name)
          `)
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .single();

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

    if (attemptId) fetchResults();
  }, [attemptId, navigate]);

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

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "Tier 1": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Tier 2": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Tier 3": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getSkillColor = (percentage: number) => {
    if (percentage >= 70) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-slate-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Score Overview */}
        <Card className="mb-6 border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mb-2">
              <Badge className={`text-lg px-4 py-1 ${getTierColor(attempt.tier)}`}>
                {attempt.tier}
              </Badge>
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

        {/* Skills Analysis */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Skills Mastered */}
          <Card className="border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Skills Mastered (70%+)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skillAnalysis.mastered.length > 0 ? (
                <ul className="space-y-1">
                  {skillAnalysis.mastered.map((skill, idx) => (
                    <li key={idx} className="text-sm text-emerald-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No skills in this category</p>
              )}
            </CardContent>
          </Card>

          {/* Skills Needing Support */}
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Needs Additional Support (&lt;50%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skillAnalysis.needsSupport.length > 0 ? (
                <ul className="space-y-1">
                  {skillAnalysis.needsSupport.map((skill, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No skills in this category</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skills In Progress */}
        {skillAnalysis.developing.length > 0 && (
          <Card className="border-amber-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Skills In Progress (50-69%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {skillAnalysis.developing.map((skill, idx) => (
                  <li key={idx} className="text-sm text-amber-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    {skill}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Detailed Skill Breakdown */}
        {Object.keys(skillAnalysis.skillStats).length > 0 && (
          <Card className="border-slate-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Skill-by-Skill Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(skillAnalysis.skillStats).map(([skill, stats]) => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{skill}</span>
                    <span className="text-slate-500">
                      {stats.correct}/{stats.total} ({stats.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getSkillColor(stats.percentage)}`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tier Explanation & Next Steps */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Understanding Your {attempt.tier} Placement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            {attempt.tier === "Tier 1" && (
              <>
                <p>
                  <strong className="text-emerald-700">Congratulations!</strong> Your student has mastered 
                  the topics covered in this diagnostic test and is ready for advanced topics.
                </p>
                <p>
                  Continue challenging them with advanced materials and consider enrichment opportunities.
                </p>
              </>
            )}
            {attempt.tier === "Tier 2" && (
              <>
                <p>
                  Your student is performing at or near grade level and would benefit from targeted 
                  support in specific areas.
                </p>
                <p>
                  <strong className="text-amber-700">Recommended:</strong> Register for our 10-session 
                  support program. Your student will receive automatic diagnostic retries at sessions 
                  5 and 10 to track progress.
                </p>
              </>
            )}
            {attempt.tier === "Tier 3" && (
              <>
                <p>
                  Your student is currently performing below grade level and needs strong, consistent 
                  support to build foundational skills.
                </p>
                <p>
                  <strong className="text-red-700">Recommended:</strong> Register for our comprehensive 
                  15-session support program. Your student will receive automatic diagnostic retries at 
                  sessions 7, 10, and 15 to monitor growth.
                </p>
              </>
            )}
            
            <div className="border-t border-slate-100 pt-4 mt-4">
              <p className="text-xs text-slate-500">
                <strong>Contact D.E.Bs LEARNING ACADEMY</strong><br />
                📧 Email: info@debslearnacademy.com | 📞 Phone: 347-364-1906
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Results;