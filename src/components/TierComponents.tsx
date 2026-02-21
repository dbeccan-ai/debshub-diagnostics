import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TIER_LABELS,
  INSIGHT_BOXES,
  TIER_CTAS,
  PLACEMENT_PATHWAY,
  CTA_STYLES,
  SKILL_ACTION,
  getTierFromScore,
  type TierCTA,
} from "@/lib/tierConfig";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Download,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

/* ─── Insight Box ─── */
export function InsightBox({ score }: { score: number }) {
  const tier = getTierFromScore(score);
  const cfg = INSIGHT_BOXES[tier];
  return (
    <div className={`border ${cfg.borderClass} ${cfg.bgClass} rounded-lg p-4 mt-3`}>
      <p className={`text-sm font-bold ${cfg.titleClass} flex items-center gap-1.5 mb-1`}>
        {tier === "red" ? <ShieldAlert className="h-4 w-4" /> : tier === "yellow" ? <TrendingUp className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {cfg.title}
      </p>
      <p className={`text-sm ${cfg.bodyClass}`}>{cfg.body}</p>
    </div>
  );
}

/* ─── Tier Status Badge (new labels) ─── */
export function TierStatusBadge({ score }: { score: number }) {
  const tier = getTierFromScore(score);
  const cfg = TIER_LABELS[tier];
  return (
    <Badge className={`${cfg.badgeClass} px-3 py-1 text-xs font-semibold gap-1`}>
      {tier === "green" ? <CheckCircle2 className="h-3.5 w-3.5" /> : tier === "yellow" ? <AlertTriangle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {cfg.label}
    </Badge>
  );
}

/* ─── Skill Row with Status Pill + Action ─── */
export function SkillRow({ skill, correct, total, percentage }: { skill: string; correct: number; total: number; percentage: number }) {
  const tier = getTierFromScore(percentage);
  const cfg = TIER_LABELS[tier];
  const action = SKILL_ACTION[tier];
  return (
    <div className="space-y-1.5 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{skill}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500">{correct}/{total} ({percentage}%)</span>
          <Badge className={`${cfg.badgeClass} text-[10px] px-2 py-0.5`}>
            {tier === "green" ? "Mastered" : tier === "yellow" ? "Developing" : "Support"}
          </Badge>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${tier === "green" ? "bg-emerald-500" : tier === "yellow" ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 italic">{action}</p>
    </div>
  );
}

/* ─── Recommended Next Step CTA Panel ─── */
export function RecommendedNextStepPanel({
  overallScore,
  attemptId,
  onNavigate,
  subject,
  studentName,
  prioritySkills = [],
  developingSkills = [],
}: {
  overallScore: number;
  attemptId?: string;
  onNavigate?: (path: string) => void;
  subject?: string;
  studentName?: string;
  prioritySkills?: string[];
  developingSkills?: string[];
}) {
  const tier = getTierFromScore(overallScore);
  const ctas = TIER_CTAS[tier];
  const style = CTA_STYLES[tier];
  const cfg = TIER_LABELS[tier];

  const isELA = subject?.toLowerCase().includes("ela") || subject?.toLowerCase().includes("english");
  const subjectLabel = subject || "Academic";

  const handleStrategyCall = () => {
    window.open(
      "mailto:info@debslearnacademy.com?subject=Strategy%20Call%20Request&body=Hi%2C%20I%20would%20like%20to%20schedule%20a%20strategy%20call%20regarding%20my%20child%27s%20diagnostic%20results.%20Please%20let%20me%20know%20your%20availability.",
      "_blank"
    );
  };

  const handleDownloadHomePlan = () => {
    const tierName = tier === "green" ? "Tier 1 – Enrichment" : tier === "yellow" ? "Tier 2 – Skill Builder" : "Tier 3 – Intensive Intervention";
    const badgeColor = tier === "green" ? "#059669" : tier === "yellow" ? "#d97706" : "#dc2626";

    // Subject-specific & skill-specific strategies
    const getSubjectTips = () => {
      if (isELA) {
        if (tier === "red") return [
          "Read aloud together for at least 20 minutes every day — fluency and comprehension build simultaneously",
          "After reading, ask 2–3 open-ended questions: 'Why did the character do that?' 'What do you think happens next?'",
          "Focus on one weak ELA skill per week (e.g., vocabulary, punctuation, inference) with short daily activities",
          "Use spelling practice apps or word journals — write new words in sentences to build contextual understanding",
          "Practice writing 3–5 sentences daily on any topic to build grammar and writing confidence",
          "Schedule a call with D.E.Bs Academy for a structured ELA intervention plan",
        ];
        if (tier === "yellow") return [
          "Read a mix of fiction and non-fiction together — discuss the author's purpose and main idea",
          "Build vocabulary daily: pick 5 new words, define them, and use in conversation",
          "Practice identifying text structures: cause/effect, compare/contrast, problem/solution",
          "Review grammar rules through short daily exercises (15 minutes is enough to build habits)",
          "Encourage journaling 3× per week — writing regularly strengthens all ELA skills simultaneously",
        ];
        return [
          "Challenge with above-grade-level books and complex texts to stretch comprehension",
          "Introduce literary analysis: theme, tone, author's craft, symbolism",
          "Encourage creative writing projects — short stories, poetry, essays on topics of interest",
          "Explore debate and persuasive writing to strengthen argumentation skills",
          "Join a reading club or writing enrichment program to maintain momentum",
        ];
      } else {
        // Math
        if (tier === "red") return [
          "Set aside 30–45 minutes of structured math practice daily — consistency is the key",
          "Focus on one foundational math skill per week until fully solid before moving on",
          "Use manipulatives (blocks, counters, number lines) for hands-on understanding of abstract concepts",
          "Practice times tables and number facts daily — fluency unlocks every other math skill",
          "After every homework problem, ask your child to explain their thinking aloud",
          "Schedule a call with D.E.Bs Academy for a targeted math intervention plan",
        ];
        if (tier === "yellow") return [
          "Set aside 20–30 minutes of targeted math practice daily",
          "Use flashcards and math games to reinforce developing skills (fractions, word problems, etc.)",
          "Review homework together and discuss errors — mistakes are learning opportunities",
          "Celebrate small wins — progress at this stage accelerates quickly with consistent effort",
          "Coordinate with the teacher on specific skill gaps to align home and school practice",
        ];
        return [
          "Introduce math enrichment challenges above grade level (competition problems, puzzles)",
          "Explore coding and logic games that build mathematical thinking",
          "Encourage project-based math: budgeting, measuring, cooking with fractions",
          "Work through advanced topics in your grade's next level to stay ahead",
          "Join math enrichment clubs or competitions to stretch skills further",
        ];
      }
    };

    const tips = getSubjectTips();

    // Filter skills to match the subject — exclude cross-subject contamination
    const mathKeywords = ["math", "number", "arithmetic", "algebra", "geometry", "fraction", "multiplication", "division", "calculus", "statistics", "rounding", "decimal", "place value", "perimeter", "area", "volume", "angle", "measurement", "pattern", "graph", "time", "money", "word problem", "general math"];
    const elaKeywords = ["reading", "writing", "grammar", "vocabulary", "comprehension", "spelling", "phonics", "fluency", "punctuation", "language", "ela", "english", "literacy"];

    const isSubjectMatch = (skill: string) => {
      const lower = skill.toLowerCase();
      if (isELA) {
        // For ELA, exclude skills that are purely math-labeled
        const isMathOnly = mathKeywords.some(k => lower.includes(k)) && !elaKeywords.some(k => lower.includes(k));
        return !isMathOnly;
      } else {
        // For Math, exclude skills that are purely ELA-labeled
        const isELAOnly = elaKeywords.some(k => lower.includes(k)) && !mathKeywords.some(k => lower.includes(k));
        return !isELAOnly;
      }
    };

    const filteredPrioritySkills = prioritySkills.filter(isSubjectMatch);
    const filteredDevelopingSkills = developingSkills.filter(isSubjectMatch);
    const allWeakSkills = [...filteredPrioritySkills, ...filteredDevelopingSkills];
    const hasSkills = allWeakSkills.length > 0;

    const skillFocusHtml = hasSkills ? `
<h2>🎯 Priority Focus Skills</h2>
<p>Based on this diagnostic, your child needs targeted support in the following ${subjectLabel} areas:</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead><tr style="background:#f1f5f9;">
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Skill / Section</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Priority Level</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Recommended Action</th>
  </tr></thead>
  <tbody>
    ${filteredPrioritySkills.map(s => `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">${s}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;"><span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:bold;">🔴 Immediate Focus</span></td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">Daily structured practice — do not skip weeks</td></tr>`).join("")}
    ${filteredDevelopingSkills.map(s => `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">${s}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:bold;">🟡 Reinforce</span></td><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">Practice 2–3× per week until solid</td></tr>`).join("")}
  </tbody>
</table>` : "";

    const weeklyPlanHtml = isELA
      ? `<h2>📅 6-Week ${subjectLabel} Home Plan</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead><tr style="background:#f1f5f9;">
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Week</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Focus Area</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Home Activity</th>
  </tr></thead>
  <tbody>
    ${(() => {
      const base = filteredPrioritySkills.length > 0 ? [...filteredPrioritySkills, ...filteredDevelopingSkills] : ["Reading Comprehension", "Vocabulary", "Writing"];
      const elaPad = ["Mixed Reading Review", "Writing Practice", "Progress Assessment"];
      while (base.length < 6) base.push(elaPad[base.length - (base.length - (base.length % 3))] || "Review");
      return base.slice(0, 6);
    })().map((skill, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:bold;color:#1C2D5A;">Week ${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">${skill}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${
        i === 0 ? "Daily 15-min reading + comprehension questions" :
        i === 1 ? "Vocabulary journal: 5 new words/day in sentences" :
        i === 2 ? "Grammar drill sheets + punctuation practice" :
        i === 3 ? "Short writing prompts (3–5 sentences, 3×/week)" :
        i === 4 ? "Mixed ELA review: reading passage + 5 questions" :
        "Progress check + celebrate growth, identify next focus"
      }</td>
    </tr>`).join("")}
  </tbody>
</table>`
      : `<h2>📅 6-Week Math Home Plan</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <thead><tr style="background:#f1f5f9;">
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Week</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Focus Skill</th>
    <th style="text-align:left;padding:8px 12px;font-size:13px;color:#475569;border:1px solid #e2e8f0;">Home Activity</th>
  </tr></thead>
  <tbody>
    ${(() => {
      const base = filteredPrioritySkills.length > 0 ? [...filteredPrioritySkills, ...filteredDevelopingSkills] : ["Number Sense", "Operations", "Problem Solving"];
      const mathPad = ["Word Problem Practice", "Mixed Skill Review", "Progress Check"];
      while (base.length < 6) base.push(mathPad[base.length - (base.length - (base.length % 3))] || "Review");
      return base.slice(0, 6);
    })().map((skill, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:bold;color:#1C2D5A;">Week ${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">${skill}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${
        i === 0 ? "Daily 10-min drill + 3 practice problems on this skill" :
        i === 1 ? "Flashcard review + real-world application activity" :
        i === 2 ? "Worksheet practice + verbal explanation of steps" :
        i === 3 ? "Word problem focus: 5 problems per session, 3×/week" :
        i === 4 ? "Mixed skill review: combine skills from weeks 1–4" :
        "Progress check + celebrate growth, identify next focus"
      }</td>
    </tr>`).join("")}
  </tbody>
</table>`;

    const studentDisplay = studentName ? studentName : "Your Child";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subjectLabel} Home Support Plan – D.E.Bs Learning Academy</title>
<style>
body{font-family:Georgia,serif;max-width:750px;margin:40px auto;padding:20px;color:#1C2D5A;}
h1{color:#1C2D5A;border-bottom:3px solid #FFDE59;padding-bottom:10px;}
h2{color:#1C2D5A;margin-top:28px;font-size:18px;}
li{margin:8px 0;line-height:1.6;}
ol{padding-left:20px;}
.badge{background:${badgeColor};color:white;padding:4px 14px;border-radius:20px;font-size:14px;font-weight:bold;display:inline-block;}
.subject-pill{background:#1C2D5A;color:white;padding:3px 10px;border-radius:12px;font-size:13px;font-weight:bold;display:inline-block;margin-left:8px;}
.student-banner{background:#f0f4ff;border-left:5px solid #1C2D5A;padding:14px 20px;border-radius:6px;margin-bottom:20px;}
.student-banner h2{margin:0 0 4px 0;font-size:20px;color:#1C2D5A;}
.student-banner p{margin:0;color:#475569;font-size:14px;}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;font-size:13px;color:#64748b;}
a{color:#1C2D5A;}
@media print{body{margin:20px;}}
</style></head>
<body>
<p style="text-align:center;font-size:13px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">D.E.Bs LEARNING ACADEMY — Unlocking Brilliance Through Learning</p>
<h1>🏠 ${subjectLabel} Home Support Plan</h1>
<div class="student-banner">
  <h2>👤 ${studentDisplay}</h2>
  <p>Personalised ${subjectLabel} support plan based on diagnostic results</p>
</div>
<p><span class="badge">${tierName}</span> <span class="subject-pill">${subjectLabel} Diagnostic</span></p>
<p style="margin-top:16px;">This plan is tailored to the results of <strong>${studentDisplay}'s ${subjectLabel} diagnostic</strong> and is designed to guide focused home support over the next <strong>6–8 weeks</strong>.</p>

${skillFocusHtml}

<h2>📋 Weekly Home Strategies</h2>
<ol>${tips.map((t) => `<li>${t}</li>`).join("")}</ol>

${weeklyPlanHtml}

<h2>📞 Next Step</h2>
<p>For a personalized ${subjectLabel} intervention plan tailored to your child's specific diagnostic results:</p>
<ul>
  <li>📧 Email: <a href="mailto:info@debslearnacademy.com">info@debslearnacademy.com</a></li>
  <li>📞 Call: <a href="tel:+13473641906">347-364-1906</a></li>
  <li>🌐 Website: <a href="https://www.debslearnacademy.com">www.debslearnacademy.com</a></li>
</ul>
<div class="footer">
  <p><strong>D.E.Bs Learning Academy</strong> — Supporting every learner from foundational skills to academic excellence.</p>
  <p>Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),400);}</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <Card className={`border-2 ${cfg.borderClass} overflow-hidden`}>
      <div className={`${cfg.bgClass} px-6 py-4 border-b ${cfg.borderClass}`}>
        <h2 className={`text-lg font-bold ${cfg.textClass} flex items-center gap-2`}>
          <ArrowRight className="h-5 w-5" /> Recommended Next Step
        </h2>
        <p className={`text-xs ${cfg.textClass} opacity-70 mt-1`}>{cfg.helper}</p>
      </div>
      <CardContent className="p-6 space-y-3">
        <Button
          className={`w-full ${style} font-semibold text-base py-6`}
          onClick={() => window.open(ctas.primary.paymentUrl, "_blank")}
        >
          {ctas.primary.label}
        </Button>
        <Button variant="outline" className="w-full" onClick={handleStrategyCall}>
          <Phone className="mr-2 h-4 w-4" />
          {ctas.secondary.label}
        </Button>
        <Button variant="ghost" className="w-full text-slate-600" onClick={handleDownloadHomePlan}>
          <Download className="mr-2 h-4 w-4" />
          {ctas.tertiary.label}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Placement Pathway Table ─── */
export function PlacementPathwayCard({ overallScore }: { overallScore: number }) {
  const currentTier = getTierFromScore(overallScore);
  return (
    <Card className="border-slate-200 overflow-hidden">
      <div className="bg-[#1C2D5A] px-6 py-4 text-white">
        <h2 className="text-lg font-bold">Placement Pathway</h2>
        <p className="text-xs text-white/70 mt-1">Your child's tier determines the best-fit support pathway.</p>
      </div>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Tier</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-700">Programme</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-700">Investment</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {PLACEMENT_PATHWAY.map((row) => {
              const isActive = row.color === currentTier;
              return (
                <tr key={row.tier} className={`border-b border-slate-100 ${isActive ? `${TIER_LABELS[row.color].bgClass} font-semibold` : ""}`}>
                  <td className={`px-5 py-3 ${isActive ? TIER_LABELS[row.color].textClass : "text-slate-700"}`}>
                    {isActive && "→ "}{row.tier}
                  </td>
                  <td className={`px-5 py-3 ${isActive ? TIER_LABELS[row.color].textClass : "text-slate-700"}`}>
                    {row.label}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold ${isActive ? TIER_LABELS[row.color].textClass : "text-slate-500"}`}>
                    {row.price}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => window.open(row.paymentUrl, "_blank")}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-opacity ${isActive ? `${CTA_STYLES[row.color]} opacity-100` : "opacity-40 bg-slate-200 text-slate-600"} ${!isActive ? "cursor-pointer hover:opacity-70" : ""}`}
                    >
                      Enroll
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ─── Tier Classification Blocks (replaces old "Skills Mastered / Needs Support" blocks) ─── */
export function TierClassificationBlocks({ sections }: { sections: Array<{ section: string; correct: number; total: number; percent: number }> }) {
  const green = sections.filter((s) => s.percent >= 85);
  const yellow = sections.filter((s) => s.percent >= 66 && s.percent < 85);
  const red = sections.filter((s) => s.percent < 66);

  return (
    <div className="space-y-4">
      {red.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-800 mb-1 text-sm">🔴 Priority Intervention Required</p>
          <p className="text-xs text-red-600 mb-3">These skills are below foundational mastery and require targeted support to prevent academic delay.</p>
          <ul className="space-y-1.5">
            {red.map((s, i) => (
              <li key={i} className="text-red-700 flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>{s.section}</strong> <span className="text-red-600 text-xs">({s.correct}/{s.total} correct, {s.percent}%)</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {yellow.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-semibold text-amber-800 mb-1 text-sm">🟡 Strengthening Zone</p>
          <p className="text-xs text-amber-600 mb-3">These skills are developing but need reinforcement to reach mastery.</p>
          <ul className="space-y-1.5">
            {yellow.map((s, i) => (
              <li key={i} className="text-amber-700 flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>{s.section}</strong> <span className="text-amber-600 text-xs">({s.correct}/{s.total} correct, {s.percent}%)</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {green.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="font-semibold text-emerald-800 mb-1 text-sm">🟢 Demonstrated Mastery</p>
          <p className="text-xs text-emerald-600 mb-3">These skills meet or exceed grade-level expectations.</p>
          <ul className="space-y-1.5">
            {green.map((s, i) => (
              <li key={i} className="text-emerald-700 flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><strong>{s.section}</strong> <span className="text-emerald-600 text-xs">({s.correct}/{s.total} correct, {s.percent}%)</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
