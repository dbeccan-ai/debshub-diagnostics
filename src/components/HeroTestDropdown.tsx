import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";
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

interface HeroTestDropdownProps {
  type: "math" | "ela";
  buttonLabel: string;
}

export function HeroTestDropdown({ type, buttonLabel }: HeroTestDropdownProps) {
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
    sessionStorage.setItem("pendingTest", JSON.stringify({
      testId: test.id,
      testName: test.name,
      grade: extractGradeFromName(test.name),
    }));

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    const grade = extractGradeFromName(test.name);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-[11px] font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {type === "math" ? "Math" : "ELA"} Diagnostics
              </div>
              <div className="text-[10px] text-slate-500">Select a test to get started:</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>

          <ScrollArea className="h-[280px]">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No tests available yet.
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestClick(test)}
                    className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 text-xs">{test.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                      {test.description}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
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
