import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Target, TrendingUp, Users, FileText, Award, ArrowRight, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ReadingRecovery = () => {
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const checkEnrollment = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if enrolled in Reading Recovery
        const { data: enrollment } = await supabase
          .from("reading_recovery_enrollments")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        setIsEnrolled(!!enrollment);
      }
    };
    checkEnrollment();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: enrollment } = await supabase
          .from("reading_recovery_enrollments")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setIsEnrolled(!!enrollment);
      } else {
        setIsEnrolled(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAccessProgramme = () => {
    if (isEnrolled) {
      navigate("/reading-recovery/dashboard");
    } else {
      navigate("/reading-recovery/auth");
    }
  };

  // Removed blocking loading state - page renders immediately while auth checks in background

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/reading-recovery" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground">Reading Recovery Programme</span>
              <p className="text-xs text-muted-foreground">by D.E.Bs Learning Academy</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isEnrolled ? (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate("/reading-recovery/dashboard")}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/reading-recovery/auth")}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => navigate("/reading-recovery/auth")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            21-Day Reading Recovery Programme
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 max-w-4xl mx-auto">
            Transform Your Child's Reading in 21 Days
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Identify exactly where your child's reading breaks down and get a clear roadmap to fluency with our comprehensive diagnostic and recovery programme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6"
              onClick={handleAccessProgramme}
            >
              {isEnrolled ? "Continue Your Journey" : "Start Free Assessment"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!isEnrolled && (
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/reading-recovery/auth")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Sign Up", desc: "Create your free account to access the full programme", icon: Users },
              { step: 2, title: "Take the Diagnostic", desc: "Complete the reading assessment to identify breakdown points", icon: Target },
              { step: 3, title: "Get Your Plan", desc: "Receive a personalized 21-day recovery roadmap", icon: FileText },
              { step: 4, title: "Track Progress", desc: "Complete daily activities and watch improvement unfold", icon: TrendingUp },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="relative overflow-hidden border-emerald-100">
                <div className="absolute top-0 left-0 w-12 h-12 bg-emerald-600 text-white flex items-center justify-center font-bold text-lg rounded-br-xl">
                  {step}
                </div>
                <CardContent className="pt-16 pb-6 px-6">
                  <Icon className="w-8 h-8 text-emerald-600 mb-4" />
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
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
            {[
              "Comprehensive reading diagnostic assessment",
              "Age-appropriate passages (Grades 1-8)",
              "Oral reading fluency evaluation",
              "Comprehension assessment at 3 levels",
              "Personalized 21-day recovery roadmap",
              "Daily activities and exercises",
              "Progress tracking dashboard",
              "Parent-facing summary reports",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 bg-emerald-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Expected Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Target, title: "Identify Gaps", desc: "Pinpoint the exact breakdown point (decoding, comprehension, fluency)" },
              { icon: TrendingUp, title: "Measurable Progress", desc: "Track improvement with regular assessments and progress metrics" },
              { icon: Award, title: "Reading Confidence", desc: "Build skills and confidence with structured daily practice" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-emerald-300" />
                </div>
                <h3 className="font-semibold text-xl mb-2">{title}</h3>
                <p className="text-emerald-200">{desc}</p>
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
            Join families who are transforming their children's reading abilities with our proven programme.
          </p>
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6"
            onClick={handleAccessProgramme}
          >
            {isEnrolled ? "Go to Your Dashboard" : "Create Free Account"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Free to start • No credit card required
          </p>
        </div>
      </section>

      {/* Link back to Diagnostic Hub */}
      <section className="py-8 bg-muted/30 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for Math or ELA diagnostic tests?{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Visit DEBs Diagnostic Hub →
            </Link>
          </p>
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
