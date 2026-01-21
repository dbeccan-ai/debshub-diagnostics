import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { OralReadingAutoAssist } from "@/components/OralReadingAutoAssist";
import { 
  getPassage, 
  gradeBands, 
  versions, 
  interpretationGuide, 
  celebrationMilestones,
  type Passage,
  type Question 
} from "@/data/reading-recovery-content";

type Step = 1 | 2 | 3 | 4 | 5;

interface AdminInfo {
  studentName: string;
  assessmentDate: string;
  adminName: string;
  adminEmail: string;
}

interface DetectedErrors {
  omissions: string[];
  substitutions: Array<{ expected: string; actual: string }>;
  insertions: string[];
}

interface Scores {
  oralReadingErrors: number;
  questionResults: Record<string, boolean>;
  transcript?: string;
  detectedErrors?: DetectedErrors;
}

const ReadingRecoveryDiagnostic = () => {
  const [step, setStep] = useState<Step>(1);
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    studentName: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    adminName: "",
    adminEmail: "",
  });
  const [selectedGradeBand, setSelectedGradeBand] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<"A" | "B" | "C" | "">("");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [scores, setScores] = useState<Scores>({ oralReadingErrors: 0, questionResults: {} });
  const [decodingChecks, setDecodingChecks] = useState<string[]>([]);

  const handleNext = () => {
    if (step === 2 && selectedGradeBand && selectedVersion) {
      const p = getPassage(selectedGradeBand, selectedVersion as "A" | "B" | "C");
      setPassage(p || null);
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const toggleQuestionResult = (questionId: string) => {
    setScores((prev) => ({
      ...prev,
      questionResults: {
        ...prev.questionResults,
        [questionId]: !prev.questionResults[questionId],
      },
    }));
  };

  const calculateScores = () => {
    if (!passage) return { literal: 0, inferential: 0, analytical: 0, total: 0 };
    const results = scores.questionResults;
    let literal = 0, inferential = 0, analytical = 0;
    passage.questions.forEach((q) => {
      if (results[q.id]) {
        if (q.level === "literal") literal++;
        else if (q.level === "inferential") inferential++;
        else if (q.level === "analytical") analytical++;
      }
    });
    return { literal, inferential, analytical, total: literal + inferential + analytical };
  };

  const identifyBreakdownPoint = () => {
    if (!passage) return null;
    const sc = calculateScores();
    const thresholds = passage.scoringThresholds;
    
    // Check decoding first (priority order)
    const isElementary = ["1-2", "3-4"].includes(passage.gradeBand);
    const decodingThreshold = isElementary ? 8 : 16;
    if (scores.oralReadingErrors >= decodingThreshold) return "decoding";
    
    // Check comprehension gaps
    const literalMax = thresholds.literal.total;
    const inferentialMax = thresholds.inferential.total;
    const analyticalMax = thresholds.analytical.total;
    
    const literalGap = passage.gradeBand === "1-2" ? sc.literal <= 1 : sc.literal <= (literalMax <= 3 ? 1 : 2);
    const inferentialGap = passage.gradeBand === "1-2" ? sc.inferential === 0 : sc.inferential <= (inferentialMax <= 2 ? 0 : 1);
    const analyticalGap = passage.gradeBand === "1-2" ? sc.analytical === 0 : sc.analytical <= (analyticalMax <= 1 ? 0 : 1);

    if (literalGap) return "literal";
    if (inferentialGap) return "inferential";
    if (analyticalGap) return "analytical";
    return null;
  };

  const getInterpretation = () => {
    const breakdown = identifyBreakdownPoint();
    if (!breakdown) return null;
    return interpretationGuide[breakdown as keyof typeof interpretationGuide];
  };

  const progressPercent = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/reading-recovery" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold">Reading Recovery Diagnostic</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round(progressPercent)}% Complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Step 1: Admin Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Administrator Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input id="studentName" value={adminInfo.studentName} onChange={(e) => setAdminInfo({ ...adminInfo, studentName: e.target.value })} placeholder="Enter student name" />
                </div>
                <div>
                  <Label htmlFor="assessmentDate">Assessment Date</Label>
                  <Input id="assessmentDate" type="date" value={adminInfo.assessmentDate} onChange={(e) => setAdminInfo({ ...adminInfo, assessmentDate: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="adminName">Administrator Name *</Label>
                  <Input id="adminName" value={adminInfo.adminName} onChange={(e) => setAdminInfo({ ...adminInfo, adminName: e.target.value })} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Administrator Email *</Label>
                  <Input id="adminEmail" type="email" value={adminInfo.adminEmail} onChange={(e) => setAdminInfo({ ...adminInfo, adminEmail: e.target.value })} placeholder="your@email.com" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={!adminInfo.studentName || !adminInfo.adminName || !adminInfo.adminEmail}>
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Grade Band & Version */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Grade Band & Version</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Grade Band</Label>
                <RadioGroup value={selectedGradeBand} onValueChange={setSelectedGradeBand} className="grid md:grid-cols-2 gap-3">
                  {gradeBands.map((gb) => (
                    <Label key={gb.value} htmlFor={gb.value} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedGradeBand === gb.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value={gb.value} id={gb.value} />
                      <div>
                        <div className="font-medium">{gb.label}</div>
                        <div className="text-sm text-muted-foreground">{gb.description}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold mb-3 block">Version</Label>
                <RadioGroup value={selectedVersion} onValueChange={(v) => setSelectedVersion(v as "A" | "B" | "C")} className="grid md:grid-cols-3 gap-3">
                  {versions.map((v) => (
                    <Label key={v.value} htmlFor={`v-${v.value}`} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedVersion === v.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value={v.value} id={`v-${v.value}`} />
                      <div>
                        <div className="font-medium">{v.label}</div>
                        <div className="text-sm text-muted-foreground">{v.description}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
                <Button onClick={handleNext} disabled={!selectedGradeBand || !selectedVersion}>Begin Assessment <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Passage & Oral Reading */}
        {step === 3 && passage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>"{passage.title}"</CardTitle>
                <p className="text-sm text-muted-foreground">{passage.metadata.wordCount} words | Lexile: {passage.metadata.lexile} | {passage.metadata.focus}</p>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-lg border whitespace-pre-wrap text-lg leading-relaxed">
                  {passage.text}
                </div>
              </CardContent>
            </Card>

            {/* Auto-Assist Recording */}
            <OralReadingAutoAssist
              passageText={passage.text}
              passageTitle={passage.title}
              gradeBand={passage.gradeBand}
              version={passage.version}
              studentName={adminInfo.studentName}
              initialErrorCount={scores.oralReadingErrors}
              onErrorCountConfirmed={(count, transcript, errors, suggestedStrategy) => {
                setScores(prev => ({
                  ...prev,
                  oralReadingErrors: count,
                  transcript,
                  detectedErrors: errors
                }));
                // Auto-check the suggested decoding strategy
                if (suggestedStrategy && passage?.decodingChecklist?.strategies) {
                  const matchingStrategy = passage.decodingChecklist.strategies.find(
                    s => s.toLowerCase().includes(suggestedStrategy.toLowerCase().split(' ')[0]) ||
                         suggestedStrategy.toLowerCase().includes(s.toLowerCase().split(' ')[0])
                  );
                  if (matchingStrategy && !decodingChecks.includes(matchingStrategy)) {
                    setDecodingChecks(prev => [...prev.filter(s => s !== matchingStrategy), matchingStrategy]);
                  } else if (suggestedStrategy) {
                    // Try exact match from the strategies list
                    const exactMatch = passage.decodingChecklist.strategies.find(s => 
                      s === suggestedStrategy
                    );
                    if (exactMatch && !decodingChecks.includes(exactMatch)) {
                      setDecodingChecks(prev => [...prev.filter(s => s !== exactMatch), exactMatch]);
                    }
                  }
                }
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Decoding Observation</CardTitle>
                <p className="text-sm text-muted-foreground">Manual entry (or use Auto-Assist above)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="errors">Number of Oral Reading Errors</Label>
                  <Input id="errors" type="number" min={0} value={scores.oralReadingErrors} onChange={(e) => setScores({ ...scores, oralReadingErrors: parseInt(e.target.value) || 0 })} className="w-32" />
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Accuracy Thresholds:</p>
                  <p className="text-emerald-600">✓ {passage.decodingChecklist.accuracyLevels.strong}</p>
                  <p className="text-amber-600">⚠ {passage.decodingChecklist.accuracyLevels.needsSupport}</p>
                  <p className="text-red-600">✗ {passage.decodingChecklist.accuracyLevels.significantGap}</p>
                </div>
                {passage.decodingChecklist.strategies && (
                  <div>
                    <p className="font-medium mb-2">Decoding Strategies Observed:</p>
                    <div className="space-y-2">
                      {passage.decodingChecklist.strategies.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox id={`strat-${i}`} checked={decodingChecks.includes(s)} onCheckedChange={(c) => setDecodingChecks(c ? [...decodingChecks, s] : decodingChecks.filter(x => x !== s))} />
                          <Label htmlFor={`strat-${i}`} className="text-sm">{s}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
                  <Button onClick={handleNext}>Continue to Comprehension <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Comprehension Questions */}
        {step === 4 && passage && (
          <div className="space-y-6">
            {/* Instruction Banner */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Oral Assessment Instructions</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Ask each question <strong>verbally</strong> to the student and listen to their response. 
                      Mark "Correct" if their answer demonstrates understanding, or "Incorrect" if they struggle 
                      or give an inaccurate response. There are no multiple-choice options—evaluate the quality 
                      of the student's verbal explanation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(["literal", "inferential", "analytical"] as const).map((level) => {
              const questions = passage.questions.filter((q) => q.level === level);
              const levelLabels = { literal: "LITERAL COMPREHENSION", inferential: "INFERENTIAL COMPREHENSION", analytical: "ANALYTICAL COMPREHENSION" };
              const levelDescs = { 
                literal: "Ask the student to recall facts stated directly in the text", 
                inferential: "Ask the student to make inferences and read between the lines", 
                analytical: "Ask the student to think critically and evaluate the text" 
              };
              return (
                <Card key={level}>
                  <CardHeader>
                    <CardTitle className="text-lg">{levelLabels[level]}</CardTitle>
                    <p className="text-sm text-muted-foreground">{levelDescs[level]}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Ask the student:</p>
                          <p className="font-medium">"{q.text}"</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground text-center">Student's response:</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant={scores.questionResults[q.id] ? "default" : "outline"} className={scores.questionResults[q.id] ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => toggleQuestionResult(q.id)}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Correct
                            </Button>
                            <Button size="sm" variant={scores.questionResults[q.id] === false ? "destructive" : "outline"} onClick={() => setScores(prev => ({ ...prev, questionResults: { ...prev.questionResults, [q.id]: false } }))}>
                              <XCircle className="w-4 h-4 mr-1" /> Incorrect
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">Complete Assessment <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && passage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Results for {adminInfo.studentName}</CardTitle>
                <p className="text-sm text-muted-foreground">{passage.title} - {passage.versionLabel}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  const sc = calculateScores();
                  const breakdown = identifyBreakdownPoint();
                  const interp = getInterpretation();
                  return (
                    <>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Literal</p>
                          <p className="text-2xl font-bold">{sc.literal}/{passage.scoringThresholds.literal.total}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Inferential</p>
                          <p className="text-2xl font-bold">{sc.inferential}/{passage.scoringThresholds.inferential.total}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Analytical</p>
                          <p className="text-2xl font-bold">{sc.analytical}/{passage.scoringThresholds.analytical.total}</p>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-2xl font-bold text-primary">{sc.total}/{passage.scoringThresholds.totalQuestions}</p>
                        </div>
                      </div>

                      <Separator />

                      {breakdown ? (
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                            <h3 className="font-bold text-lg">Primary Breakdown Point: {breakdown.toUpperCase()}</h3>
                          </div>
                          {interp && "characteristics" in interp && (
                            <>
                              <p className="font-medium mb-2">Characteristics:</p>
                              <ul className="list-disc pl-5 space-y-1 mb-4">
                                {interp.characteristics.map((c, i) => <li key={i}>{c}</li>)}
                              </ul>
                              <p className="font-medium mb-2">{interp.focus.title}</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {interp.focus.days.map((d, i) => <li key={i}>{d}</li>)}
                              </ul>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <h3 className="font-bold text-lg">No Significant Gaps Identified!</h3>
                          </div>
                          <p>Great work! Continue with grade-level reading practice and enrichment activities.</p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h3 className="font-bold mb-3">Celebration Milestones to Track</h3>
                        <div className="space-y-2">
                          {celebrationMilestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Checkbox id={`mile-${i}`} />
                              <Label htmlFor={`mile-${i}`}>{m}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
              <Link to="/reading-recovery">
                <Button>Done</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingRecoveryDiagnostic;
