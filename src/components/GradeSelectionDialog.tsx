import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GradeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (grade: number) => void;
  testName: string;
}

export function GradeSelectionDialog({
  open,
  onOpenChange,
  onConfirm,
  testName,
}: GradeSelectionDialogProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("");

  const handleConfirm = () => {
    if (selectedGrade) {
      onConfirm(parseInt(selectedGrade));
    }
  };

  const getPricing = () => {
    if (!selectedGrade) return null;
    const grade = parseInt(selectedGrade);
    return grade <= 6 ? "$99" : "$120";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Your Grade</DialogTitle>
          <DialogDescription>
            Choose your current grade level to determine pricing for the {testName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedGrade && (
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <p className="text-sm font-medium">Test Price: {getPricing()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {parseInt(selectedGrade) <= 6 ? "Grades 1-6 pricing" : "Grades 7+ pricing"}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedGrade}>
            Continue to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
