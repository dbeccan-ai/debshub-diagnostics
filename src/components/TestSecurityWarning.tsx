import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MonitorX } from "lucide-react";

interface TestSecurityWarningProps {
  open: boolean;
  onClose: () => void;
  onReturnToDashboard: () => void;
  tabSwitchCount: number;
}

export const TestSecurityWarning = ({
  open,
  onClose,
  onReturnToDashboard,
  tabSwitchCount,
}: TestSecurityWarningProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <MonitorX className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl text-red-700">
            Test Session Terminated
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-slate-700">
              Your test has been <strong>disabled</strong> because you switched 
              to another tab or window during the test.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-red-700 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Tab switches detected: {tabSwitchCount}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Please contact your teacher or administrator if you believe this 
              was an error. You will need a new test attempt to continue.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4">
          <Button
            onClick={onReturnToDashboard}
            className="bg-slate-700 hover:bg-slate-800"
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
