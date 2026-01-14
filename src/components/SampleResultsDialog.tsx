import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface SampleData {
  tier: string;
  tierLabel: string;
  score: number;
  correct: number;
  total: number;
  studentName: string;
  testName: string;
  gradeLevel: number;
  completedAt: string;
  mastered: string[];
  needsSupport: string[];
  developing: string[];
  skillStats: Record<string, { total: number; correct: number; percentage: number }>;
  parentExplanation: string;
}

const sampleDataByTier: Record<number, SampleData> = {
  1: {
    tier: "Tier 1",
    tierLabel: "Above Grade Level",
    score: 87,
    correct: 26,
    total: 30,
    studentName: "Sample Student",
    testName: "Math Diagnostic",
    gradeLevel: 4,
    completedAt: "Jan 15, 2025",
    mastered: [
      "Number Sense & Place Value",
      "Addition & Subtraction Fluency",
      "Multiplication Concepts",
      "Problem Solving Strategies",
    ],
    needsSupport: [],
    developing: ["Fraction Concepts"],
    skillStats: {
      "Number Sense & Place Value": { total: 6, correct: 6, percentage: 100 },
      "Addition & Subtraction": { total: 8, correct: 7, percentage: 88 },
      "Multiplication & Division": { total: 6, correct: 5, percentage: 83 },
      "Problem Solving": { total: 5, correct: 4, percentage: 80 },
      "Fractions": { total: 5, correct: 4, percentage: 80 },
    },
    parentExplanation: "Excellent! Your child is excelling and demonstrates strong understanding across all tested skills. They are ready for enrichment activities and more challenging material.",
  },
  2: {
    tier: "Tier 2",
    tierLabel: "At Grade Level",
    score: 68,
    correct: 20,
    total: 30,
    studentName: "Sample Student",
    testName: "ELA Diagnostic",
    gradeLevel: 4,
    completedAt: "Jan 15, 2025",
    mastered: [
      "Reading Comprehension",
      "Vocabulary Recognition",
    ],
    needsSupport: ["Grammar & Mechanics"],
    developing: [
      "Writing Organization",
      "Critical Analysis",
    ],
    skillStats: {
      "Reading Comprehension": { total: 8, correct: 6, percentage: 75 },
      "Vocabulary": { total: 6, correct: 5, percentage: 83 },
      "Writing Organization": { total: 6, correct: 4, percentage: 67 },
      "Grammar & Mechanics": { total: 5, correct: 2, percentage: 40 },
      "Critical Analysis": { total: 5, correct: 3, percentage: 60 },
    },
    parentExplanation: "Your child is on track and understands most grade-level concepts well. With continued practice and targeted support in a few areas, they'll continue to thrive.",
  },
  3: {
    tier: "Tier 3",
    tierLabel: "Needs Targeted Support",
    score: 45,
    correct: 14,
    total: 30,
    studentName: "Sample Student",
    testName: "Math Diagnostic",
    gradeLevel: 4,
    completedAt: "Jan 15, 2025",
    mastered: [],
    needsSupport: [
      "Number Sense & Place Value",
      "Multi-Step Problem Solving",
      "Fraction Concepts",
    ],
    developing: [
      "Basic Computation",
      "Addition & Subtraction",
    ],
    skillStats: {
      "Number Sense": { total: 6, correct: 2, percentage: 33 },
      "Addition & Subtraction": { total: 8, correct: 4, percentage: 50 },
      "Multiplication": { total: 6, correct: 3, percentage: 50 },
      "Problem Solving": { total: 5, correct: 2, percentage: 40 },
      "Fractions": { total: 5, correct: 3, percentage: 60 },
    },
    parentExplanation: "Your child has some foundational gaps that we've identified. With the right support and a personalized learning plan, they can build the skills they need to succeed.",
  },
};

const getTierColor = (tier: string) => {
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

interface SampleResultsDialogProps {
  buttonText: string;
  className?: string;
}

export const SampleResultsDialog = ({ buttonText, className }: SampleResultsDialogProps) => {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const data = sampleDataByTier[selectedTier];
  const incorrectAnswers = data.total - data.correct;
  const isTier1 = data.tier === "Tier 1";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={className}>
          {buttonText}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Sample Diagnostic Results
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Preview what parents and teachers receive after a student completes their diagnostic
          </p>
          
          {/* Tier Selector Tabs */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedTier === tier
                    ? tier === 1 ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : tier === 2 ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Results Content - Matching Results.tsx exactly */}
        <div className="bg-slate-50 px-6 py-6">
          {/* Score Overview */}
          <Card className="mb-6 border-slate-200">
            <CardHeader className="text-center pb-2">
              <div className="mb-2">
                <Badge className={`text-lg px-4 py-1 ${getTierColor(data.tier)}`}>
                  {data.tier}
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                {data.score}%
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {data.correct} of {data.total} questions correct
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.studentName}</p>
                  <p className="text-xs text-slate-500">Student Name</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.testName}</p>
                  <p className="text-xs text-slate-500">Test Type</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center mt-4">
                <div>
                  <p className="text-lg font-semibold text-slate-700">Grade {data.gradeLevel}</p>
                  <p className="text-xs text-slate-500">Grade Level</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">{data.completedAt}</p>
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
                <p className="text-2xl font-bold text-emerald-700">{data.correct}</p>
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
                <p className="text-2xl font-bold text-amber-700">{Object.keys(data.skillStats).length}</p>
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
                {data.mastered.length > 0 ? (
                  <ul className="space-y-1">
                    {data.mastered.map((skill, idx) => (
                      <li key={idx} className="text-sm text-emerald-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : isTier1 ? (
                  <p className="text-xs text-emerald-600 italic">
                    Excellent! Student demonstrated strong understanding across all tested skills.
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills in this category</p>
                )}
              </CardContent>
            </Card>

            {/* Skills Needing Support */}
            {(!isTier1 || data.needsSupport.length > 0) && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Needs Additional Support (&lt;50%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.needsSupport.length > 0 ? (
                    <ul className="space-y-1">
                      {data.needsSupport.map((skill, idx) => (
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
            )}

            {/* For Tier 1 without weak skills, show a positive card instead */}
            {isTier1 && data.needsSupport.length === 0 && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Ready for Advanced Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-emerald-700">
                    Great news! Your student has no skills requiring additional support and is ready for enrichment activities.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Skills In Progress */}
          {data.developing.length > 0 && (
            <Card className="border-amber-200 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Skills In Progress (50-69%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {data.developing.map((skill, idx) => (
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
          <Card className="border-slate-200 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Skill-by-Skill Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.skillStats).map(([skill, stats]) => (
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

          {/* Parent Explanation */}
          <Card className="border-sky-200 bg-sky-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-sky-700">
                What This Means for Your Child
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-sky-800 leading-relaxed">
                {data.parentExplanation}
              </p>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-xs text-slate-400 text-center mt-6">
            This is a sample report. Actual reports include personalized recommendations and learning paths.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
