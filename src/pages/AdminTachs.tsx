import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  tachsApi, SECTION_NAMES, skillLabel, formatClock,
  type TachsAdminAttempt, type TachsAdminSection, type TachsAuditRow, type TachsAttemptEvent,
} from "@/lib/tachs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Printer, RotateCcw, Search } from "lucide-react";
import SEO from "@/components/SEO";

const BAND_KEYS = ["strong", "approaching", "developing", "foundations"] as const;

export default function AdminTachs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TachsAdminAttempt[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [band, setBand] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [version, setVersion] = useState("all");
  const [detail, setDetail] = useState<{
    attempt: TachsAdminAttempt; sections: TachsAdminSection[]; audit: TachsAuditRow[]; events: TachsAttemptEvent[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reopenTarget, setReopenTarget] = useState<TachsAdminAttempt | null>(null);
  const [reopenSection, setReopenSection] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("This page is for administrators only."); navigate("/dashboard"); return; }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { attempts } = await tachsApi.adminList();
      setAttempts(attempts ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the TACHS attempts.");
    } finally { setLoading(false); }
  };

  const versions = useMemo(
    () => [...new Set(attempts.map((a) => a.blueprint_version))].sort((a, b) => b - a),
    [attempts],
  );

  const filtered = useMemo(() => attempts.filter((a) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${a.profiles?.full_name ?? ""} ${a.profiles?.username ?? ""} ${a.parent_email ?? ""} ${a.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (status !== "all" && a.status !== status) return false;
    if (band !== "all" && (a.results?.band?.key ?? "") !== band) return false;
    if (emailFilter !== "all" && (a.email_status ?? "pending") !== emailFilter) return false;
    if (version !== "all" && String(a.blueprint_version) !== version) return false;
    return true;
  }), [attempts, search, status, band, emailFilter, version]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await tachsApi.adminDetail(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the attempt details.");
    } finally { setDetailLoading(false); }
  };

  const resend = async (a: TachsAdminAttempt) => {
    setBusy(a.id);
    try {
      const res = await tachsApi.adminResendEmail(a.id);
      if (res.email?.email_status === "sent") toast.success("Report emailed to the parent or guardian.");
      else toast.error(res.email?.email_error ?? "The email could not be sent. The result is still saved.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The email could not be sent.");
    } finally { setBusy(null); }
  };

  const confirmReopen = async () => {
    if (!reopenTarget) return;
    setBusy(reopenTarget.id);
    try {
      const res = await tachsApi.adminReopen(reopenTarget.id, reopenSection || undefined);
      toast.success(`Reopened ${SECTION_NAMES[res.section_key as keyof typeof SECTION_NAMES] ?? res.section_key}. The student can retake that part.`);
      setReopenTarget(null); setReopenSection("");
      await load();
      if (detail?.attempt.id === reopenTarget.id) await openDetail(reopenTarget.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reopen this attempt.");
    } finally { setBusy(null); }
  };

  const emailBadge = (s: string | null) => {
    const v = s ?? "pending";
    const tone = v === "sent" ? "bg-green-100 text-green-800" : v === "failed" ? "bg-red-100 text-red-800" : v === "skipped" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{v}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="TACHS Pilot Attempts | Admin" description="Review D.E.Bs TACHS Readiness Diagnostic pilot attempts, section metrics, and report delivery." noIndex />
      <div className="container mx-auto max-w-7xl px-4 py-8 print:py-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2 -ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Button>
            <h1 className="text-2xl font-bold">TACHS Readiness Diagnostic</h1>
            <p className="text-sm text-muted-foreground">All pilot attempts, section metrics, answer audit, and report delivery.</p>
          </div>
          <Badge className="bg-secondary text-secondary-foreground">Pilot</Badge>
        </div>

        <Card className="mb-6 print:hidden">
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Student, email, ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={band} onValueChange={setBand}>
              <SelectTrigger><SelectValue placeholder="Readiness band" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All bands</SelectItem>
                {BAND_KEYS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={emailFilter} onValueChange={setEmailFilter}>
              <SelectTrigger><SelectValue placeholder="Email status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All email states</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger><SelectValue placeholder="Blueprint" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All blueprints</SelectItem>
                {versions.map((v) => <SelectItem key={v} value={String(v)}>Version {v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="print:hidden"><CardTitle className="text-lg">{filtered.length} attempt{filtered.length === 1 ? "" : "s"}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading attempts…</div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No attempts match these filters yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead><TableHead>Grade</TableHead><TableHead>Status</TableHead>
                    <TableHead>Band</TableHead><TableHead>Accuracy</TableHead><TableHead>Blueprint</TableHead>
                    <TableHead>Started</TableHead><TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{a.profiles?.full_name ?? "Student"}</div>
                        <div className="text-xs text-muted-foreground">{a.parent_email ?? "No parent email"}</div>
                        {a.test_mode && <Badge variant="outline" className="mt-1">Test mode</Badge>}
                      </TableCell>
                      <TableCell>{a.grade_level ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.status === "completed" ? "Completed" : "In progress"}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.results?.band?.label ?? "—"}</TableCell>
                      <TableCell>{a.results ? `${a.results.overall_accuracy}%` : "—"}</TableCell>
                      <TableCell>v{a.blueprint_version}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(a.started_at).toLocaleDateString()}</TableCell>
                      <TableCell>{emailBadge(a.email_status)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDetail(a.id)}>Details</Button>
                          <Button size="sm" variant="outline" disabled={a.status !== "completed" || busy === a.id} onClick={() => resend(a)}>
                            {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            <span className="ml-1 hidden lg:inline">Resend</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setReopenTarget(a); setReopenSection(""); }}>
                            <RotateCcw className="h-4 w-4" /><span className="ml-1 hidden lg:inline">Reopen</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          {detailLoading || !detail ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{detail.attempt.profiles?.full_name ?? "Student"} — TACHS attempt</DialogTitle>
                <DialogDescription>
                  Blueprint v{detail.attempt.blueprint_version} · started {new Date(detail.attempt.started_at).toLocaleString()}
                  {detail.attempt.completed_at ? ` · completed ${new Date(detail.attempt.completed_at).toLocaleString()}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="mb-3 flex flex-wrap gap-2 print:hidden">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print report</Button>
                {detail.attempt.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/tachs/results/${detail.attempt.id}`)}>Open full report</Button>
                )}
              </div>

              <section className="mb-5">
                <h3 className="mb-2 font-semibold">Section metrics</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Section</TableHead><TableHead>Status</TableHead><TableHead>Items</TableHead>
                      <TableHead>Time used</TableHead><TableHead>Submit reason</TableHead><TableHead>Difficulty path</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {detail.sections.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap">{SECTION_NAMES[s.section_key]}</TableCell>
                          <TableCell>{s.status.replace(/_/g, " ")}</TableCell>
                          <TableCell>{s.item_count}</TableCell>
                          <TableCell>{s.time_used_seconds != null ? formatClock(s.time_used_seconds) : "—"}</TableCell>
                          <TableCell>{s.submit_reason ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {(s.difficulty_path ?? []).map((p) => p.difficulty).join(" → ") || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {detail.attempt.results && (
                <section className="mb-5">
                  <h3 className="mb-2 font-semibold">Skill metrics</h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {detail.attempt.results.skills.map((k) => (
                      <div key={`${k.section_key}-${k.skill}`} className="rounded-md border p-2 text-sm">
                        <div className="font-medium">{skillLabel(k.skill)}</div>
                        <div className="text-xs text-muted-foreground">{SECTION_NAMES[k.section_key]} · {k.correct}/{k.presented} · {k.accuracy}%</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-5">
                <h3 className="mb-2 font-semibold">Answer audit ({detail.audit.length} items)</h3>
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Item</TableHead><TableHead>Skill</TableHead>
                      <TableHead>Diff</TableHead><TableHead>Chosen</TableHead><TableHead>Key</TableHead><TableHead>Result</TableHead>
                      <TableHead>Time</TableHead><TableHead>Flag</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {detail.audit.map((r, i) => (
                        <TableRow key={`${r.section_key}-${r.position}-${i}`}>
                          <TableCell>{r.position}</TableCell>
                          <TableCell className="whitespace-nowrap">{SECTION_NAMES[r.section_key]}</TableCell>
                          <TableCell className="max-w-[18rem] truncate text-xs">{r.code} — {r.stem}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{skillLabel(r.skill)}</TableCell>
                          <TableCell>{r.difficulty}</TableCell>
                          <TableCell>{r.selected_key ?? "—"}</TableCell>
                          <TableCell>{r.correct_key ?? "—"}</TableCell>
                          <TableCell>{r.is_correct == null ? "—" : r.is_correct ? "Correct" : "Incorrect"}</TableCell>
                          <TableCell>{formatClock(r.time_spent_seconds ?? 0)}</TableCell>
                          <TableCell>{r.is_flagged ? "Yes" : ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-semibold">Activity and email log</h3>
                {detail.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded events yet.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {detail.events.map((e) => (
                      <li key={e.id} className="rounded border p-2">
                        <span className="font-medium">{e.event_type.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground"> · {new Date(e.created_at).toLocaleString()}</span>
                        {e.detail && Object.keys(e.detail).length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground break-all">{JSON.stringify(e.detail)}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reopen confirmation */}
      <Dialog open={!!reopenTarget} onOpenChange={(o) => { if (!o) setReopenTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen a section for retaking</DialogTitle>
            <DialogDescription>
              This clears the answers for the selected section only and lets {reopenTarget?.profiles?.full_name ?? "this student"} take it again.
              The previous result is preserved in the activity log. This action is recorded.
            </DialogDescription>
          </DialogHeader>
          <Select value={reopenSection} onValueChange={setReopenSection}>
            <SelectTrigger><SelectValue placeholder="First submitted section" /></SelectTrigger>
            <SelectContent>
              {Object.entries(SECTION_NAMES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy === reopenTarget?.id} onClick={confirmReopen}>
              {busy === reopenTarget?.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Reopen section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
