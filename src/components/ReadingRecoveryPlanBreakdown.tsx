import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ReadingRecoveryActivityDialog from "@/components/ReadingRecoveryActivityDialog";
import { roadmap, categoryConfig, ASSESSMENT_CHECKPOINTS } from "@/data/reading-recovery-roadmap";

interface Props {
  /** Exact grade level (0 = Kindergarten) used to tailor the daily worksheets. */
  gradeLevel: number | null;
  studentName?: string | null;
  enrollmentId?: string | null;
  /** Read-only surfaces (admin review) cannot mark days complete. */
  readOnly?: boolean;
  onComplete?: (day: number) => void;
}

const WEEKS = [
  { label: "Week 1 — Foundation Building", days: [1, 7] },
  { label: "Week 2 — Building Skills", days: [8, 14] },
  { label: "Week 3 — Consolidation & Mastery", days: [15, 21] },
];

const ReadingRecoveryPlanBreakdown = ({
  gradeLevel,
  studentName,
  enrollmentId,
  readOnly = true,
  onComplete,
}: Props) => {
  const [openDay, setOpenDay] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {WEEKS.map((week) => (
        <div key={week.label}>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {week.label}
          </h4>
          <div className="space-y-2">
            {roadmap
              .filter((a) => a.day >= week.days[0] && a.day <= week.days[1])
              .map((activity) => {
                const style = categoryConfig[activity.category] || categoryConfig["Review"];
                const Icon = style.icon;
                const checkpoint = ASSESSMENT_CHECKPOINTS[activity.day];
                const isAssessment = activity.category === "Assessment";
                return (
                  <div
                    key={activity.day}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      isAssessment ? "border-sky-200 bg-sky-50/60" : "border-muted bg-muted/20"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${style.bgColor} ${style.color}`}
                    >
                      <span className="text-sm font-bold">{activity.day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{activity.title}</p>
                        {checkpoint && (
                          <Badge variant="outline" className="border-sky-300 text-sky-700">
                            {checkpoint}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-xs ${style.bgColor} ${style.color} border-0`}
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {activity.category}
                      </Badge>
                      <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    {!isAssessment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => setOpenDay(activity.day)}
                      >
                        Open
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <ReadingRecoveryActivityDialog
        day={openDay}
        gradeLevel={gradeLevel}
        enrollmentId={readOnly ? null : enrollmentId ?? null}
        studentName={studentName ?? null}
        onClose={() => setOpenDay(null)}
        onComplete={readOnly ? undefined : onComplete}
      />
    </div>
  );
};

export default ReadingRecoveryPlanBreakdown;
