import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowLeft, ArrowRight, Check } from "lucide-react";
import elaTests from "@/data/ela-diagnostic-tests.json";
import DEBsHeader from "@/components/DEBsHeader";
import DiagnosticLanding from "@/components/DiagnosticLanding";

interface Question {
  id: string;
  number: number;
  type: string;
  topic: string;
  question_text: string;
  choices?: string[];
  correct_answer?: string;
}

export default function TakeELATest() {
  const { grade } = useParams();
  const navigate = useNavigate();
  const gradeNum = grade?.replace("grade-", "");
  
  const test = elaTests.all_diagnostics.find(t => t.grade === gradeNum);
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState((test?.total_time_minutes || 90) * 60);
  const [submitted, setSubmitted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  // Flatten all questions from all sections
  const allQuestions: Question[] = [];
  test?.sections.forEach(section => {
    if (section.questions) {
      allQuestions.push(...(section.questions as Question[]));
    }
    if ((section as any).subsections) {
      (section as any).subsections.forEach((sub: any) => {
        if (sub.questions) {
          allQuestions.push(...sub.questions);
        }
      });
    }
  });

  useEffect(() => {
    if (submitted || !testStarted) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, testStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Calculate score for multiple choice
    let correct = 0;
    let total = 0;
    allQuestions.forEach(q => {
      if (q.type === "multiple_choice" && q.correct_answer) {
        total++;
        const userAnswer = answers[q.id];
        if (userAnswer) {
          const answerLetter = userAnswer.charAt(0).toUpperCase();
          if (answerLetter === q.correct_answer) {
            correct++;
          }
        }
      }
    });
    localStorage.setItem(`ela-test-grade-${gradeNum}`, JSON.stringify({
      answers,
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      completedAt: new Date().toISOString()
    }));
  };

  // Get ELA description based on grade
  const getELADescription = (grade: string) => {
    const descriptions: Record<string, string> = {
      "5": "Reading comprehension, vocabulary, grammar, and writing skills assessment",
      "6": "Literary analysis, central ideas, inferencing, and composition skills",
      "7": "Language, grammar, literary devices, and analytical writing",
      "8": "Reading comprehension, rhetoric, and structured writing assessment",
      "9": "Literary analysis, vocabulary in context, and argumentative writing",
      "10": "Advanced literary analysis, central idea development, and essay writing",
      "11": "Rhetoric, literary analysis, advanced vocabulary, and critical writing",
      "12": "College-ready analysis, reading comprehension, and extended writing",
    };
    return descriptions[grade] || "Comprehensive English Language Arts assessment";
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-lg">Test not found for Grade {gradeNum}</p>
          <Button onClick={() => navigate("/diagnostics/ela")} className="mt-4">
            Back to ELA Hub
          </Button>
        </Card>
      </div>
    );
  }

  // Show landing page before test starts
  if (!testStarted && !submitted) {
    return (
      <DiagnosticLanding
        grade={gradeNum || ""}
        subject="ELA"
        description={getELADescription(gradeNum || "")}
        totalTime={test.total_time_minutes}
        totalPoints={allQuestions.length * 4}
        testInfo={[
          { label: "Total Time", value: `${test.total_time_minutes} min`, emoji: "⏰" },
          { label: "Questions", value: `${allQuestions.length}`, emoji: "📊" },
          { label: "Sections", value: `${test.sections.length}`, emoji: "📚" },
          { label: "Writing", value: "Required", emoji: "✏️" },
        ]}
        onStart={() => setTestStarted(true)}
      />
    );
  }

  const currentQ = allQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100;

  if (submitted) {
    const result = JSON.parse(localStorage.getItem(`ela-test-grade-${gradeNum}`) || "{}");
    const tier = result.percentage >= 80 ? "Tier 1" : result.percentage >= 50 ? "Tier 2" : "Tier 3";
    const tierColor = tier === "Tier 1" ? "bg-emerald-500" : tier === "Tier 2" ? "bg-amber-500" : "bg-red-500";

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <DEBsHeader subtitle={`Grade ${gradeNum} ELA - Results`} />
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardHeader className="text-center">
              <div className={`mx-auto w-20 h-20 rounded-full ${tierColor} flex items-center justify-center mb-4`}>
                <Check className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Test Completed!</CardTitle>
              <p className="text-muted-foreground">Grade {gradeNum} ELA Diagnostic</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-5xl font-bold text-primary">{result.percentage}%</div>
              <p className="text-lg">{result.correct} of {result.total} correct</p>
              <div className={`inline-block px-4 py-2 rounded-full text-white ${tierColor}`}>
                {tier}
              </div>
              <div className="pt-6">
                <Button onClick={() => navigate("/diagnostics/ela")}>
                  Back to ELA Hub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* DEBs Header */}
      <DEBsHeader 
        subtitle={`Grade ${gradeNum} ELA Diagnostic`}
        rightContent={
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70 hidden sm:inline">
              Q {currentQuestion + 1}/{allQuestions.length}
            </span>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Clock className="h-4 w-4 text-[#FFD700]" />
              <span className="font-mono text-[#FFD700]">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        }
      />
      <Progress value={progress} className="h-1" />

      {/* Question */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              {currentQ?.topic}
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {currentQ?.number}. {currentQ?.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQ?.type === "multiple_choice" && currentQ.choices && (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
                className="space-y-3"
              >
                {currentQ.choices.map((choice, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={choice} id={`${currentQ.id}-${idx}`} />
                    <Label htmlFor={`${currentQ.id}-${idx}`} className="flex-1 cursor-pointer">
                      {choice}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {currentQ?.type === "writing" && (
              <Textarea
                placeholder="Write your response here..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="min-h-[200px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {currentQuestion < allQuestions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              Submit Test
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
