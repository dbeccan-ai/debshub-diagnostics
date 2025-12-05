import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, Send } from "lucide-react";

interface PendingResponse {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean | null;
}

interface QuestionData {
  id: string;
  question: string;
  question_text?: string;
  type: string;
  correct_answer?: string;
  correctAnswer?: string;
  topic?: string;
  skill_tag?: string;
}

interface AttemptInfo {
  id: string;
  score: number | null;
  tier: string | null;
  grade_level: number | null;
  profiles: { full_name: string } | null;
  tests: { name: string; questions: any } | null;
}

const ManualGrading = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [pendingResponses, setPendingResponses] = useState<PendingResponse[]>([]);
  const [questions, setQuestions] = useState<Map<string, QuestionData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [stats, setStats] = useState({ correctCount: 0, totalGraded: 0, pendingCount: 0, score: 0, tier: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please sign in.");
          navigate("/auth");
          return;
        }

        // Check if user is admin or teacher
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "teacher"]);

        if (!roleData || roleData.length === 0) {
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);

        // Fetch attempt with test data - use admin query via RPC or service
        const { data: attemptData, error: attemptError } = await supabase
          .from("test_attempts")
          .select(`
            id,
            score,
            tier,
            grade_level,
            profiles:user_id (full_name),
            tests:test_id (name, questions)
          `)
          .eq("id", attemptId)
          .single();

        if (attemptError || !attemptData) {
          console.error("Attempt error:", attemptError);
          toast.error("Could not load test attempt.");
          navigate("/admin/pending-reviews");
          return;
        }

        setAttempt(attemptData as unknown as AttemptInfo);

        // Parse questions from test
        const testQuestions = attemptData.tests?.questions;
        const questionMap = new Map<string, QuestionData>();
        
        if (testQuestions) {
          const flattenQuestions = (data: any): QuestionData[] => {
            if (Array.isArray(data)) {
              if (data[0]?.sections) {
                return data.flatMap((item: any) =>
                  (item.sections || []).flatMap((section: any) =>
                    (section.questions || []).map((q: any) => ({ ...q, section: section.section_title }))
                  )
                );
              }
              if (data[0]?.questions) {
                return data.flatMap((section: any) =>
                  (section.questions || []).map((q: any) => ({ ...q, section: section.section_title }))
                );
              }
              return data;
            }
            if (data.sections) {
              return data.sections.flatMap((section: any) =>
                (section.questions || []).map((q: any) => ({ ...q, section: section.section_title }))
              );
            }
            return [];
          };

          const allQuestions = flattenQuestions(testQuestions);
          allQuestions.forEach((q: any) => {
            questionMap.set(q.id, q);
          });
        }

        setQuestions(questionMap);

        // Fetch responses needing manual review
        const { data: responses, error: respError } = await supabase
          .from("test_responses")
          .select("id, question_id, answer, is_correct")
          .eq("attempt_id", attemptId)
          .is("is_correct", null);

        if (respError) {
          console.error("Responses error:", respError);
        }

        setPendingResponses(responses || []);

        // Fetch all responses for stats
        const { data: allResp } = await supabase
          .from("test_responses")
          .select("is_correct")
          .eq("attempt_id", attemptId);

        if (allResp) {
          const graded = allResp.filter(r => r.is_correct !== null);
          const correct = graded.filter(r => r.is_correct === true).length;
          const score = graded.length > 0 ? (correct / graded.length) * 100 : 0;
          setStats({
            correctCount: correct,
            totalGraded: graded.length,
            pendingCount: allResp.length - graded.length,
            score: Math.round(score * 100) / 100,
            tier: score >= 80 ? 'Tier 1' : score >= 50 ? 'Tier 2' : 'Tier 3'
          });
        }

      } catch (err) {
        console.error("Load error:", err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      loadData();
    }
  }, [attemptId, navigate]);

  const handleGrade = async (responseId: string, isCorrect: boolean) => {
    setGradingId(responseId);
    try {
      const { data, error } = await supabase.functions.invoke("grade-manual-response", {
        body: { responseId, isCorrect, attemptId },
      });

      if (error) throw new Error(error.message);

      // Update local state
      setPendingResponses(prev => prev.filter(r => r.id !== responseId));
      setStats({
        correctCount: data.correctCount,
        totalGraded: data.totalGraded,
        pendingCount: data.pendingCount,
        score: data.score,
        tier: data.tier
      });

      toast.success(`Marked as ${isCorrect ? 'correct' : 'incorrect'}`);
    } catch (err) {
      console.error("Grading error:", err);
      toast.error("Failed to save grade.");
    } finally {
      setGradingId(null);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("finalize-grading", {
        body: { attemptId },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setStats({
        correctCount: data.skillAnalysis?.skillStats ? Object.values(data.skillAnalysis.skillStats as Record<string, {correct: number}>).reduce((sum, s) => sum + s.correct, 0) : stats.correctCount,
        totalGraded: stats.totalGraded,
        pendingCount: 0,
        score: data.score,
        tier: data.tier
      });

      if (data.emailSent) {
        toast.success("Grading finalized and results emailed to parent!");
      } else if (data.emailError) {
        toast.success("Grading finalized. Email failed: " + data.emailError);
      } else {
        toast.success("Grading finalized! No parent email configured.");
      }

      setTimeout(() => navigate("/admin/pending-reviews"), 2000);
    } catch (err: any) {
      console.error("Finalize error:", err);
      toast.error(err.message || "Failed to finalize grading.");
    } finally {
      setFinalizing(false);
    }
  };

  const getQuestionText = (questionId: string): string => {
    const q = questions.get(questionId);
    return q?.question || q?.question_text || "Question not found";
  };

  const getCorrectAnswer = (questionId: string): string => {
    const q = questions.get(questionId);
    return q?.correct_answer || q?.correctAnswer || "N/A";
  };

  const getSkillTag = (questionId: string): string => {
    const q = questions.get(questionId);
    return q?.topic || q?.skill_tag || "General";
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Tier 1": return "bg-emerald-100 text-emerald-800";
      case "Tier 2": return "bg-amber-100 text-amber-800";
      case "Tier 3": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-600">You need admin or teacher privileges.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/pending-reviews")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Manual Grading</h1>
              <p className="text-xs text-slate-500">
                {attempt?.profiles?.full_name} • {attempt?.tests?.name}
              </p>
            </div>
          </div>
          <Badge className={getTierColor(stats.tier)}>
            {stats.score.toFixed(1)}% • {stats.tier}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Stats Bar */}
        <div className="mb-6 grid gap-4 grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{stats.correctCount}</p>
              <p className="text-xs text-emerald-600">Correct</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{stats.totalGraded}</p>
              <p className="text-xs text-slate-500">Total Graded</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.pendingCount}</p>
              <p className="text-xs text-amber-600">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Questions to Grade */}
        {pendingResponses.length === 0 ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="py-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h2 className="text-lg font-semibold text-emerald-800">All Questions Graded!</h2>
              <p className="text-sm text-emerald-600 mb-6">
                Click "Finalize Grading" to recalculate skill analysis and send results to the parent.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/pending-reviews")}
                >
                  Return to Reviews
                </Button>
                <Button 
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {finalizing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Finalize Grading
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingResponses.map((response, index) => (
              <Card key={response.id} className="border-slate-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Question {index + 1} of {pendingResponses.length}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {getSkillTag(response.question_id)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Text */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500 mb-1">Question:</p>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap">
                      {getQuestionText(response.question_id)}
                    </p>
                  </div>

                  {/* Expected Answer */}
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <p className="text-sm font-medium text-emerald-700 mb-1">Expected Answer:</p>
                    <p className="text-sm text-emerald-900">
                      {getCorrectAnswer(response.question_id)}
                    </p>
                  </div>

                  {/* Student Answer */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Student's Answer:</p>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">
                      {response.answer || "(No answer provided)"}
                    </p>
                  </div>

                  {/* Grade Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleGrade(response.id, true)}
                      disabled={gradingId === response.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {gradingId === response.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Mark Correct
                    </Button>
                    <Button
                      onClick={() => handleGrade(response.id, false)}
                      disabled={gradingId === response.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      {gradingId === response.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Mark Incorrect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManualGrading;
