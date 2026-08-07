import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Plus, Unlock, X } from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  FollowUpAssessment,
  addWeeks,
  formatUnlockDate,
  isUnlocked,
} from "@/lib/followUps";

interface Row extends FollowUpAssessment {
  tests?: { name: string } | null;
  profiles?: { full_name: string } | null;
  result?: { score: number | null; completed_at: string | null } | null;
  source?: { score: number | null } | null;
}

interface CompletedAttempt {
  id: string;
  user_id: string;
  test_id: string;
  grade_level: number | null;
  school_id: string | null;
  completed_at: string | null;
  score: number | null;
  tests?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

const AdminFollowUps = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [attempts, setAttempts] = useState<CompletedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>("");
  const [checkpointWeek, setCheckpointWeek] = useState<string>("5");
  const [unlockDate, setUnlockDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: fu, error: fuError }, { data: att, error: attError }] = await Promise.all([
      supabase
        .from("follow_up_assessments")
        .select(
          `*, tests:test_id (name), profiles:student_id (full_name),
           source:source_attempt_id (score),
           result:result_attempt_id (score, completed_at)`
        )
        .order("unlock_date", { ascending: true }),
      supabase
        .from("test_attempts")
        .select(
          `id, user_id, test_id, grade_level, school_id, completed_at, score,
           tests:test_id (name), profiles:user_id (full_name)`
        )
        .not("completed_at", "is", null)
        .is("follow_up_id", null)
        .order("completed_at", { ascending: false })
        .limit(300),
    ]);

    if (fuError) console.error(fuError);
    if (attError) console.error(attError);
    setRows((fu as unknown as Row[]) || []);
    setAttempts((att as unknown as CompletedAttempt[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const allowed = (roles || []).some((r) => r.role === "admin" || r.role === "teacher");
      if (!allowed) {
        toast.error("You do not have access to this page.");
        navigate("/dashboard");
        return;
      }

      await loadAll();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) || null;

  useEffect(() => {
    if (selectedAttempt) {
      setUnlockDate(addWeeks(selectedAttempt.completed_at, Number(checkpointWeek) || 5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttemptId, checkpointWeek]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.profiles?.full_name || "").toLowerCase().includes(q) ||
        (r.tests?.name || "").toLowerCase().includes(q) ||
        r.checkpoint_label.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleGrant = async () => {
    if (!selectedAttempt) {
      toast.error("Pick a completed test first.");
      return;
    }
    try {
      setSaving(true);
      const week = Number(checkpointWeek) || null;
      const { error } = await supabase.from("follow_up_assessments").insert({
        student_id: selectedAttempt.user_id,
        source_attempt_id: selectedAttempt.id,
        test_id: selectedAttempt.test_id,
        grade_level: selectedAttempt.grade_level,
        school_id: selectedAttempt.school_id,
        checkpoint_label: week ? `Week ${week} Follow-Up` : "Follow-Up",
        week_number: week,
        unlock_date: unlockDate || addWeeks(selectedAttempt.completed_at, week || 5),
        status: "scheduled",
        created_by: currentUserId,
      });
      if (error) throw error;
      toast.success("Follow-up assessment scheduled.");
      setDialogOpen(false);
      setSelectedAttemptId("");
      await loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not schedule follow-up.";
      toast.error(message.includes("duplicate") ? "That checkpoint already exists for this test." : message);
    } finally {
      setSaving(false);
    }
  };

  const unlockNow = async (row: Row) => {
    const { error } = await supabase
      .from("follow_up_assessments")
      .update({ status: "available", unlock_date: new Date().toISOString().slice(0, 10) })
      .eq("id", row.id);
    if (error) return toast.error("Could not unlock.");
    toast.success("Follow-up unlocked for the student.");
    loadAll();
  };

  const changeDate = async (row: Row, date: string) => {
    if (!date) return;
    const { error } = await supabase
      .from("follow_up_assessments")
      .update({ unlock_date: date, status: "scheduled" })
      .eq("id", row.id);
    if (error) return toast.error("Could not update the date.");
    toast.success("Unlock date updated.");
    loadAll();
  };

  const cancelRow = async (row: Row) => {
    const { error } = await supabase
      .from("follow_up_assessments")
      .update({ status: "cancelled" })
      .eq("id", row.id);
    if (error) return toast.error("Could not cancel.");
    toast.success("Follow-up cancelled.");
    loadAll();
  };

  const statusBadge = (row: Row) => {
    if (row.status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
    if (row.result?.completed_at) return <Badge className="bg-emerald-600 text-white">Completed</Badge>;
    if (isUnlocked(row)) return <Badge className="bg-sky-600 text-white">Available</Badge>;
    return <Badge variant="outline">Locked</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Follow-Up Assessments | Admin"
        description="Schedule and manage free follow-up diagnostic retakes at Week 5 and Week 10 program checkpoints."
        path="/admin/follow-ups"

      />
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Follow-Up Assessments</h1>
              <p className="text-sm text-slate-500">
                Free retakes at program checkpoints — no payment required for students.
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Grant Follow-Up
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-sky-600" />
              Scheduled Follow-Ups
            </CardTitle>
            <CardDescription>
              Week 5 and Week 10 retakes of the student's original diagnostic.
            </CardDescription>
            <Input
              placeholder="Search by student, test or checkpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 max-w-sm"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-slate-500">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No follow-up assessments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>Unlocks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.profiles?.full_name || "Student"}
                        </TableCell>
                        <TableCell>
                          {row.tests?.name || "Diagnostic"}
                          {row.grade_level ? ` (G${row.grade_level})` : ""}
                        </TableCell>
                        <TableCell>{row.checkpoint_label}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            defaultValue={row.unlock_date}
                            className="h-8 w-[150px]"
                            onBlur={(e) => {
                              if (e.target.value !== row.unlock_date) changeDate(row, e.target.value);
                            }}
                          />
                        </TableCell>
                        <TableCell>{statusBadge(row)}</TableCell>
                        <TableCell className="text-sm">
                          {row.result?.completed_at && row.source?.score !== null && row.result?.score !== null
                            ? `${row.source?.score}% → ${row.result?.score}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {row.status !== "cancelled" && !row.result?.completed_at && (
                              <>
                                {!isUnlocked(row) && (
                                  <Button size="sm" variant="outline" onClick={() => unlockNow(row)}>
                                    <Unlock className="mr-1 h-3.5 w-3.5" />
                                    Unlock now
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => cancelRow(row)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {row.result?.completed_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/results/${row.result_attempt_id}`)}
                              >
                                Results
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Grant a free follow-up</DialogTitle>
            <DialogDescription>
              Pick the student's completed diagnostic. The follow-up uses the exact same test.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Completed test</Label>
              <Select value={selectedAttemptId} onValueChange={setSelectedAttemptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student's completed test" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {attempts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {(a.profiles?.full_name || "Student") + " — " + (a.tests?.name || "Diagnostic")}
                      {a.completed_at ? ` (${new Date(a.completed_at).toLocaleDateString()})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Checkpoint</Label>
                <Select value={checkpointWeek} onValueChange={setCheckpointWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Week 5</SelectItem>
                    <SelectItem value="10">Week 10</SelectItem>
                    <SelectItem value="15">Week 15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unlock date</Label>
                <Input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />
              </div>
            </div>

            {selectedAttempt && (
              <p className="text-sm text-slate-500">
                Original score: {selectedAttempt.score ?? "—"}% · unlocks{" "}
                {unlockDate ? formatUnlockDate(unlockDate) : "—"}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrant} disabled={saving || !selectedAttemptId}>
              {saving ? "Scheduling..." : "Schedule Follow-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFollowUps;
