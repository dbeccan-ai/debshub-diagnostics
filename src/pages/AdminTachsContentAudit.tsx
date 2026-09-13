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
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Eye } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TachsVisual } from "@/components/TachsVisual";
import { tachsApi, skillLabel, SECTION_NAMES, type TachsAuditItem, type TachsSectionKey } from "@/lib/tachs";
import audit from "@/data/tachs-content-audit.json";

type Audit = typeof audit;
type VersionAudit = Audit["versions"][number];

const pctText = (n: number) => `${Math.round(n * 100)}%`;

export default function AdminTachsContentAudit() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [versionNo, setVersionNo] = useState<number>(Math.max(...audit.versions.map((v) => v.version)));
  const [items, setItems] = useState<TachsAuditItem[] | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
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

  const v: VersionAudit = useMemo(() => audit.versions.find((x) => x.version === versionNo) ?? audit.versions[audit.versions.length - 1], [versionNo]);
  const allWarnings = useMemo(() => [...v.warnings, ...v.sections.flatMap((s) => s.warnings.map((w) => `${s.name}: ${w}`))], [v]);

  const loadItems = async () => {
    setItemsLoading(true); setItemsError(null);
    try {
      const r = await tachsApi.adminContentAudit(versionNo);
      setItems(r.items);
    } catch (e) {
      setItems(null);
      setItemsError(e instanceof Error ? e.message : "Item preview unavailable");
    } finally { setItemsLoading(false); }
  };
  useEffect(() => { setItems(null); setSkill("all"); }, [versionNo]);

  const skillsForSection = useMemo(() => {
    const sec = v.sections.find((s) => s.key === section);
    return sec ? sec.skills.map((s) => s.skill) : [...new Set(v.sections.flatMap((s) => s.skills.map((k) => k.skill)))];
  }, [v, section]);

  const filtered = useMemo(() => (items ?? []).filter((q) =>
    (section === "all" || q.section_key === section) &&
    (skill === "all" || q.skill === skill) &&
    (difficulty === "all" || String(q.difficulty) === difficulty) &&
    (!query || `${q.code} ${q.stem} ${q.passage_title ?? ""}`.toLowerCase().includes(query.toLowerCase()))
  ), [items, section, skill, difficulty, query]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

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
          <div className="flex items-center gap-2">
            <Select value={String(versionNo)} onValueChange={(x) => setVersionNo(Number(x))}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{audit.versions.map((x) => <SelectItem key={x.version} value={String(x.version)}>v{x.version} — {x.name}{x.frozen ? " (frozen)" : " (active)"}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

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
          <CardHeader><CardTitle className="text-base">Sections</CardTitle><CardDescription>Administered quota vs. available pool. Academic sections use four choices (A–D); ability sections use five (A–E) from v2. TEST MODE presents one representative item per skill.</CardDescription></CardHeader>
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

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><CardTitle className="text-base">Item preview</CardTitle><CardDescription>Administrator-only. Loaded from the engine; never shown to students.</CardDescription></div>
              {items ? (
                <label className="flex items-center gap-2 text-sm"><Switch checked={showAnswers} onCheckedChange={setShowAnswers} /> Show answer keys &amp; rationales</label>
              ) : (
                <Button size="sm" onClick={loadItems} disabled={itemsLoading}>{itemsLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Eye className="mr-1 h-4 w-4" />} Load items</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {itemsError && <p className="text-sm text-destructive">{itemsError}. The preview requires the updated engine to be deployed to this environment.</p>}
            {items && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Select value={section} onValueChange={(x) => { setSection(x); setSkill("all"); }}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All sections</SelectItem>{v.sections.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}</SelectContent>
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
                  <Badge variant="outline" className="self-center">{filtered.length} items</Badge>
                </div>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {filtered.slice(0, 150).map((q) => (
                    <div key={q.code} className="rounded-md border p-3 text-sm space-y-2">
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
                  ))}
                  {filtered.length > 150 && <p className="text-xs text-muted-foreground">Showing the first 150 matches — narrow the filters to see more.</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
