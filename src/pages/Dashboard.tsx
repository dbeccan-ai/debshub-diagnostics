import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { MailCheck, Clock, MailX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else if (!loading) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      setProfile(profileData);

      const { data: attemptsData } = await supabase
        .from("test_attempts")
        .select(`
          *,
          tests (name, test_type),
          certificates (certificate_url)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      setAttempts(attemptsData || []);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <h1 className="text-2xl font-bold text-primary">DEBs Diagnostic Hub</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name}!</h2>
          <p className="text-muted-foreground">Track your progress and view your test history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/tests")}>
            <CardHeader>
              <CardTitle>Take a Test</CardTitle>
              <CardDescription>Start a new diagnostic test</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Browse Tests</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tests Completed</CardTitle>
              <CardDescription>Your total attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {attempts.filter(a => a.completed_at).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Score</CardTitle>
              <CardDescription>Across all tests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {attempts.filter(a => a.score).length > 0
                  ? Math.round(
                      attempts
                        .filter(a => a.score)
                        .reduce((sum, a) => sum + parseFloat(a.score), 0) /
                        attempts.filter(a => a.score).length
                    )
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>Your recent test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tests taken yet. Start your first test!
              </p>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (attempt.completed_at) {
                        // For completed tests, stay on dashboard (results are shown here)
                        return;
                      } else {
                        // For in-progress tests, resume the test
                        navigate(`/test/${attempt.id}`);
                      }
                    }}
                  >
                    <div>
                      <h3 className="font-semibold">{attempt.tests?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {attempt.completed_at ? (
                        <>
                          <Badge variant="outline">{attempt.tier}</Badge>
                          <span className="font-bold text-lg">{attempt.score}%</span>
                          {attempt.certificates?.[0]?.certificate_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(attempt.certificates[0].certificate_url, "_blank");
                              }}
                            >
                              View Certificate
                            </Button>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  {attempt.email_status === "sent" && (
                                    <MailCheck className="w-5 h-5 text-green-600" />
                                  )}
                                  {attempt.email_status === "pending" && (
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                  )}
                                  {attempt.email_status === "failed" && (
                                    <MailX className="w-5 h-5 text-red-600" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {attempt.email_status === "sent" && "Email Sent"}
                                {attempt.email_status === "pending" && "Pending Email"}
                                {attempt.email_status === "failed" && "Email not delivered"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test/${attempt.id}`);
                          }}
                        >
                          Resume Test
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;