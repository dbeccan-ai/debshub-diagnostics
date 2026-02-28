import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, AlertCircle, X, Lightbulb, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getQuestionsByTestName, normalizeQuestions } from "@/lib/testQuestions";
import reinforcementData from "@/data/reinforcement-questions.json";
import { useTabVisibility } from "@/hooks/use-tab-visibility";
import { TestSecurityWarning } from "@/components/TestSecurityWarning";
import { PreTestSecurityCheck } from "@/components/PreTestSecurityCheck";
import { useLanguage, languageOptions } from "@/contexts/LanguageContext";
import QuestionVisual from "@/components/QuestionVisual";
import DEBsHeader from "@/components/DEBsHeader";
import DiagnosticLanding from "@/components/DiagnosticLanding";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { 
  getGrade2DiagramByVisual, 
  getPictureHelperForQuestion, 
  getDrawAreaForQuestion 
} from "@/components/diagrams/Grade2Diagrams";
import { getGrade3DiagramByVisual } from "@/components/diagrams/Grade3Diagrams";
import { getELAVisualForQuestion } from "@/components/diagrams/Grade1ELADiagrams";
import { getGrade4ELAVisualForQuestion } from "@/components/diagrams/Grade4ELADiagrams";

interface SkillPerformance {
  correct: number;
  incorrect: number;
  adaptiveAdded: number;
}

const MAX_ADAPTIVE_PER_SKILL = 3;

const TakeTest = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const { language, languageLabel } = useLanguage();
  const { isPaused } = useAccountStatus();
  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLanguage, setTranslatedLanguage] = useState<string>("en");
  
  // Tab visibility security
  const { isTestDisabled, tabSwitchCount } = useTabVisibility(testStarted);
  
  // Adaptive testing state
  const [questions, setQuestions] = useState<any[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<any[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<Record<string, SkillPerformance>>({});
  const [addedAdaptiveIds, setAddedAdaptiveIds] = useState<Set<string>>(new Set());
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPaused) {
      toast.error("Your account is on hold. Please resolve your outstanding balance to continue.");
      navigate("/dashboard");
      return;
    }
    fetchTestAttempt();
  }, [attemptId, isPaused]);

  useEffect(() => {
    // Only start timer if test has started and not disabled
    if (timeRemaining > 0 && testStarted && !isTestDisabled) {
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
  }, [timeRemaining, testStarted, isTestDisabled]);

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

      // Check if user is admin (admins bypass payment)
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      const isAdmin = !!userRole;

      // Check if payment is required but not completed (admins bypass)
      if (attemptData.payment_status === "pending" && !isAdmin) {
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
      let questionsArray = normalizeQuestions(finalTestData.questions);
      
      // If no questions from edge function, try loading from JSON file as fallback
      if (questionsArray.length === 0) {
        const jsonQuestions = getQuestionsByTestName(finalTestData.name);
        if (jsonQuestions) {
          finalTestData = { ...finalTestData, questions: jsonQuestions as any };
          questionsArray = normalizeQuestions(jsonQuestions);
          console.log(`Loaded ${questionsArray.length} questions from JSON for ${finalTestData.name}`);
        }
      }
      
      setTest(finalTestData);
      setQuestions(questionsArray);
      setOriginalQuestions(questionsArray);
      setTimeRemaining(finalTestData.duration_minutes * 60);
      
      // Translate if needed
      if (language !== "en") {
        await translateQuestions(questionsArray, language);
      } else {
        setTranslatedLanguage("en");
      }
      
      // Show landing page first (not security check immediately)
      // Security check will be shown when user clicks Start
    } catch (error: any) {
      console.error("Error loading test:", error);
      toast.error("Failed to load test");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Translate questions to selected language
  const translateQuestions = async (questionsToTranslate: any[], targetLang: string) => {
    if (targetLang === "en") {
      setQuestions(originalQuestions.length > 0 ? originalQuestions : questionsToTranslate);
      setTranslatedLanguage("en");
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-questions", {
        body: { questions: questionsToTranslate, targetLanguage: targetLang },
      });

      if (error || data?.error) {
        console.error("Translation error:", error || data?.error);
        toast.error("Translation failed, showing original questions");
        return;
      }

      if (data?.translatedQuestions) {
        setQuestions(data.translatedQuestions);
        setTranslatedLanguage(targetLang);
        toast.success(`Test translated to ${languageLabel}`);
      }
    } catch (err) {
      console.error("Translation failed:", err);
      toast.error("Translation failed, showing original questions");
    } finally {
      setIsTranslating(false);
    }
  };

  // Re-translate when language changes (only after test is loaded)
  useEffect(() => {
    if (originalQuestions.length > 0 && !loading && language !== translatedLanguage) {
      translateQuestions(originalQuestions, language);
    }
  }, [language]);

  // Normalize topic name for matching
  const normalizeTopicName = (topic: string): string => {
    return topic
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  };

  // Get reinforcement questions for a skill
  const getReinforcementQuestions = (skill: string): any[] => {
    const normalizedSkill = normalizeTopicName(skill);
    const reinforcementQuestions = (reinforcementData.reinforcement_questions as Record<string, any[]>)[normalizedSkill];
    
    if (!reinforcementQuestions) return [];
    
    return reinforcementQuestions.map(q => ({
      id: q.id,
      question: q.question_text,
      type: 'multiple-choice',
      options: q.choices,
      topic: q.topic,
      correct_answer: q.correct_answer,
      isAdaptive: true
    }));
  };

  // Check if answer is correct (for multiple choice only)
  const checkAnswer = (questionId: string, answer: string): boolean | null => {
    const question = questions.find(q => q.id === questionId);
    if (!question || question.type !== 'multiple-choice') return null;
    
    const correctAnswer = question.correct_answer || question.correctAnswer;
    // Handle both full answer and letter-only formats
    const answerLetter = answer.charAt(0).toUpperCase();
    const correctLetter = correctAnswer?.charAt(0).toUpperCase();
    return answerLetter === correctLetter || answer === correctAnswer;
  };

  // Add adaptive question if needed
  const checkAndAddAdaptiveQuestion = (questionId: string, isCorrect: boolean | null) => {
    if (isCorrect !== false) return; // Only add for wrong answers
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const skill = normalizeTopicName(question.topic || 'general');
    const currentPerf = skillPerformance[skill] || { correct: 0, incorrect: 0, adaptiveAdded: 0 };
    
    // Check if we've already added max adaptive questions for this skill
    if (currentPerf.adaptiveAdded >= MAX_ADAPTIVE_PER_SKILL) return;
    
    // Get available reinforcement questions
    const availableReinforcement = getReinforcementQuestions(skill).filter(
      q => !addedAdaptiveIds.has(q.id)
    );
    
    if (availableReinforcement.length > 0) {
      const newQuestion = availableReinforcement[0];
      
      // Insert after current question
      setQuestions(prev => {
        const updated = [...prev];
        const insertIndex = currentQuestionIndex + 1;
        updated.splice(insertIndex, 0, newQuestion);
        return updated;
      });
      
      setAddedAdaptiveIds(prev => new Set([...prev, newQuestion.id]));
      
      setSkillPerformance(prev => ({
        ...prev,
        [skill]: {
          ...prev[skill],
          correct: prev[skill]?.correct || 0,
          incorrect: (prev[skill]?.incorrect || 0) + 1,
          adaptiveAdded: (prev[skill]?.adaptiveAdded || 0) + 1
        }
      }));
      
      setAdaptiveMessage(`Let's practice "${skill}" with another question.`);
      
      // Clear message after 3 seconds
      setTimeout(() => setAdaptiveMessage(null), 3000);
    } else {
      // Just update skill performance without adding question
      setSkillPerformance(prev => ({
        ...prev,
        [skill]: {
          ...prev[skill],
          correct: prev[skill]?.correct || 0,
          incorrect: (prev[skill]?.incorrect || 0) + 1,
          adaptiveAdded: prev[skill]?.adaptiveAdded || 0
        }
      }));
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Handle moving to next question - check if adaptive question needed
  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.id];
    
    if (currentAnswer && currentQuestion?.type === 'multiple-choice') {
      const isCorrect = checkAnswer(currentQuestion.id, currentAnswer);
      checkAndAddAdaptiveQuestion(currentQuestion.id, isCorrect);
    }
    
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  };

  // Handle security check confirmation
  const handleSecurityCheckConfirm = () => {
    setShowSecurityCheck(false);
    setTestStarted(true);
    toast.success("Test started! Good luck!");
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

  if (loading || isTranslating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
        <div className="text-center">
          <p className="text-lg text-[#1e3a8a]">
            {isTranslating ? `Translating to ${languageLabel}...` : "Loading test..."}
          </p>
          {isTranslating && (
            <p className="text-sm text-[#1e3a8a]/60 mt-2">This may take a moment</p>
          )}
        </div>
      </div>
    );
  }

  if (!test || !attempt) {
    return null;
  }

  // Questions are now in state (initialized when test loads)
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
        <p className="text-lg text-[#1e3a8a]">No questions found for this test.</p>
      </div>
    );
  }

  // Extract grade and subject from test name
  const getTestInfo = (testName: string) => {
    const gradeMatch = testName.match(/Grade\s*(\d+)/i);
    const grade = gradeMatch ? gradeMatch[1] : "N/A";
    const isMath = testName.toLowerCase().includes("math");
    const isELA = testName.toLowerCase().includes("ela") || testName.toLowerCase().includes("english");
    const subject: "Math" | "ELA" = isMath ? "Math" : "ELA";
    const description = isMath 
      ? "Comprehensive math assessment covering arithmetic, problem-solving, and mathematical reasoning"
      : "Reading comprehension, vocabulary, grammar, and writing skills assessment";
    return { grade, subject, description };
  };

  const testInfo = getTestInfo(test.name);

  // Show landing page before test starts
  if (showLanding && !testStarted) {
    return (
      <DiagnosticLanding
        grade={testInfo.grade}
        subject={testInfo.subject}
        description={testInfo.description}
        totalTime={test.duration_minutes}
        totalPoints={questions.length * 4}
        testInfo={testInfo.subject === "Math" ? [
          { label: "Total Time", value: `${test.duration_minutes} min`, emoji: "⏰" },
          { label: "Questions", value: `${questions.length}`, emoji: "📊" },
          { label: "Calculator", value: "Part C", emoji: "🧮" },
          { label: "Show Work", value: "B & C", emoji: "📝" },
        ] : [
          { label: "Total Time", value: `${test.duration_minutes} min`, emoji: "⏰" },
          { label: "Questions", value: `${questions.length}`, emoji: "📊" },
          { label: "Sections", value: "3", emoji: "📚" },
          { label: "Writing", value: "Required", emoji: "✏️" },
        ]}
        onStart={() => {
          setShowLanding(false);
          setShowSecurityCheck(true);
        }}
      />
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
      {/* Pre-Test Security Check Dialog */}
      <PreTestSecurityCheck
        open={showSecurityCheck}
        onConfirm={handleSecurityCheckConfirm}
        testName={test.name}
      />

      {/* Tab Switch Warning Dialog */}
      <TestSecurityWarning
        open={isTestDisabled && testStarted}
        onClose={() => {}}
        onReturnToDashboard={() => navigate("/dashboard")}
        tabSwitchCount={tabSwitchCount}
      />

      {/* DEBs Header */}
      <DEBsHeader 
        subtitle={test.name}
        rightContent={
          <div className="flex items-center gap-3">
            {translatedLanguage !== "en" && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                <Globe className="h-3 w-3" />
                {languageOptions.find(l => l.value === translatedLanguage)?.label || translatedLanguage}
              </span>
            )}
            <span className="text-sm text-white/70 hidden sm:inline">
              Q {currentQuestionIndex + 1}/{questions.length}
            </span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold ${
              timeRemaining < 300 ? "bg-red-500 text-white" : 
              timeRemaining < 600 ? "bg-orange-400 text-white" : 
              "bg-white/10 text-[#FFD700]"
            }`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        }
      />

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

      {/* Adaptive Question Message */}
      {adaptiveMessage && (
        <Alert className="bg-blue-50 border-blue-300 mx-6 mt-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              {adaptiveMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Student Info */}
        <div className="text-sm text-[#1e3a8a]/60 mb-4">
          Student: {profile?.full_name} | Grade: {attempt?.grade_level || "N/A"} | Time limit: {test.duration_minutes} minutes
          {addedAdaptiveIds.size > 0 && (
            <span className="ml-2 text-blue-600">
              ({addedAdaptiveIds.size} practice question{addedAdaptiveIds.size !== 1 ? 's' : ''} added)
            </span>
          )}
        </div>

        {/* Question Card */}
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-8">
            {/* Adaptive Question Badge */}
            {currentQuestion?.isAdaptive && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Lightbulb className="h-4 w-4" />
                Practice Question
              </div>
            )}
            
            {/* Section Info for Grade 1 */}
            {currentQuestion?.section_title && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-800">{currentQuestion.section_title}</p>
                {currentQuestion?.section_instructions && (
                  <p className="text-xs text-purple-600 mt-1">{currentQuestion.section_instructions}</p>
                )}
                {currentQuestion?.student_completes && (
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    📝 Answer any {currentQuestion.student_completes} of the problems in this section
                  </p>
                )}
              </div>
            )}
            
            {/* Question Block */}
            <div className="bg-[#F7FAFF] rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#1e3a8a] mb-3">
                Question {currentQuestionIndex + 1}
                {currentQuestion?.topic && (
                  <span className="ml-2 text-sm font-normal text-[#1e3a8a]/60">
                    ({currentQuestion.topic})
                  </span>
                )}
              </h3>
              <p className="text-[#1e3a8a] text-base leading-relaxed mb-4">
                {currentQuestion.question}
              </p>
              
              {/* Visual Component for questions with visuals */}
              {currentQuestion.visual && (
                typeof currentQuestion.visual === 'string' 
                  ? (getGrade2DiagramByVisual(currentQuestion.visual) || getGrade3DiagramByVisual(currentQuestion.visual))
                  : <QuestionVisual visual={currentQuestion.visual} />
              )}
              
              {/* Grade 2 Picture Helpers for word problems (Math only) */}
              {testInfo.subject === "Math" && getPictureHelperForQuestion(currentQuestion.id)}
              
              {/* Grade 2 Draw Areas for extended response (Math only) */}
              {testInfo.subject === "Math" && getDrawAreaForQuestion(currentQuestion.id)}
              
              {/* ELA Visual Helpers */}
              {testInfo.subject === "ELA" && testInfo.grade === "1" && getELAVisualForQuestion(currentQuestion.id)}
              {testInfo.subject === "ELA" && testInfo.grade === "4" && getGrade4ELAVisualForQuestion(currentQuestion.id)}
              
              {/* Diagram boxes for questions with diagrams (e.g., sentence diagrams) */}
              {currentQuestion.diagrams && currentQuestion.diagrams.length > 0 && (
                <div className="mt-4 space-y-4">
                  {currentQuestion.diagrams.map((diagram: { title: string; diagram: string }, idx: number) => (
                    <div key={idx} className="bg-gray-50 border-2 border-[#2E5A8F] rounded-lg p-5">
                      <div className="text-[#1e3a8a] font-bold mb-4 text-base">
                        {diagram.title}
                      </div>
                      <div className="bg-white p-4 rounded font-mono text-sm leading-relaxed whitespace-pre">
                        {diagram.diagram}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div className="space-y-3 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-dashed border-green-300">
                <Label htmlFor="answer" className="text-base font-semibold text-green-800 flex items-center gap-2">
                  ✏️ Enter your answer here:
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Show your work and write your answer..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="min-h-[120px] text-base border-green-300 focus:border-green-500 focus:ring-green-500 bg-white"
                  rows={5}
                />
                <p className="text-xs text-green-600">
                  💡 Tip: Show your work step by step to earn full credit!
                </p>
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
              onClick={handleNext}
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
