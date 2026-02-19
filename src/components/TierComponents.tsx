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
export function RecommendedNextStepPanel({ overallScore, attemptId, onNavigate }: { overallScore: number; attemptId?: string; onNavigate?: (path: string) => void }) {
  const tier = getTierFromScore(overallScore);
  const ctas = TIER_CTAS[tier];
  const style = CTA_STYLES[tier];
  const cfg = TIER_LABELS[tier];

  const handleStrategyCall = () => {
    window.open(
      "mailto:info@debslearnacademy.com?subject=Strategy%20Call%20Request&body=Hi%2C%20I%20would%20like%20to%20schedule%20a%20strategy%20call%20regarding%20my%20child%27s%20diagnostic%20results.%20Please%20let%20me%20know%20your%20availability.",
      "_blank"
    );
  };

  const handleDownloadHomePlan = () => {
    const tierName = tier === "green" ? "Tier 1 – Enrichment" : tier === "yellow" ? "Tier 2 – Skill Builder" : "Tier 3 – Intensive Intervention";
    const tips =
      tier === "green"
        ? ["Introduce enrichment challenges above grade level", "Read chapter books and discuss themes in depth", "Encourage creative writing and project-based learning", "Explore math puzzles, science experiments, and coding activities", "Join enrichment clubs or competitions to stretch skills further"]
        : tier === "yellow"
        ? ["Set aside 20–30 minutes of targeted practice daily", "Use flashcards and games to reinforce developing skills", "Review homework together and discuss errors without frustration", "Celebrate small wins — progress at this stage accelerates quickly", "Coordinate with the teacher on specific skill gaps to address"]
        : ["Establish a structured 45-minute daily practice routine", "Focus on one foundational skill per week until solid", "Read aloud together every day — comprehension and fluency are key", "Use multisensory approaches: tracing, speaking, and writing together", "Schedule a call with D.E.Bs Academy for a personalized intervention plan"];

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Home Support Plan – D.E.Bs Learning Academy</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#1C2D5A;}
h1{color:#1C2D5A;border-bottom:3px solid #FFDE59;padding-bottom:10px;}
h2{color:#1C2D5A;margin-top:24px;}
li{margin:8px 0;line-height:1.6;}
.badge{background:${tier === "green" ? "#059669" : tier === "yellow" ? "#d97706" : "#dc2626"};color:white;padding:4px 12px;border-radius:20px;font-size:14px;font-weight:bold;}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;font-size:13px;color:#64748b;}
a{color:#1C2D5A;}
@media print{body{margin:20px;}}
</style></head>
<body>
<p style="text-align:center;font-size:13px;letter-spacing:2px;color:#64748b;text-transform:uppercase;">D.E.Bs LEARNING ACADEMY — Unlocking Brilliance Through Learning</p>
<h1>🏠 Home Support Plan</h1>
<p><span class="badge">${tierName}</span></p>
<p style="margin-top:16px;">This plan is designed to help you support your child's academic progress at home over the next <strong>6–8 weeks</strong>.</p>
<h2>📋 Weekly Home Strategies</h2>
<ol>${tips.map((t) => `<li>${t}</li>`).join("")}</ol>
<h2>📞 Next Step</h2>
<p>For a personalized intervention plan tailored to your child's specific diagnostic results:</p>
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
