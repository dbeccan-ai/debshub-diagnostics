import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, DollarSign, CheckCircle, ArrowLeft } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { GradeSelectionDialog } from "@/components/GradeSelectionDialog";

const Tests = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);

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

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      // Use the secure view that doesn't expose questions/answers
      const { data, error } = await supabase
        .from("tests_public")
        .select("*")
        .order("test_type");

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (test: any) => {
    if (!user) {
      toast.error("Please sign in to take tests");
      navigate("/auth");
      return;
    }

    // For paid tests, show grade selection dialog
    if (test.is_paid) {
      setSelectedTest(test);
      setGradeDialogOpen(true);
    } else {
      // Free tests don't need grade selection
      createTestAttempt(test, null);
    }
  };

  const createTestAttempt = async (test: any, grade: number | null) => {
    try {
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

      if (test.is_paid && attempt.payment_status === "pending") {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Available Tests</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose Your Test</h2>
          <p className="text-muted-foreground">
            Select a diagnostic test to assess your skills and track your progress
          </p>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No tests available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <Card key={test.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>{test.name}</CardTitle>
                    {test.is_paid ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        $99-$120
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500">FREE</Badge>
                    )}
                  </div>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{test.duration_minutes} minutes</span>
                    </div>
                    {test.is_paid && (
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Detailed tier placement</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Certificate included</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Strength & weakness analysis</span>
                        </li>
                      </ul>
                    )}
                  </div>
                  <Button onClick={() => handleStartTest(test)} className="w-full">
                    Start Test
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