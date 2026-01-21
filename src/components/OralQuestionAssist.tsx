import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";

interface QuestionTranscript {
  questionId: string;
  transcriptText: string;
  audioBlob?: Blob;
  isCorrect: boolean | null;
  timestamp: Date;
}

interface OralQuestionAssistProps {
  questionId: string;
  questionText: string;
  questionNumber: number;
  isCorrect: boolean | null;
  consentGiven: boolean;
  onTranscriptUpdate: (data: QuestionTranscript) => void;
  onCorrectChange: (isCorrect: boolean) => void;
}

type SpeechStatus = "idle" | "listening" | "captured" | "not_supported" | "error";
type TTSStatus = "idle" | "speaking" | "paused";

export const OralQuestionAssist = ({
  questionId,
  questionText,
  questionNumber,
  isCorrect,
  consentGiven,
  onTranscriptUpdate,
  onCorrectChange,
}: OralQuestionAssistProps) => {
  // TTS State
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // STT State
  const [sttSupported, setSttSupported] = useState(true);
  const [sttStatus, setSttStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Fallback Recording State (for browsers without STT)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Admin notes (fallback mode)
  const [adminNotes, setAdminNotes] = useState("");

  // Check for STT support on mount
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSttSupported(false);
      setSttStatus("not_supported");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        (recognitionRef.current as any).abort();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // ========== TEXT-TO-SPEECH (Read Question) ==========
  const handleReadQuestion = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("SpeechSynthesis not supported");
      return;
    }

    if (ttsStatus === "speaking") {
      window.speechSynthesis.pause();
      setTtsStatus("paused");
      return;
    }

    if (ttsStatus === "paused") {
      window.speechSynthesis.resume();
      setTtsStatus("speaking");
      return;
    }

    // Start speaking
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => setTtsStatus("idle");
    utterance.onerror = () => setTtsStatus("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setTtsStatus("speaking");
  }, [questionText, ttsStatus]);

  const handleStopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    setTtsStatus("idle");
  }, []);

  // ========== SPEECH-TO-TEXT (Capture Answer) ==========
  const startListening = useCallback(() => {
    if (!consentGiven) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSttStatus("not_supported");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setSttStatus("listening");
    
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSttStatus("error");
      } else {
        setSttStatus("idle");
      }
    };

    recognition.onend = () => {
      if (sttStatus === "listening") {
        setSttStatus("captured");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [consentGiven, sttStatus]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      (recognitionRef.current as any).stop();
      setSttStatus("captured");
      
      // Save transcript data
      onTranscriptUpdate({
        questionId,
        transcriptText: transcript,
        isCorrect,
        timestamp: new Date(),
      });
    }
  }, [transcript, questionId, isCorrect, onTranscriptUpdate]);

  const retryListening = useCallback(() => {
    setTranscript("");
    setSttStatus("idle");
  }, []);

  // ========== FALLBACK: AUDIO RECORDING ==========
  const startRecording = useCallback(async () => {
    if (!consentGiven) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Save data
        onTranscriptUpdate({
          questionId,
          transcriptText: adminNotes,
          audioBlob: blob,
          isCorrect,
          timestamp: new Date(),
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  }, [consentGiven, questionId, adminNotes, isCorrect, onTranscriptUpdate]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setAdminNotes("");
  }, [audioUrl]);

  // Handle audio playback end
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  // ========== RENDER ==========
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-lg">
      {/* Question with TTS Controls */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Ask the student:</p>
          <p className="font-medium">"{questionText}"</p>
        </div>
        
        {/* TTS Controls */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReadQuestion}
            className="gap-1"
            title="Read question aloud"
          >
            {ttsStatus === "speaking" ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : ttsStatus === "paused" ? (
              <>
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Read</span>
              </>
            )}
          </Button>
          {(ttsStatus === "speaking" || ttsStatus === "paused") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStopReading}
              title="Stop reading"
            >
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* STT Section (when supported) */}
      {sttSupported && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2">
            {sttStatus === "idle" && (
              <Button
                size="sm"
                variant="outline"
                onClick={startListening}
                disabled={!consentGiven}
                className="gap-1"
              >
                <Mic className="w-4 h-4" />
                Start Answer
              </Button>
            )}
            {sttStatus === "listening" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopListening}
                className="gap-1"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            )}
            {sttStatus === "captured" && (
              <Button
                size="sm"
                variant="outline"
                onClick={retryListening}
                className="gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </Button>
            )}
            {sttStatus === "error" && (
              <span className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Microphone access denied
              </span>
            )}
            
            <span className="text-xs text-muted-foreground">
              {sttStatus === "idle" && "Ready to capture"}
              {sttStatus === "listening" && (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Listening...
                </span>
              )}
              {sttStatus === "captured" && "Captured"}
            </span>
          </div>

          {(transcript || sttStatus === "captured") && (
            <div className="bg-white border rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1">Student's Transcript:</p>
              <p className="text-sm">{transcript || "(No speech detected)"}</p>
            </div>
          )}
        </div>
      )}

      {/* Fallback Recording Section (when STT not supported) */}
      {!sttSupported && (
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="w-4 h-4" />
            Speech-to-text not available in this browser. Recording audio instead.
          </div>

          <div className="flex items-center gap-2">
            {!isRecording && !audioBlob && (
              <Button
                size="sm"
                variant="outline"
                onClick={startRecording}
                disabled={!consentGiven}
                className="gap-1"
              >
                <Mic className="w-4 h-4" />
                Record Audio
              </Button>
            )}
            {isRecording && (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopRecording}
                className="gap-1"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
            {audioBlob && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={playRecording}
                  className="gap-1"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRecording}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-record
                </Button>
              </>
            )}
          </div>

          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} className="hidden" />
          )}

          <div>
            <Label htmlFor={`notes-${questionId}`} className="text-xs text-muted-foreground">
              Admin Notes (optional):
            </Label>
            <Textarea
              id={`notes-${questionId}`}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes about the student's response..."
              className="h-20 mt-1"
            />
          </div>
        </div>
      )}

      {/* Correct/Incorrect Buttons */}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">Evaluate response:</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isCorrect === true ? "default" : "outline"}
            className={isCorrect === true ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => onCorrectChange(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Correct
          </Button>
          <Button
            size="sm"
            variant={isCorrect === false ? "destructive" : "outline"}
            onClick={() => onCorrectChange(false)}
          >
            <XCircle className="w-4 h-4 mr-1" /> Incorrect
          </Button>
        </div>
      </div>
    </div>
  );
};

export type { QuestionTranscript };
