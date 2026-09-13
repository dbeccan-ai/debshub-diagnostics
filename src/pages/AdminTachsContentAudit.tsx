import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Eye, RotateCcw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TachsVisual } from "@/components/TachsVisual";
import { tachsApi, skillLabel, SECTION_NAMES, type TachsAuditItem, type TachsSectionKey } from "@/lib/tachs";
import { PINNED_ATTEMPTS, compareVersions, filterItems, type VersionSummary } from "@/lib/tachsAdminHelpers";
import audit from "@/data/tachs-content-audit.json";

type Audit = typeof audit;
type VersionAudit = Audit["versions"][number];

const pctText = (n: number) => `${Math.round(n * 100)}%`;
const versionTag = (v: { version: number; frozen: boolean }) => `v${v.version} ${v.frozen ? "frozen" : "revised (active)"}`;

type ItemsState = { status: "idle" } | { status: "loading" } | { status: "ok"; items: TachsAuditItem[] } | { status: "error"; message: string };

function ItemCard({ q, showAnswers }: { q: TachsAuditItem; showAnswers: boolean }) {
  return (
    <div className="rounded-md border p-3 text-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{q.code}</span>
        <span>{SECTION_NAMES[q.section_key]}</span><span>· {skillLabel(q.skill)}</span><span>· L{q.difficulty}</span>
        {q.strand && <span>· {q.strand}</span>}
        {q.passage_title && <span>· “{q.passage_title}”</span>}
      </div>
      <p className="whitespace-pre-wrap">{q.stem}</p>
      {q.visual ? <TachsVisual spec={q.visual} alt={q.visual_alt} maxWidth={320} /> : null}
      <ol className="grid gap-1 sm:grid-cols-2">
        {q.choices.map((c) => (
          <li key={c.key} className={`flex items-start gap-2 rounded px-2 py-1 ${showAnswers && c.key === q.correct_key ? "bg-primary/10 font-medium" : ""}`}>
            <span className="font-mono">{c.key}.</span>
            {c.visual ? <TachsVisual spec={c.visual} maxWidth={110} /> : <span>{c.text}</span>}
          </li>
        ))}
      </ol>
      {showAnswers && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Key {q.correct_key}.</span> {q.rationale}</p>}
    </div>
  );
}

export default function AdminTachsContentAudit() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const versionsDesc = useMemo(() => [...audit.versions].sort((a, b) => b.version - a.version), []);
  const [versionNo, setVersionNo] = useState<number>(versionsDesc[0].version);
  const [compare, setCompare] = useState(false);
  const [items, setItems] = useState<Record<number, ItemsState>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [section, setSection] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("This page is for administrators only."); navigate("/dashboard"); return; }
      setReady(true);
    })();
  }, [navigate]);

  const v: VersionAudit = useMemo(() => audit.versions.find((x) => x.version === versionNo) ?? versionsDesc[0], [versionNo, versionsDesc]);
  const frozen: VersionAudit | undefined = useMemo(() => audit.versions.find((x) => x.frozen), []);
  const revised: VersionAudit = useMemo(() => audit.versions.find((x) => !x.frozen) ?? versionsDesc[0], [versionsDesc]);
  const comparison = useMemo(() => (frozen ? compareVersions(frozen as VersionSummary, revised as VersionSummary) : []), [frozen, revised]);
  const allWarnings = useMemo(() => [...v.warnings, ...v.sections.flatMap((s) => s.warnings.map((w) => `${s.name}: ${w}`))], [v]);

  const loadItems = async (ver: number) => {
    setItems((m) => ({ ...m, [ver]: { status: "loading" } }));
    try {
      const r = await tachsApi.adminContentAudit(ver);
      setItems((m) => ({ ...m, [ver]: { status: "ok", items: r.items } }));
    } catch (e) {
      setItems((m) => ({ ...m, [ver]: { status: "error", message: e instanceof Error ? e.message : "Item preview unavailable" } }));
    }
  };
  useEffect(() => { setSkill("all"); }, [versionNo, compare]);

  const activeVersions: VersionAudit[] = compare && frozen ? [frozen, revised] : [v];
  const skillsForSection = useMemo(() => {
    const secs = activeVersions.flatMap((av) => av.sections.filter((s) => section === "all" || s.key === section));
    return [...new Set(secs.flatMap((s) => s.skills.map((k) => k.skill)))];
  }, [activeVersions, section]);

  const filteredFor = (ver: number) => {
    const st = items[ver];
    return st?.status === "ok" ? filterItems(st.items, { section, skill, difficulty, query }) : [];
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const renderItemsPane = (ver: VersionAudit) => {
    const st = items[ver.version] ?? { status: "idle" as const };
    const list = filteredFor(ver.version);
    return (
      <div key={ver.version} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{versionTag(ver)}</Badge>
          {st.status === "ok" && <Badge variant="outline">{list.length} of {st.items.length} items</Badge>}
          {st.status === "idle" && <Button size="sm" onClick={() => loadItems(ver.version)}><Eye className="mr-1 h-4 w-4" /> Load {versionTag(ver)} items</Button>}
          {st.status === "loading" && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</span>}
        </div>
        {st.status === "error" && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="text-destructive">{st.message}</p>
            <p className="text-xs text-muted-foreground">Item previews are served only by the admin-gated engine action; if the engine build is older, deploy it to enable this.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => loadItems(ver.version)}><RotateCcw className="mr-1 h-4 w-4" /> Retry</Button>
          </div>
        )}
        {st.status === "ok" && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {list.slice(0, 150).map((q) => <ItemCard key={q.code} q={q} showAnswers={showAnswers} />)}
            {list.length === 0 && <p className="text-sm text-muted-foreground">No items match.</p>}
            {list.length > 150 && <p className="text-xs text-muted-foreground">Showing the first 150 matches — narrow the filters to see more.</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="TACHS Content Audit | Admin" description="Blueprint, pool sizes, skill quotas, difficulty mix and item previews for the D.E.Bs TACHS Readiness Diagnostic." path="/admin/tachs/content-audit" noIndex />
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tachs")} className="mb-2 -ml-2"><ArrowLeft className="mr-1 h-4 w-4" /> TACHS attempts</Button>
            <h1 className="text-2xl font-bold">TACHS Content Audit</h1>
            <p className="text-sm text-muted-foreground">Snapshot generated {new Date(audit.generated_at).toLocaleString()}. Answer keys and rationales are loaded on demand for administrators only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><Switch checked={compare} onCheckedChange={setCompare} disabled={!frozen} /> Compare v{frozen?.version ?? 1} frozen vs v{revised.version} revised</label>
            {!compare && (
              <Select value={String(versionNo)} onValueChange={(x) => setVersionNo(Number(x))}>
                <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                <SelectContent>{versionsDesc.map((x) => <SelectItem key={x.version} value={String(x.version)}>{versionTag(x)} — {x.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900" role="note">
            <strong>Carry-over notice.</strong> {PINNED_ATTEMPTS[0]?.label} (blueprint v2) was administered with earlier v2 Reading/Written carry-over items (codes <span className="font-mono">V2-R</span> / <span className="font-mono">V2-W</span>), which are <em>not</em> the revised <span className="font-mono">RD2</span> / <span className="font-mono">WR2</span> pools shown here. Her stored attempt remains bound to its original question IDs; do not treat it as a baseline for the final revised v2 bank.
            {" "}<Button variant="link" className="h-auto p-0 text-amber-900 underline" onClick={() => navigate(`/admin/tachs/${PINNED_ATTEMPTS[0]?.id}`)}>Open her original attempt and answer audit</Button>
          </CardContent>
        </Card>

        {compare && frozen ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Section comparison — {versionTag(frozen)} vs {versionTag(revised)}</CardTitle>
              <CardDescription>Pool, choice count, skill quotas and difficulty mix side by side. Frozen v1 remains bound to existing attempts and is never edited.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {comparison.map((row) => (
                <div key={row.key} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{row.name}</h3>
                    <Badge variant="outline">pool {row.left?.pool ?? "—"} → {row.right?.pool ?? "—"} ({row.pool_delta >= 0 ? "+" : ""}{row.pool_delta})</Badge>
                    <Badge variant="outline">administered {row.left?.administered ?? "—"} → {row.right?.administered ?? "—"}</Badge>
                    <Badge variant={row.choices_changed ? "default" : "outline"}>{row.left?.choices ?? "—"} → {row.right?.choices ?? "—"} choices</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Table>
                      <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead className="text-right">v{frozen.version} quota / pool</TableHead><TableHead className="text-right">v{revised.version} quota / pool</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {row.skills.map((k) => (
                          <TableRow key={k.skill} className={k.changed ? "bg-primary/5" : ""}>
                            <TableCell>{skillLabel(k.skill)}</TableCell>
                            <TableCell className="text-right">{k.left_quota ?? "—"} / {k.left_pool ?? "—"}</TableCell>
                            <TableCell className="text-right">{k.right_quota ?? "—"} / {k.right_pool ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-sm space-y-1 md:w-64">
                      <p className="font-medium">Difficulty share</p>
                      {row.difficulty.map((d) => (
                        <div key={d.level} className="flex items-center justify-between gap-2"><span>Level {d.level}</span><span>{d.left_share != null ? pctText(d.left_share) : "—"} → {d.right_share != null ? pctText(d.right_share) : "—"}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card><CardHeader className="pb-1"><CardDescription>Pool size</CardDescription><CardTitle className="text-3xl">{v.pool}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{v.administered} items administered per attempt</CardContent></Card>
              <Card><CardHeader className="pb-1"><CardDescription>Passages</CardDescription><CardTitle className="text-3xl">{v.passages.length}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{v.passages.filter((p) => p.section === "reading").length} reading · {v.passages.filter((p) => p.section === "written_expression").length} editing</CardContent></Card>
              <Card>
                <CardHeader className="pb-1"><CardDescription>Validation</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl">{allWarnings.length === 0 ? <><CheckCircle2 className="h-6 w-6 text-primary" /> All checks pass</> : <><AlertTriangle className="h-6 w-6 text-destructive" /> {allWarnings.length} warning{allWarnings.length === 1 ? "" : "s"}</>}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{allWarnings.length ? <ul className="list-disc pl-4 space-y-0.5">{allWarnings.map((w) => <li key={w}>{w}</li>)}</ul> : "Pool minima, skill quotas, difficulty mix, choice counts and passage lengths hold."}</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Sections — {versionTag(v)}</CardTitle><CardDescription>Administered quota vs. available pool. Academic sections use four choices (A–D); ability sections use five (A–E) from v2. TEST MODE presents one representative item per skill.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {v.sections.map((s) => (
                  <div key={s.key} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{s.name}</h3>
                      <Badge variant="outline">{s.administered} of {s.pool} (min {s.pool_minimum})</Badge>
                      <Badge variant="outline">{s.choices} choices</Badge>
                      <Badge variant="outline">{s.time_minutes} min</Badge>
                      <Badge variant="outline">TEST MODE: {s.test_mode.item_count} items</Badge>
                      <span className="text-xs text-muted-foreground">Keys: {Object.entries(s.keys).sort().map(([k, n]) => `${k} ${n}`).join(" · ")}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Table>
                        <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead className="text-right">Quota</TableHead><TableHead className="text-right">Pool</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                          {s.skills.map((k) => (
                            <TableRow key={k.skill}><TableCell>{skillLabel(k.skill)}</TableCell><TableCell className="text-right">{k.quota}</TableCell><TableCell className="text-right">{k.pool}</TableCell><TableCell>{k.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="text-sm space-y-1 md:w-64">
                        <p className="font-medium">Difficulty mix</p>
                        {s.difficulty.map((d) => (
                          <div key={d.level} className="flex items-center justify-between gap-2">
                            <span>Level {d.level}</span>
                            <span className={d.ok ? "" : "text-destructive"}>{d.count} · {pctText(d.share)}{d.target != null ? ` (target ${pctText(d.target)})` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {v.passages.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Passages</CardTitle><CardDescription>Reading passages target 300–450 words with eight items each.</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Words</TableHead><TableHead className="text-right">Items</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {v.passages.map((p) => <TableRow key={p.id}><TableCell>{SECTION_NAMES[p.section as TachsSectionKey]}</TableCell><TableCell>{p.title}</TableCell><TableCell className="capitalize">{p.kind}</TableCell><TableCell className="text-right">{p.words}</TableCell><TableCell className="text-right">{p.items}</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><CardTitle className="text-base">Item preview{compare ? " — side by side" : ""}</CardTitle><CardDescription>Administrator-only. Stems, choices, visuals, difficulty, skill, key and rationale, loaded from the engine; never shown to students.</CardDescription></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={showAnswers} onCheckedChange={setShowAnswers} /> Show answer keys &amp; rationales</label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={section} onValueChange={(x) => { setSection(x); setSkill("all"); }}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All sections</SelectItem>{Object.entries(SECTION_NAMES).map(([k, n]) => <SelectItem key={k} value={k}>{n}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All skills</SelectItem>{skillsForSection.map((k) => <SelectItem key={k} value={k}>{skillLabel(k)}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All levels</SelectItem><SelectItem value="1">Level 1</SelectItem><SelectItem value="2">Level 2</SelectItem><SelectItem value="3">Level 3</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Search code, stem or passage" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
              {(section !== "all" || skill !== "all" || difficulty !== "all" || query) && <Button size="sm" variant="ghost" onClick={() => { setSection("all"); setSkill("all"); setDifficulty("all"); setQuery(""); }}>Reset</Button>}
            </div>
            <div className={compare ? "grid gap-4 lg:grid-cols-2" : ""}>
              {activeVersions.map(renderItemsPane)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
