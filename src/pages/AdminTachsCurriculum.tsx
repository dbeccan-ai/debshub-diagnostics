import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Loader2, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { tachsCurriculumApi, loadAdminDetail, TachsError } from "@/lib/tachs";
import { PROGRAM_KEYS, TACHS_PROGRAMS, type TachsProgramKey } from "@/lib/tachsPrograms";
import { buildTachsCurriculum, type TachsCurriculum } from "@/lib/tachsCurriculum";
import { curriculumDocxBlob, curriculumFileStem, curriculumMarkdown } from "@/lib/tachsCurriculumDoc";

/**
 * ADMIN-ONLY: Personalized TACHS Curriculum for /admin/tachs/:attemptId/curriculum.
 * Guarded by the same admin role check as the other admin pages; the dedicated `tachs-curriculum`
 * function re-validates the role server-side before returning any attempt detail. Uses internal
 * section + skill metrics. There is deliberately NO parent link, email or family-facing output here.
 */
export default function AdminTachsCurriculum() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programKey, setProgramKey] = useState<TachsProgramKey | null>(null);
  const [curriculum, setCurriculum] = useState<TachsCurriculum | null>(null);
  const [source, setSource] = useState<"engine" | "local">("engine");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("Admin access required."); navigate("/dashboard"); return; }
      setAuthorized(true);
    })();
  }, [navigate]);

  const generate = async (key: TachsProgramKey | null) => {
    setLoading(true); setError(null);
    try {
      const r = await tachsCurriculumApi.generate(attemptId, key ?? undefined);
      setCurriculum(r.curriculum); setProgramKey(r.curriculum.program.key); setSource("engine");
    } catch (e) {
      // Admin-only fallback (function not deployed yet): the admin detail read is itself role-gated,
      // so the same shared builder runs locally on the internal results snapshot.
      if (e instanceof TachsError && (e.status === 401 || e.status === 403)) { setError(e.message); setLoading(false); return; }
      try {
        const d = await loadAdminDetail(attemptId);
        if (d.attempt.status !== "completed" || !d.attempt.results) throw new Error("A curriculum can be generated only after the diagnostic is completed.");
        const pk = key ?? d.parent_report_content?.recommended_program_key ?? d.parent_report_defaults?.recommended_program_key ?? "tachs_skill_builder";
        setCurriculum(buildTachsCurriculum({ results: d.attempt.results as unknown as Record<string, unknown>, programKey: pk, studentName: d.attempt.profiles?.full_name ?? "Student", gradeLevel: d.attempt.grade_level ?? null }));
        setProgramKey(pk); setSource("local");
      } catch (e2) { setError(e2 instanceof Error ? e2.message : "Could not generate the curriculum."); }
    } finally { setLoading(false); }
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const downloadMarkdown = () => {
    if (!curriculum) return;
    saveBlob(new Blob([curriculumMarkdown(curriculum)], { type: "text/markdown;charset=utf-8" }), `${curriculumFileStem(curriculum)}.md`);
    toast.success("Markdown/TXT curriculum downloaded (internal copy).");
  };
  const downloadDocx = async () => {
    if (!curriculum) return;
    try {
      saveBlob(await curriculumDocxBlob(curriculum), `${curriculumFileStem(curriculum)}.docx`);
      toast.success("DOCX curriculum downloaded (internal copy).");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not build the DOCX file."); }
  };

  useEffect(() => { if (authorized && attemptId) void generate(null); }, [authorized, attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authorized) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="TACHS Curriculum (Admin) | D.E.Bs" description="Consultant-only personalized TACHS curriculum." path={`/admin/tachs/${attemptId}/curriculum`} noIndex />
      <style>{`@page { size: Letter portrait; margin: 0.55in; } @media print { .no-print { display: none !important; } .print-break { break-inside: avoid; } body { font-size: 11px; } }`}</style>
      <header className="border-b bg-card no-print">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/tachs/${attemptId}`)}><ArrowLeft className="mr-1 h-4 w-4" /> Back to attempt</Button>
            <h1 className="text-xl font-bold text-primary">Personalized TACHS Curriculum — Based on Identified Skill Gaps</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="rounded-md border-2 border-destructive bg-destructive/5 p-4 text-sm font-bold" role="note" data-testid="curriculum-admin-banner">
          ADMIN ONLY — this curriculum uses internal skill metrics and is never sent to families. Share only the approved parent report and At-Home Support Plan.
        </div>
        <section className="no-print space-y-3 rounded-md border bg-card p-4" aria-label="Curriculum controls">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium">Selected program
              <Select value={programKey ?? ""} onValueChange={(v) => { setProgramKey(v as TachsProgramKey); void generate(v as TachsProgramKey); }}>
                <SelectTrigger className="mt-1 w-72" aria-label="Program"><SelectValue placeholder="Program" /></SelectTrigger>
                <SelectContent>{PROGRAM_KEYS.map((k) => <SelectItem key={k} value={k}>{TACHS_PROGRAMS[k].name} · {TACHS_PROGRAMS[k].duration_weeks} wks</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <Button disabled={loading} onClick={() => generate(programKey)} data-testid="curriculum-regenerate"><RefreshCw className="mr-1 h-4 w-4" /> Generate / Regenerate Curriculum</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!curriculum} onClick={() => void downloadDocx()} data-testid="curriculum-download-docx"><Download className="mr-1 h-4 w-4" /> Download Skill-Gap Curriculum — DOCX</Button>
            <Button variant="outline" disabled={!curriculum} onClick={downloadMarkdown} data-testid="curriculum-download-md"><FileText className="mr-1 h-4 w-4" /> Download Skill-Gap Curriculum — Markdown/TXT</Button>
            <Button variant="outline" disabled={!curriculum} onClick={() => window.print()} data-testid="curriculum-print"><Printer className="mr-1 h-4 w-4" /> Print / Save Curriculum as PDF</Button>
          </div>
          <p className="text-sm text-muted-foreground">Use the DOCX or text download as the source document for workbook creation.</p>
        </section>
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating curriculum…</div>}
        {error && <Card className="border-destructive"><CardContent className="pt-6 text-sm">{error}</CardContent></Card>}
        {curriculum && !loading && (
          <>
            <Card className="print-break">
              <CardHeader><CardTitle className="text-2xl">{curriculum.student_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{curriculum.grade_level ? `Grade ${curriculum.grade_level} · ` : ""}Score {curriculum.overall_accuracy}% · {curriculum.program.tier_badge} · {curriculum.program.name} · {curriculum.program.duration_weeks} weeks · {curriculum.program.total_sessions} sessions · {curriculum.program.total_hours} hours{source === "local" ? " · built locally from the internal snapshot" : ""}</p>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <div><h3 className="font-semibold">ADMIN ONLY priority summary</h3><p>{curriculum.priorities.join(", ") || "None — all sections Tier 1"}</p></div>
                <div><h3 className="font-semibold">Strengths to maintain</h3><p>{curriculum.strengths.join(", ") || "None yet"}</p></div>
                <div className="md:col-span-2 overflow-x-auto">
                  <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead>Weakest skills (internal)</TableHead></TableRow></TableHeader>
                    <TableBody>{[...curriculum.section_profile].sort((a, b) => a.priority_rank - b.priority_rank).map((s) => (
                      <TableRow key={s.section_key}><TableCell>{s.priority_rank}</TableCell><TableCell>{s.label}</TableCell><TableCell>{s.accuracy}%</TableCell><TableCell>{s.tier_badge}</TableCell>
                        <TableCell className="text-xs">{s.weakest_skills.map((k) => `${k.label} ${k.correct}/${k.presented}`).join(" · ") || "—"}</TableCell></TableRow>
                    ))}</TableBody></Table>
                </div>
                <div className="md:col-span-2"><h3 className="font-semibold">Milestones</h3><ul className="list-disc pl-5">{curriculum.milestones.map((m) => <li key={m.week}>Week {m.week}: {m.description}</li>)}</ul></div>
                <div className="md:col-span-2"><h3 className="font-semibold">Workbook development specifications</h3><ul className="list-disc pl-5">{curriculum.workbook_specifications.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                <div className="md:col-span-2"><h3 className="font-semibold">Consultant notes</h3><ul className="list-disc pl-5">{curriculum.consultant_notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
              </CardContent>
            </Card>

            {curriculum.weeks.map((w) => (
              <Card key={w.week} className="print-break" data-testid="curriculum-week">
                <CardHeader className="pb-2"><CardTitle className="text-lg">Week {w.week} — {w.phase}</CardTitle><p className="text-sm text-muted-foreground">Focus: {w.focus_sections.join(" · ")}</p><p className="text-xs text-muted-foreground">Skills: {w.focus_skills.join(" · ")}</p></CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <div><h4 className="font-semibold">Measurable objectives</h4><ul className="list-disc pl-5">{w.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
                  <div><h4 className="font-semibold">Consultant-led lesson sequence</h4><ol className="list-decimal pl-5">{w.lesson_sequence.map((o, i) => <li key={i}>{o}</li>)}</ol></div>
                  <div><h4 className="font-semibold">Independent practice</h4><ul className="list-disc pl-5">{w.independent_practice.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
                  <div><h4 className="font-semibold">At-home reinforcement</h4><ul className="list-disc pl-5">{w.home_reinforcement.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
                  {w.algebra_focus && <p className="md:col-span-2 text-sm"><strong>Algebra I foundations:</strong> {w.algebra_focus}</p>}
                  <div className="md:col-span-2 space-y-3">
                    {w.sessions.map((sn) => (
                      <div key={sn.session} className="rounded-md border p-3" data-testid="curriculum-session">
                        <p className="font-semibold">Session {sn.session} — {sn.day_label} · {sn.minutes} minutes · {sn.section_focus}</p>
                        <ul className="list-disc pl-5 text-xs mt-1">{sn.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                        <ul className="list-disc pl-5 text-xs mt-1">{sn.agenda.map((a, i) => <li key={i}><strong>{a.block} ({a.minutes} min):</strong> {a.detail}</li>)}</ul>
                        <p className="text-xs mt-1"><strong>Exit check:</strong> {sn.exit_check}</p>
                      </div>
                    ))}
                  </div>
                  {w.progress_check && <p className="md:col-span-2 rounded-md border border-primary/40 bg-primary/5 p-2"><strong>Progress check:</strong> {w.progress_check}</p>}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
