import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, XCircle, AlertTriangle, Volume2, Mic, Trophy, BarChart3, Loader2 } from "lucide-react";
import { OralReadingAutoAssist } from "@/components/OralReadingAutoAssist";
import { OralQuestionAssist, type QuestionTranscript } from "@/components/OralQuestionAssist";
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
  questionTranscripts?: Record<string, QuestionTranscript>;
}

const ReadingRecoveryDiagnostic = () => {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [savedTranscriptId, setSavedTranscriptId] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    studentName: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    adminName: "",
    adminEmail: "",
  });
  const [selectedGradeBand, setSelectedGradeBand] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<"A" | "B" | "C" | "">("");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [scores, setScores] = useState<Scores>({ oralReadingErrors: 0, questionResults: {}, questionTranscripts: {} });
  const [decodingChecks, setDecodingChecks] = useState<string[]>([]);
  const [oralConsentGiven, setOralConsentGiven] = useState(false);
  const [deleteAudioAfter24h, setDeleteAudioAfter24h] = useState(true);

  // Check authentication and enrollment on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Redirect to Reading Recovery auth with redirect back
        navigate("/reading-recovery/auth?redirect=/reading-recovery/diagnostic");
        return;
      }
      
      setUserId(session.user.id);
      
      // Check if enrolled in Reading Recovery
      const { data: enrollment } = await supabase
        .from("reading_recovery_enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (!enrollment) {
        // Redirect to enroll
        navigate("/reading-recovery/auth?redirect=/reading-recovery/diagnostic");
        return;
      }
      
      setAuthLoading(false);
    };
    checkAuth();
  }, [navigate]);

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

  // Save assessment to database when reaching Step 5
  useEffect(() => {
    const saveAssessment = async () => {
      if (step !== 5 || !passage || !userId || savedTranscriptId) return;
      
      const sc = calculateScores();
      const percentage = Math.round((sc.total / passage.scoringThresholds.totalQuestions) * 100);
      
      try {
        const { data, error } = await supabase
          .from("reading_diagnostic_transcripts")
          .insert({
            user_id: userId,
            student_name: adminInfo.studentName,
            passage_title: passage.title,
            grade_band: passage.gradeBand,
            version: passage.version,
            original_text: passage.text,
            transcript: scores.transcript || null,
            detected_errors: scores.detectedErrors ? {
              omissions: scores.detectedErrors.omissions,
              substitutions: scores.detectedErrors.substitutions,
              insertions: scores.detectedErrors.insertions,
            } : null,
            final_error_count: scores.oralReadingErrors,
            consent_given: oralConsentGiven,
            auto_delete_enabled: deleteAudioAfter24h,
          })
          .select("id")
          .single();
        
        if (error) {
          console.error("Error saving assessment:", error);
        } else if (data) {
          setSavedTranscriptId(data.id);
          console.log("Assessment saved with ID:", data.id);
        }
      } catch (err) {
        console.error("Failed to save assessment:", err);
      }
    };
    
    saveAssessment();
  }, [step, passage, userId, savedTranscriptId, adminInfo.studentName, scores, oralConsentGiven, deleteAudioAfter24h]);

  const progressPercent = (step / 5) * 100;
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-amber-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Oral Assessment Instructions</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask each question <strong>verbally</strong> to the student and listen to their response. 
                      Mark "Correct" if their answer demonstrates understanding, or "Incorrect" if they struggle 
                      or give an inaccurate response. There are no multiple-choice options—evaluate the quality 
                      of the student's verbal explanation.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                      <Volume2 className="w-3 h-3" />
                      <span><strong>Tip:</strong> Use the speaker to read the question aloud. Use the mic to capture the student's verbal response.</span>
                      <Mic className="w-3 h-3 ml-1" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consent Checkbox */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="oral-consent"
                      checked={oralConsentGiven}
                      onCheckedChange={(c) => setOralConsentGiven(!!c)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="oral-consent" className="text-sm font-medium cursor-pointer">
                        I have permission to record/transcribe the student's voice for this assessment.
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Microphone features are disabled until consent is provided.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-6">
                    <Checkbox
                      id="delete-audio-24h"
                      checked={deleteAudioAfter24h}
                      onCheckedChange={(c) => setDeleteAudioAfter24h(!!c)}
                      disabled={!oralConsentGiven}
                    />
                    <Label htmlFor="delete-audio-24h" className="text-xs text-muted-foreground cursor-pointer">
                      Delete audio recordings after 24 hours (recommended)
                    </Label>
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
                      <OralQuestionAssist
                        key={q.id}
                        questionId={q.id}
                        questionText={q.text}
                        questionNumber={q.number}
                        questionType={level}
                        passageText={passage.text}
                        isCorrect={scores.questionResults[q.id] ?? null}
                        consentGiven={oralConsentGiven}
                        onTranscriptUpdate={(data) => {
                          setScores(prev => ({
                            ...prev,
                            questionTranscripts: {
                              ...prev.questionTranscripts,
                              [q.id]: data,
                            },
                          }));
                        }}
                        onCorrectChange={(isCorrect) => {
                          setScores(prev => ({
                            ...prev,
                            questionResults: {
                              ...prev.questionResults,
                              [q.id]: isCorrect,
                            },
                          }));
                        }}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">Complete Assessment <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && passage && (
          <div className="space-y-6">
            {/* Hero Results Card with Tier */}
            {(() => {
              const sc = calculateScores();
              const breakdown = identifyBreakdownPoint();
              const interp = getInterpretation();
              const percentage = Math.round((sc.total / passage.scoringThresholds.totalQuestions) * 100);
              const tier = percentage >= 80 ? 'Tier 1' : percentage >= 50 ? 'Tier 2' : 'Tier 3';
              const tierColor = tier === 'Tier 1' ? 'bg-emerald-500' : tier === 'Tier 2' ? 'bg-amber-500' : 'bg-red-500';
              const tierBg = tier === 'Tier 1' ? 'bg-emerald-50 border-emerald-200' : tier === 'Tier 2' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
              const tierDesc = tier === 'Tier 1' 
                ? 'Excellent! Student has mastered reading comprehension at this level.'
                : tier === 'Tier 2'
                ? 'Good progress. Some areas need additional support and practice.'
                : 'Needs significant support. Focused intervention recommended.';

              return (
                <>
                  {/* Main Score & Tier Display */}
                  <Card className={`border-2 ${tierBg}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Score Circle */}
                        <div className="flex flex-col items-center">
                          <div className={`w-32 h-32 rounded-full ${tierColor} flex items-center justify-center shadow-lg`}>
                            <div className="text-center text-white">
                              <p className="text-4xl font-bold">{percentage}%</p>
                              <p className="text-sm opacity-90">Score</p>
                            </div>
                          </div>
                          <p className="mt-3 text-lg font-semibold">{sc.total}/{passage.scoringThresholds.totalQuestions} Correct</p>
                        </div>

                        {/* Tier Badge & Description */}
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                            <span className={`px-4 py-2 rounded-full text-white font-bold text-lg ${tierColor}`}>
                              {tier}
                            </span>
                            {tier === 'Tier 1' && <Trophy className="w-6 h-6 text-emerald-600" />}
                          </div>
                          <h2 className="text-2xl font-bold mb-2">
                            Assessment Complete for {adminInfo.studentName}
                          </h2>
                          <p className="text-muted-foreground">{tierDesc}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {passage.title} • Grade Band {passage.gradeBand} • Version {passage.version}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Score Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Score Breakdown by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Literal Comprehension</p>
                          <p className="text-3xl font-bold">{sc.literal}/{passage.scoringThresholds.literal.total}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((sc.literal / passage.scoringThresholds.literal.total) * 100)}%
                          </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Inferential Comprehension</p>
                          <p className="text-3xl font-bold">{sc.inferential}/{passage.scoringThresholds.inferential.total}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((sc.inferential / passage.scoringThresholds.inferential.total) * 100)}%
                          </p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Analytical Comprehension</p>
                          <p className="text-3xl font-bold">{sc.analytical}/{passage.scoringThresholds.analytical.total}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((sc.analytical / passage.scoringThresholds.analytical.total) * 100)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Breakdown Point / Success Message */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Assessment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>

                  {/* Celebration Milestones */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Celebration Milestones to Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {celebrationMilestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                            <Checkbox id={`mile-${i}`} />
                            <Label htmlFor={`mile-${i}`} className="cursor-pointer">{m}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Button>
              <div className="flex gap-3">
                {savedTranscriptId && (
                  <Link to={`/reading-recovery/results/${savedTranscriptId}`}>
                    <Button variant="outline">View Detailed Results</Button>
                  </Link>
                )}
                <Link to="/reading-recovery/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingRecoveryDiagnostic;
