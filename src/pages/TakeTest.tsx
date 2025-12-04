import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getQuestionsByTestName, normalizeQuestions } from "@/lib/testQuestions";

const TakeTest = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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
          if (prev === 300 && !showTimeWarning) {
            setShowTimeWarning(true);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchTestAttempt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptError) {
        toast.error("Test not found");
        navigate("/dashboard");
        return;
      }

      // Check if test already completed
      if (attemptData.completed_at) {
        toast.info("This test has already been completed");
        navigate("/dashboard");
        return;
      }

      // Check if payment is required but not completed
      if (attemptData.payment_status === "pending") {
        toast.info("Please complete payment first");
        navigate(`/checkout/${attemptData.id}`);
        return;
      }

      setAttempt(attemptData);

      // Fetch questions securely via edge function (no correct answers exposed)
      const { data: testResponse, error: testError } = await supabase.functions.invoke(
        "get-test-questions",
        { body: { attemptId } }
      );

      if (testError || testResponse?.error) {
        const errorMsg = testResponse?.error || testError?.message || "Failed to load test";
        console.error("Test fetch error:", errorMsg);
        
        // Handle specific error cases
        if (testResponse?.error === "Payment required before accessing test") {
          toast.info("Please complete payment first");
          navigate(`/checkout/${attemptData.id}`);
          return;
        }
        
        toast.error(errorMsg);
        navigate("/dashboard");
        return;
      }

      let finalTestData = testResponse.test;
      const questionsArray = normalizeQuestions(finalTestData.questions);
      
      // If no questions from edge function, try loading from JSON file as fallback
      if (questionsArray.length === 0) {
        const jsonQuestions = getQuestionsByTestName(finalTestData.name);
        if (jsonQuestions) {
          finalTestData = { ...finalTestData, questions: jsonQuestions as any };
          console.log(`Loaded ${normalizeQuestions(jsonQuestions).length} questions from JSON for ${finalTestData.name}`);
        }
      }
      
      setTest(finalTestData);
      setTimeRemaining(finalTestData.duration_minutes * 60);
    } catch (error: any) {
      console.error("Error loading test:", error);
      toast.error("Failed to load test");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      toast.loading("Submitting and grading test...");

      // Submit answers to secure edge function for server-side grading
      const { data: gradeResult, error: gradeError } = await supabase.functions.invoke(
        "grade-test",
        { body: { attemptId, answers } }
      );

      if (gradeError || gradeResult?.error) {
        const errorMsg = gradeResult?.error || gradeError?.message || "Failed to grade test";
        console.error("Grade error:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("Grade result:", gradeResult);

      // For paid tests, generate certificate
      if (gradeResult.isPaid) {
        try {
          const certResponse = await supabase.functions.invoke("generate-certificate", {
            body: { attemptId },
          });

          if (certResponse.error) {
            console.error("Certificate generation error:", certResponse.error);
          }
        } catch (certError) {
          console.error("Certificate service unavailable:", certError);
        }
      }

      // Send email for ALL tests (paid and free) - non-blocking
      try {
        const emailResponse = await supabase.functions.invoke("send-test-results", {
          body: { attemptId },
        });

        if (emailResponse.error) {
          console.error("Email sending error:", emailResponse.error);
        }
      } catch (emailError) {
        console.error("Email service unavailable:", emailError);
      }
      
      toast.dismiss();
      toast.success(`Test submitted! Score: ${gradeResult.score}% (${gradeResult.tier})`);

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

  const getTimerColor = () => {
    if (timeRemaining < 300) return "bg-red-100 text-red-900";
    if (timeRemaining < 600) return "bg-orange-100 text-orange-900";
    return "bg-blue-100 text-blue-900";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
        <p className="text-lg text-[#1e3a8a]">Loading test...</p>
      </div>
    );
  }

  if (!test || !attempt) {
    return null;
  }

  // Use utility function to normalize questions
  const questions = normalizeQuestions(test.questions);
  
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
        <p className="text-lg text-[#1e3a8a]">No questions found for this test.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
        <p className="text-lg text-[#1e3a8a]">Loading question...</p>
      </div>
    );
  }
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-300 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a8a]">{test.name}</h1>
              <p className="text-sm text-[#1e3a8a]/60 mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getTimerColor()}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      {/* Time Warning Banner */}
      {showTimeWarning && timeRemaining < 300 && timeRemaining > 0 && (
        <Alert className="bg-yellow-50 border-yellow-300 mx-6 mt-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <AlertDescription className="text-yellow-800">
                Less than 5 minutes remaining. Your test will auto-submit when the timer ends.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimeWarning(false)}
              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Student Info */}
        <div className="text-sm text-[#1e3a8a]/60 mb-4">
          Student: {profile?.full_name} | Grade: {attempt?.grade_level || "N/A"} | Time limit: {test.duration_minutes} minutes
        </div>

        {/* Question Card */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-8">
            {/* Question Block */}
            <div className="bg-[#F7FAFF] rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-3">
                Question {currentQuestionIndex + 1}
              </h3>
              <p className="text-[#1e3a8a] text-base leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Area */}
            {currentQuestion.type === "multiple-choice" ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      answers[currentQuestion.id] === option
                        ? "bg-[#22c55e] border-[#22c55e] text-white"
                        : "bg-white border-gray-200 hover:border-blue-300 text-[#1e3a8a]"
                    }`}
                  >
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      className={answers[currentQuestion.id] === option ? "border-white" : ""}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-base font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : currentQuestion.type === "short" ? (
              <div className="space-y-2">
                <Label htmlFor="answer" className="text-base font-medium text-[#1e3a8a]">
                  Your answer:
                </Label>
                <Input
                  id="answer"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="answer" className="text-base font-medium text-[#1e3a8a]">
                  Show your work and provide your answer:
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="min-h-[150px] text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={6}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="border-gray-300 text-[#1e3a8a] hover:bg-gray-100"
          >
            Previous
          </Button>

          <div className="text-sm text-[#1e3a8a]/70">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>

          {isLastQuestion ? (
            <Button 
              onClick={handleSubmit} 
              className="bg-[#fb923c] hover:bg-[#f97316] text-white font-semibold"
            >
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold"
            >
              Next
            </Button>
          )}
        </div>

        {/* Unanswered Questions Warning */}
        {unansweredCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#1e3a8a]/60">
              You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}. 
              You can still continue and come back before submitting.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TakeTest;
