import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, PenLine, Calculator, Grid3X3, Scissors, Shapes, ShieldAlert, ArrowRight, Clock } from "lucide-react";

const DOMAINS = [
  { icon: BookOpen, name: "Reading", blurb: "Passages with questions on main idea, inference, vocabulary in context, and text structure." },
  { icon: PenLine, name: "Written Expression", blurb: "Usage, punctuation and capitalization, sentence structure, and paragraph organization." },
  { icon: Calculator, name: "Mathematics", blurb: "Late Grade 8 through introductory Algebra I: integer and ratio fluency, equations, inequalities, slope, functions, systems, exponents, geometry, data, and multistep modeling." },
  { icon: Grid3X3, name: "Figure Matrices", blurb: "Spot the rule across rows and columns of a 3 x 3 grid and choose the missing figure." },
  { icon: Scissors, name: "Paper Folding", blurb: "A sheet is folded one to three times (including diagonal and off-center folds), then punched or notched; choose the fully unfolded sheet." },
  { icon: Shapes, name: "Figure Classification", blurb: "Three figures share a rule; find the figure that belongs with them." },
];

const TIMING = [
  ["Reading", 50, 30], ["Written Expression", 50, 25], ["Mathematics", 50, 40],
  ["Figure Matrices", 20, 12], ["Paper Folding", 15, 12], ["Figure Classification", 15, 11],
] as const;

const FAQ = [
  { q: "What is the TACHS?", a: "The Test for Admission into Catholic High Schools (TACHS) is an entrance exam used by many Catholic high schools in the New York area, typically taken by eighth graders in the fall." },
  { q: "Is this the official TACHS?", a: "No. The D.E.Bs TACHS Readiness Diagnostic is an original practice-and-diagnosis tool built by D.E.Bs. It is not affiliated with, endorsed by, or produced by the TACHS program or its publisher, and it does not produce official scores." },
  { q: "How long does it take?", a: "The full pilot runs about 130 minutes of testing across six timed sections, plus optional short breaks. You can only work on one section at a time; once a section is submitted or its timer ends, it locks." },
  { q: "Can my child pause?", a: "Each section timer runs on our server so it cannot be paused, but progress is saved automatically. Optional breaks are offered after Mathematics (5 minutes) and after Figure Matrices and Paper Folding (1 minute each)." },
  { q: "What do we get afterward?", a: "An immediate preliminary readiness report: overall and section accuracy, pacing, skill-level strengths and gaps, the adaptive difficulty path, a readiness band, and a next-step plan you can print." },
  { q: "Is the test adaptive?", a: "Yes. Each section starts at medium difficulty. Two correct answers in a row raise the difficulty; two incorrect answers in a row lower it. This helps pinpoint each student's working level." },
];

export default function TachsLanding() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session));
  }, []);

  const cta = () => navigate(signedIn ? "/tachs/start" : "/auth?redirect=/tachs/start");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="TACHS Readiness Diagnostic | D.E.Bs Diagnostic Hub"
        description="Adaptive, timed TACHS-style readiness diagnostic covering Reading, Written Expression, Mathematics, Figure Matrices, Paper Folding, and Figure Classification with an immediate skills report."
        path="/tachs"
        jsonLd={{
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="font-bold text-primary text-lg">D.E.Bs Diagnostic Hub</Link>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(signedIn ? "/dashboard" : "/auth?redirect=/tachs")}>{signedIn ? "Dashboard" : "Sign in"}</Button>
            <Button onClick={cta}>Start diagnostic <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-14 max-w-5xl">
        <section className="text-center space-y-4">
          <Badge variant="secondary">D.E.Bs Pilot</Badge>
          <h1 className="text-4xl font-bold tracking-tight">TACHS Readiness Diagnostic</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A timed, adaptive practice diagnostic modelled on the structure of the Test for Admission into Catholic High Schools.
            Find out exactly which skills are ready and which need work before test day.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="lg" onClick={cta}>{signedIn ? "Start or resume" : "Sign in to begin"}</Button>
            <Button size="lg" variant="outline" asChild><a href="#pathway">See the two-year pathway</a></Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Not affiliated with or endorsed by the TACHS program or its publisher.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">What TACHS means</h2>
          <p className="text-muted-foreground">
            TACHS stands for the <strong>Test for Admission into Catholic High Schools</strong>. It is taken by eighth graders applying to
            Catholic high schools in the Archdiocese of New York and the Diocese of Brooklyn/Queens. The exam samples reading, language,
            mathematics, and abstract reasoning ability. Our diagnostic covers the same six domains so families can see where a student stands.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">The six domains</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map(({ icon: Icon, name, blurb }) => (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <Icon className="h-8 w-8 text-primary mb-2" aria-hidden />
                  <CardTitle className="text-lg">{name}</CardTitle>
                </CardHeader>
                <CardContent><CardDescription>{blurb}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Clock className="h-6 w-6" /> D.E.Bs pilot timing table</h2>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Important:</strong> the section counts and times below are <em>D.E.Bs working allocations</em> for this pilot diagnostic.
            They are not official TACHS specifications and may differ from the actual exam.
          </p>
          <Card>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Section</TableHead><TableHead className="text-right">Items</TableHead><TableHead className="text-right">Minutes</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {TIMING.map(([n, i, m]) => (
                  <TableRow key={n}><TableCell>{n}</TableCell><TableCell className="text-right">{i}</TableCell><TableCell className="text-right">{m}</TableCell></TableRow>
                ))}
                <TableRow className="font-semibold"><TableCell>Total</TableCell><TableCell className="text-right">200</TableCell><TableCell className="text-right">130</TableCell></TableRow>
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-muted-foreground mt-2">Optional breaks: 5 minutes after Mathematics; 1 minute after Figure Matrices and after Paper Folding. Calculator available in Mathematics only.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>How students should prepare</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Take the diagnostic in one sitting, in a quiet space, with a pencil and scrap paper.</p>
              <p>Read every question fully; the adaptive engine rewards accuracy over speed.</p>
              <p>Use the flag button to mark items you want to revisit before submitting a section.</p>
              <p>Do not guess wildly: patterns of two correct or two incorrect answers move the difficulty.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>How parents can help</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Confirm the grade level and your email before starting so the report reaches you.</p>
              <p>Keep the session free of interruptions; timers run on our server and cannot be paused.</p>
              <p>Review the printed report together and pick two focus skills for the next six weeks.</p>
              <p>Re-test after a study cycle to measure growth, not just a single score.</p>
            </CardContent>
          </Card>
        </section>

        <section id="pathway">
          <h2 className="text-2xl font-bold mb-4">Two-year readiness pathway</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><Badge className="w-fit mb-1">Grade 7</Badge><CardTitle className="text-lg">Build the foundation</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Fall: baseline diagnostic to map strengths and gaps.</p>
                <p>Winter: targeted skill work in reading and language; introduce abstract reasoning puzzles weekly.</p>
                <p>Spring: math fluency (fractions, ratios, pre-algebra) and a second diagnostic to measure growth.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Badge className="w-fit mb-1">Grade 8</Badge><CardTitle className="text-lg">Sharpen and simulate</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Summer: full timed diagnostic; build pacing habits section by section.</p>
                <p>September–October: weekly timed sections, error-log review, and final diagnostic two weeks before the exam.</p>
                <p>November: light review, rest, and test-day routines.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
          <strong>Disclaimer.</strong> D.E.Bs Diagnostic Hub and the D.E.Bs TACHS Readiness Diagnostic are independent products. They are not affiliated
          with, sponsored by, or endorsed by the TACHS program, the Archdiocese of New York, the Diocese of Brooklyn, or the test publisher. TACHS is a
          trademark of its respective owner. All questions are original D.E.Bs content. Results are readiness estimates, not official scores or predictions.
        </section>

        <div className="text-center pb-8">
          <Button size="lg" onClick={cta}>{signedIn ? "Start or resume the diagnostic" : "Sign in to begin"}</Button>
        </div>
      </main>
    </div>
  );
}
