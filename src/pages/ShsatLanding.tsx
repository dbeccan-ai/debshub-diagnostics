import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, Rocket, Target, Timer, ShieldAlert } from "lucide-react";
import ShsatRegistrationAlert from "@/components/ShsatRegistrationAlert";
import { READINESS_DOMAINS, SHSAT_STRUCTURE } from "@/lib/shsatConfig";

const ICONS = [Layers, Rocket, Target, Timer];

export default function ShsatLanding() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session)); }, []);
  const begin = () => navigate(signedIn ? "/shsat/entry-gate" : "/auth?redirect=/shsat/entry-gate");

  return (
    <div className="min-h-screen bg-background">
      <SEO title="SHSAT Readiness Diagnostic | D.E.Bs Diagnostic Hub"
        description="A readiness diagnostic for the NYC SHSAT that identifies foundation gaps, advanced application readiness, and test-performance needs before preparation begins."
        path="/shsat" />
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="font-bold text-primary text-lg">D.E.Bs Diagnostic Hub</Link>
          <Button variant="ghost" onClick={() => navigate(signedIn ? "/dashboard" : "/auth?redirect=/shsat")}>{signedIn ? "Dashboard" : "Sign in"}</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10 space-y-12 max-w-5xl text-base">
        <ShsatRegistrationAlert />
        <section className="text-center space-y-4">
          <Badge variant="secondary">Phase 1 · Entry Gate open</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">D.E.Bs SHSAT Readiness Diagnostic</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            This is a readiness diagnostic, not simply a practice test. It identifies the skills the SHSAT tests and the prerequisite
            foundations 2–3 instructional levels beneath them, so preparation targets the real cause of missed questions.
          </p>
          <p className="text-sm text-muted-foreground">
            Current SHSAT: {SHSAT_STRUCTURE.totalQuestions} questions ({SHSAT_STRUCTURE.elaQuestions} ELA · {SHSAT_STRUCTURE.mathQuestions} Math) · {SHSAT_STRUCTURE.minutes} minutes · {SHSAT_STRUCTURE.format}
          </p>
          <Button size="lg" onClick={begin}>Begin Entry Gate <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Four readiness domains</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {READINESS_DOMAINS.map((d, i) => { const Icon = ICONS[i]; return (
              <Card key={d.key}>
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-5 w-5 text-primary" aria-hidden />{d.key}. {d.name}</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">{d.blurb}</CardContent>
              </Card>); })}
          </div>
          <blockquote className="border-l-4 border-primary bg-muted/40 p-4 rounded-r-lg italic">
            D.E.Bs distinguishes nominal grade-level standards from the functional readiness required to solve complex, multi-step SHSAT problems accurately under time constraints.
          </blockquote>
        </section>
        <section className="text-center space-y-3">
          <Button size="lg" onClick={begin}>Begin Entry Gate <ArrowRight className="ml-1 h-4 w-4" /></Button>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Original D.E.Bs content. Not affiliated with or endorsed by the NYC Department of Education.
          </p>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} D.E.Bs LEARNING ACADEMY LLC</footer>
    </div>
  );
}
