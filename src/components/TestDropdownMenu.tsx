import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

interface Test {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  is_paid: boolean | null;
  price: number | null;
  test_type: string | null;
}

interface TestDropdownMenuProps {
  testType: "math" | "ela";
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function TestDropdownMenu({
  testType,
  isOpen,
  onToggle,
  onClose,
}: TestDropdownMenuProps) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract grade number from test name (e.g., "Grade 1 Math Diagnostic" -> 1)
  const extractGradeFromName = (name: string): number | null => {
    const match = name.match(/grade\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  useEffect(() => {
    if (isOpen) {
      fetchTests();
    }
  }, [isOpen, testType]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // Filter by test type - math tests have "Math" in name, ELA tests have "ELA" in name
      const { data, error } = await supabase
        .from("tests_public")
        .select("*")
        .eq("is_paid", true);

      if (error) throw error;

      // Filter by test type and grade range (1-6 only as per request)
      const filteredTests = (data || [])
        .filter((test) => {
          const testNameLower = test.name?.toLowerCase() || "";
          const matchesType = testType === "math" 
            ? testNameLower.includes("math")
            : testNameLower.includes("ela");
          
          const grade = extractGradeFromName(test.name || "");
          const inGradeRange = grade !== null && grade >= 1 && grade <= 6;
          
          return matchesType && inGradeRange;
        })
        .sort((a, b) => {
          const gradeA = extractGradeFromName(a.name || "") || 0;
          const gradeB = extractGradeFromName(b.name || "") || 0;
          return gradeA - gradeB;
        });

      setTests(filteredTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = async (test: Test) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Store selected test in session storage for after auth
      const grade = extractGradeFromName(test.name || "");
      sessionStorage.setItem("pendingTest", JSON.stringify({
        testId: test.id,
        testName: test.name,
        grade: grade,
      }));
      onClose();
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
    const grade = extractGradeFromName(test.name || "");

    // Create test attempt
    try {
      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .insert({
          test_id: test.id,
          user_id: user.id,
          grade_level: grade,
          payment_status: isAdmin ? "completed" : "pending",
        })
        .select()
        .single();

      if (error) throw error;

      onClose();
      
      // Admins go directly to test, others go to checkout
      if (isAdmin) {
        toast.success("Admin access granted - starting test");
        navigate(`/test/${attempt.id}`);
      } else {
        navigate(`/checkout/${attempt.id}`);
      }
    } catch (error) {
      console.error("Error creating test attempt:", error);
      toast.error("Failed to start test. Please try again.");
    }
  };

  const formatPrice = (price: number | null) => {
    return price ? `$${price}` : "$99";
  };

  if (!isOpen) return null;

  return (
    <div className="mt-3 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h4 className="font-semibold text-slate-900 text-sm">
          {testType === "math" ? "Math" : "ELA"} Diagnostic Tests (Grades 1-6)
        </h4>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : tests.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">
            No tests available yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {tests.map((test) => (
              <button
                key={test.id}
                onClick={() => handleTestClick(test)}
                className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors"
              >
                <div className="font-semibold text-slate-900 text-sm">
                  {test.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {test.description}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {test.duration_minutes} minutes · {formatPrice(test.price)}/student
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
