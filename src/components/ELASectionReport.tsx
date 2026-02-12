import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Target,
  Home,
  Award,
  Share2,
  Download,
} from "lucide-react";
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

interface SkillStat {
  total: number;
  correct: number;
  percentage: number;
}

interface SectionResult {
  section: string;
  correct: number;
  total: number;
  percent: number;
  status: "Mastered" | "Developing" | "Support Needed";
  masteredSkills: string[];
  supportSkills: string[];
  developingSkills: string[];
  recommendation: string;
}

interface Props {
  skillStats: Record<string, SkillStat>;
  mastered: string[];
  needsSupport: string[];
  developing: string[];
  tier: string | null;
  studentName: string;
  gradLevel: number | null;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number | null;
  correctAnswers: number | null;
  testName: string;
}

/* ──────────────────────── Section mapping ──────────────────────── */

const ELA_SECTIONS = [
  "Reading Comprehension",
  "Vocabulary",
  "Spelling",
  "Grammar & Language Conventions",
  "Writing",
];

function mapSkillToSection(skill: string): string {
  const s = skill.toLowerCase();
  if (s.includes("reading") || s.includes("comprehension") || s.includes("main idea") || s.includes("inference") || s.includes("summary") || s.includes("author") || s.includes("passage") || s.includes("text structure") || s.includes("central idea") || s.includes("literary") || s.includes("rhetoric") || s.includes("theme") || s.includes("character") || s.includes("plot") || s.includes("setting") || s.includes("point of view") || s.includes("compare") || s.includes("story") || s.includes("detail"))
    return "Reading Comprehension";
  if (s.includes("vocab") || s.includes("synonym") || s.includes("antonym") || s.includes("context clue") || s.includes("word meaning") || s.includes("word structure") || s.includes("prefix") || s.includes("suffix") || s.includes("root") || s.includes("figurative") || s.includes("idiom") || s.includes("connotation") || s.includes("denotation") || s.includes("word") || s.includes("definition") || s.includes("meaning"))
    return "Vocabulary";
  if (s.includes("spell") || s.includes("homophone") || s.includes("homograph"))
    return "Spelling";
  if (s.includes("grammar") || s.includes("punctuation") || s.includes("verb") || s.includes("subject") || s.includes("pronoun") || s.includes("adjective") || s.includes("adverb") || s.includes("sentence") || s.includes("clause") || s.includes("conjunction") || s.includes("tense") || s.includes("agreement") || s.includes("capitalization") || s.includes("comma") || s.includes("apostrophe") || s.includes("possessive") || s.includes("parts of speech") || s.includes("modifier") || s.includes("contraction"))
    return "Grammar & Language Conventions";
  if (s.includes("writ") || s.includes("essay") || s.includes("narrative") || s.includes("opinion") || s.includes("persuasive") || s.includes("argument") || s.includes("composition") || s.includes("paragraph") || s.includes("draft"))
    return "Writing";
  return "Grammar & Language Conventions";
}

function buildSectionResults(skillStats: Record<string, SkillStat>): SectionResult[] {
  const sectionMap: Record<string, { correct: number; total: number; skills: Record<string, SkillStat> }> = {};
  ELA_SECTIONS.forEach((s) => { sectionMap[s] = { correct: 0, total: 0, skills: {} }; });

  Object.entries(skillStats).forEach(([skill, stats]) => {
    const section = mapSkillToSection(skill);
    if (!sectionMap[section]) sectionMap[section] = { correct: 0, total: 0, skills: {} };
    sectionMap[section].correct += stats.correct;
    sectionMap[section].total += stats.total;
    sectionMap[section].skills[skill] = stats;
  });

  return ELA_SECTIONS.map((sectionName) => {
    const data = sectionMap[sectionName];
    const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const status: "Mastered" | "Developing" | "Support Needed" =
      percent >= 70 ? "Mastered" : percent >= 50 ? "Developing" : "Support Needed";

    const masteredSkills: string[] = [];
    const supportSkills: string[] = [];
    const developingSkills: string[] = [];
    Object.entries(data.skills).forEach(([skill, st]) => {
      const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
      if (pct >= 70) masteredSkills.push(skill);
      else if (pct >= 50) developingSkills.push(skill);
      else supportSkills.push(skill);
    });

    return {
      section: sectionName,
      correct: data.correct,
      total: data.total,
      percent,
      status,
      masteredSkills,
      supportSkills,
      developingSkills,
      recommendation:
        status === "Mastered"
          ? "Spiral review weekly to retain mastery."
          : status === "Developing"
          ? "Reinforce 2–3 times weekly until stable."
          : "Immediate reteach + guided practice required.",
    };
  }).filter((s) => s.total > 0);
}

/* ──────────────────────── Styling helpers ──────────────────────── */

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

function getTierColor(tier: string | null) {
  switch (tier) {
    case "Tier 1": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Tier 2": return "bg-amber-100 text-amber-800 border-amber-300";
    case "Tier 3": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-slate-100 text-slate-800 border-slate-300";
  }
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

export default function ELASectionReport({
  skillStats,
  tier,
  studentName,
  gradLevel,
  completedAt,
  score,
  totalQuestions,
  correctAnswers,
  testName,
}: Props) {
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});
  const sections = buildSectionResults(skillStats);
  const incorrectAnswers = (totalQuestions || 0) - (correctAnswers || 0);
  const overallScore = score || 0;
  const overallTier = getTierFromScore(overallScore);
  const tierCfg = TIER_LABELS[overallTier];

  const toggleCommitment = (key: string) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied! Share this with a parent or guardian.");
  };

  if (sections.length === 0) return null;

  const weakSections = [...sections]
    .sort((a, b) => a.percent - b.percent)
    .filter((s) => s.percent < 70)
    .slice(0, 3);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* ══════════════════ CERTIFICATE HEADER ══════════════════ */}
      <Card className="border-2 border-[#1C2D5A] overflow-hidden">
        <div className="bg-[#1C2D5A] text-white text-center py-6 px-4">
          <p className="text-sm font-medium tracking-widest uppercase opacity-80">D.E.Bs LEARNING ACADEMY</p>
          <p className="text-xs italic opacity-60 mt-1">Unlocking Brilliance Through Learning</p>
          <h1 className="text-2xl font-black mt-4 tracking-wide">TEST RESULT CERTIFICATE</h1>
        </div>
        <CardContent className="p-6">
          {/* Top-right actions */}
          <div className="flex justify-end gap-2 mb-4 print:hidden">
            <Button size="sm" variant="outline" onClick={handleShare} className="text-xs">
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share with Parent/Guardian
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF Report
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Student Name</p>
              <p className="font-bold text-[#1C2D5A] text-lg">{studentName}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Grade Level</p>
              <p className="font-bold text-[#1C2D5A] text-lg">Grade {gradLevel}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Test Type</p>
              <p className="font-bold text-[#1C2D5A]">{testName}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Date Completed</p>
              <p className="font-bold text-[#1C2D5A]">
                {completedAt ? new Date(completedAt).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Score</p>
              <p className="font-black text-3xl text-[#1C2D5A]">{score}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Tier Placement</p>
              <Badge className={`text-base px-4 py-1 ${getTierColor(tier)}`}>{tier}</Badge>
              <p className="text-xs mt-1">{tierCfg.label}</p>
            </div>
          </div>

          {/* ELA Section Classification Blocks */}
          <div className="mt-6 border-t border-slate-200 pt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Skills Assessed in This Diagnostic</h3>
              <p className="text-sm text-slate-600 mb-3">
                This diagnostic test assessed your student's understanding of {sections.length} ELA skill areas:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {sections.map((s) => (
                  <Badge key={s.section} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                    {s.section}
                  </Badge>
                ))}
              </div>
            </div>

            <TierClassificationBlocks sections={sections} />
          </div>

          {/* Desktop CTA after score summary */}
          <div className="mt-6 print:hidden">
            <RecommendedNextStepPanel overallScore={overallScore} />
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════ DETAILED SKILLS ANALYSIS ══════════════════ */}
      <Card className="border-slate-200">
        <div className="bg-[#1C2D5A] text-white px-6 py-4">
          <p className="text-sm font-medium tracking-widest uppercase opacity-80">D.E.Bs LEARNING ACADEMY</p>
          <p className="text-xs italic opacity-60 mt-0.5">Unlocking Brilliance Through Learning</p>
          <h2 className="text-xl font-black mt-3">DETAILED SKILLS ANALYSIS REPORT</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* Correct / Incorrect / Total summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-3xl font-black text-emerald-700">{correctAnswers}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Correct Answers</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-3xl font-black text-red-700">{incorrectAnswers}</p>
              <p className="text-xs text-red-600 font-medium mt-1">Incorrect Answers</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-3xl font-black text-slate-700">{totalQuestions}</p>
              <p className="text-xs text-slate-600 font-medium mt-1">Total Questions</p>
            </div>
          </div>

          {/* Overall ELA section classification with new labels */}
          <div className="space-y-4">
            <TierClassificationBlocks sections={sections} />
          </div>

          {/* Section-by-Section Performance Table */}
          <div>
            <h3 className="text-sm font-bold text-[#1C2D5A] mb-3">📊 Section-by-Section Performance</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">ELA Section</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Score</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Status</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700 hidden sm:table-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => {
                    const sTier = getTierFromScore(s.percent);
                    return (
                      <tr key={s.section} className={`border-t border-slate-100 ${TIER_LABELS[sTier].bgClass}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{s.section}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-semibold ${TIER_LABELS[sTier].textClass}`}>
                            {s.correct}/{s.total} ({s.percent}%)
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <TierStatusBadge score={s.percent} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 italic hidden sm:table-cell">
                          {s.recommendation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════ TIER EXPLANATION & NEXT STEPS ══════════════════ */}
      <Card className="border-slate-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <p className="text-xs text-slate-500 font-medium">D.E.Bs LEARNING ACADEMY – Unlocking Brilliance Through Learning</p>
          <h2 className="text-lg font-bold text-[#1C2D5A] mt-1">Understanding Your {tier} Placement</h2>
        </div>
        <CardContent className="p-6 space-y-4 text-sm text-slate-700">
          <div className={`p-4 rounded-lg border ${tierCfg.borderClass} ${tierCfg.bgClass}`}>
            <p className={`font-bold text-base ${tierCfg.textClass} mb-1`}>{tierCfg.label}</p>
            <p className={`text-sm ${tierCfg.textClass}`}>{tierCfg.helper}</p>
          </div>

          {sections.filter((s) => s.percent < 70).length > 0 && (
            <div>
              <h3 className="font-bold text-[#1C2D5A] mb-2">Focus Areas:</h3>
              <p>We recommend prioritizing these ELA sections for additional practice: <strong>{sections.filter((s) => s.percent < 70).sort((a, b) => a.percent - b.percent).map((s) => s.section).join(", ")}</strong>.</p>
            </div>
          )}

          {/* Contact */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="font-bold text-[#1C2D5A] mb-1">Contact D.E.Bs LEARNING ACADEMY</p>
            <p className="text-xs text-slate-500">📧 Email: info@debslearnacademy.com | 📞 Phone: 347-364-1906</p>
            <p className="text-xs text-slate-500">🌐 Website: www.debslearnacademy.com</p>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════ PLACEMENT PATHWAY ══════════════════ */}
      <PlacementPathwayCard overallScore={overallScore} />

      {/* ══════════════════ SECTION-BY-SECTION BREAKDOWN ══════════════════ */}
      <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
        <BookOpen className="h-5 w-5" /> ELA Section-by-Section Breakdown
      </h2>

      {ELA_SECTIONS.map((sectionName) => {
        const section = sections.find((s) => s.section === sectionName);
        if (!section) return null;
        const colors = SECTION_COLORS[sectionName] || SECTION_COLORS["Reading Comprehension"];
        const icon = SECTION_ICONS[sectionName];
        const sectionTier = getTierFromScore(section.percent);

        return (
          <Card key={sectionName} className={`${colors.border} border overflow-hidden`}>
            <div className={`${colors.bg} px-5 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`${colors.light} p-2 rounded-lg ${colors.text}`}>{icon}</div>
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{sectionName}</h3>
                  <p className="text-xs text-slate-500">
                    {section.correct}/{section.total} correct
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${colors.text}`}>{section.percent}%</span>
                <TierStatusBadge score={section.percent} />
              </div>
            </div>

            <div className="px-5 pt-3">
              <Progress value={section.percent} className="h-2.5" />
            </div>

            {/* Insight Box */}
            <div className="px-5">
              <InsightBox score={section.percent} />
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Skill-by-skill rows for this section */}
              {Object.entries(buildSectionResults(skillStats).find(s => s.section === sectionName)?.masteredSkills || {}).length > 0 || true ? (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Individual Skills</p>
                  {Object.entries(skillStats)
                    .filter(([skill]) => mapSkillToSection(skill) === sectionName)
                    .map(([skill, stats]) => (
                      <SkillRow key={skill} skill={skill} correct={stats.correct} total={stats.total} percentage={stats.percentage} />
                    ))
                  }
                </div>
              ) : null}

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  📋 Recommended Next Step
                </p>
                <p className="text-sm text-slate-800">{section.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ══════════════════ PARENT PRIORITY FOCUS ══════════════════ */}
      {weakSections.length > 0 && (
        <Card className="border-2 border-[#FFDE59] overflow-hidden">
          <div className="bg-[#FFDE59] px-6 py-4">
            <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
              <Home className="h-5 w-5" /> Priority Focus for the Next 6–8 Weeks
            </h2>
            <p className="text-sm text-[#1C2D5A]/70 mt-1">
              Based on your child's results, here are the top areas to focus on
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {weakSections.map((section, idx) => {
              const homeStrats = getHomeStrategies(section.section);
              const schoolStrats = getSchoolStrategies(section.section);

              return (
                <div key={section.section} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#1C2D5A]">
                      Priority #{idx + 1}: {section.section}
                    </h3>
                    <TierStatusBadge score={section.percent} />
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Current score: <strong>{section.percent}%</strong> — {section.recommendation}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-2">🏠 Home Strategies</p>
                      <ul className="space-y-2">
                        {homeStrats.map((s, i) => (
                          <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs font-bold text-purple-700 uppercase mb-2">🏫 School Support</p>
                      <ul className="space-y-2">
                        {schoolStrats.map((s, i) => (
                          <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />
                            {s}
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
              <h3 className="font-bold text-[#1C2D5A] mb-3 flex items-center gap-2">
                ✅ Parent Commitment Checklist
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Check off commitments you'd like to focus on over the next 6–8 weeks:
              </p>
              <div className="space-y-3">
                {[
                  "I will read with my child for at least 15 minutes daily",
                  "I will review my child's schoolwork and provide feedback weekly",
                  "I will communicate with my child's teacher about progress monthly",
                  "I will provide a quiet, dedicated space for homework and practice",
                  "I will celebrate my child's progress and effort regularly",
                  "I will limit screen time and encourage educational activities",
                ].map((commitment, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={commitments[`c-${i}`] || false}
                      onCheckedChange={() => toggleCommitment(`c-${i}`)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-slate-700">{commitment}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════ BOTTOM CTA (mobile repeat) ══════════════════ */}
      <div className="print:hidden sm:hidden">
        <RecommendedNextStepPanel overallScore={overallScore} />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-2">
        <p>D.E.Bs LEARNING ACADEMY – Unlocking Brilliance Through Learning</p>
        <p>Report Generated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
