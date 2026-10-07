import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import ShsatRegistrationAlert from "@/components/ShsatRegistrationAlert";
import { PATHWAYS, GRADES } from "@/lib/shsatConfig";

export default function ShsatNext() {
  const navigate = useNavigate();
  const [intake, setIntake] = useState<{ student_first_name: string; pathway: string; current_grade: string } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth?redirect=/shsat/next"); return; }
      const [{ data }, { data: s }] = await Promise.all([
        supabase.from("shsat_intakes").select("student_first_name, pathway, current_grade").eq("user_id", user.id).maybeSingle(),
        supabase.from("shsat_settings").select("assessment_enabled").eq("id", 1).maybeSingle(),
      ]);
      if (!data) { navigate("/shsat/entry-gate"); return; }
      setIntake(data); setEnabled(!!s?.assessment_enabled); setLoading(false);
    })();
  }, [navigate]);

  if (loading || !intake) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const pathway = PATHWAYS.find((p) => p.key === intake.pathway)?.label ?? intake.pathway;
  const grade = GRADES.find((g) => g.value === intake.current_grade)?.label;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="SHSAT Readiness Check | D.E.Bs Diagnostic Hub" description="Your SHSAT readiness check." path="/shsat/next" noIndex />
      <header className="border-b bg-card"><div className="container mx-auto py-4 px-4"><Link to="/shsat" className="font-bold text-primary text-lg">← D.E.Bs SHSAT Readiness Diagnostic</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6 text-base">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" aria-hidden />
            <CardTitle className="text-2xl">Readiness Check Coming Next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Thank you{intake.student_first_name ? `, ${intake.student_first_name}` : ""}. Your Entry Gate is saved.</p>
            <div className="flex flex-wrap justify-center gap-2"><Badge variant="secondary">{grade}</Badge><Badge>Pathway: {pathway}</Badge></div>
            <p className="text-muted-foreground">
              The D.E.Bs SHSAT Readiness Check will evaluate both the skills the SHSAT tests and the prerequisite foundations beneath them,
              so we can see whether a missed question comes from the tested skill itself or from an earlier gap.
            </p>
            {enabled
              ? <p className="font-medium">The readiness check is being opened. Your consultant will share your start link.</p>
              : <p className="font-medium">We are finalizing the diagnostic items. We will notify your parent/guardian email when the readiness check opens.</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/shsat/entry-gate")}>Edit Entry Gate</Button>
              <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
            </div>
          </CardContent>
        </Card>
        {intake.pathway === "testing_this_november" && <ShsatRegistrationAlert />}
      </main>
    </div>
  );
}
