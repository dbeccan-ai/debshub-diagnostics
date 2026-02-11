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

  // Map question topics to ELA sections
  const mapTopicToSection = (topic: string, qType: string): string => {
    const t = (topic || "").toLowerCase();
    if (qType === "writing") return "Writing";
    if (t.includes("reading") || t.includes("comprehension") || t.includes("main idea") || t.includes("inference") || t.includes("summary") || t.includes("author") || t.includes("passage") || t.includes("text structure") || t.includes("central idea") || t.includes("literary") || t.includes("rhetoric") || t.includes("theme") || t.includes("character") || t.includes("plot") || t.includes("setting") || t.includes("point of view") || t.includes("compare")) return "Reading Comprehension";
    if (t.includes("vocab") || t.includes("synonym") || t.includes("antonym") || t.includes("context clue") || t.includes("word meaning") || t.includes("word structure") || t.includes("prefix") || t.includes("suffix") || t.includes("root") || t.includes("figurative") || t.includes("idiom") || t.includes("connotation") || t.includes("denotation")) return "Vocabulary";
    if (t.includes("spell") || t.includes("homophone") || t.includes("homograph")) return "Spelling";
    if (t.includes("grammar") || t.includes("punctuation") || t.includes("verb") || t.includes("subject") || t.includes("pronoun") || t.includes("adjective") || t.includes("adverb") || t.includes("sentence") || t.includes("clause") || t.includes("conjunction") || t.includes("tense") || t.includes("agreement") || t.includes("capitalization") || t.includes("comma") || t.includes("apostrophe") || t.includes("possessive") || t.includes("parts of speech") || t.includes("modifier")) return "Grammar & Language Conventions";
    if (t.includes("writ") || t.includes("essay") || t.includes("narrative") || t.includes("opinion") || t.includes("persuasive") || t.includes("argument") || t.includes("composition")) return "Writing";
    return "Grammar & Language Conventions"; // default fallback
  };

  const handleSubmit = () => {
    setSubmitted(true);

    // Build section-level scoring
    const sectionData: Record<string, { correct: number; total: number; skills: Record<string, { correct: number; total: number }> }> = {};
    const sectionOrder = ["Reading Comprehension", "Vocabulary", "Spelling", "Grammar & Language Conventions", "Writing"];
    sectionOrder.forEach(s => { sectionData[s] = { correct: 0, total: 0, skills: {} }; });

    allQuestions.forEach(q => {
      if (q.type === "multiple_choice" && q.correct_answer) {
        const section = mapTopicToSection(q.topic || "", q.type);
        const skillName = q.topic || "General";
        if (!sectionData[section]) sectionData[section] = { correct: 0, total: 0, skills: {} };
        if (!sectionData[section].skills[skillName]) sectionData[section].skills[skillName] = { correct: 0, total: 0 };

        sectionData[section].total++;
        sectionData[section].skills[skillName].total++;

        const userAnswer = answers[q.id];
        if (userAnswer) {
          const answerLetter = userAnswer.charAt(0).toUpperCase();
          if (answerLetter === q.correct_answer) {
            sectionData[section].correct++;
            sectionData[section].skills[skillName].correct++;
          }
        }
      }
    });

    let overallCorrect = 0;
    let overallTotal = 0;

    const sectionBreakdown = sectionOrder.map(sectionName => {
      const data = sectionData[sectionName];
      const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      overallCorrect += data.correct;
      overallTotal += data.total;

      const status: "Mastered" | "Developing" | "Support Needed" =
        percent >= 85 ? "Mastered" : percent >= 70 ? "Developing" : "Support Needed";

      const masteredSkills: string[] = [];
      const supportSkills: string[] = [];

      Object.entries(data.skills).forEach(([skill, stats]) => {
        const skillPct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        if (skillPct >= 85) masteredSkills.push(skill);
        else if (skillPct < 70) supportSkills.push(skill);
      });

      const recommendation =
        status === "Mastered"
          ? "Maintain with weekly reinforcement."
          : status === "Developing"
          ? "Targeted practice 2–3 times per week."
          : "Immediate focused intervention recommended.";

      return {
        section: sectionName,
        sectionKey: sectionName.toLowerCase().replace(/ & /g, "_").replace(/ /g, "_"),
        correct: data.correct,
        total: data.total,
        percent,
        status,
        masteredSkills,
        supportSkills,
        recommendation,
      };
    }).filter(s => s.total > 0);

    const overallPercent = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;
    const tier = overallPercent >= 85 ? "Tier 1" : overallPercent >= 70 ? "Tier 2" : "Tier 3";

    const priorities = [...sectionBreakdown]
      .sort((a, b) => a.percent - b.percent)
      .filter(s => s.status !== "Mastered")
      .slice(0, 3)
      .map(s => s.section);

    const resultData = {
      studentName: "Student",
      gradeLevel: gradeNum || "",
      completedAt: new Date().toISOString(),
      overallPercent,
      overallCorrect,
      overallTotal,
      tier,
      sectionBreakdown,
      priorities,
      answers,
    };

    localStorage.setItem(`ela-results-grade-${gradeNum}`, JSON.stringify(resultData));
    localStorage.setItem(`ela-test-grade-${gradeNum}`, JSON.stringify({
      answers,
      correct: overallCorrect,
      total: overallTotal,
      percentage: overallPercent,
      completedAt: new Date().toISOString(),
    }));

    // Navigate to ELA results page
    navigate(`/ela-results/grade-${gradeNum}`);
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

  // submitted state is now handled by navigate in handleSubmit, but keep as safety
  if (submitted) {
    return null; // Navigation already happened in handleSubmit
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
