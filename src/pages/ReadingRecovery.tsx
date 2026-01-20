import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Target, TrendingUp, Users, FileText, Award, ArrowRight } from "lucide-react";

const ReadingRecovery = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              DEB
            </div>
            <div>
              <span className="font-bold text-foreground">D.E.Bs LEARNING ACADEMY</span>
              <p className="text-xs text-muted-foreground">Unlocking Brilliance Through Learning</p>
            </div>
          </Link>
          <Link to="/auth">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Reading Recovery Program
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 max-w-4xl mx-auto">
            Reading Recovery Diagnostic
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Identify exactly where your child's reading breaks down and get a clear 21-day roadmap to fluency
          </p>
          <Link to="/reading-recovery/diagnostic">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">
              Start the Reading Recovery Diagnostic
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Select Grade Band", desc: "Choose the appropriate grade level (1-2, 3-4, 5-6, or 7-8)", icon: Target },
              { step: 2, title: "Complete the Assessment", desc: "Student reads passage aloud while parent/admin marks errors", icon: FileText },
              { step: 3, title: "Answer Comprehension Questions", desc: "Literal, Inferential, and Analytical questions", icon: CheckCircle2 },
              { step: 4, title: "Get Your Roadmap", desc: "Receive personalized recommendations based on breakdown point", icon: TrendingUp },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-br-xl">
                  {step}
                </div>
                <CardContent className="pt-16 pb-6 px-6">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Families Get */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Families Get</h2>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
            {[
              "Age-appropriate reading passage matched to developmental stage",
              "Decoding observation checklist to track oral reading accuracy",
              "Comprehension questions at three levels (Literal, Inferential, Analytical)",
              "Automatic scoring with gap identification",
              "Personalized 21-Day Reading Recovery Blueprint recommendations",
              '"What\'s Next?" parent-facing summary',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Target, title: "Identify Gaps", desc: "Pinpoint the exact breakdown point (decoding, literal, inferential, or analytical)" },
              { icon: Users, title: "Correct Tier Placement", desc: "Get accurate tier placement based on performance" },
              { icon: Award, title: "Clear Next Steps", desc: "Receive actionable recommendations for targeted improvement" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-2">{title}</h3>
                <p className="text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Begin the Reading Recovery Diagnostic today and unlock your child's reading potential.
          </p>
          <Link to="/reading-recovery/diagnostic">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">
              Start / Preview the Reading Recovery Diagnostic
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-white">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} D.E.Bs LEARNING ACADEMY. All rights reserved.</p>
          <p className="mt-1">Contact: info@debslearnacademy.com | 347-364-1906</p>
        </div>
      </footer>
    </div>
  );
};

export default ReadingRecovery;
