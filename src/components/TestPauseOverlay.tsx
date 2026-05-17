import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

interface TestPauseOverlayProps {
  open: boolean;
  onResume: () => void;
  pausedAt: number | null;
}

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function TestPauseOverlay({ open, onResume, pausedAt }: TestPauseOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open || !pausedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - pausedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, pausedAt]);

  if (!open) return null;

  const showNudge = elapsed >= 600; // 10 minutes

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001F3F]/95 backdrop-blur-md">
      <div className="mx-6 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFDE59]/30">
          <Pause className="h-8 w-8 text-[#1C2D5A]" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[#1C2D5A]">Test Paused</h2>
        <p className="mb-1 text-sm text-[#1C2D5A]/70">
          Your timer and answers are saved. Take your time — no penalty.
        </p>
        <p className="mb-6 font-mono text-3xl font-bold text-[#1C2D5A]">
          {formatDuration(elapsed)}
        </p>
        {showNudge && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Ready to come back? Click resume whenever you're set.
          </p>
        )}
        <Button
          onClick={onResume}
          size="lg"
          className="w-full bg-[#22c55e] text-white hover:bg-[#16a34a]"
        >
          <Play className="mr-2 h-5 w-5" />
          Resume Test
        </Button>
      </div>
    </div>
  );
}
