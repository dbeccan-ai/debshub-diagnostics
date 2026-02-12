import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Target,
  Home,
  RefreshCw,
  Award,
  Share2,
} from "lucide-react";
import DEBsHeader from "@/components/DEBsHeader";
import { getTierFromScore, TIER_LABELS } from "@/lib/tierConfig";
import {
  InsightBox,
  TierStatusBadge,
  SkillRow,
  RecommendedNextStepPanel,
  PlacementPathwayCard,
  TierClassificationBlocks,
} from "@/components/TierComponents";

/* ──────────────────────── Types ──────────────────────── */

interface SectionResult {
  section: string;
  sectionKey: string;
  correct: number;
  total: number;
  percent: number;
  status: "Mastered" | "Developing" | "Support Needed";
  masteredSkills: string[];
  supportSkills: string[];
  recommendation: string;
}

interface ELAResultData {
  studentName: string;
  gradeLevel: string;
  completedAt: string;
  overallPercent: number;
  overallCorrect: number;
  overallTotal: number;
  tier: string;
  sectionBreakdown: SectionResult[];
  priorities: string[];
  answers: Record<string, string>;
}

/* ──────────────────────── Constants ──────────────────────── */

const SECTION_ORDER = [
  "Reading Comprehension",
  "Vocabulary",
  "Spelling",
  "Grammar & Language Conventions",
  "Writing",
];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "Reading Comprehension": <BookOpen className="h-5 w-5" />,
  Vocabulary: <GraduationCap className="h-5 w-5" />,
  Spelling: <Target className="h-5 w-5" />,
  "Grammar & Language Conventions": <TrendingUp className="h-5 w-5" />,
  Writing: <Award className="h-5 w-5" />,
};

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  "Reading Comprehension": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", light: "bg-blue-100" },
  Vocabulary: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", light: "bg-purple-100" },
  Spelling: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", light: "bg-teal-100" },
  "Grammar & Language Conventions": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", light: "bg-orange-100" },
  Writing: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", light: "bg-pink-100" },
};

/* ──────────────────────── Helpers ──────────────────────── */

function getScoreRingColor(percent: number) {
  if (percent >= 70) return "#059669";
  if (percent >= 50) return "#d97706";
  return "#dc2626";
}

function getHomeStrategies(section: string): string[] {
  const strategies: Record<string, string[]> = {
    "Reading Comprehension": [
      "Read together for 15–20 minutes daily and ask who/what/where/why questions",
      "Visit the local library weekly and let your child choose books they enjoy",
      "After reading, have your child retell the story in their own words",
    ],
    Vocabulary: [
      "Introduce 3 new words per week and use them in daily conversation",
      "Play word games like Scrabble Jr., Boggle, or crossword puzzles",
      "Encourage your child to keep a personal word journal",
    ],
    Spelling: [
      "Practice spelling words using look-say-cover-write-check method",
      "Use magnetic letters or letter tiles for hands-on practice",
      "Create fun spelling quizzes during car rides or meal prep",
    ],
    "Grammar & Language Conventions": [
      "Read books aloud and point out punctuation and sentence patterns",
      "Have your child write short daily journal entries and review them together",
      "Play sentence-building games using word cards",
    ],
    Writing: [
      "Encourage daily writing: stories, letters to family, or a diary",
      "Provide writing prompts like 'What would you do if…' to spark ideas",
      "Celebrate their writing by displaying it on the fridge or sharing with family",
    ],
  };
  return strategies[section] || ["Practice this skill area regularly at home."];
}

function getSchoolStrategies(section: string): string[] {
  const strategies: Record<string, string[]> = {
    "Reading Comprehension": [
      "Request guided reading group placement at appropriate level",
      "Ask teacher for leveled readers to bring home for practice",
    ],
    Vocabulary: [
      "Request vocabulary enrichment activities from teacher",
      "Coordinate with teacher on grade-level word lists",
    ],
    Spelling: [
      "Request differentiated spelling word lists based on skill level",
      "Ask about available spelling intervention programs",
    ],
    "Grammar & Language Conventions": [
      "Request additional grammar worksheets or activities for home practice",
      "Ask about small-group grammar instruction opportunities",
    ],
    Writing: [
      "Request writing rubrics so your child understands expectations",
      "Ask about writing tutoring or workshop opportunities",
    ],
  };
  return strategies[section] || ["Coordinate with teacher for targeted support."];
}

/* ──────────────────────── Component ──────────────────────── */

export default function ELAResults() {
  const { grade } = useParams();
  const navigate = useNavigate();
  const gradeNum = grade?.replace("grade-", "") || "";
  const [result, setResult] = useState<ELAResultData | null>(null);
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem(`ela-results-grade-${gradeNum}`);
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      const old = localStorage.getItem(`ela-test-grade-${gradeNum}`);
      if (old) {
        const parsed = JSON.parse(old);
        setResult({
          studentName: "Student",
          gradeLevel: gradeNum,
          completedAt: parsed.completedAt || new Date().toISOString(),
          overallPercent: parsed.percentage || 0,
          overallCorrect: parsed.correct || 0,
          overallTotal: parsed.total || 0,
          tier: parsed.percentage >= 70 ? "Tier 1" : parsed.percentage >= 50 ? "Tier 2" : "Tier 3",
          sectionBreakdown: [],
          priorities: [],
          answers: parsed.answers || {},
        });
      }
    }
  }, [gradeNum]);

  const handlePrint = () => window.print();
  const handleDownload = () => window.print();
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied! Share with a parent or guardian.");
  };

  const toggleCommitment = (key: string) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <p className="text-lg font-medium text-slate-700 mb-4">No ELA results found for Grade {gradeNum}</p>
          <Button onClick={() => navigate("/diagnostics/ela")}>Back to ELA Hub</Button>
        </Card>
      </div>
    );
  }

  const scoreColor = getScoreRingColor(result.overallPercent);
  const overallTier = getTierFromScore(result.overallPercent);
  const tierCfg = TIER_LABELS[overallTier];
  const weakSections = [...result.sectionBreakdown]
    .sort((a, b) => a.percent - b.percent)
    .filter((s) => s.percent < 70)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <DEBsHeader subtitle="ELA Diagnostic Results" />

      {/* Action Bar */}
      <div className="print:hidden border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleShare} className="text-xs">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={handleDownload} className="bg-[#1C2D5A] hover:bg-[#1C2D5A]/90 text-white">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/diagnostics/ela/grade-${gradeNum}`)} className="border-[#D72638] text-[#D72638] hover:bg-red-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Retake Test
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* ══════════════ CERTIFICATE HEADER ══════════════ */}
        <Card className="border-2 border-[#1C2D5A] overflow-hidden">
          <div className="bg-[#1C2D5A] text-white px-6 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#FFDE59] font-semibold mb-1">D.E.Bs LEARNING ACADEMY</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TEST RESULT CERTIFICATE</h1>
            <p className="text-xs text-white/70 mt-1">Unlocking Brilliance Through Learning</p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Student Name</p>
                <p className="text-lg font-bold text-[#1C2D5A]">{result.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Grade Level</p>
                <p className="text-lg font-bold text-[#1C2D5A]">Grade {result.gradeLevel}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Test Type</p>
                <p className="text-lg font-bold text-[#1C2D5A]">ELA Diagnostic</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Date Completed</p>
                <p className="text-lg font-bold text-[#1C2D5A]">
                  {new Date(result.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Score + Tier Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6 border-t border-b border-slate-200">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10" strokeDasharray={`${(result.overallPercent / 100) * 327} 327`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black" style={{ color: scoreColor }}>{result.overallPercent}%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">Overall</span>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm text-slate-500 mb-1">{result.overallCorrect} of {result.overallTotal} questions correct</p>
                <div className="mb-2">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${tierCfg.badgeClass}`}>
                    {result.tier}
                  </span>
                </div>
                <p className="text-xs font-medium">{tierCfg.label}</p>
                <p className="text-xs text-slate-400 mt-1">{tierCfg.helper}</p>
              </div>
            </div>

            {/* Insight box */}
            <InsightBox score={result.overallPercent} />

            {/* Desktop CTA */}
            <div className="mt-6 print:hidden">
              <RecommendedNextStepPanel overallScore={result.overallPercent} />
            </div>
          </CardContent>
        </Card>

        {/* ══════════════ PLACEMENT PATHWAY ══════════════ */}
        <PlacementPathwayCard overallScore={result.overallPercent} />

        {/* ══════════════ SECTION CARDS ══════════════ */}
        {result.sectionBreakdown.length > 0 ? (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Section-by-Section Breakdown
            </h2>

            {/* Classification blocks */}
            <TierClassificationBlocks sections={result.sectionBreakdown} />

            {SECTION_ORDER.map((sectionName) => {
              const section = result.sectionBreakdown.find((s) => s.section === sectionName);
              if (!section) return null;
              const colors = SECTION_COLORS[sectionName] || SECTION_COLORS["Reading Comprehension"];
              const icon = SECTION_ICONS[sectionName];

              return (
                <Card key={sectionName} className={`${colors.border} border overflow-hidden`}>
                  <div className={`${colors.bg} px-5 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`${colors.light} p-2 rounded-lg ${colors.text}`}>{icon}</div>
                      <div>
                        <h3 className={`font-bold text-lg ${colors.text}`}>{sectionName}</h3>
                        <p className="text-xs text-slate-500">{section.correct}/{section.total} correct</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${colors.text}`}>{section.percent}%</span>
                      <TierStatusBadge score={section.percent} />
                    </div>
                  </div>

                  <div className="px-5 pt-3">
                    <Progress value={section.percent} className="h-2.5" style={{ "--tw-progress-color": section.percent >= 70 ? "#059669" : section.percent >= 50 ? "#d97706" : "#dc2626" } as React.CSSProperties} />
                  </div>

                  {/* Insight Box */}
                  <div className="px-5">
                    <InsightBox score={section.percent} />
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">📋 Recommended Next Step</p>
                      <p className="text-sm text-slate-800">{section.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-800 font-medium">Section breakdown not available for this result.</p>
            <p className="text-sm text-amber-600 mt-1">This may be from an older test format. Retake the test for a full sectioned report.</p>
          </Card>
        )}

        {/* ══════════════ PARENT PRIORITY FOCUS ══════════════ */}
        {weakSections.length > 0 && (
          <Card className="border-2 border-[#FFDE59] overflow-hidden">
            <div className="bg-[#FFDE59] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
                <Home className="h-5 w-5" /> Priority Focus for the Next 6–8 Weeks
              </h2>
              <p className="text-sm text-[#1C2D5A]/70 mt-1">Based on your child's results, here are the top areas to focus on</p>
            </div>

            <CardContent className="p-6 space-y-6">
              {weakSections.map((section, idx) => {
                const homeStrats = getHomeStrategies(section.section);
                const schoolStrats = getSchoolStrategies(section.section);

                return (
                  <div key={section.section} className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#1C2D5A]">Priority #{idx + 1}: {section.section}</h3>
                      <TierStatusBadge score={section.percent} />
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Current score: <strong>{section.percent}%</strong> — {section.recommendation}</p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs font-bold text-blue-700 uppercase mb-2">🏠 Home Strategies</p>
                        <ul className="space-y-2">
                          {homeStrats.map((s, i) => (
                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-xs font-bold text-purple-700 uppercase mb-2">🏫 School Support</p>
                        <ul className="space-y-2">
                          {schoolStrats.map((s, i) => (
                            <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Parent Commitment Checklist */}
              <div className="border-t border-slate-200 pt-5">
                <h3 className="font-bold text-[#1C2D5A] mb-3 flex items-center gap-2">✅ Parent Commitment Checklist</h3>
                <p className="text-sm text-slate-500 mb-4">Check off commitments you'd like to focus on over the next 6–8 weeks:</p>
                <div className="space-y-3">
                  {[
                    "I will read with my child for at least 15 minutes daily",
                    "I will review my child's schoolwork and provide feedback weekly",
                    "I will communicate with my child's teacher about progress monthly",
                    "I will provide a quiet, dedicated space for homework and practice",
                    "I will celebrate my child's progress and effort regularly",
                    "I will limit screen time and encourage educational activities",
                  ].map((commitment, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <Checkbox checked={commitments[`c-${i}`] || false} onCheckedChange={() => toggleCommitment(`c-${i}`)} className="mt-0.5" />
                      <span className="text-sm text-slate-700">{commitment}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ TIER EXPLANATION ══════════════ */}
        <Card className="border-[#1C2D5A] border-2 overflow-hidden">
          <div className="bg-[#1C2D5A] px-6 py-4 text-center">
            <h2 className="text-xl font-bold text-white">{result.tier} Action Plan</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className={`p-4 rounded-lg border ${tierCfg.borderClass} ${tierCfg.bgClass}`}>
              <p className={`font-bold text-base ${tierCfg.textClass} mb-1`}>{tierCfg.label}</p>
              <p className={`text-sm ${tierCfg.textClass}`}>{tierCfg.helper}</p>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <p className="text-xs text-slate-500">
                <strong>Contact D.E.Bs LEARNING ACADEMY</strong><br />
                📧 info@debslearnacademy.com | 📞 347-364-1906
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA (mobile repeat) */}
        <div className="print:hidden sm:hidden">
          <RecommendedNextStepPanel overallScore={result.overallPercent} />
        </div>

        {/* Bottom Actions */}
        <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-center pb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print Result
          </Button>
          <Button onClick={handleDownload} className="gap-2 bg-[#1C2D5A] hover:bg-[#1C2D5A]/90 text-white">
            <Download className="h-4 w-4" /> Download / Print Result
          </Button>
          <Button variant="outline" onClick={() => navigate(`/diagnostics/ela/grade-${gradeNum}`)} className="gap-2 border-[#D72638] text-[#D72638] hover:bg-red-50">
            <RefreshCw className="h-4 w-4" /> Retake Test
          </Button>
        </div>
      </main>
    </div>
  );
}
