import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  tachsApi, SECTION_NAMES, skillLabel, formatClock, dollars, REPORT_STATUS_LABEL, PACING_LABEL,
  type TachsAdminAttempt, type TachsAdminSection, type TachsAuditRow, type TachsAttemptEvent, type TachsOrder, type TachsReportStatus, type TachsCarryover, type TachsParentReport,
} from "@/lib/tachs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Loader2, Mail, Printer, RotateCcw, Search, KeyRound, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

const BAND_KEYS = ["strong", "approaching", "developing", "foundations"] as const;

export default function AdminTachs() {
  const navigate = useNavigate();
  const { attemptId: routeAttemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TachsAdminAttempt[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [band, setBand] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [version, setVersion] = useState("all");
  const [detail, setDetail] = useState<{
    attempt: TachsAdminAttempt; sections: TachsAdminSection[]; audit: TachsAuditRow[]; events: TachsAttemptEvent[]; carryover?: TachsCarryover; parent_preview?: TachsParentReport | null;
  } | null>(null);
  const [reportNotes, setReportNotes] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
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
    setLoading(true);
    try {
      const { attempts, orders } = await tachsApi.adminList();
      setAttempts(attempts ?? []);
      setOrders(orders ?? []);
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
    if (routeAttemptId !== id) navigate(`/admin/tachs/${id}`, { replace: true });
    try {
      const d = await tachsApi.adminDetail(id);
      setDetail(d); setReportNotes(d.attempt.report_notes ?? ""); setSendConfirm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the attempt details.");
    } finally { setDetailLoading(false); }
  };

  const reportStatusOf = (a: TachsAdminAttempt): TachsReportStatus => (a.report_status ?? "draft") as TachsReportStatus;
  const canSend = (a: TachsAdminAttempt) => a.status === "completed" && !a.test_mode && (reportStatusOf(a) === "approved" || reportStatusOf(a) === "sent");

  /** Report workflow: draft -> reviewed -> approved -> sent. Every step is server-checked and audited. */
  const transition = async (a: TachsAdminAttempt, to: TachsReportStatus) => {
    setBusy(a.id);
    try {
      const res = await tachsApi.adminReportTransition(a.id, to, to === "sent" ? undefined : reportNotes);
      if (to === "sent") {
        if (res.report?.email_status === "sent") toast.success("Reviewed parent report emailed to the parent or guardian.");
        else toast.error(res.report?.email_error ?? "The email could not be sent. The result and approval are still saved.");
      } else {
        toast.success(`Report marked ${to}.`);
      }
      setSendConfirm(false);
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
                <DialogTitle>{detail.attempt.profiles?.full_name ?? "Student"} — TACHS attempt</DialogTitle>
                <DialogDescription>
                  Blueprint v{detail.attempt.blueprint_version} · started {new Date(detail.attempt.started_at).toLocaleString()}
                  {detail.attempt.completed_at ? ` · completed ${new Date(detail.attempt.completed_at).toLocaleString()}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="mb-3 flex flex-wrap gap-2 print:hidden">
                <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print internal report</Button>
                {detail.attempt.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/tachs/results/${detail.attempt.id}`)}>Preview parent report</Button>
                )}
              </div>

              {detail.carryover?.flagged && (
                <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="note">
                  <strong>Bank note:</strong> {detail.carryover.note}
                </p>
              )}

              {detail.attempt.status === "completed" && (
                <section className="mb-5 rounded-md border border-primary/40 p-3">
                  <h3 className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Parent report approval</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Status: <strong>{REPORT_STATUS_LABEL[reportStatusOf(detail.attempt)]}</strong>
                    {detail.attempt.report_reviewed_at ? ` · reviewed ${new Date(detail.attempt.report_reviewed_at).toLocaleString()}` : ""}
                    {detail.attempt.report_approved_at ? ` · approved ${new Date(detail.attempt.report_approved_at).toLocaleString()}` : ""}
                    {detail.attempt.report_sent_at ? ` · sent ${new Date(detail.attempt.report_sent_at).toLocaleString()}` : ""}
                    {reportStatusOf(detail.attempt) === "draft" && detail.attempt.email_status === "sent" ? " · An earlier automatic email exists in the log below; it is preserved and the report still requires review." : ""}
                    {" "}Acknowledgment email: {detail.attempt.ack_email_status ?? "pending"}.
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">The parent receives only section-level raw accuracy, pacing, observations and a working band labelled as pending consultant review — never answers, keys, rationales or adaptive paths. Completion sends an acknowledgment only.</p>
                  <Textarea className="mb-2" placeholder="Consultant review notes (internal)" value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {reportStatusOf(detail.attempt) === "draft" && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "reviewed")}>Mark reviewed</Button>}
                    {reportStatusOf(detail.attempt) === "reviewed" && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "approved")}>Approve parent report</Button>}
                    {canSend(detail.attempt) && !sendConfirm && <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => setSendConfirm(true)}><Mail className="mr-1 h-4 w-4" /> {reportStatusOf(detail.attempt) === "sent" ? "Re-send parent report" : "Send parent report"}</Button>}
                    {canSend(detail.attempt) && sendConfirm && (
                      <>
                        <span className="self-center text-sm">Email the approved preliminary report to {detail.attempt.parent_email ?? "the parent on file"}?</span>
                        <Button size="sm" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "sent")}>{busy === detail.attempt.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}Confirm send</Button>
                        <Button size="sm" variant="outline" onClick={() => setSendConfirm(false)}>Cancel</Button>
                      </>
                    )}
                    {reportStatusOf(detail.attempt) !== "draft" && <Button size="sm" variant="ghost" disabled={busy === detail.attempt.id} onClick={() => transition(detail.attempt, "draft")}>Return to draft</Button>}
                  </div>
                </section>
              )}

              {detail.parent_preview && (
                <section className="mb-5">
                  <h3 className="mb-2 font-semibold">What the parent will see (section-level only)</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Correct</TableHead><TableHead>Accuracy</TableHead><TableHead>Time</TableHead><TableHead>Pacing</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {detail.parent_preview.sections.map((s) => (
                          <TableRow key={s.section_key}><TableCell>{s.label}</TableCell><TableCell>{s.correct} of {s.presented}</TableCell><TableCell>{s.accuracy}%</TableCell><TableCell>{formatClock(s.time_used_seconds)} of {formatClock(s.time_limit_seconds)}</TableCell><TableCell>{PACING_LABEL[s.pacing]}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm">{detail.parent_preview.observations.map((o, i) => <li key={i}>{o}</li>)}</ul>
                  {detail.parent_preview.working_band && <p className="mt-2 text-xs text-muted-foreground">Working band shown to parent: <strong>{detail.parent_preview.working_band.label}</strong> — labelled "{detail.parent_preview.working_band.interpretation}".</p>}
                </section>
              )}

              <section className="mb-5">
                <h3 className="mb-2 font-semibold">Payment</h3>
                {detail.attempt.order ? (
                  <div className="grid gap-1 rounded-md border p-3 text-sm sm:grid-cols-2">
                    <div>Status: <strong>{detail.attempt.order.payment_status}</strong> ({detail.attempt.order.source})</div>
                    <div>Base: {dollars(detail.attempt.order.net_amount_cents)} · Fee: {dollars(detail.attempt.order.fee_cents)} · Total: {dollars(detail.attempt.order.total_cents)}</div>
                    <div>Paid: {detail.attempt.order.amount_paid_cents != null ? dollars(detail.attempt.order.amount_paid_cents) : "—"} {detail.attempt.order.currency.toUpperCase()}</div>
                    <div>Payment time: {detail.attempt.order.verified_at ? new Date(detail.attempt.order.verified_at).toLocaleString() : "—"}</div>
                    <div className="sm:col-span-2 break-all text-xs text-muted-foreground">Session: {detail.attempt.order.stripe_checkout_session_id ?? "—"} · Intent: {detail.attempt.order.stripe_payment_intent_id ?? "—"}</div>
                    {detail.attempt.order.grant_reason && <div className="sm:col-span-2 text-xs">Grant reason: {detail.attempt.order.grant_reason}</div>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No order linked — access source: {detail.attempt.access_source ?? "unknown"}{detail.attempt.test_mode ? " (admin TEST MODE)" : ""}.</p>
                )}
              </section>

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
                <h3 className="mb-2 font-semibold">Answer audit ({detail.audit.length} items) — internal only</h3>
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>#</TableHead><TableHead>Section</TableHead><TableHead>Item</TableHead><TableHead>Skill</TableHead>
                      <TableHead>Diff</TableHead><TableHead>Chosen</TableHead><TableHead>Key</TableHead><TableHead>Result</TableHead>
                      <TableHead>Rationale</TableHead><TableHead>Time</TableHead><TableHead>Flag</TableHead>
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
                          <TableCell className="max-w-[16rem] text-xs text-muted-foreground" title={r.rationale ?? ""}>{r.rationale ?? "—"}</TableCell>
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
