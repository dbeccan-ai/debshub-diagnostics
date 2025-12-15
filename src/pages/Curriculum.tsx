import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, BookOpen, Target, CheckCircle, XCircle, 
  Lightbulb, Clock, Play, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

interface Activity {
  name: string;
  description: string;
  duration: string;
  type: string;
}

interface Week {
  week: number;
  focus: string;
  objectives: string[];
  activities: Activity[];
  assessmentGoal: string;
}

interface PracticeQuestion {
  skill: string;
  difficulty: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

interface CurriculumData {
  studentName: string;
  testName: string;
  gradeLevel: number;
  tier: string;
  score: number;
  curriculum: {
    title: string;
    overview: string;
    weeks: Week[];
  };
  practiceQuestions: PracticeQuestion[];
}

const Curriculum = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CurriculumData | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    const generateCurriculum = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to view your curriculum");
          navigate("/auth");
          return;
        }

        toast.loading("Generating your personalized curriculum...", { id: "curriculum" });

        const { data: result, error } = await supabase.functions.invoke("generate-curriculum", {
          body: { attemptId },
        });

        if (error) throw new Error(error.message);
        if (!result || !result.curriculum) throw new Error("Invalid curriculum data");

        setData(result);
        toast.success("Curriculum ready!", { id: "curriculum" });
      } catch (err: any) {
        console.error("Error generating curriculum:", err);
        toast.error(err.message || "Failed to generate curriculum", { id: "curriculum" });
        navigate(`/results/${attemptId}`);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) generateCurriculum();
  }, [attemptId, navigate]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => 
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    );
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !data?.practiceQuestions[currentQuestion]) return;
    setShowResult(true);
    if (selectedAnswer === data.practiceQuestions[currentQuestion].correctAnswer) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setCurrentQuestion(prev => Math.min(prev + 1, (data?.practiceQuestions.length || 1) - 1));
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "Tier 1": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Tier 2": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Tier 3": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video": return "🎥";
      case "game": return "🎮";
      case "worksheet": return "📝";
      default: return "✏️";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-emerald-100 text-emerald-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "hard": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Generating your personalized curriculum...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Could not load curriculum</p>
      </div>
    );
  }

  const currentQ = data.practiceQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/results/${attemptId}`)}
            className="text-slate-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
          <div className="flex items-center gap-3">
            <Badge className={getTierColor(data.tier)}>{data.tier}</Badge>
            <span className="text-sm text-slate-600">Grade {data.gradeLevel}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {data.studentName}'s Learning Journey
          </h1>
          <p className="text-lg text-slate-600">
            Personalized curriculum based on your {data.testName} results
          </p>
        </div>

        {/* Overview Card */}
        <Card className="mb-8 border-sky-200 bg-gradient-to-r from-sky-50 to-sky-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-800">
              <Target className="h-5 w-5" />
              {data.curriculum.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{data.curriculum.overview}</p>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Weekly Curriculum */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-600" />
              4-Week Learning Plan
            </h2>
            
            {data.curriculum.weeks.map((week) => (
              <Card key={week.week} className="border-slate-200">
                <button
                  onClick={() => toggleWeek(week.week)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-slate-800">
                        Week {week.week}: {week.focus}
                      </CardTitle>
                      {expandedWeeks.includes(week.week) ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </CardHeader>
                </button>
                
                {expandedWeeks.includes(week.week) && (
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Objectives:</h4>
                      <ul className="space-y-1">
                        {week.objectives.map((obj, idx) => (
                          <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Activities:</h4>
                      <div className="space-y-2">
                        {week.activities.map((activity, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-800">
                                {getActivityIcon(activity.type)} {activity.name}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activity.duration}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{activity.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Goal:</h4>
                      <p className="text-sm text-amber-700">{week.assessmentGoal}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Practice Questions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Practice Questions
            </h2>
            
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {currentQuestion + 1} of {data.practiceQuestions.length}
                    </Badge>
                    <Badge className={getDifficultyColor(currentQ?.difficulty || "medium")}>
                      {currentQ?.difficulty}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                    {currentQ?.skill}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium text-slate-800">{currentQ?.question}</p>
                
                <div className="space-y-2">
                  {currentQ?.options.map((option, idx) => {
                    const letter = option.charAt(0);
                    const isSelected = selectedAnswer === letter;
                    const isCorrect = letter === currentQ.correctAnswer;
                    
                    let className = "w-full text-left p-3 rounded-lg border-2 transition-all ";
                    
                    if (showResult) {
                      if (isCorrect) {
                        className += "border-emerald-500 bg-emerald-50";
                      } else if (isSelected && !isCorrect) {
                        className += "border-red-500 bg-red-50";
                      } else {
                        className += "border-slate-200 bg-white opacity-50";
                      }
                    } else {
                      className += isSelected 
                        ? "border-sky-500 bg-sky-50" 
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50";
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(letter)}
                        className={className}
                        disabled={showResult}
                      >
                        <span className="text-sm text-slate-700">{option}</span>
                      </button>
                    );
                  })}
                </div>
                
                {!showResult && !showHint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="text-amber-600"
                  >
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Show Hint
                  </Button>
                )}
                
                {showHint && !showResult && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-700">
                      <strong>Hint:</strong> {currentQ?.hint}
                    </p>
                  </div>
                )}
                
                {showResult && (
                  <div className={`rounded-lg p-4 ${
                    selectedAnswer === currentQ?.correctAnswer 
                      ? "bg-emerald-50 border border-emerald-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedAnswer === currentQ?.correctAnswer ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span className="font-semibold text-emerald-700">Correct!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-700">Not quite right</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{currentQ?.explanation}</p>
                  </div>
                )}
                
                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-600">
                    Score: {correctCount}/{currentQuestion + (showResult ? 1 : 0)}
                  </div>
                  {!showResult ? (
                    <Button 
                      onClick={checkAnswer}
                      disabled={!selectedAnswer}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Check Answer
                    </Button>
                  ) : (
                    <Button 
                      onClick={nextQuestion}
                      disabled={currentQuestion >= data.practiceQuestions.length - 1}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      Next Question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact CTA */}
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
              <CardContent className="pt-6">
                <h3 className="font-bold text-amber-800 mb-2">Want More Practice?</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Register for our tutoring pods for personalized instruction and guided practice sessions.
                </p>
                <div className="text-xs text-amber-600">
                  <strong>Contact D.E.Bs LEARNING ACADEMY</strong><br />
                  📧 info@debslearnacademy.com | 📞 347-364-1906
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Curriculum;
