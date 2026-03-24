import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import mathData from "@/data/diagnostic-tests.json";
import elaData from "@/data/ela-diagnostic-tests.json";
import { getTierFromScore, TIER_LABELS } from "@/lib/tierConfig";
import {
  TierStatusBadge,
  SkillRow,
  RecommendedNextStepPanel,
  PlacementPathwayCard,
  TierClassificationBlocks,
  InsightBox,
} from "@/components/TierComponents";

interface DemoQuestion {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  topic: string;
  type: string;
}

function extractMCQuestions(test: any): DemoQuestion[] {
  const questions: DemoQuestion[] = [];
  for (const section of test.sections || []) {
    // Handle subsections (ELA format)
    if (section.subsections) {
      for (const sub of section.subsections) {
        for (const q of sub.questions || []) {
          if (q.type === "multiple_choice" && q.choices?.length) {
            questions.push({
              id: q.id,
              question_text: q.question_text || q.question || "",
              choices: q.choices,
              correct_answer: q.correct_answer || q.correctAnswer || "",
              topic: q.topic || q.skill_tag || "General",
              type: q.type,
            });
          }
        }
      }
    }
    // Handle direct questions
    for (const q of section.questions || []) {
      if (q.type === "multiple_choice" && q.choices?.length) {
        questions.push({
          id: q.id,
          question_text: q.question_text || q.question || "",
          choices: q.choices,
          correct_answer: q.correct_answer || q.correctAnswer || "",
          topic: q.topic || q.skill_tag || "General",
          type: q.type,
        });
      }
    }
  }
  return questions;
}

const SAMPLE_SIZE = 5;

const GRADE_LABELS: Record<string, Record<string, string>> = {
  math: {
    "1": "Grade 1 Math", "2": "Grade 2 Math", "3": "Grade 3 Math",
    "4": "Grade 4 Math", "5": "Grade 5 Math", "6": "Grade 6 Math",
    "7": "Pre-Algebra", "8": "Grade 8 Math", "9": "Algebra 1",
    "10": "Algebra 1 / Geometry", "11": "Algebra 2", "12": "Pre-Calculus",
  },
  ela: {
    "1": "Grade 1 ELA", "2": "Grade 2 ELA", "3": "Grade 3 ELA",
    "4": "Grade 4 ELA", "5": "Grade 5 ELA", "6": "Grade 6 ELA",
    "7": "Grade 7 ELA", "8": "Grade 8 ELA", "9": "English I",
    "10": "English II", "11": "English III", "12": "English IV / AP Prep",
  },
};

function getTier(pct: number) {
  if (pct >= 85) return { label: "Tier 1 — Demonstrated Mastery", color: "text-green-700 bg-green-100", bar: "bg-green-500" };
  if (pct >= 66) return { label: "Tier 2 — Strengthening Zone", color: "text-yellow-700 bg-yellow-100", bar: "bg-yellow-500" };
  return { label: "Tier 3 — Priority Intervention", color: "text-red-700 bg-red-100", bar: "bg-red-500" };
}

function getRecommendations(tier: string, subject: string, grade: string) {
  const gradeNum = parseInt(grade);
  const subjectLabel = subject === "math" ? "Math" : "ELA";
  if (tier.includes("Tier 1")) {
    return {
      next: `Continue with enrichment activities in ${subjectLabel}. Challenge with above-grade-level problems.`,
      homework: [`Advanced ${subjectLabel} worksheet (Grade ${Math.min(gradeNum + 1, 12)})`, "Independent project or extension activity", "Peer tutoring opportunities"],
      curriculum: `Student is performing at or above grade level. Recommend placement in accelerated ${subjectLabel} track.`,
    };
  }
  if (tier.includes("Tier 2")) {
    return {
      next: `Targeted skill reinforcement in identified weak areas. Small-group instruction recommended.`,
      homework: [`Skill-specific practice sheets targeting weak topics`, `Grade ${grade} ${subjectLabel} review packet`, "Daily 15-minute practice routine"],
      curriculum: `Student shows partial mastery. Focus on closing specific skill gaps through targeted intervention.`,
    };
  }
  return {
    next: `Intensive intervention required. One-on-one or small-group support recommended immediately.`,
    homework: [`Foundation skills workbook (Grade ${Math.max(gradeNum - 1, 1)} level)`, "Daily guided practice with parent support", "Visual aids and manipulatives for core concepts"],
    curriculum: `Student needs significant support. Recommend placement in intervention program with progress monitoring every 2 weeks.`,
  };
}

export default function DemoTest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const subject = params.get("subject") || "math";
  const grade = params.get("grade") || "4";

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = useMemo(() => {
    const source = subject === "ela" ? elaData : mathData;
    const test = (source as any).all_diagnostics.find((t: any) => t.grade === grade);
    if (!test) return [];
    const all = extractMCQuestions(test);
    // Take evenly spaced questions for variety
    if (all.length <= SAMPLE_SIZE) return all;
    const step = Math.floor(all.length / SAMPLE_SIZE);
    return Array.from({ length: SAMPLE_SIZE }, (_, i) => all[i * step]);
  }, [subject, grade]);

  const testLabel = GRADE_LABELS[subject]?.[grade] || `Grade ${grade} ${subject.toUpperCase()}`;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-amber-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Sample Not Available</h2>
            <p className="text-muted-foreground text-sm">
              A demo sample for {testLabel} is not yet available in our question bank. Please try a different grade level.
            </p>
            <Button onClick={() => navigate("/demo")} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Demo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RESULTS VIEW ---
  if (submitted) {
    const results = questions.map((q, i) => {
      const userAns = answers[i] || "";
      const correctLetter = q.correct_answer.replace(/[^A-Da-d]/g, "").toUpperCase();
      const userLetter = userAns.charAt(0).toUpperCase();
      return { ...q, userAns, isCorrect: userLetter === correctLetter };
    });
    const correct = results.filter((r) => r.isCorrect).length;
    const pct = Math.round((correct / questions.length) * 100);
    const tier = getTier(pct);
    const recs = getRecommendations(tier.label, subject, grade);

    // Skill breakdown
    const topicMap: Record<string, { correct: number; total: number }> = {};
    results.forEach((r) => {
      if (!topicMap[r.topic]) topicMap[r.topic] = { correct: 0, total: 0 };
      topicMap[r.topic].total++;
      if (r.isCorrect) topicMap[r.topic].correct++;
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-amber-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="w-4 h-4" />
            <span>Demo Sample Results — {testLabel}</span>
          </div>

          {/* Score Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{pct}% Score</h2>
                  <p className="text-sm text-muted-foreground">{correct} of {questions.length} correct</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${tier.color}`}>
                  {tier.label}
                </span>
              </div>
              <Progress value={pct} className="h-3" />
            </CardContent>
          </Card>

          {/* Skill Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Skill Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(topicMap).map(([topic, data]) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{data.correct}/{data.total}</span>
                      {data.correct === data.total ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : data.correct === 0 ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-yellow-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Question Review</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {results.map((r, i) => (
                <div key={r.id} className={`p-3 rounded-lg border ${r.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-start gap-2">
                    {r.isCorrect ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                    <div className="text-sm">
                      <p className="font-medium">Q{i + 1}: {r.question_text}</p>
                      <p className="text-muted-foreground mt-1">
                        Your answer: {r.userAns || "No answer"} {!r.isCorrect && `• Correct: ${r.correct_answer}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Recommended Next Steps</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{recs.next}</p>
              <div>
                <h4 className="text-sm font-semibold mb-2">Suggested Homework</h4>
                <ul className="space-y-1">
                  {recs.homework.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Curriculum Placement</h4>
                <p className="text-sm text-muted-foreground">{recs.curriculum}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center pb-8">
            <Button variant="outline" onClick={() => navigate("/demo")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Demo
            </Button>
            <Button onClick={() => { setSubmitted(false); setAnswers({}); setCurrentQ(0); }} className="gap-2">
              Retake Sample
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- TEST VIEW ---
  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/demo")} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{testLabel} — Demo Sample</span>
        </div>

        <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">Question {currentQ + 1} of {questions.length}</p>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{q.topic}</span>
              <h3 className="text-lg font-semibold mt-1">{q.question_text}</h3>
            </div>

            <RadioGroup
              value={answers[currentQ] || ""}
              onValueChange={(val) => setAnswers((prev) => ({ ...prev, [currentQ]: val }))}
              className="space-y-3"
            >
              {q.choices.map((choice, ci) => (
                <div key={ci} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value={choice} id={`c-${ci}`} />
                  <Label htmlFor={`c-${ci}`} className="cursor-pointer flex-1 text-sm">{choice}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ((p) => p + 1)} disabled={!answers[currentQ]} className="gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
              Submit & See Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
