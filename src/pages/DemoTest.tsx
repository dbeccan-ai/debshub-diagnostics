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
    const overallTier = getTierFromScore(pct);
    const tierCfg = TIER_LABELS[overallTier];
    const incorrectCount = questions.length - correct;
    const isELA = subject === "ela";
    const subjectLabel = isELA ? "ELA" : "Math";

    // Skill breakdown
    const topicMap: Record<string, { correct: number; total: number }> = {};
    results.forEach((r) => {
      if (!topicMap[r.topic]) topicMap[r.topic] = { correct: 0, total: 0 };
      topicMap[r.topic].total++;
      if (r.isCorrect) topicMap[r.topic].correct++;
    });

    const skillSections = Object.entries(topicMap).map(([topic, data]) => ({
      section: topic,
      correct: data.correct,
      total: data.total,
      percent: Math.round((data.correct / data.total) * 100),
    }));

    const prioritySkills = skillSections.filter(s => s.percent < 66).map(s => s.section);
    const developingSkills = skillSections.filter(s => s.percent >= 66 && s.percent < 85).map(s => s.section);

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/demo")} className="text-slate-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Demo
            </Button>
            <Badge variant="outline" className="text-xs border-sky-300 text-sky-700 bg-sky-50">
              <GraduationCap className="mr-1 h-3 w-3" /> Demo Preview
            </Badge>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {/* Score Overview — mirrors Results.tsx */}
          <Card className="mb-6 border-slate-200">
            <CardHeader className="text-center pb-2">
              <div className="mb-2 flex flex-col items-center gap-2">
                <Badge className={`text-lg px-4 py-1 ${tierCfg.badgeClass}`}>
                  {tierCfg.badge}
                </Badge>
                <TierStatusBadge score={pct} />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                {pct}%
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {correct} of {questions.length} questions correct
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
                <div>
                  <p className="text-2xl font-bold text-slate-900">Demo Student</p>
                  <p className="text-xs text-slate-500">Student Name</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{testLabel}</p>
                  <p className="text-xs text-slate-500">Test Type</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center mt-4">
                <div>
                  <p className="text-lg font-semibold text-slate-700">Grade {grade}</p>
                  <p className="text-xs text-slate-500">Grade Level</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">
                    {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>

              {/* Insight Box */}
              <InsightBox score={pct} />

              {/* Recommended Next Step CTA */}
              <div className="mt-4">
                <RecommendedNextStepPanel
                  overallScore={pct}
                  subject={subjectLabel}
                  studentName="Demo Student"
                  prioritySkills={prioritySkills}
                  developingSkills={developingSkills}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-700">{correct}</p>
                <p className="text-xs text-emerald-600">Correct</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-center">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{incorrectCount}</p>
                <p className="text-xs text-red-600">Incorrect</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{skillSections.length}</p>
                <p className="text-xs text-amber-600">Skills Tested</p>
              </CardContent>
            </Card>
          </div>

          {/* Tier Classification Blocks */}
          {skillSections.length > 0 && (
            <div className="mb-6">
              <TierClassificationBlocks sections={skillSections} />
            </div>
          )}

          {/* Skill-by-Skill Performance */}
          {skillSections.length > 0 && (
            <Card className="border-slate-200 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Skill-by-Skill Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {skillSections.map((s) => (
                  <SkillRow key={s.section} skill={s.section} correct={s.correct} total={s.total} percentage={s.percent} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Placement Pathway */}
          <div className="mb-6">
            <PlacementPathwayCard overallScore={pct} />
          </div>

          {/* Curriculum Preview */}
          <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 mb-6">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="bg-sky-100 rounded-full p-3 flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-sky-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sky-900 text-base mb-1">
                    📚 AI-Generated {subjectLabel} Curriculum
                  </h3>
                  <p className="text-sm text-sky-700 mb-3">
                    In the full version, students receive a personalized 4-week learning plan with practice questions
                    built around their specific performance data.
                    {prioritySkills.length > 0 && (
                      <span> Priority areas for this demo: <strong>{prioritySkills.join(", ")}</strong></span>
                    )}
                  </p>
                  <Badge variant="outline" className="text-xs border-sky-300 text-sky-600">
                    Demo Preview — Full curriculum available after enrollment
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Explanation */}
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

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pb-8">
            <Button variant="outline" onClick={() => navigate("/demo")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Demo
            </Button>
            <Button onClick={() => { setSubmitted(false); setAnswers({}); setCurrentQ(0); }} className="gap-2">
              Retake Sample
            </Button>
          </div>
        </main>
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
