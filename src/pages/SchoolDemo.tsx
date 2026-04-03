import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, BarChart3, Users, Award, CheckCircle, Star, ArrowRight, GraduationCap, ClipboardCheck, FileText, Phone } from "lucide-react";

const GRADE_OPTIONS = [
  { label: "Grade 1", value: "1" },
  { label: "Grade 2", value: "2" },
  { label: "Grade 3", value: "3" },
  { label: "Grade 4", value: "4" },
  { label: "Grade 5", value: "5" },
  { label: "Grade 6", value: "6" },
  { label: "Grade 7", value: "7" },
  { label: "Grade 8", value: "8" },
  { label: "Grade 9", value: "9" },
  { label: "Grade 10", value: "10" },
  { label: "Grade 11", value: "11" },
  { label: "Grade 12", value: "12" },
];

export default function SchoolDemo() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedMathGrade, setSelectedMathGrade] = useState("");
  const [selectedElaGrade, setSelectedElaGrade] = useState("");
  const [form, setForm] = useState({
    name: "",
    title: "",
    school_name: "",
    district: "",
    email: "",
    phone: "",
    student_count: "",
    package_interest: "",
    message: "",
  });

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.school_name || !form.email) {
      toast({ title: "Missing fields", description: "Please fill in Name, School Name, and Email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("demo_requests").insert({
      name: form.name.trim(),
      title: form.title.trim() || null,
      school_name: form.school_name.trim(),
      district: form.district.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      student_count: form.student_count ? parseInt(form.student_count) : null,
      grade_levels: selectedGrades.length > 0 ? selectedGrades : null,
      package_interest: form.package_interest || null,
      message: form.message.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Request submitted!", description: "We'll be in touch within 1 business day." });
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-gradient-to-br from-sky-100 via-white to-amber-50 text-foreground min-h-screen">
      {/* NAVBAR */}
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/icon-512.png" alt="DEBs Diagnostic Hub" className="h-9 w-9 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base">D.E.Bs DIAGNOSTIC HUB</div>
              <div className="text-xs text-muted-foreground">School &amp; District Partnerships</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground">How It Works</button>
            <button onClick={() => scrollTo("sandbox")} className="text-muted-foreground hover:text-foreground">Try It</button>
            <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground">Pricing</button>
            <button onClick={() => scrollTo("quote")} className="text-muted-foreground hover:text-foreground">Request a Quote</button>
          </nav>
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">← Back to Main Site</a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-accent text-accent-foreground mb-5">
              <GraduationCap className="w-4 h-4" /> FOR SCHOOLS &amp; DISTRICTS
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
              Data-Driven Diagnostic Testing<br className="hidden sm:block" /> for Your Entire School
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Automated tier placement, AI-powered grading, and parent-ready reports — across Math, ELA, and Reading Recovery. From 25 students to district-wide rollout.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => scrollTo("sandbox")} className="gap-2">
                <BookOpen className="w-4 h-4" /> Try a Sample Test
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("quote")} className="gap-2">
                <Phone className="w-4 h-4" /> Request a Quote
              </Button>
            </div>

            {/* Trust stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { stat: "1,250+", label: "Students Tested" },
                { stat: "Grades 1–12", label: "Full Coverage" },
                { stat: "Math + ELA", label: "Core Subjects" },
                { stat: "3-Tier", label: "Placement System" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-bold text-primary">{item.stat}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 bg-card/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">How It Works — School Edition</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              From enrollment to parent communication in four simple steps.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: "1. Enroll Students", desc: "Bulk upload via CSV or share a school code for self-enrollment." },
                { icon: ClipboardCheck, title: "2. Take Diagnostics", desc: "Grade-level Math & ELA tests with oral reading components." },
                { icon: BarChart3, title: "3. AI Grades & Tiers", desc: "Automated scoring with Green / Yellow / Red tier placement." },
                { icon: FileText, title: "4. Reports & Letters", desc: "Class-wide data dashboards plus individual parent reports." },
              ].map((step) => (
                <Card key={step.title} className="text-center border-border/50">
                  <CardContent className="pt-6 pb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE SANDBOX */}
        <section id="sandbox" className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Try It Yourself</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Experience the same diagnostic tests your students will take — no account needed.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {/* Math sample */}
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-blue-700">M</span>
                  </div>
                  <CardTitle className="text-lg">Math Diagnostic</CardTitle>
                  <CardDescription>Choose a grade level — 5 sample questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedMathGrade} onValueChange={setSelectedMathGrade}>
                    <SelectTrigger><SelectValue placeholder="Select grade level" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <a href={selectedMathGrade ? `/demo/test?subject=math&grade=${selectedMathGrade}` : "#"}>
                    <Button variant="outline" className="w-full gap-2" disabled={!selectedMathGrade}>
                      Take Sample Test <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* ELA sample */}
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-green-700">E</span>
                  </div>
                  <CardTitle className="text-lg">ELA Diagnostic</CardTitle>
                  <CardDescription>Choose a grade level — 5 sample questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedElaGrade} onValueChange={setSelectedElaGrade}>
                    <SelectTrigger><SelectValue placeholder="Select grade level" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <a href={selectedElaGrade ? `/demo/test?subject=ela&grade=${selectedElaGrade}` : "#"}>
                    <Button variant="outline" className="w-full gap-2" disabled={!selectedElaGrade}>
                      Take Sample Test <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Sample Results */}
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                    <Award className="w-5 h-5 text-amber-700" />
                  </div>
                  <CardTitle className="text-lg">Sample Results</CardTitle>
                  <CardDescription>See all 3 tiers + parent reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { tier: "Tier 1 — Enrichment", color: "bg-green-500" },
                      { tier: "Tier 2 — Skill Builder", color: "bg-yellow-500" },
                      { tier: "Tier 3 — Intervention", color: "bg-red-500" },
                    ].map((t) => (
                      <div key={t.tier} className="flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${t.color}`} />
                        <span>{t.tier}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      Each tier generates a personalized parent letter, certificate, and curriculum pathway.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-16 bg-card/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">School Pricing Options</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Flexible plans for Saturday Academies, school sites, and district-wide partnerships.
            </p>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Option A */}
              <Card className="border-border/50 relative">
                <CardHeader>
                  <CardTitle className="text-xl">Option A</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">Per Student Diagnostic License</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold text-primary">$25–$40</span>
                    <span className="text-muted-foreground text-sm ml-1">per student</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Minimum 25 students</p>
                  <div className="bg-accent/50 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-accent-foreground">Best for:</span> Small Saturday Academy programs
                  </div>
                  <ul className="space-y-2">
                    {["Individual diagnostic test", "AI-powered tier placement", "Parent report & certificate", "Score breakdown by skill"].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4" onClick={() => scrollTo("quote")}>
                    Get a Quote
                  </Button>
                </CardContent>
              </Card>

              {/* Option B */}
              <Card className="border-primary/50 relative ring-2 ring-primary/20 shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl">Option B</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">School Site License (Semester)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold text-primary">$3,500–$7,500</span>
                    <span className="text-muted-foreground text-sm ml-1">per semester</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Pricing depends on grade bands, student count &amp; reporting depth</p>
                  <ul className="space-y-2">
                    {[
                      "Unlimited diagnostics",
                      "Class-wide reports & dashboards",
                      "Admin dashboard access",
                      "Bulk student enrollment",
                      "Teacher accounts & class management",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" onClick={() => scrollTo("quote")}>
                    Get a Quote
                  </Button>
                </CardContent>
              </Card>

              {/* Option C */}
              <Card className="border-border/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">Premium</span>
                </div>
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl">Option C</CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">Diagnostic + Intervention Partnership</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold text-primary">$7,500–$15,000</span>
                    <span className="text-muted-foreground text-sm ml-1">per semester</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Full consultation and implementation support</p>
                  <ul className="space-y-2">
                    {[
                      "Everything in Site License",
                      "Diagnostic Hub access",
                      "Grouping recommendations",
                      "Tier strategy consulting",
                      "Optional staff training",
                      "Dedicated support contact",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4" onClick={() => scrollTo("quote")}>
                    Get a Quote
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ROI SECTION */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Why Schools Choose DEBs</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { stat: "40+ hrs", desc: "saved per term on manual grading", icon: ClipboardCheck },
                { stat: "23%", desc: "average score improvement after Tier 2 intervention", icon: BarChart3 },
                { stat: "90%", desc: "parent satisfaction with reports", icon: Users },
              ].map((item) => (
                <Card key={item.stat} className="text-center border-border/50">
                  <CardContent className="pt-6">
                    <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl font-bold text-primary mb-1">{item.stat}</div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* QUOTE FORM */}
        <section id="quote" className="py-16 bg-card/50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Request a Quote</h2>
            <p className="text-center text-muted-foreground mb-8">
              Tell us about your school and we'll put together a custom proposal within 1 business day.
            </p>

            {submitted ? (
              <Card className="border-primary/30">
                <CardContent className="pt-8 pb-8 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Thank you!</h3>
                  <p className="text-muted-foreground">We've received your request and will reach out within 1 business day.</p>
                  <Button variant="outline" onClick={() => scrollTo("sandbox")} className="mt-4">
                    Explore Sample Tests
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="title">Title / Role</Label>
                        <Input id="title" placeholder="e.g. Principal, District Supervisor" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="school_name">School Name *</Label>
                        <Input id="school_name" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} required maxLength={200} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="district">District</Label>
                        <Input id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={200} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="student_count">Estimated # of Students</Label>
                        <Input id="student_count" type="number" min={1} value={form.student_count} onChange={(e) => setForm({ ...form, student_count: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="package">Package Interest</Label>
                        <Select value={form.package_interest} onValueChange={(v) => setForm({ ...form, package_interest: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a package" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Option A — Per Student</SelectItem>
                            <SelectItem value="B">Option B — Site License</SelectItem>
                            <SelectItem value="C">Option C — Partnership</SelectItem>
                            <SelectItem value="unsure">Not sure yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Grade Levels</Label>
                      <div className="flex flex-wrap gap-2">
                        {GRADE_OPTIONS.map((g) => (
                          <label key={g.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <Checkbox
                              checked={selectedGrades.includes(g.value)}
                              onCheckedChange={() => handleGradeToggle(g.value)}
                            />
                            {g.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" rows={3} placeholder="Any questions or specific needs?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={1000} />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/70 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} D.E.Bs Diagnostic Hub. All rights reserved.</p>
          <p className="mt-1">
            <a href="/" className="underline hover:text-foreground">Main Site</a> · <a href="/auth" className="underline hover:text-foreground">Student Login</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
