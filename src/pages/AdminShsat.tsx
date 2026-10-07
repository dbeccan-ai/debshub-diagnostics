import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Square, Loader2, AlertTriangle } from "lucide-react";
import { SHSAT_CHECKLIST, SHSAT_CYCLE, SHSAT_STRUCTURE, PLACEMENTS, PATHWAYS, formatLongDate } from "@/lib/shsatConfig";
import type { Tables } from "@/integrations/supabase/types";

type Item = Pick<Tables<"shsat_items">, "section" | "primary_domain" | "difficulty_level" | "is_active" | "calibration_status">;

export default function AdminShsat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ok, setOk] = useState<boolean | null>(null);
  const [tax, setTax] = useState<Tables<"shsat_taxonomy">[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [intakes, setIntakes] = useState<Tables<"shsat_intakes">[]>([]);
  const [settings, setSettings] = useState<Tables<"shsat_settings"> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { setOk(false); return; }
      const [t, i, n, s] = await Promise.all([
        supabase.from("shsat_taxonomy").select("*").order("sort_order"),
        supabase.from("shsat_items").select("section, primary_domain, difficulty_level, is_active, calibration_status"),
        supabase.from("shsat_intakes").select("*").order("created_at", { ascending: false }),
        supabase.from("shsat_settings").select("*").eq("id", 1).maybeSingle(),
      ]);
      setTax(t.data ?? []); setItems(i.data ?? []); setIntakes(n.data ?? []); setSettings(s.data); setOk(true);
    })();
  }, [navigate]);

  const domains = useMemo(() => {
    const m = new Map<string, { section: string; domain: string; skills: number; active: number; byDiff: Record<number, number> }>();
    tax.forEach((t) => { const k = `${t.section}|${t.domain}`; const r = m.get(k) ?? { section: t.section, domain: t.domain, skills: 0, active: 0, byDiff: {} }; r.skills++; m.set(k, r); });
    items.filter((i) => i.is_active).forEach((i) => { const r = m.get(`${i.section}|${i.primary_domain}`); if (r) { r.active++; const d = i.difficulty_level ?? 0; r.byDiff[d] = (r.byDiff[d] ?? 0) + 1; } });
    return [...m.values()];
  }, [tax, items]);
  const calib = useMemo(() => items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.calibration_status]: (a[i.calibration_status] ?? 0) + 1 }), {}), [items]);

  const toggleEnabled = async (v: boolean) => {
    const { error } = await supabase.from("shsat_settings").update({ assessment_enabled: v, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast({ title: "Could not update", description: error.message, variant: "destructive" });
    setSettings((s) => s && { ...s, assessment_enabled: v });
    toast({ title: v ? "SHSAT assessment enabled" : "SHSAT assessment disabled" });
  };
  const setPlacement = async (id: string, placement: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const value = placement === "none" ? null : placement;
    const { error } = await supabase.from("shsat_intakes").update({ placement: value, placement_set_by: user?.id, placement_set_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "Could not save placement", description: error.message, variant: "destructive" });
    setIntakes((l) => l.map((x) => x.id === id ? { ...x, placement: value } : x));
  };

  if (ok === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ok) return <div className="p-10 text-center">Admin access required. <Link className="underline" to="/dashboard">Back</Link></div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin · SHSAT Blueprint" description="Admin SHSAT blueprint" path="/admin/shsat" noIndex />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6 text-base">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold">SHSAT Blueprint (Admin)</h1>
          <Link to="/dashboard" className="underline text-sm">← Dashboard</Link>
        </div>
        <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4 flex gap-2 items-center font-semibold"><AlertTriangle className="h-5 w-5 text-destructive" /> Placement rules pending calibration.</div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="text-lg">Exam structure</CardTitle></CardHeader><CardContent className="space-y-1">
            <p>{SHSAT_STRUCTURE.totalQuestions} total · {SHSAT_STRUCTURE.elaQuestions} ELA · {SHSAT_STRUCTURE.mathQuestions} Math</p>
            <p>{SHSAT_STRUCTURE.minutes} minutes · {SHSAT_STRUCTURE.format}</p>
            <p className="text-sm text-muted-foreground">ELA: {SHSAT_STRUCTURE.elaParts.join(", ")}</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-lg">{SHSAT_CYCLE.year} dates</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
            <p>Registration: {formatLongDate(SHSAT_CYCLE.registrationOpens)} – {formatLongDate(SHSAT_CYCLE.registrationDeadline)}</p>
            {SHSAT_CYCLE.testDates.map((d) => <p key={d.date}>• {d.label}</p>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-lg">Progress</CardTitle></CardHeader><CardContent className="space-y-1">
            {SHSAT_CHECKLIST.map((c) => <p key={c.label} className="flex items-center gap-2">{c.done ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}{c.label}</p>)}
          </CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle className="text-lg">Assessment availability</CardTitle></CardHeader><CardContent className="flex items-center gap-3">
          <Switch id="enable" checked={!!settings?.assessment_enabled} onCheckedChange={toggleEnabled} />
          <Label htmlFor="enable">Admin override: enable SHSAT assessment for students (keep off until item loading is complete)</Label>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-lg">Taxonomy & item bank ({tax.length} skills · {items.length} items · {items.filter((i) => i.is_active).length} active)</CardTitle></CardHeader><CardContent className="overflow-x-auto">
          <p className="text-sm mb-2">Calibration: {items.length ? Object.entries(calib).map(([k, v]) => `${k} ${v}`).join(" · ") : "no items loaded yet"}</p>
          <Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Domain</TableHead><TableHead>Skills</TableHead><TableHead>Active items</TableHead>{[1, 2, 3, 4, 5].map((d) => <TableHead key={d}>D{d}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{domains.map((d) => <TableRow key={d.section + d.domain}><TableCell>{d.section}</TableCell><TableCell>{d.domain}</TableCell><TableCell>{d.skills}</TableCell><TableCell>{d.active}</TableCell>{[1, 2, 3, 4, 5].map((n) => <TableCell key={n}>{d.byDiff[n] ?? 0}</TableCell>)}</TableRow>)}</TableBody></Table>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-lg">Entry Gate intakes ({intakes.length})</CardTitle></CardHeader><CardContent className="overflow-x-auto">
          <p className="text-sm text-muted-foreground mb-2">Placement is manual only. Placement rules pending calibration.</p>
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Grade</TableHead><TableHead>Pathway</TableHead><TableHead>Registered</TableHead><TableHead>Parent email</TableHead><TableHead>Placement</TableHead></TableRow></TableHeader>
            <TableBody>{intakes.map((r) => <TableRow key={r.id}>
              <TableCell>{r.student_first_name} {r.student_last_name}<div className="text-xs text-muted-foreground">{r.current_school}</div></TableCell>
              <TableCell>{r.current_grade}</TableCell>
              <TableCell>{PATHWAYS.find((p) => p.key === r.pathway)?.label}</TableCell>
              <TableCell>{r.shsat_registered}</TableCell><TableCell>{r.parent_email}</TableCell>
              <TableCell><Select value={r.placement ?? "none"} onValueChange={(v) => setPlacement(r.id, v)}>
                <SelectTrigger className="w-52" aria-label="Placement"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Not placed</SelectItem>{PLACEMENTS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select></TableCell></TableRow>)}
              {!intakes.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No intakes yet</TableCell></TableRow>}
            </TableBody></Table>
        </CardContent></Card>
      </main>
    </div>
  );
}
