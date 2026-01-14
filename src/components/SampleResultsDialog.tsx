import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star, Target, AlertTriangle, TrendingUp, CheckCircle2, BookOpen } from "lucide-react";

interface TierData {
  tier: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
  parentExplanation: string;
  skills: { name: string; status: "strong" | "developing" | "needs-support" }[];
}

const tiers: TierData[] = [
  {
    tier: 1,
    label: "Above Grade Level",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: <Star className="h-5 w-5 text-emerald-600" />,
    description: "Student demonstrates mastery beyond current grade expectations",
    parentExplanation: "Your child is excelling! They've shown strong understanding of grade-level content and are ready for enrichment activities and more challenging material.",
    skills: [
      { name: "Number Sense & Operations", status: "strong" },
      { name: "Problem Solving & Reasoning", status: "strong" },
      { name: "Algebraic Thinking", status: "strong" },
      { name: "Geometry & Measurement", status: "developing" },
    ],
  },
  {
    tier: 2,
    label: "At Grade Level",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    icon: <Target className="h-5 w-5 text-sky-600" />,
    description: "Student meets grade-level expectations with room to grow",
    parentExplanation: "Your child is on track! They understand most grade-level concepts well. With continued practice and targeted support in a few areas, they'll continue to thrive.",
    skills: [
      { name: "Reading Comprehension", status: "strong" },
      { name: "Vocabulary & Word Knowledge", status: "developing" },
      { name: "Writing & Grammar", status: "developing" },
      { name: "Critical Analysis", status: "developing" },
    ],
  },
  {
    tier: 3,
    label: "Needs Targeted Support",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    description: "Student requires focused intervention to reach grade-level standards",
    parentExplanation: "Your child has some foundational gaps that we've identified. With the right support and a personalized learning plan, they can build the skills they need to succeed.",
    skills: [
      { name: "Foundational Math Facts", status: "needs-support" },
      { name: "Multi-Step Problem Solving", status: "needs-support" },
      { name: "Number Relationships", status: "developing" },
      { name: "Basic Computation", status: "developing" },
    ],
  },
];

const getStatusIcon = (status: "strong" | "developing" | "needs-support") => {
  switch (status) {
    case "strong":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "developing":
      return <TrendingUp className="h-4 w-4 text-sky-500" />;
    case "needs-support":
      return <BookOpen className="h-4 w-4 text-amber-500" />;
  }
};

const getStatusLabel = (status: "strong" | "developing" | "needs-support") => {
  switch (status) {
    case "strong":
      return "Strong";
    case "developing":
      return "Developing";
    case "needs-support":
      return "Needs Support";
  }
};

interface SampleResultsDialogProps {
  buttonText: string;
  className?: string;
}

export const SampleResultsDialog = ({ buttonText, className }: SampleResultsDialogProps) => {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const currentTier = tiers.find((t) => t.tier === selectedTier)!;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={className}>
          {buttonText}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Sample Diagnostic Results by Tier
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            See what parents and teachers receive after a student completes their diagnostic
          </p>
        </DialogHeader>

        {/* Tier Selector Tabs */}
        <div className="flex gap-2 mt-4">
          {tiers.map((tier) => (
            <button
              key={tier.tier}
              onClick={() => setSelectedTier(tier.tier)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedTier === tier.tier
                  ? `${tier.bgColor} ${tier.borderColor} ${tier.color}`
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {tier.icon}
                <span className="hidden sm:inline">Tier {tier.tier}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Sample Report Card */}
        <div className={`mt-4 rounded-xl border-2 ${currentTier.borderColor} ${currentTier.bgColor} p-6`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {currentTier.icon}
                <span className={`text-lg font-bold ${currentTier.color}`}>
                  Tier {currentTier.tier}: {currentTier.label}
                </span>
              </div>
              <p className="text-sm text-slate-600">{currentTier.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${currentTier.bgColor} ${currentTier.color} border ${currentTier.borderColor}`}>
              Sample Report
            </div>
          </div>

          {/* Mock Student Info */}
          <div className="bg-white/80 rounded-lg p-4 mb-4 border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Student</p>
                <p className="font-medium text-slate-800">Sample Student</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Grade</p>
                <p className="font-medium text-slate-800">Grade 4</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Test Date</p>
                <p className="font-medium text-slate-800">Jan 15, 2025</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Score</p>
                <p className="font-medium text-slate-800">
                  {currentTier.tier === 1 ? "87%" : currentTier.tier === 2 ? "68%" : "45%"}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="bg-white/80 rounded-lg p-4 mb-4 border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-600" />
              Skill Breakdown
            </h4>
            <div className="space-y-2">
              {currentTier.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(skill.status)}
                    <span className={`text-xs font-medium ${
                      skill.status === "strong" ? "text-emerald-600" :
                      skill.status === "developing" ? "text-sky-600" : "text-amber-600"
                    }`}>
                      {getStatusLabel(skill.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Explanation */}
          <div className="bg-white/80 rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-600" />
              What This Means for Your Child
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {currentTier.parentExplanation}
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-400 text-center mt-4">
          Actual reports include detailed recommendations and personalized learning paths
        </p>
      </DialogContent>
    </Dialog>
  );
};
