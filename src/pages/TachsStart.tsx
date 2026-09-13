import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { tachsApi, TachsError, TACHS_PRICE_LABEL, dollars, type TachsAccess } from "@/lib/tachs";
import { ArrowLeft, FlaskConical, Lock, CheckCircle2 } from "lucide-react";

export default function TachsStart() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<string>("8");
  const [parentEmail, setParentEmail] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [access, setAccess] = useState<TachsAccess | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/tachs/start"); return; }
      try {
        const [{ data: profile }, acc] = await Promise.all([
          supabase.from("profiles").select("parent_email").eq("id", session.user.id).maybeSingle(),
          tachsApi.access(),
        ]);
        setParentEmail(profile?.parent_email ?? session.user.email ?? "");
        setAccess(acc);
        if (acc.in_progress?.grade_level) setGrade(String(acc.in_progress.grade_level));
        if (params.get("unlocked") && acc.entitled) toast.success("Payment confirmed — TACHS unlocked.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load your TACHS access.");
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const existing = access?.in_progress ?? null;
  const isAdmin = !!access?.admin;
  const canStart = isAdmin || !!access?.entitled;
  const canResume = !!existing && (isAdmin || existing.entitled);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim());

  const begin = async () => {
    if (!existing && !emailValid) { toast.error("Please enter a valid parent email."); return; }
    setBusy(true);
    try {
      const res = await tachsApi.start({ gradeLevel: Number(grade), parentEmail: parentEmail.trim(), testMode: isAdmin && testMode });
      toast.success(res.resumed ? "Resuming your diagnostic." : "Diagnostic started. Good luck!");
      navigate(`/tachs/attempt/${res.attemptId}`);
    } catch (e) {
      if (e instanceof TachsError && e.status === 402) { toast.error(e.message); navigate("/tachs/checkout"); return; }
      toast.error(e instanceof Error ? e.message : "Could not start.");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  const showPay = !isAdmin && !canStart && !canResume;

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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>{canResume ? "Resume your diagnostic" : "Before you begin"}</CardTitle>
              {isAdmin ? <Badge variant="outline">Admin access</Badge>
                : canStart || canResume ? <Badge className="bg-green-600 text-white gap-1"><CheckCircle2 className="h-3 w-3" /> Paid · unlocked</Badge>
                : <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> {TACHS_PRICE_LABEL}</Badge>}
            </div>
            <CardDescription>
              {canResume
                ? "You have a diagnostic in progress. Section timers continue on our server, so return as soon as you can."
                : "Confirm the student's grade and the parent email that should receive the report. Six timed sections, about 130 minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!canResume && (
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

            {showPay ? (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between"><span>Base price</span><span>{dollars(access!.quote.net_cents)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Processing fee (not a tax)</span><span>{dollars(access!.quote.fee_cents)}</span></div>
                  <div className="flex justify-between font-semibold border-t mt-2 pt-2"><span>Total</span><span>{dollars(access!.quote.total_cents)}</span></div>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate("/tachs/checkout")}>
                  <Lock className="mr-2 h-4 w-4" /> {access?.pending_order_id ? "Complete payment" : "Pay & unlock"} — {TACHS_PRICE_LABEL}
                </Button>
                {existing && !existing.entitled && (
                  <p className="text-xs text-muted-foreground">An unpaid attempt is on file. It will resume once payment is confirmed.</p>
                )}
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={begin} disabled={busy}>
                {busy ? "Please wait…" : canResume ? "Resume diagnostic" : "Start diagnostic"}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
