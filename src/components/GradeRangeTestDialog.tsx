import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Test {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  is_paid: boolean | null;
  test_type: string | null;
}

interface GradeRangeTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradeRange: "1-6" | "7-12";
}

export function GradeRangeTestDialog({
  open,
  onOpenChange,
  gradeRange,
}: GradeRangeTestDialogProps) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const grades = gradeRange === "1-6" 
    ? [1, 2, 3, 4, 5, 6] 
    : [7, 8, 9, 10, 11, 12];

  const price = gradeRange === "1-6" ? "$99" : "$120";

  // Extract grade number from test name (e.g., "Grade 7 Math Diagnostic" -> 7)
  const extractGradeFromName = (name: string): number | null => {
    const match = name.match(/grade\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  // Filter and sort tests by grade range
  const filterTestsByGradeRange = (allTests: Test[]): Test[] => {
    const [minGrade, maxGrade] = gradeRange === "1-6" ? [1, 6] : [7, 12];
    
    return allTests
      .filter((test) => {
        const grade = extractGradeFromName(test.name);
        if (grade === null) return false;
        return grade >= minGrade && grade <= maxGrade;
      })
      .sort((a, b) => {
        const gradeA = extractGradeFromName(a.name) || 0;
        const gradeB = extractGradeFromName(b.name) || 0;
        return gradeA - gradeB;
      });
  };

  useEffect(() => {
    if (open) {
      fetchTests();
      setSelectedTest(null);
      setSelectedGrade(null);
    }
  }, [open, gradeRange]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests_public")
        .select("*")
        .eq("is_paid", true);

      if (error) throw error;
      
      const filteredTests = filterTestsByGradeRange(data || []);
      setTests(filteredTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelect = (test: Test) => {
    setSelectedTest(test);
    setSelectedGrade(null);
  };

  const handleGradeSelect = (grade: number) => {
    setSelectedGrade(grade);
  };

  const handleContinue = async () => {
    if (!selectedTest || !selectedGrade) return;

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Store selected test and grade in session storage for after auth
      sessionStorage.setItem("pendingTest", JSON.stringify({
        testId: selectedTest.id,
        testName: selectedTest.name,
        grade: selectedGrade,
      }));
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;

    // Create test attempt
    try {
      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .insert({
          test_id: selectedTest.id,
          user_id: user.id,
          grade_level: selectedGrade,
          payment_status: isAdmin ? "admin_bypass" : "pending",
        })
        .select()
        .single();

      if (error) throw error;

      onOpenChange(false);
      
      // Admins go directly to test, others go to checkout
      if (isAdmin) {
        toast.success("Admin access granted - starting test");
        navigate(`/test/${attempt.id}`);
      } else {
        navigate(`/checkout/${attempt.id}`);
      }
    } catch (error) {
      console.error("Error creating test attempt:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {gradeRange === "1-6" ? "Grades 1-6" : "Grades 7-12"} Diagnostic
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !selectedTest ? (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <p className="text-sm text-slate-600">
              Select a diagnostic test to get started:
            </p>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {tests.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No tests available for this grade range yet.
                </p>
              ) : (
                tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestSelect(test)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-900">{test.name}</div>
                    <div className="text-sm text-slate-500">{test.description}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {test.duration_minutes} minutes · {price}/student
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : !selectedGrade ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Select student's grade level:
              </p>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-xs text-amber-600 hover:text-amber-700"
              >
                ← Back to tests
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <div className="font-medium text-slate-900">{selectedTest.name}</div>
              <div className="text-xs text-slate-500">{price}/student</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeSelect(grade)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-center"
                >
                  <div className="text-lg font-bold text-slate-900">Grade {grade}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Confirm your selection:</p>
              <button
                onClick={() => setSelectedGrade(null)}
                className="text-xs text-amber-600 hover:text-amber-700"
              >
                ← Change grade
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Test:</span>
                <span className="font-medium text-slate-900">{selectedTest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Grade Level:</span>
                <span className="font-medium text-slate-900">Grade {selectedGrade}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-600">Price:</span>
                <span className="font-bold text-slate-900">{price}</span>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="w-full bg-amber-400 text-slate-900 hover:bg-amber-300"
            >
              Continue to Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
