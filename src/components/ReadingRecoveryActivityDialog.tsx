import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Eye, EyeOff, CheckCircle2, Clock, Target, Sparkles } from "lucide-react";
import { getActivity, pickBand, type WorksheetBlock } from "@/data/reading-recovery-activities";

interface Props {
  day: number | null;
  gradeLevel: number | null;
  onClose: () => void;
  onComplete?: (day: number) => void;
}

const Block = ({ block, showAnswers }: { block: WorksheetBlock; showAnswers: boolean }) => {
  switch (block.type) {
    case "word-list": {
      const cols = block.columns ?? 4;
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <div
            className="grid gap-2 text-center"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {block.words.map((w, i) => (
              <div
                key={i}
                className="border border-muted rounded-md p-2 text-sm bg-muted/20 font-medium"
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "fill-blank":
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <ol className="space-y-3 list-decimal ml-5">
            {block.items.map((it, i) => (
              <li key={i} className="text-sm">
                <div>{it.sentence}</div>
                <Input className="mt-1 h-8" placeholder="Your answer..." />
                {showAnswers && (
                  <div className="text-xs text-emerald-700 mt-1">✓ {it.answer}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      );
    case "matching":
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="space-y-2">
              {block.pairs.map((p, i) => (
                <div key={i} className="border rounded-md p-2 bg-muted/20 font-medium">
                  {i + 1}. {p.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[...block.pairs]
                .sort(() => 0.5 - Math.random())
                .map((p, i) => (
                  <div key={i} className="border rounded-md p-2">
                    {String.fromCharCode(65 + i)}. {p.right}
                  </div>
                ))}
            </div>
          </div>
          {showAnswers && (
            <div className="mt-2 text-xs text-emerald-700">
              ✓ Answer key:{" "}
              {block.pairs.map((p, i) => `${i + 1}. ${p.left} → ${p.right}`).join(" | ")}
            </div>
          )}
        </div>
      );
    case "short-passage":
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm whitespace-pre-wrap leading-relaxed">
            {block.passage}
          </div>
          <ol className="mt-3 space-y-3 list-decimal ml-5">
            {block.questions.map((q, i) => (
              <li key={i} className="text-sm">
                <div className="font-medium">{q.q}</div>
                <Textarea className="mt-1" rows={2} placeholder="Your answer..." />
                {showAnswers && q.a && (
                  <div className="text-xs text-emerald-700 mt-1">✓ {q.a}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      );
    case "writing-prompt":
      return (
        <div>
          <p className="font-semibold mb-1">{block.title}</p>
          <p className="text-sm text-muted-foreground mb-2">{block.prompt}</p>
          <Textarea rows={block.lines ?? 6} placeholder="Start writing here..." />
        </div>
      );
    case "checklist":
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <div className="space-y-2">
            {block.items.map((it, i) => (
              <label key={i} className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" />
                <span>{it}</span>
              </label>
            ))}
          </div>
        </div>
      );
    case "fluency-tracker":
      return (
        <div>
          <p className="font-semibold mb-1">{block.title}</p>
          <p className="text-sm text-muted-foreground mb-2">{block.instructions}</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.reads ?? 3}, minmax(0, 1fr))` }}>
            {Array.from({ length: block.reads ?? 3 }).map((_, i) => (
              <div key={i} className="border rounded-md p-2 text-center">
                <div className="text-xs text-muted-foreground">Read {i + 1}</div>
                <Input className="mt-1 h-8 text-center" placeholder="WCPM" />
              </div>
            ))}
          </div>
        </div>
      );
    case "reflection":
      return (
        <div>
          <p className="font-semibold mb-2">{block.title}</p>
          <div className="space-y-3">
            {block.prompts.map((p, i) => (
              <div key={i}>
                <div className="text-sm">{p}</div>
                <Textarea className="mt-1" rows={2} />
              </div>
            ))}
          </div>
        </div>
      );
  }
};

const ReadingRecoveryActivityDialog = ({ day, gradeLevel, onClose, onComplete }: Props) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const open = day !== null;
  const activity = useMemo(() => (day !== null ? getActivity(day) : null), [day]);
  const band = useMemo(() => pickBand(gradeLevel), [gradeLevel]);
  const blocks = activity?.variantsByBand[band] ?? [];

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:shadow-none">
        {activity ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Day {activity.day} — {activity.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{activity.category}</Badge>
                <Badge variant="outline">Grade band {band}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />~{activity.estimatedMinutes} min
                </span>
              </div>
            </DialogHeader>

            <div className="flex flex-wrap gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={() => setShowAnswers((s) => !s)}>
                {showAnswers ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showAnswers ? "Hide Answer Key" : "Show Answer Key"}
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                Print Workbook
              </Button>
              {onComplete && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    onComplete(activity.day);
                    onClose();
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>

            <div className="space-y-4 print:space-y-6" id="rr-print-area">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Objective
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">{activity.objective}</CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Warm-Up (2–3 min)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {activity.warmUp.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Instructions (for the adult)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal ml-5 text-sm space-y-1">
                    {activity.instructions.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Separator />

              <div>
                <h3 className="font-semibold text-base mb-3">📝 Worksheet</h3>
                <div className="space-y-6">
                  {blocks.map((b, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <Block block={b} showAnswers={showAnswers} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {activity.extension && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">⭐ Extension Challenge</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">{activity.extension}</CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>Activity content coming soon.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReadingRecoveryActivityDialog;
