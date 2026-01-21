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
  const [selectedSubject, setSelectedSubject] = useState<"math" | "ela" | null>(null);
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

  // Filter and sort tests by grade range and subject
  const filterTestsByGradeRangeAndSubject = (allTests: Test[], subject: "math" | "ela"): Test[] => {
    const [minGrade, maxGrade] = gradeRange === "1-6" ? [1, 6] : [7, 12];
    
    return allTests
      .filter((test) => {
        const grade = extractGradeFromName(test.name);
        if (grade === null) return false;
        if (grade < minGrade || grade > maxGrade) return false;
        // Filter by subject
        const testType = test.test_type?.toLowerCase() || "";
        const testName = test.name.toLowerCase();
        if (subject === "math") {
          return testType === "math" || testName.includes("math");
        } else {
          return testType === "ela" || testName.includes("ela");
        }
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
      setSelectedSubject(null);
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
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject: "math" | "ela") => {
    setSelectedSubject(subject);
  };

  const handleTestSelect = (test: Test) => {
    setSelectedTest(test);
    setSelectedGrade(null);
  };

  const filteredTests = selectedSubject 
    ? filterTestsByGradeRangeAndSubject(tests, selectedSubject) 
    : [];

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
          payment_status: isAdmin ? "completed" : "pending",
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {gradeRange === "1-6" ? "Grades 1-6" : "Grades 7-12"} Diagnostic
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedSubject ? (
          // Step 1: Subject Selection
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a subject to view available diagnostic tests:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSubjectSelect("math")}
                className="p-6 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-center"
              >
                <div className="text-3xl mb-2">📐</div>
                <div className="text-lg font-bold text-foreground">Math</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Mathematics Diagnostic Tests
                </div>
              </button>
              <button
                onClick={() => handleSubjectSelect("ela")}
                className="p-6 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-center"
              >
                <div className="text-3xl mb-2">📚</div>
                <div className="text-lg font-bold text-foreground">ELA</div>
                <div className="text-xs text-muted-foreground mt-1">
                  English Language Arts Tests
                </div>
              </button>
            </div>
          </div>
        ) : !selectedTest ? (
          // Step 2: Test Selection (filtered by subject)
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select a {selectedSubject.toUpperCase()} diagnostic test:
              </p>
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-xs text-primary hover:text-primary/80"
              >
                ← Back to subjects
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {filteredTests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No {selectedSubject.toUpperCase()} tests available for this grade range yet.
                </p>
              ) : (
                filteredTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestSelect(test)}
                    className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="font-semibold text-foreground">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.description}</div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {test.duration_minutes} minutes · {price}/student
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : !selectedGrade ? (
          // Step 3: Grade Selection
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select student's grade level:
              </p>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-xs text-primary hover:text-primary/80"
              >
                ← Back to tests
              </button>
            </div>
            <div className="bg-muted rounded-lg p-3 mb-4">
              <div className="font-medium text-foreground">{selectedTest.name}</div>
              <div className="text-xs text-muted-foreground">{price}/student</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeSelect(grade)}
                  className="p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-center"
                >
                  <div className="text-lg font-bold text-foreground">Grade {grade}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Step 4: Confirmation
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Confirm your selection:</p>
              <button
                onClick={() => setSelectedGrade(null)}
                className="text-xs text-primary hover:text-primary/80"
              >
                ← Change grade
              </button>
            </div>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Test:</span>
                <span className="font-medium text-foreground">{selectedTest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade Level:</span>
                <span className="font-medium text-foreground">Grade {selectedGrade}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-bold text-foreground">{price}</span>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="w-full"
            >
              Continue to Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
