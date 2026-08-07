import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { bandToGrade, gradeToNumber, formatGradeLabel, getPassageForGrade } from "@/data/reading-recovery-content";

export interface DiagnosticPoint {
  id: string;
  grade_band: string;
  version: string;
  final_error_count: number | null;
  confirmed_errors?: any;
  created_at: string;
}

const STAGES = ["A", "B", "C"] as const;
const STAGE_LABEL: Record<string, string> = { A: "Pre", B: "Mid", C: "Post" };

const SERIES_COLORS = [
  "hsl(160 84% 39%)",
  "hsl(217 91% 60%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 51%)",
  "hsl(190 80% 42%)",
];

const comprehensionPct = (d: DiagnosticPoint): number | null => {
  const s = d.confirmed_errors?.comprehensionSummary?.total;
  if (!s || !s.total) return null;
  return Math.round((s.correct / s.total) * 100);
};

const accuracyPct = (d: DiagnosticPoint): number | null => {
  if (d.final_error_count === null || d.final_error_count === undefined) return null;
  const grade = bandToGrade(d.grade_band);
  const version = (STAGES as readonly string[]).includes(d.version) ? (d.version as "A" | "B" | "C") : "A";
  const words = getPassageForGrade(grade, version)?.metadata?.wordCount;
  if (!words) return null;
  return Math.max(0, Math.round(((words - d.final_error_count) / words) * 100));
};

type Metric = "accuracy" | "errors" | "comprehension";

const METRICS: Array<{ key: Metric; label: string; unit: string }> = [
  { key: "accuracy", label: "Reading accuracy", unit: "%" },
  { key: "comprehension", label: "Comprehension", unit: "%" },
  { key: "errors", label: "Reading errors", unit: "" },
];

const ReadingProgressCharts = ({ diagnostics }: { diagnostics: DiagnosticPoint[] }) => {
  const [metric, setMetric] = useState<Metric>("accuracy");

  const grades = useMemo(() => {
    const set = new Set(diagnostics.map((d) => bandToGrade(d.grade_band)));
    return [...set].sort((a, b) => gradeToNumber(a) - gradeToNumber(b));
  }, [diagnostics]);

  const valueFor = (d: DiagnosticPoint): number | null =>
    metric === "accuracy" ? accuracyPct(d) : metric === "comprehension" ? comprehensionPct(d) : d.final_error_count ?? null;

  /** One row per assessment stage, one column per grade — progress within each grade. */
  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const row: Record<string, string | number | null> = { stage: STAGE_LABEL[stage] };
      grades.forEach((g) => {
        const matches = diagnostics
          .filter((d) => bandToGrade(d.grade_band) === g && d.version === stage)
          .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        const latest = matches[matches.length - 1];
        row[g] = latest ? valueFor(latest) : null;
      });
      return row;
    });
  }, [diagnostics, grades, metric]);

  /** Grade-over-grade view: best/latest value achieved at each grade level attempted. */
  const gradeData = useMemo(() => {
    return grades.map((g) => {
      const forGrade = diagnostics
        .filter((d) => bandToGrade(d.grade_band) === g)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
      const values = forGrade.map(valueFor).filter((v): v is number => v !== null);
      const latest = values.length ? values[values.length - 1] : null;
      const first = values.length ? values[0] : null;
      return {
        grade: formatGradeLabel(g),
        first,
        latest,
        assessments: forGrade.length,
      };
    });
  }, [diagnostics, grades, metric]);

  if (diagnostics.length === 0) return null;

  const unit = METRICS.find((m) => m.key === metric)?.unit ?? "";
  const domain: [number | "auto", number | "auto"] = metric === "errors" ? [0, "auto"] : [0, 100];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="h-5 w-5 text-emerald-600" />
          Progress by grade level
        </CardTitle>
        <CardDescription>
          Each grade is tracked on its own bar, so gains at one grade never mask gaps at the next.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          {METRICS.map((m) => (
            <Button
              key={m.key}
              size="sm"
              variant={metric === m.key ? "default" : "outline"}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-2">Pre → Mid → Post, per grade</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RLineChart data={stageData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={domain} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `${v}${unit}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {grades.map((g, i) => (
                  <Line
                    key={g}
                    type="monotone"
                    dataKey={g}
                    name={formatGradeLabel(g)}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </RLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">First vs. most recent result at each grade</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={domain} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `${v}${unit}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="first" name="First" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="latest" name="Most recent" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {gradeData.map((g) => (
            <Badge key={g.grade} variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {g.grade}: {g.latest === null ? "—" : `${g.latest}${unit}`} ({g.assessments} assessment
              {g.assessments === 1 ? "" : "s"})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingProgressCharts;
