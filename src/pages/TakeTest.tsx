import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TakeTest = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestAttempt();
  }, [attemptId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchTestAttempt = async () => {
    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("*")
        .eq("id", attemptData.test_id)
        .single();

      if (testError) throw testError;

      setAttempt(attemptData);
      setTest(testData);
      setTimeRemaining(testData.duration_minutes * 60);
    } catch (error: any) {
      toast.error("Failed to load test");
      navigate("/tests");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      toast.loading("Submitting test...");

      const questions = test.questions as any[];
      
      // Save all responses and calculate score
      const responses = Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find((q) => q.id === questionId);
        const isCorrect = question?.type === "multiple-choice" 
          ? answer === question.correct_answer 
          : null;
        
        return {
          attempt_id: attemptId,
          question_id: questionId,
          answer,
          is_correct: isCorrect,
        };
      });

      const { error } = await supabase.from("test_responses").insert(responses);
      if (error) throw error;

      // Calculate score for auto-graded questions
      const autoGradedResponses = responses.filter((r) => r.is_correct !== null);
      const correctCount = autoGradedResponses.filter((r) => r.is_correct).length;
      const scorePercent = autoGradedResponses.length > 0 
        ? Math.round((correctCount / autoGradedResponses.length) * 100) 
        : 0;

      // Determine tier
      let tier = "Tier 3";
      if (scorePercent >= 80) tier = "Tier 1";
      else if (scorePercent >= 50) tier = "Tier 2";

      // Analyze strengths and weaknesses based on question topics
      const topicPerformance: Record<string, { correct: number; total: number }> = {};
      
      responses.forEach((response) => {
        const question = questions.find((q) => q.id === response.question_id);
        if (question?.topic && response.is_correct !== null) {
          if (!topicPerformance[question.topic]) {
            topicPerformance[question.topic] = { correct: 0, total: 0 };
          }
          topicPerformance[question.topic].total++;
          if (response.is_correct) {
            topicPerformance[question.topic].correct++;
          }
        }
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      Object.entries(topicPerformance).forEach(([topic, perf]) => {
        const topicScore = (perf.correct / perf.total) * 100;
        if (topicScore >= 70) {
          strengths.push(topic);
        } else if (topicScore < 50) {
          weaknesses.push(topic);
        }
      });

      // Update attempt with results
      const { error: updateError } = await supabase
        .from("test_attempts")
        .update({
          completed_at: new Date().toISOString(),
          score: scorePercent,
          tier,
          total_questions: autoGradedResponses.length,
          correct_answers: correctCount,
          strengths,
          weaknesses,
        })
        .eq("id", attemptId);

      if (updateError) throw updateError;

      // For paid tests, generate certificate and send email
      if (test.is_paid) {
        // Generate certificate
        const certResponse = await supabase.functions.invoke("generate-certificate", {
          body: { attemptId },
        });

        if (certResponse.error) {
          console.error("Certificate generation error:", certResponse.error);
        }

        // Send email with results immediately
        const emailResponse = await supabase.functions.invoke("send-test-results", {
          body: { attemptId },
        });

        if (emailResponse.error) {
          console.error("Email sending error:", emailResponse.error);
          toast.success("Test submitted! Certificate generated.");
        } else {
          toast.success("Test submitted! Certificate and results emailed to your parent.");
        }
      } else {
        toast.success("Test submitted successfully!");
      }

      navigate("/dashboard");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to submit test");
      console.error("Submit error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <p className="text-lg text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  if (!test || !attempt) {
    return null;
  }

  const questions = test.questions as any[];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{test.name}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <Badge variant="destructive" className="flex items-center gap-2 text-lg px-4 py-2">
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">
                  {currentQuestion.section}
                </Badge>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {currentQuestion.type === "multiple-choice" ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                className="space-y-4"
              >
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-base"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="answer" className="text-base font-medium">
                  Show your work and provide your answer:
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="min-h-[200px] text-base resize-none"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {questions.length} answered
          </div>

          {isLastQuestion ? (
            <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700">
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TakeTest;
