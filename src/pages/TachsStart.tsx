import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { tachsApi } from "@/lib/tachs";
import { ArrowLeft, FlaskConical } from "lucide-react";

export default function TachsStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<string>("8");
  const [parentEmail, setParentEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [existing, setExisting] = useState<{ id: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/tachs/start"); return; }
      const [{ data: profile }, { data: role }, { data: attempt }] = await Promise.all([
        supabase.from("profiles").select("parent_email").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle(),
        supabase.from("tachs_attempts").select("id, grade_level").eq("user_id", session.user.id).eq("status", "in_progress").maybeSingle(),
      ]);
      setParentEmail(profile?.parent_email ?? session.user.email ?? "");
      setIsAdmin(!!role);
      if (attempt) { setExisting({ id: attempt.id }); if (attempt.grade_level) setGrade(String(attempt.grade_level)); }
      setLoading(false);
    })();
  }, [navigate]);

  const begin = async () => {
    if (!existing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) { toast.error("Please enter a valid parent email."); return; }
    setBusy(true);
    try {
      const res = await tachsApi.start({ gradeLevel: Number(grade), parentEmail: parentEmail.trim(), testMode: isAdmin && testMode });
      toast.success(res.resumed ? "Resuming your diagnostic." : "Diagnostic started. Good luck!");
      navigate(`/tachs/attempt/${res.attemptId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start.");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Start TACHS Readiness Diagnostic | D.E.Bs" description="Confirm details and begin the D.E.Bs TACHS Readiness Diagnostic." path="/tachs/start" noIndex />
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tachs")} aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-bold text-primary">TACHS Readiness Diagnostic</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>{existing ? "Resume your diagnostic" : "Before you begin"}</CardTitle>
            <CardDescription>
              {existing
                ? "You have a diagnostic in progress. Section timers continue on our server, so return as soon as you can."
                : "Confirm the student's grade and the parent email that should receive the report. Six timed sections, about 130 minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!existing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="grade">Current grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger id="grade"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8, 9].map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent email</Label>
                  <Input id="parent" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} autoComplete="email" />
                </div>
                {isAdmin && (
                  <label className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm cursor-pointer">
                    <Checkbox checked={testMode} onCheckedChange={(v) => setTestMode(v === true)} className="mt-0.5" />
                    <span><span className="font-semibold flex items-center gap-1"><FlaskConical className="h-4 w-4" /> Admin TEST MODE</span>
                      <span className="text-muted-foreground">Shortened timers (2 min) and 4 items per section. Watermarked; excluded from real reporting.</span></span>
                  </label>
                )}
              </>
            )}
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>One question at a time; you can go back within the current section only.</li>
              <li>Each section locks when you submit it or its time runs out.</li>
              <li>Calculator is available in Mathematics only.</li>
              <li>Your answers save automatically; you can resume if disconnected.</li>
            </ul>
            <Button className="w-full" size="lg" onClick={begin} disabled={busy}>
              {busy ? "Please wait…" : existing ? "Resume diagnostic" : "Start diagnostic"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
