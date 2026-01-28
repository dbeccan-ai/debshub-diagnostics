import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Wand2,
  Edit2,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DetectedErrors {
  omissions: string[];
  substitutions: Array<{ expected: string; actual: string }>;
  insertions: string[];
}

interface LanguageInfo {
  detectedAccent: string | null;
  confidence: number;
  notes: string;
}

interface OralReadingAutoAssistProps {
  passageText: string;
  passageTitle: string;
  gradeBand: string;
  version: string;
  studentName: string;
  onErrorCountConfirmed: (count: number, transcript: string, errors: DetectedErrors, suggestedStrategy?: string) => void;
  initialErrorCount?: number;
}

// Analyze error patterns to suggest the most likely decoding strategy used
const analyzeDecodingStrategy = (errors: DetectedErrors, totalWords: number): string | undefined => {
  const omissionCount = errors.omissions.length;
  const substitutionCount = errors.substitutions.length;
  const insertionCount = errors.insertions.length;
  const totalErrors = omissionCount + substitutionCount + insertionCount;
  
  // If very few errors, student is doing well
  if (totalErrors === 0 || (totalErrors <= 2 && totalWords > 50)) {
    return "Sounded out unfamiliar words successfully";
  }
  
  // High omission rate suggests skipping difficult words
  if (omissionCount >= 3 && omissionCount > substitutionCount) {
    return "Skipped difficult words entirely";
  }
  
  // Check substitutions for phonetic similarity patterns
  // If substitutions have similar starting sounds, likely attempted to sound out
  const phoneticSubstitutions = errors.substitutions.filter(sub => {
    const expected = sub.expected.toLowerCase();
    const actual = sub.actual.toLowerCase();
    // Check if first letter or first two letters match (attempted sounding out)
    return expected[0] === actual[0] || 
           (expected.length > 1 && actual.length > 1 && expected.slice(0, 2) === actual.slice(0, 2));
  });
  
  if (phoneticSubstitutions.length >= 2 || 
      (substitutionCount >= 2 && phoneticSubstitutions.length > substitutionCount / 2)) {
    return "Attempted to sound out but needed help";
  }
  
  // Random substitutions suggest guessing based on context/pictures
  if (substitutionCount >= 2) {
    return "Guessed at words based on pictures/first letter";
  }
  
  // Default for moderate errors
  if (totalErrors >= 3) {
    return "Attempted to sound out but needed help";
  }
  
  return undefined;
};

export const OralReadingAutoAssist = ({
  passageText,
  passageTitle,
  gradeBand,
  version,
  studentName,
  onErrorCountConfirmed,
  initialErrorCount = 0,
}: OralReadingAutoAssistProps) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [detectedErrors, setDetectedErrors] = useState<DetectedErrors | null>(null);
  const [suggestedErrorCount, setSuggestedErrorCount] = useState<number | null>(null);
  const [confirmedErrorCount, setConfirmedErrorCount] = useState<number>(initialErrorCount);
  const [isEditing, setIsEditing] = useState(false);
  const [editedErrors, setEditedErrors] = useState<DetectedErrors | null>(null);
  const [languageInfo, setLanguageInfo] = useState<LanguageInfo | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started. Have the student read the passage aloud.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped.");
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error("No audio recording found.");
      return;
    }

    setIsTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use transcription.");
        return;
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("originalText", passageText);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          toast.error("Payment required. Please add credits to continue.");
        } else {
          toast.error(errorData.error || "Transcription failed.");
        }
        return;
      }

      const result = await response.json();
      setTranscript(result.transcript);
      setDetectedErrors(result.errors);
      setEditedErrors(result.errors);
      setSuggestedErrorCount(result.suggestedErrorCount);
      setConfirmedErrorCount(result.suggestedErrorCount);
      
      // Set language/accent info if detected
      if (result.languageInfo) {
        setLanguageInfo(result.languageInfo);
      }
      
      let successMessage = `Transcription complete! Detected ${result.suggestedErrorCount} potential errors.`;
      if (result.languageInfo?.detectedAccent && result.languageInfo.detectedAccent !== "Native English") {
        successMessage += ` Detected ${result.languageInfo.detectedAccent} accent.`;
      }
      toast.success(successMessage);
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const confirmErrors = () => {
    if (transcript && editedErrors) {
      const wordCount = passageText.split(/\s+/).length;
      const suggestedStrategy = analyzeDecodingStrategy(editedErrors, wordCount);
      onErrorCountConfirmed(confirmedErrorCount, transcript, editedErrors, suggestedStrategy);
      toast.success("Errors confirmed and saved.");
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript(null);
    setDetectedErrors(null);
    setLanguageInfo(null);
    setEditedErrors(null);
    setSuggestedErrorCount(null);
  };

  const removeError = (type: "omissions" | "insertions", index: number) => {
    if (!editedErrors) return;
    const updated = { ...editedErrors };
    updated[type] = updated[type].filter((_, i) => i !== index);
    setEditedErrors(updated);
    setConfirmedErrorCount(
      updated.omissions.length + updated.substitutions.length + updated.insertions.length
    );
  };

  const removeSubstitution = (index: number) => {
    if (!editedErrors) return;
    const updated = { ...editedErrors };
    updated.substitutions = updated.substitutions.filter((_, i) => i !== index);
    setEditedErrors(updated);
    setConfirmedErrorCount(
      updated.omissions.length + updated.substitutions.length + updated.insertions.length
    );
  };

  const highlightErrors = (text: string) => {
    if (!editedErrors) return text;
    
    const words = text.split(/\s+/);
    const errorWords = new Set([
      ...editedErrors.omissions,
      ...editedErrors.insertions,
      ...editedErrors.substitutions.map(s => s.actual),
    ]);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()\-—–]/g, "");
      if (errorWords.has(cleanWord)) {
        return (
          <span key={i} className="bg-red-200 text-red-800 px-1 rounded">
            {word}
          </span>
        );
      }
      return <span key={i}>{word} </span>;
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            Auto-Assist Recording
          </CardTitle>
          <Badge variant="outline" className="bg-blue-100">Beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Record the student reading aloud for automatic error detection
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Checkbox 
            id="consent" 
            checked={consentGiven} 
            onCheckedChange={(checked) => setConsentGiven(checked === true)}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="consent" className="font-medium text-amber-800">
              I have permission to record this student
            </Label>
            <p className="text-sm text-amber-700 mt-1">
              Ensure you have proper consent before recording. Audio will be processed securely.
            </p>
          </div>
        </div>

        {/* Auto-delete Setting */}
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
          <div>
            <Label className="font-medium">Auto-delete audio after 24 hours</Label>
            <p className="text-sm text-muted-foreground">Recommended for privacy compliance</p>
          </div>
          <Switch 
            checked={autoDeleteEnabled} 
            onCheckedChange={setAutoDeleteEnabled}
          />
        </div>

        {!consentGiven && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Please confirm consent before recording
          </div>
        )}

        {/* Recording Controls */}
        {consentGiven && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {!isRecording && !audioBlob && (
                <Button 
                  onClick={startRecording} 
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive"
                  className="animate-pulse"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}

              {audioBlob && !isRecording && (
                <>
                  <audio src={audioUrl || undefined} controls className="h-10" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearRecording}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>

            {/* Transcribe Button */}
            {audioBlob && !transcript && (
              <Button 
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Analyze Reading
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            {transcript && editedErrors && (
              <div className="space-y-4 pt-2">
                <Separator />

                {/* Language/Accent Detection */}
                {languageInfo && languageInfo.detectedAccent && (
                  <div className={`p-3 rounded-lg border ${
                    languageInfo.detectedAccent === "Native English" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-indigo-50 border-indigo-200"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <Label className={`font-medium flex items-center gap-2 ${
                        languageInfo.detectedAccent === "Native English" 
                          ? "text-green-800" 
                          : "text-indigo-800"
                      }`}>
                        🌍 Detected Accent/Language
                      </Label>
                      <Badge variant="outline" className={
                        languageInfo.detectedAccent === "Native English" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-indigo-100 text-indigo-700"
                      }>
                        {languageInfo.confidence}% confidence
                      </Badge>
                    </div>
                    <p className={`font-semibold ${
                      languageInfo.detectedAccent === "Native English" 
                        ? "text-green-700" 
                        : "text-indigo-700"
                    }`}>
                      {languageInfo.detectedAccent}
                    </p>
                    {languageInfo.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {languageInfo.notes}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Transcript */}
                <div>
                  <Label className="font-medium mb-2 block">Transcription</Label>
                  <div className="p-3 bg-white border rounded-lg text-sm leading-relaxed">
                    {highlightErrors(transcript)}
                  </div>
                </div>

                {/* Detected Errors */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* Omissions */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium text-orange-800">Omissions</Label>
                      <Badge variant="outline" className="bg-orange-100">
                        {editedErrors.omissions.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {editedErrors.omissions.map((word, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded">
                          <span className="text-orange-700">{word}</span>
                          <button 
                            onClick={() => removeError("omissions", i)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {editedErrors.omissions.length === 0 && (
                        <p className="text-sm text-orange-600">None detected</p>
                      )}
                    </div>
                  </div>

                  {/* Substitutions */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium text-red-800">Substitutions</Label>
                      <Badge variant="outline" className="bg-red-100">
                        {editedErrors.substitutions.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {editedErrors.substitutions.map((sub, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded">
                          <span>
                            <span className="text-red-700 line-through">{sub.expected}</span>
                            <span className="mx-1">→</span>
                            <span className="text-red-800 font-medium">{sub.actual}</span>
                          </span>
                          <button 
                            onClick={() => removeSubstitution(i)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {editedErrors.substitutions.length === 0 && (
                        <p className="text-sm text-red-600">None detected</p>
                      )}
                    </div>
                  </div>

                  {/* Insertions */}
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium text-purple-800">Insertions</Label>
                      <Badge variant="outline" className="bg-purple-100">
                        {editedErrors.insertions.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {editedErrors.insertions.map((word, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded">
                          <span className="text-purple-700">+ {word}</span>
                          <button 
                            onClick={() => removeError("insertions", i)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {editedErrors.insertions.length === 0 && (
                        <p className="text-sm text-purple-600">None detected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Count Confirmation */}
                <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg">
                  <div>
                    <Label className="font-medium">Total Error Count</Label>
                    <p className="text-sm text-muted-foreground">
                      Suggested: {suggestedErrorCount} | Current: {confirmedErrorCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <Input 
                          type="number" 
                          min={0}
                          value={confirmedErrorCount}
                          onChange={(e) => setConfirmedErrorCount(parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button size="sm" onClick={() => setIsEditing(false)}>
                          Done
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-primary">{confirmedErrorCount}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Confirm Button */}
                <Button 
                  onClick={confirmErrors}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Error Count ({confirmedErrorCount})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
