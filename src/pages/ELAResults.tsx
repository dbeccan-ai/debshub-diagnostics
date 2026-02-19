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
  CheckCircle,
  XCircle,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Target,
  Award,
  RefreshCw,
  Share2,
  Home,
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
  "Reading Comprehension": <BookOpen className="h-4 w-4" />,
  Vocabulary: <GraduationCap className="h-4 w-4" />,
  Spelling: <Target className="h-4 w-4" />,
  "Grammar & Language Conventions": <TrendingUp className="h-4 w-4" />,
  Writing: <Award className="h-4 w-4" />,
};

/* ──────────────────────── Helpers ──────────────────────── */

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

function getCurriculumWeeks(section: string): Array<{ week: string; focus: string; activities: string[] }> {
  const curricula: Record<string, Array<{ week: string; focus: string; activities: string[] }>> = {
    "Reading Comprehension": [
      { week: "Week 1–2", focus: "Identifying Main Idea & Details", activities: ["Read short passages and highlight key sentences", "Complete graphic organizers for main idea vs. details", "Retell stories using 3 key points"] },
      { week: "Week 3–4", focus: "Making Inferences", activities: ["Use 'I think… because…' sentence frames", "Read picture books and predict outcomes", "Discuss character motivations"] },
      { week: "Week 5–6", focus: "Compare & Contrast", activities: ["Use Venn diagrams after reading two texts", "Write comparison paragraphs", "Discuss similarities between story themes"] },
    ],
    Vocabulary: [
      { week: "Week 1–2", focus: "Context Clues", activities: ["Identify unknown words in passages", "Use surrounding text to guess meaning", "Create personal dictionaries"] },
      { week: "Week 3–4", focus: "Root Words & Affixes", activities: ["Learn common prefixes (un-, re-, pre-)", "Build word families from root words", "Word sorts by prefix/suffix"] },
      { week: "Week 5–6", focus: "Synonyms & Antonyms", activities: ["Word matching games", "Thesaurus exploration activities", "Write sentences using new vocabulary pairs"] },
    ],
    Spelling: [
      { week: "Week 1–2", focus: "Phoneme-Grapheme Correspondence", activities: ["Sort words by spelling pattern", "Use look-say-cover-write-check", "Multi-sensory spelling (trace in sand, air writing)"] },
      { week: "Week 3–4", focus: "Common Word Families", activities: ["Group words by ending (-ight, -tion, -ous)", "Build words using onset and rime", "Spelling bingo with family word groups"] },
      { week: "Week 5–6", focus: "Spelling Rules Review", activities: ["Practice 'i before e' exceptions", "Drop-e and doubling rules for suffixes", "Mini spelling tests with self-correction"] },
    ],
    "Grammar & Language Conventions": [
      { week: "Week 1–2", focus: "Parts of Speech", activities: ["Identify nouns, verbs, adjectives in sentences", "Sort word cards by part of speech", "Mad Libs grammar games"] },
      { week: "Week 3–4", focus: "Sentence Structure", activities: ["Build compound sentences using conjunctions", "Fix run-on sentences", "Identify subject and predicate"] },
      { week: "Week 5–6", focus: "Punctuation & Capitalization", activities: ["Proofread passages for errors", "Write and punctuate dialogue correctly", "Capitalization rule sorting activities"] },
    ],
    Writing: [
      { week: "Week 1–2", focus: "Paragraph Structure", activities: ["Topic sentence practice", "Supporting detail identification", "Concluding sentence writing"] },
      { week: "Week 3–4", focus: "Descriptive & Narrative Writing", activities: ["Use sensory details in writing", "Story maps and graphic organizers", "Peer review of drafts"] },
      { week: "Week 5–6", focus: "Editing & Revision", activities: ["CUPS editing checklist (Capitalization, Usage, Punctuation, Spelling)", "Revise for clarity and flow", "Publish and celebrate finished pieces"] },
    ],
  };
  return curricula[section] || [
    { week: "Week 1–2", focus: "Foundation Review", activities: ["Revisit core concepts for this skill area", "Practice with targeted worksheets", "Build confidence through repetition"] },
    { week: "Week 3–4", focus: "Skill Building", activities: ["Introduce new strategies and approaches", "Apply skills to varied contexts", "Track progress weekly"] },
    { week: "Week 5–6", focus: "Mastery Practice", activities: ["Apply skills independently", "Self-assess and reflect on growth", "Share accomplishments with the family"] },
  ];
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
      const parsed: ELAResultData = JSON.parse(stored);
      // Filter out any sections with 0 total (shouldn't happen but guard anyway)
      if (parsed.sectionBreakdown) {
        parsed.sectionBreakdown = parsed.sectionBreakdown.filter(s => s.total > 0);
      }
      setResult(parsed);
    }
    // Note: old `ela-test-grade-X` format is no longer used — it didn't contain section data.
    // Users with old data will see the "retake test" prompt.
  }, [gradeNum]);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!result) return;
    const overallTier = getTierFromScore(result.overallPercent);
    const tierCfg = TIER_LABELS[overallTier];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>ELA Diagnostic Results – ${result.studentName}</title>
<style>
body{font-family:Georgia,serif;max-width:750px;margin:40px auto;padding:20px;color:#1C2D5A;}
h1{color:#1C2D5A;border-bottom:3px solid #FFDE59;padding-bottom:10px;}
h2{color:#1C2D5A;margin-top:28px;}
h3{color:#1C2D5A;margin-top:16px;}
li{margin:6px 0;line-height:1.6;}
table{width:100%;border-collapse:collapse;margin-top:12px;}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e2e8f0;}
th{background:#f8fafc;font-weight:bold;}
.badge{background:${overallTier === "green" ? "#059669" : overallTier === "yellow" ? "#d97706" : "#dc2626"};color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;display:inline-block;margin-bottom:8px;}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;font-size:13px;color:#64748b;}
a{color:#1C2D5A;}
@media print{body{margin:20px;}}
</style></head>
<body>
<p style="text-align:center;font-size:12px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">D.E.Bs LEARNING ACADEMY — Unlocking Brilliance Through Learning</p>
<h1>📋 ELA Diagnostic Results</h1>
<p><span class="badge">${tierCfg.badge} — ${tierCfg.label}</span></p>
<table>
  <tr><th>Student</th><td>${result.studentName}</td><th>Grade</th><td>Grade ${result.gradeLevel}</td></tr>
  <tr><th>Test Type</th><td>ELA Diagnostic</td><th>Date</th><td>${new Date(result.completedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</td></tr>
  <tr><th>Overall Score</th><td>${result.overallPercent}%</td><th>Correct</th><td>${result.overallCorrect} / ${result.overallTotal}</td></tr>
</table>
${result.sectionBreakdown.length > 0 ? `
<h2>Section Breakdown</h2>
<table>
  <thead><tr><th>Section</th><th>Score</th><th>Correct/Total</th><th>Status</th></tr></thead>
  <tbody>
    ${result.sectionBreakdown.map(s => `<tr><td>${s.section}</td><td>${s.percent}%</td><td>${s.correct}/${s.total}</td><td>${s.status}</td></tr>`).join("")}
  </tbody>
</table>` : ""}
<h2>📞 Next Steps</h2>
<ul>
  <li>📧 Email: <a href="mailto:info@debslearnacademy.com">info@debslearnacademy.com</a></li>
  <li>📞 Call: <a href="tel:+13473641906">347-364-1906</a></li>
  <li>🌐 Website: <a href="https://www.debslearnacademy.com">www.debslearnacademy.com</a></li>
</ul>
<div class="footer">
  <p><strong>D.E.Bs Learning Academy</strong> — Supporting every learner from foundational skills to academic excellence.</p>
  <p>Generated: ${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),400);}</script>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

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

  const overallTier = getTierFromScore(result.overallPercent);
  const tierCfg = TIER_LABELS[overallTier];
  const incorrectAnswers = result.overallTotal - result.overallCorrect;
  const weakSections = [...result.sectionBreakdown]
    .sort((a, b) => a.percent - b.percent)
    .filter((s) => s.percent < 66)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <DEBsHeader subtitle="ELA Diagnostic Results" />

      {/* ── Section 1: Header Bar ── */}
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={handleShare} className="text-xs">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" onClick={handleDownload} className="bg-slate-900 text-white hover:bg-slate-800">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/diagnostics/ela/grade-${gradeNum}`)} className="border-red-300 text-red-700 hover:bg-red-50">
              <RefreshCw className="mr-2 h-4 w-4" /> Retake Test
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">

        {/* ── Section 2: Score Overview Card ── */}
        <Card className="border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="mb-2 flex flex-col items-center gap-2">
              <Badge className={`text-lg px-4 py-1 ${tierCfg.badgeClass}`}>
                {tierCfg.badge}
              </Badge>
              <p className="text-xs font-medium">{tierCfg.label}</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">{result.overallPercent}%</p>
            <p className="text-sm text-slate-500 mt-1">
              {result.overallCorrect} of {result.overallTotal} questions correct
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{result.studentName}</p>
                <p className="text-xs text-slate-500">Student Name</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">ELA Diagnostic</p>
                <p className="text-xs text-slate-500">Test Type</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              <div>
                <p className="text-lg font-semibold text-slate-700">Grade {result.gradeLevel}</p>
                <p className="text-xs text-slate-500">Grade Level</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  {new Date(result.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>

            <InsightBox score={result.overallPercent} />

            <div className="mt-4 print:hidden">
              <RecommendedNextStepPanel overallScore={result.overallPercent} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-700">{result.overallCorrect}</p>
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
              <p className="text-2xl font-bold text-amber-700">{result.sectionBreakdown.length || SECTION_ORDER.length}</p>
              <p className="text-xs text-amber-600">Sections Tested</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Sections 4-6: Breakdown (only if data exists) ── */}
        {result.sectionBreakdown.length > 0 ? (
          <>
            {/* Section 4: Tier Classification Blocks */}
            <TierClassificationBlocks sections={result.sectionBreakdown} />

            {/* Section 5: Section-by-Section Performance */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Section-by-Section Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {SECTION_ORDER.map((sectionName) => {
                  const section = result.sectionBreakdown.find((s) => s.section === sectionName);
                  if (!section) return null;
                  const icon = SECTION_ICONS[sectionName];
                  return (
                    <div key={sectionName} className="space-y-2 py-4 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{icon}</span>
                          <span className="text-sm font-medium text-slate-800">{sectionName}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-500">{section.correct}/{section.total} ({section.percent}%)</span>
                          <TierStatusBadge score={section.percent} />
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${overallTier === "green" || getTierFromScore(section.percent) === "green" ? "bg-emerald-500" : getTierFromScore(section.percent) === "yellow" ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(section.percent, 100)}%` }}
                        />
                      </div>
                      {section.recommendation && (
                        <p className="text-xs text-slate-500 italic">{section.recommendation}</p>
                      )}
                      {/* Individual skill tags */}
                      {(section.masteredSkills?.length > 0 || section.supportSkills?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {section.masteredSkills?.map((skill, i) => (
                            <Badge key={`m-${i}`} variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                              ✓ {skill}
                            </Badge>
                          ))}
                          {section.supportSkills?.map((skill, i) => (
                            <Badge key={`s-${i}`} variant="outline" className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border-red-200">
                              ✗ {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Section 6: Skills Assessed Tags */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">Skills Assessed in This Diagnostic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>This diagnostic assessed your student's performance across {result.sectionBreakdown.length} ELA sections:</p>
                <div className="flex flex-wrap gap-2">
                  {result.sectionBreakdown.map((section) => (
                    <Badge key={section.section} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                      {SECTION_ICONS[section.section]} {section.section} — {section.percent}%
                    </Badge>
                  ))}
                </div>
                {/* Individual skills assessed across all sections */}
                {result.sectionBreakdown.some(s => (s.masteredSkills?.length || 0) + (s.supportSkills?.length || 0) > 0) && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Individual Skills Assessed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.sectionBreakdown.flatMap(s => [
                        ...(s.masteredSkills || []).map(skill => ({ skill, mastered: true })),
                        ...(s.supportSkills || []).map(skill => ({ skill, mastered: false })),
                      ]).map(({ skill, mastered }, i) => (
                        <Badge key={i} variant="outline" className={`text-[10px] px-2 py-0.5 ${mastered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {mastered ? "✓" : "✗"} {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-900 font-bold text-base mb-1">📋 Section Breakdown Not Available</p>
            <p className="text-sm text-amber-700 mt-1 mb-4">
              Your result was saved in an older format that doesn't include section-by-section data.
              Retake the test to see your full ELA breakdown — including section scores, skill tags, and priority focus areas.
            </p>
            <Button
              onClick={() => navigate(`/diagnostics/ela/grade-${gradeNum}`)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retake Test for Full Report
            </Button>
          </Card>
        )}

        {/* ── Section 7: Placement Pathway ── */}
        <PlacementPathwayCard overallScore={result.overallPercent} />

        {/* ── Section 8: Tier Explanation ── */}
        <Card className="border-slate-200">
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
            <div className="border-t border-slate-100 pt-4">
              <p className="font-bold text-[#1C2D5A] mb-1 text-sm">Contact D.E.Bs LEARNING ACADEMY</p>
              <p className="text-xs text-slate-600">
                📧{" "}
                <a href="mailto:info@debslearnacademy.com" className="text-blue-600 underline hover:text-blue-800">
                  info@debslearnacademy.com
                </a>{" "}
                | 📞{" "}
                <a href="tel:+13473641906" className="text-blue-600 underline hover:text-blue-800">
                  347-364-1906
                </a>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                🌐{" "}
                <a href="https://www.debslearnacademy.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                  www.debslearnacademy.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 9: Priority Focus for Next 6–8 Weeks ── */}
        {weakSections.length > 0 && (
          <Card className="border-2 border-amber-300 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
              <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Home className="h-5 w-5" /> Priority Focus for the Next 6–8 Weeks
              </h2>
              <p className="text-xs text-amber-700 mt-1">Based on your child's results, here are the top areas to focus on</p>
            </div>
            <CardContent className="p-6 space-y-6">
              {weakSections.map((section, idx) => {
                const homeStrats = getHomeStrategies(section.section);
                const schoolStrats = getSchoolStrategies(section.section);
                const curriculum = getCurriculumWeeks(section.section);

                return (
                  <div key={section.section} className="border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#1C2D5A]">
                        Priority #{idx + 1}: {section.section}
                      </h3>
                      <TierStatusBadge score={section.percent} />
                    </div>
                    <p className="text-sm text-slate-600">
                      Current score: <strong>{section.percent}%</strong> — {section.recommendation}
                    </p>

                    {/* Home + School strategies */}
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

                    {/* 6-Week Curriculum Outline */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-700 uppercase mb-3">📅 6-Week Curriculum Outline</p>
                      <div className="space-y-3">
                        {curriculum.map((week, wi) => (
                          <div key={wi} className="border-l-2 border-slate-300 pl-3">
                            <p className="text-xs font-semibold text-slate-700">{week.week} — {week.focus}</p>
                            <ul className="mt-1 space-y-0.5">
                              {week.activities.map((activity, ai) => (
                                <li key={ai} className="text-xs text-slate-600 flex items-start gap-1.5">
                                  <span className="mt-0.5 w-1 h-1 bg-slate-400 rounded-full flex-shrink-0" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
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

        {/* ── Section 10: Bottom CTA (mobile) ── */}
        <div className="print:hidden sm:hidden mb-6">
          <RecommendedNextStepPanel overallScore={result.overallPercent} />
        </div>

      </main>
    </div>
  );
}
