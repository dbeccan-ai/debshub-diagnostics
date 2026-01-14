import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Test {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  is_paid: boolean | null;
  test_type: string | null;
}

interface DiagnosticTestSelectorProps {
  type: "math" | "ela";
  onTestSelect?: (test: Test) => void;
}

export function DiagnosticTestSelector({ type, onTestSelect }: DiagnosticTestSelectorProps) {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const extractGradeFromName = (name: string): number | null => {
    const match = name.match(/grade\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests_public")
        .select("*")
        .eq("is_paid", true)
        .eq("test_type", type);

      if (error) throw error;

      // Sort by grade level
      const sortedTests = (data || []).sort((a, b) => {
        const gradeA = extractGradeFromName(a.name) || 0;
        const gradeB = extractGradeFromName(b.name) || 0;
        return gradeA - gradeB;
      });

      setTests(sortedTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tests.length === 0) {
      fetchTests();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleTestClick = async (test: Test) => {
    if (onTestSelect) {
      onTestSelect(test);
    }
    
    // Store test info and navigate to auth/checkout flow
    sessionStorage.setItem("pendingTest", JSON.stringify({
      testId: test.id,
      testName: test.name,
      grade: extractGradeFromName(test.name),
    }));

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
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
    const grade = extractGradeFromName(test.name);

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

      setIsOpen(false);
      
      if (isAdmin) {
        toast.success("Admin access granted - starting test");
        navigate(`/test/${attempt.id}`);
      } else {
        navigate(`/checkout/${attempt.id}`);
      }
    } catch (error) {
      console.error("Error creating test attempt:", error);
      toast.error("Failed to start test");
    }
  };

  const getPrice = (testName: string): string => {
    const grade = extractGradeFromName(testName);
    if (grade && grade >= 7) return "$120";
    return "$99";
  };

  const title = type === "math" ? "Math Diagnostic Test" : "ELA Diagnostic Test";
  const subtitle = type === "math" ? "90-minute adaptive · Grades 1–12" : "90-minute reading & writing · Grades 1–12";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Test Card */}
      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
        >
          Run
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <div className="font-bold text-slate-900">
                {type === "math" ? "Math" : "ELA"} Diagnostics
              </div>
              <div className="text-xs text-slate-500">Select a diagnostic test to get started:</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <ScrollArea className="h-[300px] sm:h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No tests available yet.
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestClick(test)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-900">{test.name}</div>
                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {test.description}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      {test.duration_minutes} minutes · {getPrice(test.name)}/student
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
