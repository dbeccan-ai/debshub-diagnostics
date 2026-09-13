import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  tachsApi, SECTION_NAMES, skillLabel, formatClock, dollars, REPORT_STATUS_LABEL, loadAdminAttempts, loadAdminDetail,
  type TachsAdminAttempt, type TachsAdminDetail, type TachsOrder, type TachsReportStatus, type TachsParentReportContent, type TachsHomeSupportPlan,
} from "@/lib/tachs";
import { PROGRAM_KEYS, TACHS_PROGRAMS, TACHS_TIERS, usd, usd2, pricingBreakdown, type TachsProgramKey } from "@/lib/tachsPrograms";
import { defaultHomeSupportPlan, sectionScores } from "@/lib/tachsParentReport";
import { TachsHomeSupportPlan } from "@/components/TachsHomeSupportPlan";
import { PINNED_ATTEMPTS, MODE_LABEL, countsByMode, filterByMode, type AttemptMode } from "@/lib/tachsAdminHelpers";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, ClipboardList, Loader2, Mail, Printer, RotateCcw, Search, KeyRound, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

const BAND_KEYS = ["strong", "approaching", "developing", "foundations"] as const;

export default function AdminTachs() {
  const navigate = useNavigate();
  const { attemptId: routeAttemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [source, setSource] = useState<"engine" | "direct">("engine");
  const [mode, setMode] = useState<AttemptMode>("all");
  const [attempts, setAttempts] = useState<TachsAdminAttempt[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [band, setBand] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [version, setVersion] = useState("all");
  const [detail, setDetail] = useState<TachsAdminDetail | null>(null);
  const [reportNotes, setReportNotes] = useState("");
  const [parentForm, setParentForm] = useState<TachsParentReportContent | null>(null);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [approvalConfirm, setApprovalConfirm] = useState(false);
  const [detailTab, setDetailTab] = useState<"parent" | "internal">("parent");
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reopenTarget, setReopenTarget] = useState<TachsAdminAttempt | null>(null);
  const [reopenSection, setReopenSection] = useState<string>("");
  const [orders, setOrders] = useState<TachsOrder[]>([]);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantQuery, setGrantQuery] = useState("");
  const [grantResults, setGrantResults] = useState<{ id: string; full_name: string | null; username: string | null; parent_email: string | null }[]>([]);
  const [grantUser, setGrantUser] = useState<{ id: string; full_name: string | null; parent_email: string | null } | null>(null);
  const [grantReason, setGrantReason] = useState("");
  const [grantConfirm, setGrantConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("This page is for administrators only."); navigate("/dashboard"); return; }
      await load();
      if (routeAttemptId) await openDetail(routeAttemptId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true); setLoadError(null);
    const r = await loadAdminAttempts();
    if (r.kind === "error") {
      // An API failure must never look like "no attempts".
      setLoadError(r.message);
    } else {
      setAttempts(r.attempts); setOrders(r.orders); setSource(r.source);
    }
    setLoading(false);
  };

  const counts = useMemo(() => countsByMode(attempts), [attempts]);
  const filtersActive = mode !== "all" || !!search || status !== "all" || band !== "all" || emailFilter !== "all" || version !== "all";
  const resetFilters = () => { setMode("all"); setSearch(""); setStatus("all"); setBand("all"); setEmailFilter("all"); setVersion("all"); };

  const versions = useMemo(
    () => [...new Set(attempts.map((a) => a.blueprint_version))].sort((a, b) => b - a),
    [attempts],
  );

  const filtered = useMemo(() => filterByMode(attempts, mode).filter((a) => {
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
  }), [attempts, mode, search, status, band, emailFilter, version]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    if (routeAttemptId !== id) navigate(`/admin/tachs/${id}`, { replace: true });
    try {
      const d = await loadAdminDetail(id);
      setDetail(d); setReportNotes(d.attempt.report_notes ?? ""); setSendConfirm(false); setApprovalConfirm(false); setDetailTab("parent");
      const base = d.parent_report_content ?? d.parent_report_defaults ?? null;
      // Older saved content (before the home plan existed) gets the generated plan for its own priorities/program.
      const results = d.attempt.results as unknown as Record<string, unknown> | null;
      const hp = base?.home_support_plan ?? (base && results ? (defaultHomeSupportPlan(base.recommended_program_key, base.priority_sections, sectionScores(results)) as TachsHomeSupportPlan) : undefined);
      setParentForm(base ? { ...base, customized_next_steps: [...base.customized_next_steps], priority_sections: [...base.priority_sections], home_support_plan: hp ? JSON.parse(JSON.stringify(hp)) : undefined } : null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the attempt details.");
    } finally { setDetailLoading(false); }
  };

  const reportStatusOf = (a: TachsAdminAttempt): TachsReportStatus => (a.report_status ?? "draft") as TachsReportStatus;
  const canSend = (a: TachsAdminAttempt) => a.status === "completed" && !a.test_mode && (reportStatusOf(a) === "approved" || reportStatusOf(a) === "sent");
  const canEditParent = !!detail && detail.attempt.status === "completed" && (reportStatusOf(detail.attempt) === "draft" || reportStatusOf(detail.attempt) === "reviewed");

  /** Save consultant-controlled parent content (server-validated; no item-level data can be entered). */
  const saveParentContent = async () => {
    if (!detail || !parentForm) return;
    setBusy("parent-content");
    try {
      const { approved_for_parent_at: _ignored, ...content } = parentForm;
      const clean = (xs: string[]) => xs.map((s) => s.trim()).filter(Boolean);
      const hp = content.home_support_plan;
      await tachsApi.adminSaveParentReport(detail.attempt.id, {
        ...content, customized_next_steps: clean(content.customized_next_steps),
        home_support_plan: hp ? { ...hp, section_actions: hp.section_actions.map((s) => ({ ...s, actions: clean(s.actions) })), weekly_routine: clean(hp.weekly_routine), guidance: clean(hp.guidance) } : undefined,
      });
      toast.success("Parent report content saved. It is released only when you approve the report.");
      await openDetail(detail.attempt.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the parent content.");
    } finally { setBusy(null); }
  };

  /** Report workflow: draft -> reviewed -> approved -> sent. Every step is server-checked and audited. */
  const transition = async (a: TachsAdminAttempt, to: TachsReportStatus) => {
    setBusy(a.id);
    try {
      const res = await tachsApi.adminReportTransition(a.id, to, to === "sent" ? undefined : reportNotes);
      if (to === "sent") {
        if (res.report?.email_status === "sent") toast.success("Reviewed parent report emailed to the parent or guardian.");
        else toast.error(res.report?.email_error ?? "The email could not be sent. The result and approval are still saved.");
      } else if (to === "approved") {
        toast.success("Approved. No email has been sent. Review the parent preview, then choose Send Parent Report.", { duration: 8000 });
      } else {
        toast.success(`Report marked ${to}.`);
      }
      setSendConfirm(false); setApprovalConfirm(false);
      if (to === "approved") setDetailTab("parent");
      await load();
      if (detail?.attempt.id === a.id) await openDetail(a.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the report.");
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

  const searchUsers = async (q: string) => {
    setGrantQuery(q); setGrantUser(null);
    if (q.trim().length < 2) { setGrantResults([]); return; }
    try { const { users } = await tachsApi.adminSearchUsers(q); setGrantResults(users); } catch { setGrantResults([]); }
  };

  const confirmGrant = async () => {
    if (!grantUser) return;
    setBusy("grant");
    try {
      await tachsApi.adminGrantAccess(grantUser.id, grantReason);
      toast.success(`TACHS access granted to ${grantUser.full_name ?? "the student"}. This is recorded.`);
      setGrantOpen(false); setGrantUser(null); setGrantQuery(""); setGrantResults([]); setGrantReason(""); setGrantConfirm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not grant access.");
    } finally { setBusy(null); }
  };

  const paymentLabel = (a: TachsAdminAttempt) => {
    if (a.test_mode) return { text: "Test mode", tone: "bg-muted text-muted-foreground" };
    const o = a.order;
    if (a.access_source === "admin_grant" || o?.payment_status === "granted") return { text: "Admin grant", tone: "bg-sky-100 text-sky-800" };
    if (a.access_source === "legacy") return { text: "Legacy", tone: "bg-amber-100 text-amber-900" };
    if (o?.payment_status === "completed") return { text: `Paid ${dollars(o.amount_paid_cents ?? o.total_cents)}`, tone: "bg-green-100 text-green-800" };
    return { text: "Unpaid", tone: "bg-red-100 text-red-800" };
  };

  const reportBadge = (a: TachsAdminAttempt) => {
    const v = reportStatusOf(a);
    const tone = v === "sent" ? "bg-green-100 text-green-800" : v === "approved" ? "bg-sky-100 text-sky-800" : v === "reviewed" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground";
    const legacy = v === "draft" && a.email_status === "sent";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tone}`} title={legacy ? "An earlier automatic email exists in the log; the report itself has not been reviewed." : undefined}>{v}{legacy ? " · auto-email on record" : ""}</span>;
  };

  const emailBadge = (s: string | null) => {
    const v = s ?? "pending";
    const tone = v === "sent" ? "bg-green-100 text-green-800" : v === "failed" ? "bg-red-100 text-red-800" : v === "skipped" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{v}</span>;
  };

  const printSurface = (surface: "parent" | "internal") => {
    const bodyClass = surface === "parent" ? "printing-tachs-parent" : "printing-tachs-internal";
    document.body.classList.add(bodyClass);
    const cleanup = () => document.body.classList.remove(bodyClass);
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="TACHS Pilot Attempts | Admin" description="Review D.E.Bs TACHS Readiness Diagnostic pilot attempts, section metrics, and report delivery." path="/admin/tachs" noIndex />
      <div className="container mx-auto max-w-7xl px-4 py-8 print:py-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2 -ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Button>
            <h1 className="text-2xl font-bold">TACHS Readiness Diagnostic</h1>
            <p className="text-sm text-muted-foreground">All pilot attempts, section metrics, answer audit, and report delivery.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/tachs/content-audit")}><ClipboardList className="mr-1 h-4 w-4" /> Content audit</Button>
            <Button size="sm" variant="outline" onClick={() => setGrantOpen(true)}><KeyRound className="mr-1 h-4 w-4" /> Grant TACHS access</Button>
            <Badge className="bg-secondary text-secondary-foreground">Pilot</Badge>
          </div>
        </div>

        <Card className="mb-6 print:hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base">TACHS orders ({orders.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {orders.length === 0 ? <p className="text-sm text-muted-foreground">No TACHS orders yet.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Student</TableHead><TableHead>Status</TableHead><TableHead>Base</TableHead><TableHead>Fee</TableHead><TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead><TableHead>Source</TableHead><TableHead>Session</TableHead><TableHead>Payment time</TableHead><TableHead>Attempt</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {orders.slice(0, 50).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="whitespace-nowrap"><div className="font-medium">{o.profiles?.full_name ?? "Student"}</div><div className="text-xs text-muted-foreground">{o.profiles?.parent_email ?? ""}</div></TableCell>
                      <TableCell>{o.payment_status}</TableCell>
                      <TableCell>{dollars(o.net_amount_cents)}</TableCell>
                      <TableCell>{dollars(o.fee_cents)}</TableCell>
                      <TableCell>{dollars(o.total_cents)}</TableCell>
                      <TableCell>{o.amount_paid_cents != null ? dollars(o.amount_paid_cents) : "—"}</TableCell>
                      <TableCell className="text-xs">{o.source}{o.grant_reason ? ` · ${o.grant_reason}` : ""}</TableCell>
                      <TableCell className="max-w-[10rem] truncate text-xs" title={o.stripe_checkout_session_id ?? ""}>{o.stripe_checkout_session_id ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{o.verified_at ? new Date(o.verified_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>{o.attempt_id ? <Button size="sm" variant="link" className="h-auto p-0" onClick={() => openDetail(o.attempt_id!)}>Open</Button> : "Unused"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {PINNED_ATTEMPTS.length > 0 && (
          <Card className="mb-6 border-primary/40 print:hidden">
            <CardHeader className="pb-2"><CardTitle className="text-base">Pinned attempts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PINNED_ATTEMPTS.map((p) => {
                const live = attempts.find((a) => a.id === p.id);
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.note}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{p.id}{live ? ` · ${live.status === "completed" ? "completed" : "in progress"} · v${live.blueprint_version}` : loading ? "" : " · not in the loaded list"}</div>
                    </div>
                    <Button size="sm" data-testid={`pinned-${p.id}`} onClick={() => openDetail(p.id)}>Open original attempt &amp; answer audit</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 print:hidden">
          <CardContent className="flex flex-wrap items-center gap-2 p-4" role="tablist" aria-label="Attempt type">
            {(Object.keys(MODE_LABEL) as AttemptMode[]).map((m) => (
              <Button key={m} role="tab" aria-selected={mode === m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                {MODE_LABEL[m]} ({counts[m]})
              </Button>
            ))}
            {filtersActive && <Button size="sm" variant="ghost" onClick={resetFilters}>Reset filters</Button>}
            {source === "direct" && !loading && !loadError && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900" title="The engine's admin list is unavailable on the current deployment; rows were read directly from the database under admin-only access.">Loaded directly from database (engine list unavailable)</span>
            )}
          </CardContent>
        </Card>

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
          <CardHeader className="print:hidden"><CardTitle className="text-lg">{loadError ? "Attempts unavailable" : `${filtered.length} of ${counts.all} attempt${counts.all === 1 ? "" : "s"}`}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading attempts…</div>
            ) : loadError ? (
              <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <p className="font-medium text-destructive">Could not load the TACHS attempts.</p>
                <p className="mt-1 text-muted-foreground break-words">{loadError}</p>
                <p className="mt-1 text-xs text-muted-foreground">No data was deleted — this is a loading error, not an empty list.</p>
                <Button size="sm" className="mt-3" onClick={load}><RotateCcw className="mr-1 h-4 w-4" /> Retry</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <p>{counts.all === 0 ? "No TACHS attempts recorded yet." : `No attempts match these filters (${counts.all} total).`}</p>
                {filtersActive && <Button size="sm" variant="outline" className="mt-3" onClick={resetFilters}>Reset filters</Button>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead><TableHead>Grade</TableHead><TableHead>Status</TableHead>
                    <TableHead>Band</TableHead><TableHead>Accuracy</TableHead><TableHead>Blueprint</TableHead>
                    <TableHead>Started</TableHead><TableHead>Payment</TableHead><TableHead>Report</TableHead><TableHead>Email</TableHead>
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
                      <TableCell>{(() => { const p = paymentLabel(a); return <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${p.tone}`}>{p.text}</span>; })()}</TableCell>
                      <TableCell>{reportBadge(a)}</TableCell>
                      <TableCell>{emailBadge(a.email_status)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDetail(a.id)}>{a.status === "completed" && reportStatusOf(a) === "draft" ? "Review" : "Details"}</Button>
                          <Button size="sm" variant="outline" disabled={!canSend(a) || busy === a.id} title={canSend(a) ? "Send the approved parent report" : "Review and approve the report first"} onClick={() => openDetail(a.id)}>
                            {busy === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            <span className="ml-1 hidden lg:inline">Send</span>
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
      <Dialog open={!!detail || detailLoading} onOpenChange={(o) => { if (!o) { setDetail(null); navigate("/admin/tachs", { replace: true }); } }}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          {detailLoading || !detail ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{detail.attempt.profiles?.full_name ?? "Student"} — TACHS report workspace</DialogTitle>
                <DialogDescription>Choose the family-safe report or the separate administrator-only diagnostic audit.</DialogDescription>
              </DialogHeader>

              <style>{`@media print {
                body.printing-tachs-parent * { visibility: hidden !important; }
                body.printing-tachs-parent [data-print-surface="parent"],
                body.printing-tachs-parent [data-print-surface="parent"] * { visibility: visible !important; }
                body.printing-tachs-parent [data-print-surface="parent"] { position: absolute; inset: 0; width: 100%; padding: 24px; background: white; }
                body.printing-tachs-internal * { visibility: hidden !important; }
                body.printing-tachs-internal [data-print-surface="internal"],
                body.printing-tachs-internal [data-print-surface="internal"] * { visibility: visible !important; }
                body.printing-tachs-internal [data-print-surface="internal"] { position: absolute; inset: 0; width: 100%; padding: 24px; background: white; }
                .admin-no-print { display: none !important; }
              }`}</style>

              <Tabs value={detailTab} onValueChange={(value) => { setDetailTab(value as "parent" | "internal"); setSendConfirm(false); setApprovalConfirm(false); }}>
                <TabsList className="mb-4 grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-2 print:hidden" aria-label="TACHS attempt detail views">
                  <TabsTrigger value="parent" className="min-h-11 whitespace-normal" data-testid="parent-report-tab">Parent Report — Edit &amp; Preview</TabsTrigger>
                  <TabsTrigger value="internal" className="min-h-11 whitespace-normal" data-testid="internal-audit-tab">Internal Diagnostic Audit — Never Sent</TabsTrigger>
                </TabsList>

                <TabsContent value="parent" data-testid="parent-report-panel" className="space-y-5">
                  <div className="rounded-md border-2 border-primary bg-primary/5 p-4 text-sm font-semibold print:hidden" role="note">
                    This tab shows exactly what Kecha will receive. Nothing in the Internal Diagnostic Audit tab is included.
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto] print:hidden">
                    <section className="rounded-md border p-3" data-testid="delivery-status">
                      <h3 className="font-semibold">Delivery status</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <span>Report: <strong>{REPORT_STATUS_LABEL[reportStatusOf(detail.attempt)]}</strong></span>
                        <span>Email sent: <strong>{detail.attempt.report_sent_at ? "Yes" : "No"}</strong></span>
                      </div>
                    </section>
                    <div className="flex flex-wrap content-start gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/tachs/results/${detail.attempt.id}`, "_blank", "noopener,noreferrer")}>
                        Preview Parent Report
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => printSurface("parent")}><Printer className="mr-1 h-4 w-4" /> Print Parent Report</Button>
                    </div>
                  </div>

                  {detail.attempt.status === "completed" && parentForm && (
                    <section className="rounded-md border p-3 print:hidden" data-testid="parent-content-editor">
                      <h3 className="mb-1 font-semibold">Parent report content</h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {detail.parent_report_content ? "Saved content." : "Generated defaults — nothing has been saved or released."} Editable while the report is in draft or reviewed.
                      </p>
                      <div className="grid gap-3">
                        <label className="text-sm font-medium">Interpretation
                          <Textarea className="mt-1 min-h-[120px]" value={parentForm.interpretation} disabled={!canEditParent} onChange={(e) => setParentForm({ ...parentForm, interpretation: e.target.value })} />
                        </label>
                        <div className="text-sm font-medium">Priority sections
                          <div className="mt-1 flex flex-wrap gap-2">
                            {(Object.keys(SECTION_NAMES) as (keyof typeof SECTION_NAMES)[]).map((k) => {
                              const on = parentForm.priority_sections.includes(k);
                              return <Button key={k} type="button" size="sm" variant={on ? "default" : "outline"} disabled={!canEditParent} aria-pressed={on}
                                onClick={() => setParentForm({ ...parentForm, priority_sections: on ? parentForm.priority_sections.filter((x) => x !== k) : [...parentForm.priority_sections, k] })}>{SECTION_NAMES[k]}</Button>;
                            })}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium">Recommended program
                            <Select value={parentForm.recommended_program_key} disabled={!canEditParent} onValueChange={(v) => setParentForm({ ...parentForm, recommended_program_key: v as TachsProgramKey })}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{PROGRAM_KEYS.map((k) => <SelectItem key={k} value={k}>{TACHS_PROGRAMS[k].name} — {usd(TACHS_PROGRAMS[k].total_cents)} ({TACHS_TIERS[TACHS_PROGRAMS[k].tier].badge})</SelectItem>)}</SelectContent>
                            </Select>
                          </label>
                          <label className="text-sm font-medium">Price override (USD, optional)
                            <Input className="mt-1" type="number" min={0} step="1" placeholder={String(TACHS_PROGRAMS[parentForm.recommended_program_key].total_cents / 100)} disabled={!canEditParent}
                              value={parentForm.price_override_cents == null ? "" : String(parentForm.price_override_cents / 100)}
                              onChange={(e) => setParentForm({ ...parentForm, price_override_cents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) })} />
                          </label>
                        </div>
                        <label className="text-sm font-medium">Diagnostic Enrollment Credit expires (defaults to 7 days after release)
                          <Input className="mt-1" type="date" disabled={!canEditParent}
                            value={parentForm.credit_expires_at ? parentForm.credit_expires_at.slice(0, 10) : ""}
                            onChange={(e) => setParentForm({ ...parentForm, credit_expires_at: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null })} />
                        </label>
                        <label className="text-sm font-medium">Next-step plan (one step per line)
                          <Textarea className="mt-1 min-h-[120px]" value={parentForm.customized_next_steps.join("\n")} disabled={!canEditParent}
                            onChange={(e) => setParentForm({ ...parentForm, customized_next_steps: e.target.value.split("\n") })} />
                        </label>
                        {parentForm.home_support_plan && (() => { const hp = parentForm.home_support_plan; const setHp = (patch: Partial<typeof hp>) => setParentForm({ ...parentForm, home_support_plan: { ...hp, ...patch } }); return (
                          <fieldset className="rounded-md border p-3 space-y-3" data-testid="home-plan-editor">
                            <legend className="px-1 text-sm font-semibold">At-Home Support Plan (section-level only)</legend>
                            <label className="block text-sm font-medium">Weekly cadence<Textarea className="mt-1 min-h-[60px]" value={hp.cadence} disabled={!canEditParent} onChange={(e) => setHp({ cadence: e.target.value })} /></label>
                            {hp.section_actions.map((s, i) => (
                              <label key={s.section_key} className="block text-sm font-medium">{SECTION_NAMES[s.section_key]} — parent-friendly actions (one per line, up to 4)
                                <Textarea className="mt-1 min-h-[90px]" value={s.actions.join("\n")} disabled={!canEditParent}
                                  onChange={(e) => setHp({ section_actions: hp.section_actions.map((x, j) => j === i ? { ...x, actions: e.target.value.split("\n") } : x) })} />
                              </label>
                            ))}
                            <label className="block text-sm font-medium">Simple weekly routine (one line per item)<Textarea className="mt-1 min-h-[90px]" value={hp.weekly_routine.join("\n")} disabled={!canEditParent} onChange={(e) => setHp({ weekly_routine: e.target.value.split("\n") })} /></label>
                            <label className="block text-sm font-medium">Family guidance (one line per item)<Textarea className="mt-1 min-h-[90px]" value={hp.guidance.join("\n")} disabled={!canEditParent} onChange={(e) => setHp({ guidance: e.target.value.split("\n") })} /></label>
                            <label className="block text-sm font-medium">Progress-check reminder<Textarea className="mt-1 min-h-[60px]" value={hp.progress_check} disabled={!canEditParent} onChange={(e) => setHp({ progress_check: e.target.value })} /></label>
                            <label className="block text-sm font-medium">Strengths note (optional)<Input className="mt-1" value={hp.strengths_note ?? ""} disabled={!canEditParent} onChange={(e) => setHp({ strengths_note: e.target.value || null })} /></label>
                            <Button size="sm" variant="outline" disabled={!canEditParent} onClick={() => setParentForm({ ...parentForm, home_support_plan: defaultHomeSupportPlan(parentForm.recommended_program_key, parentForm.priority_sections, sectionScores(detail.attempt.results as unknown as Record<string, unknown>)) as TachsHomeSupportPlan })}>Regenerate home plan from priorities</Button>
                          </fieldset>); })()}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" disabled={!canEditParent || busy === "parent-content"} onClick={saveParentContent}>{busy === "parent-content" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}Save parent content</Button>
                          {detail.parent_report_defaults && <Button size="sm" variant="outline" disabled={!canEditParent} onClick={() => setParentForm({ ...detail.parent_report_defaults! })}>Reset to generated defaults</Button>}
                          {!canEditParent && <span className="self-center text-xs text-muted-foreground">Return the report to draft to edit.</span>}
                        </div>
                      </div>
                    </section>
                  )}

                  {detail.parent_preview && (
                    <section data-testid="parent-preview" data-print-surface="parent" className="rounded-md border p-4 text-sm space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">D.E.Bs Diagnostic Hub</p>
                        <h2 className="text-xl font-bold">{detail.parent_preview.title}</h2>
                        <p className="text-muted-foreground">{detail.attempt.profiles?.full_name ?? "Student"}{detail.attempt.grade_level ? ` · Grade ${detail.attempt.grade_level}` : ""}{detail.parent_preview.assessment_date ? ` · ${new Date(detail.parent_preview.assessment_date).toLocaleDateString()}` : ""}</p>
                      </div>
                      <section aria-labelledby="admin-parent-summary"><h3 id="admin-parent-summary" className="font-semibold">1. Student Summary</h3><p className="mt-1">Overall <strong>{detail.parent_preview.overall.accuracy}%</strong> · {detail.parent_preview.overall.tier_badge} · {detail.parent_preview.overall.tier_label}</p></section>
                      <section aria-labelledby="admin-parent-sections"><h3 id="admin-parent-sections" className="mb-2 font-semibold">2. Section Results</h3>
                        <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Score</TableHead><TableHead>D.E.Bs Tier</TableHead></TableRow></TableHeader><TableBody>
                          {detail.parent_preview.sections.map((s) => <TableRow key={s.section_key}><TableCell>{s.label}</TableCell><TableCell>{s.accuracy}%</TableCell><TableCell>{s.tier_badge} · {s.tier_label}</TableCell></TableRow>)}
                        </TableBody></Table></div>
                      </section>
                      <section aria-labelledby="admin-parent-interpretation"><h3 id="admin-parent-interpretation" className="font-semibold">3. D.E.Bs Consultant Interpretation</h3><p className="mt-1 leading-relaxed">{detail.parent_preview.interpretation}</p></section>
                      <section aria-labelledby="admin-parent-plan"><h3 id="admin-parent-plan" className="font-semibold">4. Recommended Next-Step Plan</h3><ol className="mt-1 list-decimal space-y-1 pl-5">{detail.parent_preview.plan.map((step, i) => <li key={i}>{step}</li>)}</ol><p className="mt-2 text-muted-foreground">{detail.parent_preview.placement_note}</p></section>
                      {detail.parent_preview.home_support && (
                        <section aria-labelledby="admin-parent-home" data-testid="admin-home-plan-preview" data-print-surface="home-plan">
                          <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="admin-parent-home" className="font-semibold">5. {detail.parent_preview.home_support.title}</h3><Button size="sm" variant="outline" className="print:hidden" onClick={() => printSurface("home-plan")}><Printer className="mr-1 h-4 w-4" /> Print / Save At-Home Plan</Button></div>
                          <div className="mt-2"><TachsHomeSupportPlan plan={detail.parent_preview.home_support} /></div>
                        </section>
                      )}
                      {(() => { const pg = detail.parent_preview.program; const pr = pg.pricing ?? pricingBreakdown({ regular_tuition_cents: pg.total_cents, installment_count: TACHS_PROGRAMS[pg.key]?.installments.count ?? 3, credit_applied: true, credit_expires_at: null }); return (
                        <section aria-labelledby="admin-parent-program" data-testid="admin-pricing-preview"><h3 id="admin-parent-program" className="font-semibold">6. Recommended Program &amp; Pricing</h3>
                          <p className="mt-1"><strong>{pg.name}</strong> · {pg.duration_weeks} weeks · {pg.sessions_per_week} sessions per week</p>
                          <div className="mt-2 overflow-x-auto rounded-md border"><Table><TableBody>
                            <TableRow><TableCell>Regular tuition</TableCell><TableCell className="text-right">{usd2(pr.regular_tuition_cents)}</TableCell></TableRow>
                            <TableRow><TableCell>Diagnostic Enrollment Credit{pr.credit_expires_at ? ` (enroll by ${new Date(pr.credit_expires_at).toLocaleDateString()})` : ""}</TableCell><TableCell className="text-right">− {usd2(pr.credit_cents)}</TableCell></TableRow>
                            <TableRow><TableCell>Tuition balance</TableCell><TableCell className="text-right">{usd2(pr.balance_cents)}</TableCell></TableRow>
                            <TableRow><TableCell>Stripe processing fee</TableCell><TableCell className="text-right">{usd2(pr.fee_full_cents)}</TableCell></TableRow>
                            <TableRow><TableCell>Total checkout charge</TableCell><TableCell className="text-right">{usd2(pr.total_full_cents)}</TableCell></TableRow>
                          </TableBody></Table></div>
                          <p className="mt-2">Payment choices: pay in full {usd2(pr.total_full_cents)}, or {pr.installments.count} payments of {usd2(pr.installments.charge_each_cents)} (total {usd2(pr.installments.total_charged_cents)}).</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2"><div><strong>Focus</strong><ul className="list-disc pl-5">{pg.focus.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>What is included</strong><ul className="list-disc pl-5">{pg.included.map((item, i) => <li key={i}>{item}</li>)}</ul></div></div>
                        </section>); })()}
                      <section aria-labelledby="admin-parent-disclaimer"><h3 id="admin-parent-disclaimer" className="font-semibold">7. Please note</h3><p className="mt-1 text-xs text-muted-foreground">{detail.parent_preview.disclaimer}</p></section>
                    </section>
                  )}

                  {detail.attempt.status === "completed" && (
                    <section className="rounded-md border border-primary/40 p-3 print:hidden" data-testid="parent-delivery-controls">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Approval and delivery</h3>
                      <div className="flex flex-wrap gap-2">
                        {reportStatusOf(detail.attempt) === "draft" && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "reviewed")}>Mark reviewed</Button>}
                        {reportStatusOf(detail.attempt) === "reviewed" && !approvalConfirm && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => setApprovalConfirm(true)}>Approve Parent Report</Button>}
                        {reportStatusOf(detail.attempt) === "reviewed" && approvalConfirm && <div className="w-full rounded-md border bg-muted/30 p-3 text-sm"><p><strong>Approve this exact parent report?</strong> Approval releases the parent page but does not send an email.</p><div className="mt-2 flex gap-2"><Button size="sm" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "approved")}>Confirm approval — do not send</Button><Button size="sm" variant="outline" onClick={() => setApprovalConfirm(false)}>Cancel</Button></div></div>}
                        {canSend(detail.attempt) && !sendConfirm && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => setSendConfirm(true)}><Mail className="mr-1 h-4 w-4" /> {reportStatusOf(detail.attempt) === "sent" ? "Re-send Parent Report" : "Send Parent Report"}</Button>}
                        {canSend(detail.attempt) && sendConfirm && (
                          <div className="w-full rounded-md border border-primary/40 bg-primary/5 p-3 text-sm" data-testid="send-parent-confirmation">
                            <p><strong>Send Parent Report to Kecha’s saved email: {detail.attempt.parent_email ?? "No saved email"}?</strong></p>
                            <p className="mt-1 text-muted-foreground">The email contains only: overall score and tier; six section scores and tiers; consultant interpretation; next-step plan; At-Home Support Plan; approved program and pricing; disclaimer.</p>
                            <div className="mt-2 flex gap-2"><Button size="sm" disabled={busy === detail.attempt.id || !detail.attempt.parent_email} onClick={() => transition(detail.attempt, "sent")}>{busy === detail.attempt.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}Confirm Send Parent Report</Button><Button size="sm" variant="outline" onClick={() => setSendConfirm(false)}>Cancel</Button></div>
                          </div>
                        )}
                        {reportStatusOf(detail.attempt) !== "draft" && <Button size="sm" variant="ghost" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "draft")}>Return to draft</Button>}
                      </div>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="internal" data-testid="internal-audit-panel" className="space-y-5">
                  <div className="rounded-md border-2 border-destructive bg-destructive/5 p-4 text-sm font-bold print:hidden" role="note">
                    ADMIN ONLY — this information is never included in the parent page, printable parent report, or parent email.
                  </div>
                  <div className="flex justify-end print:hidden"><Button size="sm" variant="outline" onClick={() => printSurface("internal")}><Printer className="mr-1 h-4 w-4" /> Print Internal Audit — not for families</Button></div>
                  <div data-print-surface="internal" className="space-y-5">
                    <div><h2 className="text-xl font-bold">Internal Diagnostic Audit — Never Sent</h2><p className="text-sm text-muted-foreground">{detail.attempt.profiles?.full_name ?? "Student"} · Blueprint v{detail.attempt.blueprint_version} · started {new Date(detail.attempt.started_at).toLocaleString()}{detail.attempt.completed_at ? ` · completed ${new Date(detail.attempt.completed_at).toLocaleString()}` : ""}</p></div>
                    {detail.attempt.status === "completed" && (
                      <section className="rounded-md border-2 border-primary bg-primary/5 p-4 print:hidden" data-testid="curriculum-action">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div><h3 className="font-semibold">Personalized TACHS Curriculum (consultant only)</h3><p className="text-sm text-muted-foreground">Builds the {TACHS_PROGRAMS[parentForm?.recommended_program_key ?? "tachs_skill_builder"].duration_weeks}-week, 2-sessions/week plan from internal section and skill metrics. Admin-only — no parent link is ever created.</p></div>
                          <Button onClick={() => navigate(`/admin/tachs/${detail.attempt.id}/curriculum`)}><BookOpen className="mr-1 h-4 w-4" /> Generate Personalized TACHS Curriculum</Button>
                        </div>
                      </section>
                    )}
                    {detail.source === "direct" && <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">Read directly from the stored attempt snapshot (engine detail unavailable on this deployment). Report actions require the current engine.</p>}
                    {detail.carryover?.flagged && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="note"><strong>Bank note:</strong> {detail.carryover.note}</p>}
                    <section><h3 className="mb-2 font-semibold">Historical payment details</h3>{detail.attempt.order ? <div className="grid gap-1 rounded-md border p-3 text-sm sm:grid-cols-2"><div>Status: <strong>{detail.attempt.order.payment_status}</strong> ({detail.attempt.order.source})</div><div>Base: {dollars(detail.attempt.order.net_amount_cents)} · Fee: {dollars(detail.attempt.order.fee_cents)} · Total: {dollars(detail.attempt.order.total_cents)}</div><div>Paid: {detail.attempt.order.amount_paid_cents != null ? dollars(detail.attempt.order.amount_paid_cents) : "—"} {detail.attempt.order.currency.toUpperCase()}</div><div>Payment time: {detail.attempt.order.verified_at ? new Date(detail.attempt.order.verified_at).toLocaleString() : "—"}</div><div className="sm:col-span-2 break-all text-xs text-muted-foreground">Stripe Session: {detail.attempt.order.stripe_checkout_session_id ?? "—"} · Stripe Payment Intent: {detail.attempt.order.stripe_payment_intent_id ?? "—"}</div>{detail.attempt.order.grant_reason && <div className="sm:col-span-2 text-xs">Grant reason: {detail.attempt.order.grant_reason}</div>}</div> : <p className="text-sm text-muted-foreground">No order linked — access source: {detail.attempt.access_source ?? "unknown"}{detail.attempt.test_mode ? " (admin TEST MODE)" : ""}.</p>}</section>
                    <section><h3 className="mb-2 font-semibold">Section timing, status and difficulty paths</h3><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Status</TableHead><TableHead>Items</TableHead><TableHead>Time used</TableHead><TableHead>Submit reason</TableHead><TableHead>Difficulty path</TableHead></TableRow></TableHeader><TableBody>{detail.sections.map((s) => <TableRow key={s.id}><TableCell>{SECTION_NAMES[s.section_key]}</TableCell><TableCell>{s.status.replace(/_/g, " ")}</TableCell><TableCell>{s.item_count}</TableCell><TableCell>{s.time_used_seconds != null ? formatClock(s.time_used_seconds) : "—"}</TableCell><TableCell>{s.submit_reason ?? "—"}</TableCell><TableCell className="text-xs">{(s.difficulty_path ?? []).map((path) => path.difficulty).join(" → ") || "—"}</TableCell></TableRow>)}</TableBody></Table></div></section>
                    {detail.attempt.results && <section><h3 className="mb-2 font-semibold">Skill metrics</h3><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{detail.attempt.results.skills.map((skill) => <div key={`${skill.section_key}-${skill.skill}`} className="rounded-md border p-2 text-sm"><div className="font-medium">{skillLabel(skill.skill)}</div><div className="text-xs text-muted-foreground">{SECTION_NAMES[skill.section_key]} · {skill.correct}/{skill.presented} · {skill.accuracy}%</div></div>)}</div></section>}
                    <section><h3 className="mb-2 font-semibold">Answer audit, keys and rationales ({detail.audit.length} items)</h3><div className="max-h-80 overflow-y-auto rounded-md border print:max-h-none print:overflow-visible"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Item</TableHead><TableHead>Skill</TableHead><TableHead>Diff</TableHead><TableHead>Chosen</TableHead><TableHead>Key</TableHead><TableHead>Result</TableHead><TableHead>Rationale</TableHead><TableHead>Time</TableHead><TableHead>Flag</TableHead></TableRow></TableHeader><TableBody>{detail.audit.map((row, i) => <TableRow key={`${row.section_key}-${row.position}-${i}`}><TableCell>{row.position}</TableCell><TableCell>{SECTION_NAMES[row.section_key]}</TableCell><TableCell className="max-w-[18rem] truncate text-xs">{row.code} — {row.stem}</TableCell><TableCell className="text-xs">{skillLabel(row.skill)}</TableCell><TableCell>{row.difficulty}</TableCell><TableCell>{row.selected_key ?? "—"}</TableCell><TableCell>{row.correct_key ?? "—"}</TableCell><TableCell>{row.is_correct == null ? "—" : row.is_correct ? "Correct" : "Incorrect"}</TableCell><TableCell className="max-w-[16rem] text-xs text-muted-foreground">{row.rationale ?? "—"}</TableCell><TableCell>{formatClock(row.time_spent_seconds ?? 0)}</TableCell><TableCell>{row.is_flagged ? "Yes" : ""}</TableCell></TableRow>)}</TableBody></Table></div></section>
                    <section><h3 className="mb-2 font-semibold">Internal notes and workflow history</h3><p className="mb-2 text-xs text-muted-foreground">Status: <strong>{REPORT_STATUS_LABEL[reportStatusOf(detail.attempt)]}</strong>{detail.attempt.report_reviewed_at ? ` · reviewed ${new Date(detail.attempt.report_reviewed_at).toLocaleString()}` : ""}{detail.attempt.report_approved_at ? ` · approved ${new Date(detail.attempt.report_approved_at).toLocaleString()}` : ""}{detail.attempt.report_sent_at ? ` · sent ${new Date(detail.attempt.report_sent_at).toLocaleString()}` : ""} · acknowledgment email: {detail.attempt.ack_email_status ?? "pending"}</p><Textarea placeholder="Consultant review notes (internal only — never shown to families)" value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} /></section>
                    <section><h3 className="mb-2 font-semibold">Activity and email log</h3>{detail.events.length === 0 ? <p className="text-sm text-muted-foreground">No recorded events yet.</p> : <ul className="space-y-1 text-sm">{detail.events.map((event) => <li key={event.id} className="rounded border p-2"><span className="font-medium">{event.event_type.replace(/_/g, " ")}</span><span className="text-muted-foreground"> · {new Date(event.created_at).toLocaleString()}</span>{event.detail && Object.keys(event.detail).length > 0 && <div className="mt-1 break-all text-xs text-muted-foreground">{JSON.stringify(event.detail)}</div>}</li>)}</ul>}</section>
                    <section className="border-t pt-4 print:hidden"><h3 className="font-semibold">Administrative attempt controls</h3><p className="mb-2 text-xs text-muted-foreground">Reopening changes the student attempt and is never part of the parent report.</p><Button size="sm" variant="destructive" onClick={() => { setReopenTarget(detail.attempt); setReopenSection(""); }}><RotateCcw className="mr-1 h-4 w-4" /> Reopen section</Button></section>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Grant access */}
      <Dialog open={grantOpen} onOpenChange={(o) => { if (!o) { setGrantOpen(false); setGrantConfirm(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant TACHS access</DialogTitle>
            <DialogDescription>
              For consultation scholarships or manually invoiced families. This unlocks one TACHS diagnostic without a Stripe payment and is recorded with your name and reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search student by name, username, or parent email" value={grantQuery} onChange={(e) => searchUsers(e.target.value)} />
            {grantResults.length > 0 && !grantUser && (
              <ul className="max-h-40 overflow-y-auto rounded-md border text-sm">
                {grantResults.map((u) => (
                  <li key={u.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-accent" onClick={() => { setGrantUser(u); setGrantResults([]); }}>
                    <span className="font-medium">{u.full_name ?? "Student"}</span> <span className="text-muted-foreground">{u.username ? `@${u.username} · ` : ""}{u.parent_email ?? ""}</span>
                  </button></li>
                ))}
              </ul>
            )}
            {grantUser && <p className="text-sm">Selected: <strong>{grantUser.full_name ?? "Student"}</strong> {grantUser.parent_email ? `(${grantUser.parent_email})` : ""}</p>}
            <Textarea placeholder="Reason (e.g. scholarship, manual invoice #1234)" value={grantReason} onChange={(e) => setGrantReason(e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grantConfirm} onChange={(e) => setGrantConfirm(e.target.checked)} /> I confirm this student should receive TACHS access without payment.</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button disabled={!grantUser || grantReason.trim().length < 3 || !grantConfirm || busy === "grant"} onClick={confirmGrant}>
              {busy === "grant" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1 h-4 w-4" />} Grant access
            </Button>
          </DialogFooter>
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
