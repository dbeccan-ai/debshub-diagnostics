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
      percent >= 85 ? "Mastered" : percent >= 70 ? "Developing" : "Support Needed";

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
  mastered,
  needsSupport,
  developing,
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

  const toggleCommitment = (key: string) => {
    setCommitments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (sections.length === 0) return null;

  const weakSections = [...sections]
    .sort((a, b) => a.percent - b.percent)
    .filter((s) => s.status !== "Mastered")
    .slice(0, 3);

  // Build overall individual skill lists
  const allSkillEntries = Object.entries(skillStats);
  const overallMastered = allSkillEntries.filter(([, s]) => s.percentage >= 70).map(([k]) => k);
  const overallDeveloping = allSkillEntries.filter(([, s]) => s.percentage >= 50 && s.percentage < 70).map(([k]) => k);
  const overallNeedsSupport = allSkillEntries.filter(([, s]) => s.percentage < 50).map(([k]) => k);
  const otherSkills = allSkillEntries
    .filter(([, s]) => s.percentage >= 70 && s.percentage < 85)
    .map(([k]) => k);

  // Focus areas from weakest skills
  const focusAreas = allSkillEntries
    .filter(([, s]) => s.percentage < 70)
    .sort((a, b) => a[1].percentage - b[1].percentage)
    .map(([k]) => k);

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
              <p className="text-slate-500 text-xs">Tier</p>
              <Badge className={`text-base px-4 py-1 ${getTierColor(tier)}`}>{tier}</Badge>
            </div>
          </div>

          {/* Skills Assessed Block (matching math diagnostic style) */}
          <div className="mt-6 border-t border-slate-200 pt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Skills Assessed in This Diagnostic</h3>
              <p className="text-sm text-slate-600 mb-3">
                This diagnostic test assessed your student's understanding of {allSkillEntries.length} skills:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {allSkillEntries.map(([skill]) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Needs academic support */}
            {overallNeedsSupport.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800 mb-2">Your student needs academic support with:</p>
                <ul className="space-y-1.5">
                  {overallNeedsSupport.map((skill, i) => {
                    const stats = skillStats[skill];
                    return (
                      <li key={i} className="text-red-700 flex items-start gap-2">
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>{skill}</strong>
                          {stats && <span className="text-red-600 text-xs ml-1">({stats.correct}/{stats.total} correct, {stats.percentage}%)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Developing understanding */}
            {overallDeveloping.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-semibold text-amber-800 mb-2">Your student is developing understanding of:</p>
                <ul className="space-y-1.5">
                  {overallDeveloping.map((skill, i) => {
                    const stats = skillStats[skill];
                    return (
                      <li key={i} className="text-amber-700 flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>{skill}</strong>
                          {stats && <span className="text-amber-600 text-xs ml-1">({stats.correct}/{stats.total} correct, {stats.percentage}%)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Demonstrated mastery */}
            {overallMastered.length > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="font-semibold text-emerald-800 mb-2">Your student has demonstrated mastery of:</p>
                <ul className="space-y-1.5">
                  {overallMastered.map((skill, i) => {
                    const stats = skillStats[skill];
                    return (
                      <li key={i} className="text-emerald-700 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>{skill}</strong>
                          {stats && <span className="text-emerald-600 text-xs ml-1">({stats.correct}/{stats.total} correct, {stats.percentage}%)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
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

          <div className="flex items-center gap-6 text-sm">
            <span className="text-emerald-700 font-semibold">Correct: {correctAnswers} ({score}%)</span>
            <span className="text-red-700 font-semibold">Incorrect: {incorrectAnswers} ({totalQuestions ? Math.round((incorrectAnswers / totalQuestions) * 100 * 10) / 10 : 0}%)</span>
          </div>

          {/* Overall skill classification */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" /> Skills Mastered (70%+)
              </h3>
              {overallMastered.length > 0 ? (
                <ul className="space-y-1.5">
                  {overallMastered.map((skill, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-center gap-2">
                      <span className="font-medium">✓</span> {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600 italic">Keep practicing — mastery is within reach!</p>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4" /> Needs Additional Support (&lt;50%)
              </h3>
              {overallNeedsSupport.length > 0 ? (
                <ul className="space-y-1.5">
                  {overallNeedsSupport.map((skill, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                      <span className="font-medium">✗</span> {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No skills below 50% — great effort!</p>
              )}
            </div>
          </div>

          {overallDeveloping.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" /> Skills In Progress (50-69%)
              </h3>
              <ul className="space-y-1.5">
                {overallDeveloping.map((skill, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                    <span className="font-medium">→</span> {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skill-by-Skill Performance Table */}
          <div>
            <h3 className="text-sm font-bold text-[#1C2D5A] mb-3">📊 Skill-by-Skill Performance</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Topic</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(skillStats)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([skill, stats], i) => {
                      const pct = stats.percentage;
                      const rowColor = pct >= 70 ? "" : pct >= 50 ? "bg-amber-50" : "bg-red-50";
                      return (
                        <tr key={skill} className={`border-t border-slate-100 ${rowColor}`}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{skill}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`font-semibold ${pct >= 70 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>
                              {stats.correct}/{stats.total} ({pct}%)
                            </span>
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
          {tier === "Tier 1" && (
            <>
              <p><strong className="text-emerald-700">Congratulations!</strong> Your student has mastered the topics covered in this ELA diagnostic test and is ready for advanced reading and writing activities.</p>
              <div>
                <p className="font-bold text-[#1C2D5A]">What This Means:</p>
                <p>Your student has demonstrated mastery of grade-level ELA skills.</p>
              </div>
            </>
          )}
          {tier === "Tier 2" && (
            <>
              <p>Your student is performing at or near grade level in ELA. Focus on the specific skills listed above that need additional practice.</p>
              <div>
                <p className="font-bold text-[#1C2D5A]">What This Means:</p>
                <p>With targeted practice, your student can quickly reach mastery. Consistent daily reading and writing practice is recommended.</p>
              </div>
            </>
          )}
          {tier === "Tier 3" && (
            <>
              <p>Your student needs focused support in the ELA skills listed above. Consistent practice will help build foundational understanding.</p>
              <div>
                <p className="font-bold text-[#1C2D5A]">What This Means:</p>
                <p>Immediate intervention and daily practice are recommended. Consider enrolling in our tutoring programme for structured support.</p>
              </div>
            </>
          )}

          <div>
            <h3 className="font-bold text-[#1C2D5A] flex items-center gap-2 mb-2">📋 Recommended Next Steps</h3>
            {tier === "Tier 1" ? (
              <p>Your child is performing above grade level in ELA. Continue challenging them with advanced reading materials and creative writing opportunities.</p>
            ) : tier === "Tier 2" ? (
              <p>Your child is close to mastery. Register for our 10-session tutoring programme for targeted ELA support. Diagnostic retests at sessions 5 and 10 to track progress.</p>
            ) : (
              <p>Your child needs focused support. Register for our 15-session tutoring programme for comprehensive ELA intervention. Diagnostic retests at sessions 7, 10, and 15 to monitor growth.</p>
            )}
          </div>

          {focusAreas.length > 0 && (
            <div>
              <h3 className="font-bold text-[#1C2D5A] mb-2">Focus Areas:</h3>
              <p>We recommend prioritizing these skills for additional practice: <strong>{focusAreas.join(", ")}</strong>.</p>
            </div>
          )}

          {/* Per-section score table */}
          <div>
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">ELA Section</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Score</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.section} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.section}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        <span className={s.percent >= 85 ? "text-emerald-700" : s.percent >= 70 ? "text-amber-700" : "text-red-700"}>
                          {s.correct}/{s.total} ({s.percent}%)
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">{getStatusBadge(s.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="font-bold text-[#1C2D5A] mb-1">Contact D.E.Bs LEARNING ACADEMY</p>
            <p className="text-xs text-slate-500">📧 Email: info@debslearnacademy.com | 📞 Phone: 347-364-1906</p>
            <p className="text-xs text-slate-500">🌐 Website: www.debslearnacademy.com</p>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════ SECTION-BY-SECTION BREAKDOWN ══════════════════ */}
      <h2 className="text-xl font-bold text-[#1C2D5A] flex items-center gap-2">
        <BookOpen className="h-5 w-5" /> ELA Section-by-Section Breakdown
      </h2>

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

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-2">
        <p>D.E.Bs LEARNING ACADEMY – Unlocking Brilliance Through Learning</p>
        <p>Report Generated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
