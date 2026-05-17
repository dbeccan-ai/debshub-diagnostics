import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PauseCircle, Play } from "lucide-react";

interface TestSecurityWarningProps {
  open: boolean;
  onClose: () => void;
  onReturnToDashboard: () => void;
  onResume?: () => void;
  tabSwitchCount: number;
}

export const TestSecurityWarning = ({
  open,
  onClose,
  onReturnToDashboard,
  onResume,
  tabSwitchCount,
}: TestSecurityWarningProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <PauseCircle className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl text-amber-700">
            Test Paused
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-slate-700">
              Your test was paused because you switched to another tab or window.
              Don't worry — <strong>your answers and remaining time are saved</strong>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-amber-700 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Tab switches detected: {tabSwitchCount}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              You can resume right where you left off, or return to the dashboard
              and continue later.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4 flex-col sm:flex-row gap-2">
          {onResume && (
            <Button
              onClick={onResume}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="mr-2 h-4 w-4" />
              Resume Test
            </Button>
          )}
          <Button
            onClick={onReturnToDashboard}
            variant="outline"
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
