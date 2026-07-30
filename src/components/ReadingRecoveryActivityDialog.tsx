import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Eye, EyeOff, CheckCircle2, Clock, Target, Sparkles, FileText } from "lucide-react";
import { getActivity, pickBand, tuneForGrade, gradeTargetWcpm, type Activity, type WorksheetBlock } from "@/data/reading-recovery-activities";
import PhonicsChip from "@/components/PhonicsChip";

interface Props {
  day: number | null;
  gradeLevel: number | null;
  enrollmentId?: string | null;
  studentName?: string | null;
  onClose: () => void;
  onComplete?: (day: number) => void;
}


interface BlockCtx {
  usePhonics: boolean;
  isLetterMode: boolean;
  dayNumber: number | null;
  enrollmentId: string | null;
}

const Block = ({ block, showAnswers, ctx }: { block: WorksheetBlock; showAnswers: boolean; ctx: BlockCtx }) => {
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
            {block.words.map((w, i) =>
              ctx.usePhonics ? (
                <PhonicsChip
                  key={i}
                  text={w}
                  mode={ctx.isLetterMode || w.trim().length === 1 ? "letter" : "word"}
                  dayNumber={ctx.dayNumber}
                  enrollmentId={ctx.enrollmentId}
                />
              ) : (
                <div
                  key={i}
                  className="border border-muted rounded-md p-2 text-sm bg-muted/20 font-medium"
                >
                  {w}
                </div>
              )
            )}
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

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const answerLine = (height = 36) => `<div class="answer-line" style="min-height:${height}px"></div>`;

const renderPrintBlock = (block: WorksheetBlock, showAnswers: boolean) => {
  switch (block.type) {
    case "word-list": {
      const cols = block.columns ?? 4;
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <div class="word-grid" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));">
            ${block.words.map((word) => `<div class="word-tile">${escapeHtml(word)}</div>`).join("")}
          </div>
        </section>
      `;
    }
    case "fill-blank":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <ol class="questions">
            ${block.items
              .map(
                (item) => `
                  <li>
                    <div>${escapeHtml(item.sentence)}</div>
                    ${answerLine(26)}
                    ${showAnswers ? `<p class="answer">Answer: ${escapeHtml(item.answer)}</p>` : ""}
                  </li>
                `
              )
              .join("")}
          </ol>
        </section>
      `;
    case "matching":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <div class="matching-grid">
            <div>
              ${block.pairs
                .map((pair, index) => `<div class="match-row">${index + 1}. ${escapeHtml(pair.left)}</div>`)
                .join("")}
            </div>
            <div>
              ${block.pairs
                .map((pair, index) => `<div class="match-row">${String.fromCharCode(65 + index)}. ${escapeHtml(pair.right)}</div>`)
                .join("")}
            </div>
          </div>
          ${showAnswers ? `<p class="answer">Answer key: ${block.pairs.map((pair, index) => `${index + 1}. ${escapeHtml(pair.left)} → ${escapeHtml(pair.right)}`).join(" | ")}</p>` : ""}
        </section>
      `;
    case "short-passage":
      return `
        <section class="block">
          <h3>${escapeHtml(block.title)}</h3>
          <div class="passage">${escapeHtml(block.passage).replace(/\n/g, "<br />")}</div>
          <ol class="questions">
            ${block.questions
              .map(
                (question) => `
                  <li>
                    <div><strong>${escapeHtml(question.q)}</strong></div>
                    ${answerLine(62)}
                    ${showAnswers && question.a ? `<p class="answer">Answer: ${escapeHtml(question.a)}</p>` : ""}
                  </li>
                `
              )
              .join("")}
          </ol>
        </section>
      `;
    case "writing-prompt":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.prompt)}</p>
          <div class="writing-lines">
            ${Array.from({ length: block.lines ?? 6 }).map(() => `<div></div>`).join("")}
          </div>
        </section>
      `;
    case "checklist":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <ul class="checklist">
            ${block.items.map((item) => `<li><span class="box"></span>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `;
    case "fluency-tracker":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.instructions)}</p>
          <div class="fluency-grid" style="grid-template-columns: repeat(${block.reads ?? 3}, minmax(0, 1fr));">
            ${Array.from({ length: block.reads ?? 3 })
              .map((_, index) => `<div class="fluency-box"><strong>Read ${index + 1}</strong><span>WCPM</span></div>`)
              .join("")}
          </div>
        </section>
      `;
    case "reflection":
      return `
        <section class="block avoid-break">
          <h3>${escapeHtml(block.title)}</h3>
          ${block.prompts
            .map(
              (prompt) => `
                <div class="reflection-item">
                  <p>${escapeHtml(prompt)}</p>
                  ${answerLine(52)}
                </div>
              `
            )
            .join("")}
        </section>
      `;
  }
};

const buildPrintHtml = ({
  activity,
  blocks,
  showAnswers,
  gradeLevel,
  band,
  studentName,
}: {
  activity: Activity;
  blocks: WorksheetBlock[];
  showAnswers: boolean;
  gradeLevel: number | null;
  band: string;
  studentName?: string | null;
}) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>D.E.Bs Reading Recovery Day ${activity.day}</title>
    <style>
      @page { size: Letter portrait; margin: 0.55in; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #000; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.35; }
      main { width: 100%; }
      header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
      h1 { font-size: 17pt; margin: 0 0 4px; line-height: 1.2; }
      h2 { font-size: 12pt; margin: 16px 0 8px; border-bottom: 1px solid #777; padding-bottom: 3px; }
      h3 { font-size: 11.5pt; margin: 0 0 8px; }
      p { margin: 0 0 8px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; font-size: 9.5pt; }
      .meta div { min-height: 16px; }
      .card, .block { border: 1px solid #999; border-radius: 4px; padding: 10px; margin: 0 0 12px; background: #fff; }
      .avoid-break, .card, .block, li, .word-grid, .matching-grid, .fluency-grid { break-inside: avoid; page-break-inside: avoid; }
      ul, ol { margin-top: 6px; padding-left: 22px; }
      li { margin-bottom: 8px; }
      .word-grid { display: grid; gap: 7px; }
      .word-tile { border: 1px solid #999; border-radius: 6px; min-height: 28px; display: flex; align-items: center; justify-content: center; padding: 5px; font-weight: 700; text-align: center; }
      .passage { border: 1px solid #aaa; background: #f7f7f7; padding: 10px; margin-bottom: 10px; white-space: normal; }
      .questions { margin-bottom: 0; }
      .answer-line { border: 1px solid #999; border-radius: 4px; margin-top: 5px; background: repeating-linear-gradient(to bottom, #fff 0, #fff 25px, #ddd 26px); }
      .writing-lines { border: 1px solid #999; border-radius: 4px; padding: 8px 10px 4px; }
      .writing-lines div { height: 24px; border-bottom: 1px solid #777; }
      .matching-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .match-row { border: 1px solid #999; border-radius: 4px; padding: 7px; margin-bottom: 6px; }
      .checklist { list-style: none; padding-left: 0; }
      .checklist li { display: flex; gap: 8px; align-items: flex-start; }
      .box { width: 13px; height: 13px; border: 1px solid #000; display: inline-block; flex: 0 0 auto; margin-top: 2px; }
      .fluency-grid { display: grid; gap: 8px; }
      .fluency-box { border: 1px solid #999; border-radius: 4px; min-height: 52px; padding: 8px; text-align: center; }
      .fluency-box span { display: block; margin-top: 8px; border-top: 1px solid #777; padding-top: 4px; }
      .answer { color: #000; font-size: 9.5pt; font-weight: 700; margin-top: 5px; }
      .reflection-item { margin-bottom: 10px; }
      @media screen { body { padding: 24px; } main { max-width: 760px; margin: 0 auto; } }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>D.E.Bs Reading Recovery — Day ${activity.day}: ${escapeHtml(activity.title)}</h1>
        <div class="meta">
          <div>Student: ${studentName ? escapeHtml(studentName) : "____________________________"}</div>
          <div>Date: ____________________</div>
          <div>Grade ${escapeHtml(gradeLevel ?? "___")} · Band ${escapeHtml(band)} · ${escapeHtml(activity.category)}</div>
          <div>${showAnswers ? "Answer Key" : "Student Copy"}</div>
          <div>Name: ______________________________</div>
          <div>Fluency target: ~${gradeTargetWcpm(gradeLevel)} WCPM</div>
        </div>
      </header>

      <section class="card avoid-break">
        <h2>Objective</h2>
        <p>${escapeHtml(activity.objective)}</p>
      </section>

      <section class="card avoid-break">
        <h2>Warm-Up (2–3 min)</h2>
        <ul>${activity.warmUp.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>

      ${showAnswers ? `
        <section class="card avoid-break">
          <h2>Instructions for the Adult</h2>
          <ol>${activity.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        </section>
      ` : ""}

      <h2>Worksheet</h2>
      ${blocks.map((block) => renderPrintBlock(block, showAnswers)).join("")}

      ${activity.extension ? `
        <section class="card avoid-break">
          <h2>Extension Challenge</h2>
          <p>${escapeHtml(activity.extension)}</p>
        </section>
      ` : ""}
    </main>
  </body>
</html>`;

const openPrintDocument = (html: string) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");

  if (!printWindow) {
    const fallback = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(fallback);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
};

const ReadingRecoveryActivityDialog = ({ day, gradeLevel, enrollmentId, studentName, onClose, onComplete }: Props) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const open = day !== null;
  const activity = useMemo(() => (day !== null ? getActivity(day) : null), [day]);
  const band = useMemo(() => pickBand(gradeLevel), [gradeLevel]);
  const blocks = useMemo(
    () => tuneForGrade(activity?.variantsByBand[band] ?? [], gradeLevel),
    [activity, band, gradeLevel]
  );

  const printWith = (withAnswers: boolean) => {
    setShowAnswers(withAnswers);
    if (!activity) return;
    openPrintDocument(
      buildPrintHtml({
        activity,
        blocks,
        showAnswers: withAnswers,
        gradeLevel,
        band,
        studentName,
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {activity ? (
          <>
            <DialogHeader className="print-hide">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Day {activity.day} — {activity.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{activity.category}</Badge>
                <Badge variant="outline">
                  Grade {gradeLevel ?? "—"} · band {band}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />~{activity.estimatedMinutes} min
                </span>
                <span>Fluency target ~{gradeTargetWcpm(gradeLevel)} WCPM</span>
              </div>
            </DialogHeader>

            <div className="flex flex-wrap gap-2 print-hide">
              <Button size="sm" variant="outline" onClick={() => setShowAnswers((s) => !s)}>
                {showAnswers ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showAnswers ? "Hide Answer Key" : "Show Answer Key"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => printWith(false)}>
                <Printer className="w-4 h-4 mr-1" />
                Print Student Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => printWith(true)}>
                <FileText className="w-4 h-4 mr-1" />
                Print Answer Key
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


            <div className="space-y-4" id="rr-print-area">
              {/* Print header — only meaningful on paper */}
              <div className="hidden print:block mb-4 border-b border-black pb-2">
                <div className="text-lg font-bold">
                  D.E.Bs Reading Recovery — Day {activity.day}: {activity.title}
                </div>
                <div className="text-xs">
                  {studentName ? `Student: ${studentName} · ` : ""}Grade {gradeLevel ?? "___"} · {activity.category} ·{" "}
                  {showAnswers ? "ANSWER KEY" : "Student Copy"} · Date: ____________
                </div>
              </div>

              <Card className="rr-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Objective
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">{activity.objective}</CardContent>
              </Card>

              <Card className="rr-card">
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

              <Card className={`rr-card ${showAnswers ? "" : "print-hide"}`}>
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

              <Separator className="print-hide" />

              <div>
                <h3 className="font-semibold text-base mb-3">📝 Worksheet</h3>
                <div className="space-y-6">
                  {blocks.map((b, i) => {
                    const title = (b as any).title?.toLowerCase?.() ?? "";
                    const isPhonicsCat = activity.category.toLowerCase().includes("phonics");
                    const isSoundBlock = /sound|phoneme|letter/.test(title);
                    const usePhonics = b.type === "word-list" && (isPhonicsCat || isSoundBlock);
                    return (
                      <Card key={i} className="rr-card rr-block">
                        <CardContent className="pt-4">
                          <Block
                            block={b}
                            showAnswers={showAnswers}
                            ctx={{
                              usePhonics,
                              isLetterMode: isSoundBlock && isPhonicsCat,
                              dayNumber: activity.day,
                              enrollmentId: enrollmentId ?? null,
                            }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {activity.extension && (
                <Card className="rr-card border-amber-200 bg-amber-50">
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
