import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, DollarSign, CheckCircle, ArrowLeft, Calculator, BookOpen, Shield } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { GradeSelectionDialog } from "@/components/GradeSelectionDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSelector } from "@/components/LanguageSelector";

type TestType = "math" | "ela" | null;

const Tests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [selectedTestType, setSelectedTestType] = useState<TestType>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!userRole);
    };
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (selectedTestType) {
      fetchTests(selectedTestType);
    }
  }, [selectedTestType]);

  const fetchTests = async (testType: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests_public")
        .select("*")
        .eq("test_type", testType)
        .order("name");

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTestType = (type: TestType) => {
    setSelectedTestType(type);
  };

  const handleBackToTypeSelection = () => {
    setSelectedTestType(null);
    setTests([]);
  };

  const handleStartTest = async (test: any) => {
    if (!user) {
      toast.error("Please sign in to take tests");
      navigate("/auth");
      return;
    }

    if (test.is_paid) {
      setSelectedTest(test);
      setGradeDialogOpen(true);
    } else {
      createTestAttempt(test, null);
    }
  };

  // Check if user is admin
  const checkIsAdmin = async () => {
    if (!user) return false;
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    return !!userRole;
  };

  const createTestAttempt = async (test: any, grade: number | null) => {
    try {
      const isAdmin = await checkIsAdmin();
      
      // Insert test attempt - payment_status is protected by trigger, 
      // so we use default "pending" for paid tests and "not_required" for free
      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .insert({
          user_id: user!.id,
          test_id: test.id,
          payment_status: test.is_paid ? "pending" : "not_required",
          grade_level: grade,
        })
        .select()
        .single();

      if (error) throw error;

      // Admins go directly to test (edge function handles payment bypass)
      // Non-admins with paid tests go to checkout
      if (isAdmin) {
        toast.success("Admin access - starting test");
        navigate(`/test/${attempt.id}`);
      } else if (test.is_paid) {
        toast.info("Proceeding to payment");
        navigate(`/checkout/${attempt.id}`);
      } else {
        navigate(`/test/${attempt.id}`);
      }
    } catch (error: any) {
      toast.error("Failed to start test");
    }
  };

  const handleGradeConfirm = (grade: number) => {
    setGradeDialogOpen(false);
    if (selectedTest) {
      createTestAttempt(selectedTest, grade);
    }
  };

  // Extract grade number from test name for sorting
  const getGradeNumber = (name: string): number => {
    const match = name.match(/Grade\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  // Sort tests by grade level
  const sortedTests = [...tests].sort((a, b) => getGradeNumber(a.name) - getGradeNumber(b.name));

  // Test Type Selection Screen
  if (!selectedTestType) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between py-4 px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-primary">{t.testsPage.availableTests}</h1>
            </div>
            <LanguageSelector />
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Select Test Type</h2>
            <p className="text-muted-foreground">
              Choose the type of diagnostic test you want to take
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Math Diagnostic Test Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
              onClick={() => handleSelectTestType("math")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Calculator className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Math Diagnostic Test</CardTitle>
                <CardDescription className="text-base">
                  Assess mathematical skills including arithmetic, algebra, geometry, and problem-solving
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="secondary" className="text-sm">
                  Multiple grades available
                </Badge>
              </CardContent>
            </Card>

            {/* ELA Diagnostic Test Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary group"
              onClick={() => handleSelectTestType("ela")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <BookOpen className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl">ELA Diagnostic Test</CardTitle>
                <CardDescription className="text-base">
                  Assess English Language Arts skills including reading comprehension, vocabulary, and writing
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="secondary" className="text-sm">
                  Multiple grades available
                </Badge>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Grade Selection Screen (after selecting test type)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t.testsPage.loadingTests}</p>
      </div>
    );
  }

  const testTypeLabel = selectedTestType === "math" ? "Math" : "ELA";
  const testTypeIcon = selectedTestType === "math" ? (
    <Calculator className="h-6 w-6 text-blue-600" />
  ) : (
    <BookOpen className="h-6 w-6 text-green-600" />
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToTypeSelection}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              {testTypeIcon}
              <h1 className="text-2xl font-bold text-primary">{testTypeLabel} Diagnostic Tests</h1>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Select Your Grade Level</h2>
          <p className="text-muted-foreground">
            Choose the appropriate grade level for your {testTypeLabel} diagnostic test
          </p>
        </div>

        {sortedTests.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No {testTypeLabel} tests available at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedTests.map((test) => (
              <Card key={test.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{test.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {isAdmin && test.is_paid && (
                        <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary">
                          <Shield className="h-3 w-3" />
                          Free Access
                        </Badge>
                      )}
                      {test.is_paid ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${test.price}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500">{t.testsPage.free}</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{test.duration_minutes} {t.testsPage.minutes}</span>
                    </div>
                    {test.is_paid && (
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{t.testsPage.detailedTierPlacement}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{t.testsPage.certificateIncluded}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{t.testsPage.strengthWeaknessAnalysis}</span>
                        </li>
                      </ul>
                    )}
                  </div>
                  <Button onClick={() => handleStartTest(test)} className="w-full">
                    {t.testsPage.startTest}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <GradeSelectionDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        onConfirm={handleGradeConfirm}
        testName={selectedTest?.name || ""}
      />
    </div>
  );
};

export default Tests;
