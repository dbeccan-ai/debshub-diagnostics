import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PreTestSecurityCheckProps {
  open: boolean;
  onConfirm: () => void;
  testName: string;
}

export const PreTestSecurityCheck = ({
  open,
  onConfirm,
  testName,
}: PreTestSecurityCheckProps) => {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <button
          onClick={handleExit}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Exit to dashboard"
        >
          <X className="h-5 w-5" />
        </button>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Security Check Before Starting
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            <span className="font-semibold text-slate-800">{testName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              Important Test Rules
            </h4>
            <ul className="space-y-2 text-sm text-amber-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span><strong>Close all other browser tabs and windows</strong> before starting the test.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>Switching to another tab or window will <strong>immediately disable</strong> your test.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>You will need to request a new test attempt if your test is disabled.</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              Before You Begin
            </h4>
            <ul className="space-y-1 text-sm text-green-700">
              <li>✓ All other browser tabs are closed</li>
              <li>✓ All other browser windows are closed</li>
              <li>✓ Notifications are silenced</li>
              <li>✓ You are in a quiet testing environment</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pt-2 gap-3">
          <Button
            variant="outline"
            onClick={handleExit}
            className="px-6"
          >
            Exit
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold px-8"
          >
            I Understand - Start Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
