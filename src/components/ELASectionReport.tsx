import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";

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
      percent >= 85 ? "Mastered" : percent >= 70 ? "Developing" : "Support Needed";

    const masteredSkills: string[] = [];
    const supportSkills: string[] = [];
    Object.entries(data.skills).forEach(([skill, st]) => {
      const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
      if (pct >= 85) masteredSkills.push(skill);
      else if (pct < 70) supportSkills.push(skill);
    });

    return {
      section: sectionName,
      correct: data.correct,
      total: data.total,
      percent,
      status,
      masteredSkills,
      supportSkills,
      recommendation:
        status === "Mastered"
          ? "Maintain with weekly reinforcement."
          : status === "Developing"
          ? "Targeted practice 2–3 times per week."
          : "Immediate focused intervention recommended.",
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

function getStatusBadge(status: string) {
  switch (status) {
    case "Mastered":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
        </Badge>
      );
    case "Developing":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> Developing
        </Badge>
      );
    case "Support Needed":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 gap-1">
          <XCircle className="h-3.5 w-3.5" /> Support Needed
        </Badge>
      );
    default:
      return null;
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

export default function ELASectionReport({ skillStats, tier }: Props) {
  const [commitments, setCommitments] = useState<Record<string, boolean>>({});
  const sections = buildSectionResults(skillStats);

  const toggleCommitment = (key: string) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (sections.length === 0) return null;

  const weakSections = [...sections]
    .sort((a, b) => a.percent - b.percent)
    .filter((s) => s.status !== "Mastered")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
        <BookOpen className="h-5 w-5" /> ELA Section-by-Section Breakdown
      </h2>

      {/* ── Section Cards ── */}
      {ELA_SECTIONS.map((sectionName) => {
        const section = sections.find((s) => s.section === sectionName);
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
                  <p className="text-xs text-slate-500">
                    {section.correct}/{section.total} correct
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${colors.text}`}>{section.percent}%</span>
                {getStatusBadge(section.status)}
              </div>
            </div>

            <div className="px-5 pt-3">
              <Progress value={section.percent} className="h-2.5" />
            </div>

            <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Skills Mastered
                </p>
                {section.masteredSkills.length > 0 ? (
                  <ul className="space-y-1.5">
                    {section.masteredSkills.map((skill, i) => (
                      <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-600 italic">Continue building these skills</p>
                )}
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Skills Requiring Support
                </p>
                {section.supportSkills.length > 0 ? (
                  <ul className="space-y-1.5">
                    {section.supportSkills.map((skill, i) => (
                      <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No additional support needed</p>
                )}
              </div>

              <div className="sm:col-span-2 bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  📋 Recommended Next Step
                </p>
                <p className="text-sm text-slate-800">{section.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Parent Priority Focus ── */}
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
                    {getStatusBadge(section.status)}
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
    </div>
  );
}
