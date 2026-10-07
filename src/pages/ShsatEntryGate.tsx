import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GRADES, PATHWAYS, PERFORMANCE_BANDS, SPECIALIZED_HIGH_SCHOOLS } from "@/lib/shsatConfig";

const schema = z.object({
  student_first_name: z.string().trim().min(1, "First name is required").max(80),
  student_last_name: z.string().trim().min(1, "Last name is required").max(80),
  current_grade: z.enum(["6", "7", "8", "9"], { errorMap: () => ({ message: "Choose a grade" }) }),
  current_school: z.string().trim().max(160).optional(),
  nyc_resident: z.enum(["yes", "no"], { errorMap: () => ({ message: "Answer NYC residency" }) }),
  shsat_registered: z.enum(["yes", "no", "not_sure"], { errorMap: () => ({ message: "Answer registration status" }) }),
  prior_shsat_practice: z.enum(["yes", "no"], { errorMap: () => ({ message: "Answer prior practice" }) }),
  math_performance_band: z.string().max(40).optional(),
  ela_performance_band: z.string().max(40).optional(),
  target_schools: z.array(z.string()).min(1, "Choose at least one school or Undecided"),
  parent_email: z.string().trim().email("Enter a valid parent/guardian email").max(255),
  pathway: z.enum(["testing_this_november", "preparing_next_year", "long_range_6_7"], { errorMap: () => ({ message: "Choose a pathway" }) }),
});
type Form = Partial<z.infer<typeof schema>> & { target_schools: string[] };

function YesNo({ id, value, onChange, opts }: { id: string; value?: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
      {opts.map(([v, l]) => (
        <div key={v} className="flex items-center gap-2"><RadioGroupItem value={v} id={`${id}-${v}`} /><Label htmlFor={`${id}-${v}`}>{l}</Label></div>
      ))}
    </RadioGroup>
  );
}

export default function ShsatEntryGate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Form>({ target_schools: [] });
  const set = (k: keyof Form, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth?redirect=/shsat/entry-gate"); return; }
      setUserId(user.id);
      const [{ data: profile }, { data: existing }] = await Promise.all([
        supabase.from("profiles").select("full_name, parent_email, school_id").eq("id", user.id).maybeSingle(),
        supabase.from("shsat_intakes").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setSchoolId(profile?.school_id ?? null);
      if (existing) {
        setF({
          ...existing,
          current_school: existing.current_school ?? undefined,
          nyc_resident: existing.nyc_resident == null ? undefined : existing.nyc_resident ? "yes" : "no",
          prior_shsat_practice: existing.prior_shsat_practice == null ? undefined : existing.prior_shsat_practice ? "yes" : "no",
          shsat_registered: (existing.shsat_registered ?? undefined) as Form["shsat_registered"],
          math_performance_band: existing.math_performance_band ?? undefined,
          ela_performance_band: existing.ela_performance_band ?? undefined,
        } as Form);
      } else if (profile) {
        const [first, ...rest] = (profile.full_name || "").trim().split(/\s+/);
        setF({ target_schools: [], student_first_name: first || "", student_last_name: rest.join(" "), parent_email: profile.parent_email || user.email || "" });
      }
      setLoading(false);
    })();
  }, [navigate]);

  const toggleSchool = (s: string, on: boolean) => {
    let next = on ? [...f.target_schools, s] : f.target_schools.filter((x) => x !== s);
    if (on && s === "Undecided") next = ["Undecided"];
    else if (on) next = next.filter((x) => x !== "Undecided");
    set("target_schools", next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast({ title: "Please check the form", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const v = parsed.data;
    setSaving(true);
    const { error } = await supabase.from("shsat_intakes").upsert({
      user_id: userId!, school_id: schoolId,
      student_first_name: v.student_first_name, student_last_name: v.student_last_name,
      current_grade: v.current_grade, current_school: v.current_school || null,
      nyc_resident: v.nyc_resident === "yes", shsat_registered: v.shsat_registered,
      prior_shsat_practice: v.prior_shsat_practice === "yes",
      math_performance_band: v.math_performance_band || null, ela_performance_band: v.ela_performance_band || null,
      target_schools: v.target_schools, parent_email: v.parent_email, pathway: v.pathway,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast({ title: "Could not save intake", description: error.message, variant: "destructive" }); return; }
    navigate("/shsat/next");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="SHSAT Entry Gate | D.E.Bs Diagnostic Hub" description="SHSAT Readiness Diagnostic intake." path="/shsat/entry-gate" noIndex />
      <header className="border-b bg-card"><div className="container mx-auto py-4 px-4"><Link to="/shsat" className="font-bold text-primary text-lg">← D.E.Bs SHSAT Readiness Diagnostic</Link></div></header>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">SHSAT Entry Gate</CardTitle>
            <CardDescription className="text-base">Tell us about the student so the diagnostic can be matched to their grade, goals, and timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6 text-base">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="fn">Student first name *</Label><Input id="fn" value={f.student_first_name ?? ""} onChange={(e) => set("student_first_name", e.target.value)} maxLength={80} /></div>
                <div className="space-y-1"><Label htmlFor="ln">Student last name *</Label><Input id="ln" value={f.student_last_name ?? ""} onChange={(e) => set("student_last_name", e.target.value)} maxLength={80} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Current grade *</Label>
                  <Select value={f.current_grade} onValueChange={(v) => set("current_grade", v)}>
                    <SelectTrigger aria-label="Current grade"><SelectValue placeholder="Choose grade" /></SelectTrigger>
                    <SelectContent>{GRADES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label htmlFor="school">Current school</Label><Input id="school" value={f.current_school ?? ""} onChange={(e) => set("current_school", e.target.value)} maxLength={160} /></div>
              </div>
              <div className="space-y-2"><Label>NYC resident? *</Label><YesNo id="nyc" value={f.nyc_resident} onChange={(v) => set("nyc_resident", v)} opts={[["yes", "Yes"], ["no", "No"]]} /></div>
              <div className="space-y-2"><Label>Has the student registered for the SHSAT? *</Label><YesNo id="reg" value={f.shsat_registered} onChange={(v) => set("shsat_registered", v)} opts={[["yes", "Yes"], ["no", "No"], ["not_sure", "Not sure"]]} /></div>
              <div className="space-y-2"><Label>Has the student previously taken an SHSAT diagnostic or practice test? *</Label><YesNo id="prior" value={f.prior_shsat_practice} onChange={(v) => set("prior_shsat_practice", v)} opts={[["yes", "Yes"], ["no", "No"]]} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                {(["math_performance_band", "ela_performance_band"] as const).map((k) => (
                  <div key={k} className="space-y-1"><Label>{k.startsWith("math") ? "Most recent math performance band" : "Most recent ELA/reading performance band"} (optional)</Label>
                    <Select value={f[k]} onValueChange={(v) => set(k, v)}>
                      <SelectTrigger aria-label={k}><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{PERFORMANCE_BANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <fieldset className="space-y-2"><legend className="font-medium">Target specialized high schools *</legend>
                <div className="grid sm:grid-cols-2 gap-2">
                  {SPECIALIZED_HIGH_SCHOOLS.map((s) => (
                    <label key={s} className="flex items-start gap-2 cursor-pointer"><Checkbox checked={f.target_schools.includes(s)} onCheckedChange={(c) => toggleSchool(s, !!c)} className="mt-1" /><span>{s}</span></label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1"><Label htmlFor="pe">Parent/guardian email *</Label><Input id="pe" type="email" value={f.parent_email ?? ""} onChange={(e) => set("parent_email", e.target.value)} maxLength={255} /></div>
              <div className="space-y-2"><Label>Intended pathway *</Label>
                <YesNo id="path" value={f.pathway} onChange={(v) => set("pathway", v)} opts={PATHWAYS.map((p) => [p.key, p.label])} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save and continue</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
