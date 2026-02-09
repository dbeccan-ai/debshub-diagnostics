import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, RefreshCw, Users, Shield, BookOpen, GraduationCap } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  username: string | null;
  parent_email: string | null;
  created_at: string;
  school_id: string | null;
  roles: string[];
  test_count: number;
  reading_count: number;
}

const AdminUserLogins = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/auth"); return; }

        const { data: roleData } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", user.id).eq("role", "admin").maybeSingle();

        if (!roleData) { setIsAdmin(false); return; }
        setIsAdmin(true);
        await fetchUsers();
      } catch { toast.error("Something went wrong."); }
      finally { setLoading(false); }
    };
    init();
  }, [navigate]);

  const fetchUsers = async () => {
    // Fetch all profiles (admin can see all)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, username, parent_email, created_at, school_id")
      .order("created_at", { ascending: false });

    if (profilesError) { console.error(profilesError); toast.error("Could not load users."); return; }

    // Fetch all roles
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Fetch test attempt counts per user
    const { data: testCounts } = await supabase
      .from("test_attempts")
      .select("user_id")
      .not("completed_at", "is", null);

    // Fetch reading recovery counts per user
    const { data: readingCounts } = await supabase
      .from("reading_diagnostic_transcripts")
      .select("user_id");

    const roleMap: Record<string, string[]> = {};
    (allRoles || []).forEach(r => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const testCountMap: Record<string, number> = {};
    (testCounts || []).forEach(t => {
      testCountMap[t.user_id] = (testCountMap[t.user_id] || 0) + 1;
    });

    const readingCountMap: Record<string, number> = {};
    (readingCounts || []).forEach(r => {
      readingCountMap[r.user_id] = (readingCountMap[r.user_id] || 0) + 1;
    });

    const enriched: UserProfile[] = (profiles || []).map(p => ({
      ...p,
      roles: roleMap[p.id] || ["student"],
      test_count: testCountMap[p.id] || 0,
      reading_count: readingCountMap[p.id] || 0,
    }));

    setUsers(enriched);
    setFiltered(enriched);
  };

  useEffect(() => {
    let f = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      f = f.filter(u =>
        u.full_name.toLowerCase().includes(term) ||
        (u.parent_email || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term)
      );
    }
    if (roleFilter !== "all") f = f.filter(u => u.roles.includes(roleFilter));
    setFiltered(f);
  }, [searchTerm, roleFilter, users]);

  const getRoleBadge = (role: string) => {
    const config: Record<string, { icon: typeof Shield; color: string }> = {
      admin: { icon: Shield, color: "bg-red-100 text-red-800 border-red-200" },
      teacher: { icon: BookOpen, color: "bg-sky-100 text-sky-800 border-sky-200" },
      student: { icon: GraduationCap, color: "bg-slate-100 text-slate-700 border-slate-200" },
    };
    const c = config[role] || config.student;
    const Icon = c.icon;
    return (
      <Badge key={role} variant="outline" className={`${c.color} gap-1`}>
        <Icon className="h-3 w-3" /> {role}
      </Badge>
    );
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm font-medium text-slate-600">Loading...</p></div>;
  if (isAdmin === false) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md"><CardHeader><CardTitle className="text-red-600">Access Denied</CardTitle></CardHeader>
        <CardContent><Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button></CardContent></Card>
    </div>
  );

  const adminCount = users.filter(u => u.roles.includes("admin")).length;
  const teacherCount = users.filter(u => u.roles.includes("teacher")).length;
  const studentCount = users.filter(u => u.roles.includes("student")).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-slate-600">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <Users className="h-5 w-5 text-indigo-600" />
            <h1 className="text-lg font-semibold text-slate-900">All User Logins</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}><RefreshCw className="mr-1 h-4 w-4" /> Refresh</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-900">{users.length}</div><div className="text-xs text-slate-500">Total Users</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{adminCount}</div><div className="text-xs text-slate-500">Admins</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-sky-600">{teacherCount}</div><div className="text-xs text-slate-500">Teachers</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-600">{studentCount}</div><div className="text-xs text-slate-500">Students</div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search by name, email, or username..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registered Users ({filtered.length})</CardTitle>
            <CardDescription>All users registered on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-medium text-slate-600">Name</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Email</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Username</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Roles</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Tests Done</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Reading Assessments</th>
                      <th className="pb-3 text-left font-medium text-slate-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 font-medium text-slate-900">{u.full_name}</td>
                        <td className="py-3 text-slate-600">{u.parent_email || "—"}</td>
                        <td className="py-3 text-slate-600">{u.username || "—"}</td>
                        <td className="py-3"><div className="flex flex-wrap gap-1">{u.roles.map(r => getRoleBadge(r))}</div></td>
                        <td className="py-3 text-center text-slate-700">{u.test_count}</td>
                        <td className="py-3 text-center text-slate-700">{u.reading_count}</td>
                        <td className="py-3 text-slate-600">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUserLogins;
