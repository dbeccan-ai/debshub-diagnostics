import { useRef, useState } from "react";
import { Volume2, Mic, Loader2, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  text: string;
  mode?: "letter" | "word";
  dayNumber?: number | null;
  enrollmentId?: string | null;
  className?: string;
}

// Session-scoped audio cache: identical (text|mode) plays back instantly and free
const audioCache = new Map<string, string>();

const PhonicsChip = ({ text, mode = "word", dayNumber, enrollmentId, className }: Props) => {
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"idle" | "correct" | "retry">("idle");
  const [attempts, setAttempts] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cacheKey = `${mode}|${text.toLowerCase()}`;

  const play = async () => {
    try {
      setPlaying(true);
      let url = audioCache.get(cacheKey);
      if (!url) {
        const { data, error } = await supabase.functions.invoke("phonics-speak", {
          body: { text, mode },
        });
        if (error) throw error;
        // data is a Blob when the function returns audio/mpeg
        const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        audioCache.set(cacheKey, url);
      }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e: any) {
      setPlaying(false);
      toast({ title: "Couldn't play sound", description: e?.message ?? "Try again in a moment.", variant: "destructive" });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await check(blob);
      };
      rec.start();
      setRecording(true);
      setStatus("idle");
      // Auto-stop after 3s
      setTimeout(() => rec.state === "recording" && rec.stop(), 3000);
    } catch {
      toast({
        title: "Microphone needed",
        description: "Please allow microphone access to practice saying the sound.",
        variant: "destructive",
      });
    }
  };

  const check = async (blob: Blob) => {
    setRecording(false);
    setChecking(true);
    try {
      const ext = (blob.type.split(";")[0].split("/")[1] || "webm").replace("mpeg", "mp3");
      const file = new File([blob], `clip.${ext}`, { type: blob.type });
      const form = new FormData();
      form.append("audio", file);
      form.append("target", text);
      form.append("mode", mode);
      if (dayNumber != null) form.append("day_number", String(dayNumber));
      if (enrollmentId) form.append("enrollment_id", enrollmentId);

      const { data, error } = await supabase.functions.invoke("phonics-check", { body: form });
      if (error) throw error;
      const correct = !!data?.correct;
      setAttempts((n) => n + 1);
      setStatus(correct ? "correct" : "retry");
      if (!correct) {
        // Auto-replay target after a short pause so the child can hear it again
        setTimeout(() => play(), 400);
      }
    } catch (e: any) {
      toast({ title: "Couldn't check your sound", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const borderColor =
    status === "correct" ? "border-emerald-500 bg-emerald-50" :
    status === "retry" ? "border-amber-500 bg-amber-50" :
    "border-muted bg-muted/20";

  return (
    <div className={cn("rounded-md border p-2 flex flex-col items-center gap-1 transition-colors", borderColor, className)}>
      <div className="text-base font-semibold">{text}</div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={play}
          disabled={playing}
          className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
          aria-label={`Hear ${mode === "letter" ? "sound for" : "word"} ${text}`}
          title="Hear it"
        >
          {playing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={startRecording}
          disabled={recording || checking}
          className={cn(
            "p-1.5 rounded-full disabled:opacity-50",
            recording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700"
          )}
          aria-label={`Say ${text}`}
          title="Say it"
        >
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           status === "correct" ? <Check className="w-3.5 h-3.5" /> :
           status === "retry" ? <RotateCcw className="w-3.5 h-3.5" /> :
           <Mic className="w-3.5 h-3.5" />}
        </button>
      </div>
      {status !== "idle" && (
        <div className={cn("text-[10px] font-medium", status === "correct" ? "text-emerald-700" : "text-amber-700")}>
          {status === "correct" ? "Great!" : "Try again"}
          {attempts > 1 && ` (${attempts})`}
        </div>
      )}
    </div>
  );
};

export default PhonicsChip;
