import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Zap, FileText, Users, School, Heart, ArrowRight, BarChart3, CreditCard, Award } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Smooth scroll behavior for the entire page
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm shadow-md">
                DEB
              </div>
              <div>
                <div className="text-base font-bold text-foreground leading-tight">D.E.Bs LEARNING ACADEMY</div>
                <div className="text-xs text-muted-foreground">Unlocking Brilliance Through Learning</div>
              </div>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                How it works
              </button>
              <button onClick={() => scrollToSection('diagnostic-tests')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Diagnostic Tests
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Pricing
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                FAQ
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">
                Log in
              </Button>
              <Button onClick={() => scrollToSection('cta-section')} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
              New · DEBs Diagnostic Hub
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Diagnostic Testing That <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Actually Drives Results.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              DEBs Diagnostic Hub turns confusing data into clear decisions. One link, one test, and your students are auto-placed into support tiers — so parents, teachers, and leaders know exactly what to do next.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" onClick={() => scrollToSection('cta-section')} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-lg px-8">
                Book a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('diagnostic-tests')}>
                Try a Sample Diagnostic
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
              Perfect for: schools, afterschool programs, tutoring centers, and forward-thinking parents.
            </p>

            {/* Feature Bullets */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <span className="text-sm text-foreground">Auto-grading & skill breakdown</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <span className="text-sm text-foreground">Tier placement in minutes</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <span className="text-sm text-foreground">Stripe-ready for paid tests</span>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-yellow-200/40 blur-3xl rounded-full" />
            <Card className="relative bg-white/70 backdrop-blur-xl border-2 shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="text-sm font-semibold text-foreground">Dashboard · Grade 6–9 Diagnostics</div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Test Cards */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Observation Quiz</div>
                      <div className="text-sm text-muted-foreground">Learning styles snapshot · 5 min</div>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">View</Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Math Diagnostic Test</div>
                      <div className="text-sm text-muted-foreground">Skills from Grades 3–9 · 45–60 min</div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Run</Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">ELA Diagnostic Test</div>
                      <div className="text-sm text-muted-foreground">Reading & writing snapshot · 60 min</div>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Run</Button>
                  </CardContent>
                </Card>

                {/* Footer Stats */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Auto-places students into Tier 1, Tier 2, or Tier 3 support.
                  </p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-foreground">Students tested: 1,250+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Built for real classrooms, not theory.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a school leader, tutor, or parent — DEBs Diagnostic Hub meets you where you are.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Schools & Programs */}
            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <School className="w-10 h-10 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">Schools & Programs</CardTitle>
                <CardDescription className="text-base">
                  Run grade-wide diagnostics and export clean reports for leadership, MTSS teams, and parent meetings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Launch full-grade tests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tier placement overview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Download-ready for data meetings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Tutoring & Afterschool */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Users className="w-10 h-10 text-emerald-600 mb-4" />
                <CardTitle className="text-2xl">Tutoring & Afterschool</CardTitle>
                <CardDescription className="text-base">
                  Stop guessing where to start. Use diagnostics to build targeted groups and track growth over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Skill breakdowns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Group by needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Proof of progress</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Parents & Families */}
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Heart className="w-10 h-10 text-amber-600 mb-4" />
                <CardTitle className="text-2xl">Parents & Families</CardTitle>
                <CardDescription className="text-base">
                  One test link, a clear report, and concrete next steps — no jargon, no guessing, no shame.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Easy summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Suggested next steps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Option to book support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              How DEBs Diagnostic Hub Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Designed by an educator, built like a product. No messy spreadsheets, no mystery scores — just a smooth, student-friendly flow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <Card className="bg-white/80 backdrop-blur border-2 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <CardTitle className="text-xl">Choose your test</CardTitle>
                <CardDescription>
                  Select Observation Quiz, Math Diagnostic, ELA Diagnostic, or bundle.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 2 */}
            <Card className="bg-white/80 backdrop-blur border-2 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <CardTitle className="text-xl">Share one link</CardTitle>
                <CardDescription>
                  Students complete test on any device; parents can register and pay (Stripe).
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white/80 backdrop-blur border-2 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <CardTitle className="text-xl">Auto-grade & tier</CardTitle>
                <CardDescription>
                  Hub auto-grades and assigns Tier 1/2/3 with skill-by-skill breakdown.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 4 */}
            <Card className="bg-white/80 backdrop-blur border-2 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                  4
                </div>
                <CardTitle className="text-xl">Take action</CardTitle>
                <CardDescription>
                  Export reports, group students, share results, connect to interventions.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Diagnostic Tests Section (Dark) */}
      <section id="diagnostic-tests" className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                Your Diagnostic Suite, All in One Hub
              </h2>
              <p className="text-lg text-slate-300 max-w-3xl">
                Mix and match tests to fit your students. Each diagnostic is built to surface real gaps — not just give a random score.
              </p>
            </div>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shrink-0">
              Talk to our team
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Observation Quiz */}
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <Badge className="bg-emerald-600 text-white w-fit mb-4">Learning Styles</Badge>
                <CardTitle className="text-2xl text-white">Observation Quiz</CardTitle>
                <CardDescription className="text-slate-300">
                  Quick home/classroom checklist to see whether child is more visual, auditory, or hands-on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">3 simple activities</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Parent-friendly PDF</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Perfect pre-test for new students</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-emerald-500 text-emerald-400 hover:bg-emerald-950">
                  Preview this quiz
                </Button>
              </CardContent>
            </Card>

            {/* Math Diagnostic */}
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <Badge className="bg-blue-600 text-white w-fit mb-4">Mathematics</Badge>
                <CardTitle className="text-2xl text-white">Math Diagnostic</CardTitle>
                <CardDescription className="text-slate-300">
                  Regents-style math diagnostics that surface foundational and on-grade gaps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">MCQs + word problems</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Standards alignment</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tiered recommendations</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-blue-500 text-blue-400 hover:bg-blue-950">
                  See sample math report
                </Button>
              </CardContent>
            </Card>

            {/* ELA Diagnostic */}
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <Badge className="bg-purple-600 text-white w-fit mb-4">Reading & Writing</Badge>
                <CardTitle className="text-2xl text-white">ELA Diagnostic</CardTitle>
                <CardDescription className="text-slate-300">
                  High-quality passages and writing tasks for comprehension depth.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">MCQ + writing</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Rubric-based scoring</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Clear feedback</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-950">
                  Explore ELA diagnostic
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Auto-grading & tier placement</h3>
              <p className="text-muted-foreground">
                Fast scores and Tier 1/2/3 grouping happen automatically, saving you hours of manual work.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4 shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Stripe integration for paid tests</h3>
              <p className="text-muted-foreground">
                Offer free or paid diagnostic options with secure Stripe checkout built right in.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mb-4 shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Certificates & parent reports</h3>
              <p className="text-muted-foreground">
                Auto-generate certificates and simple PDF summaries that parents can understand and save.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Simple pricing for schools, programs, and parents.
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Start small with a pilot, or roll out a full diagnostic system across grades. No long-term contracts required to begin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Parents Plan */}
            <Card className="bg-white border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Parents – Single Student</CardTitle>
                <div className="text-3xl font-bold text-foreground mt-4">$XX <span className="text-base font-normal text-muted-foreground">/ test</span></div>
                <CardDescription className="text-base mt-2">
                  For families wanting a snapshot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">1 test (Math or ELA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Parent report</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Optional consultation</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-6">
                  Join the waitlist
                </Button>
              </CardContent>
            </Card>

            {/* Programs Plan (Highlighted) */}
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-400 shadow-xl hover:shadow-2xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Programs & Tutors</CardTitle>
                <div className="text-3xl font-bold text-foreground mt-4">$XXX <span className="text-base font-normal text-muted-foreground">/ cohort</span></div>
                <CardDescription className="text-base mt-2">
                  For tutoring centers & afterschool programs (25–150 students).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Access to Math + ELA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Cohort dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">CSV exports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Launch support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                  Request pilot pricing
                </Button>
              </CardContent>
            </Card>

            {/* Schools Plan */}
            <Card className="bg-white border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Schools & Districts</CardTitle>
                <div className="text-3xl font-bold text-foreground mt-4">Custom</div>
                <CardDescription className="text-base mt-2">
                  For full rollouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Unlimited diagnostics per student</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Staff training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-6">
                  Schedule a consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Questions, answered.
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6 bg-slate-50">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Is DEBs Diagnostic Hub only for schools?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No! While we built it with schools in mind, it's perfect for tutoring centers, afterschool programs, homeschool co-ops, and individual parents who want clear data on their child's academic standing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6 bg-slate-50">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What subjects and grade levels are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, we offer Math and ELA diagnostics for grades 3–9, plus a learning styles Observation Quiz. We're actively building diagnostics for additional subjects and grade bands.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6 bg-slate-50">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can we integrate this with our existing systems?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! For school and district partners, we offer custom integrations with your student information system (SIS) and learning management system (LMS). Contact us to discuss your specific needs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6 bg-slate-50">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do you offer training for teachers and staff?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. Every school and program partner gets onboarding support, including live training sessions, video walkthroughs, and ongoing support from our team.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta-section" className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ready to stop guessing and start placing students with confidence?
          </h2>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            DEBs Diagnostic Hub is your bridge between "They're struggling" and "Here's exactly what they need next." Let's build a system that works for your students, your staff, and your families.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-lg px-8">
              <a href="mailto:info@debslearnacademy.com">Book a 20-minute call</a>
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToSection('diagnostic-tests')} className="border-white text-white hover:bg-white hover:text-slate-900">
              See diagnostic options
            </Button>
          </div>

          <p className="text-sm text-slate-400">
            Prefer to explore quietly first? We'll send a sample report and a read-only tour of the hub.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} D.E.Bs LEARNING ACADEMY. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>DEBs Diagnostic Hub · Bronx, NY</span>
              <span>·</span>
              <a href="https://debslearnacademy.com" className="hover:text-primary transition-colors">
                debslearnacademy.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
