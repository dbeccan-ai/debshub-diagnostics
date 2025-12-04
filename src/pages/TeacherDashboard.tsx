import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Users, BookOpen, ClipboardList, Copy, Trash2, FileText } from "lucide-react";

interface Class {
  id: string;
  name: string;
  grade_level: number | null;
  class_code: string;
  school_name: string | null;
  created_at: string;
  student_count?: number;
}

interface ClassStudent {
  id: string;
  student_id: string;
  joined_at: string;
  profiles: {
    full_name: string;
  } | null;
  test_attempts?: {
    id: string;
    score: number | null;
    tier: string | null;
    completed_at: string | null;
    tests: {
      name: string;
    } | null;
  }[];
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [profileName, setProfileName] = useState("Teacher");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Create class form
  const [newClassName, setNewClassName] = useState("");
  const [newGradeLevel, setNewGradeLevel] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if user is teacher
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "teacher")
          .maybeSingle();

        if (!roleData) {
          // Check if admin (admins can also access)
          const { data: adminRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!adminRole) {
            setIsTeacher(false);
            return;
          }
        }

        setIsTeacher(true);

        // Get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfileName(profile.full_name);
        }

        // Fetch classes
        await fetchClasses();
      } catch (err) {
        console.error("Error loading dashboard:", err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const fetchClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching classes:", error);
      return;
    }

    // Get student counts
    const classesWithCounts = await Promise.all(
      (data || []).map(async (cls) => {
        const { count } = await supabase
          .from("class_students")
          .select("id", { count: "exact", head: true })
          .eq("class_id", cls.id);

        return { ...cls, student_count: count || 0 };
      })
    );

    setClasses(classesWithCounts as Class[]);
  };

  const fetchClassStudents = async (classId: string) => {
    const { data, error } = await supabase
      .from("class_students")
      .select(`
        id,
        student_id,
        joined_at,
        profiles:student_id (full_name)
      `)
      .eq("class_id", classId);

    if (error) {
      console.error("Error fetching students:", error);
      return;
    }

    // Fetch test attempts for each student
    const studentsWithAttempts = await Promise.all(
      (data || []).map(async (student: any) => {
        const { data: attempts } = await supabase
          .from("test_attempts")
          .select(`
            id,
            score,
            tier,
            completed_at,
            tests:test_id (name)
          `)
          .eq("user_id", student.student_id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(5);

        return { ...student, test_attempts: attempts || [] };
      })
    );

    setClassStudents(studentsWithAttempts as ClassStudent[]);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClassName.trim()) {
      toast.error("Class name is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("classes").insert({
        name: newClassName.trim(),
        grade_level: newGradeLevel ? parseInt(newGradeLevel) : null,
        teacher_id: user.id,
      });

      if (error) throw error;

      toast.success("Class created successfully!");
      setCreateDialogOpen(false);
      setNewClassName("");
      setNewGradeLevel("");
      await fetchClasses();
    } catch (err: any) {
      console.error("Error creating class:", err);
      toast.error(err.message || "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This cannot be undone.")) return;

    try {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;

      toast.success("Class deleted");
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
        setClassStudents([]);
      }
      await fetchClasses();
    } catch (err: any) {
      console.error("Error deleting class:", err);
      toast.error("Failed to delete class");
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Class code copied to clipboard");
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "Tier 1": return "bg-emerald-100 text-emerald-800";
      case "Tier 2": return "bg-amber-100 text-amber-800";
      case "Tier 3": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading teacher dashboard...</p>
      </div>
    );
  }

  if (isTeacher === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-600">Teacher access required.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-slate-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Teacher Dashboard</h1>
              <p className="text-xs text-slate-500">Welcome, {profileName}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700">
            Teacher
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-sky-600" />
              <div>
                <p className="text-2xl font-bold text-sky-700">{classes.length}</p>
                <p className="text-xs text-sky-600">My Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-slate-500" />
              <div>
                <p className="text-2xl font-bold text-slate-700">
                  {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                </p>
                <p className="text-xs text-slate-500">Total Students</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-slate-500" />
              <div>
                <p className="text-2xl font-bold text-slate-700">—</p>
                <p className="text-xs text-slate-500">Tests This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Classes List */}
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">My Classes</CardTitle>
                <CardDescription className="text-xs">
                  Manage your classes and view students
                </CardDescription>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="mr-1 h-3 w-3" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Class Name *</Label>
                      <Input
                        placeholder="5th Grade Math"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade Level</Label>
                      <Input
                        type="number"
                        placeholder="5"
                        min="1"
                        max="12"
                        value={newGradeLevel}
                        onChange={(e) => setNewGradeLevel(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating ? "Creating..." : "Create Class"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {classes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No classes yet. Create your first class!
                </p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClass?.id === cls.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setSelectedClass(cls);
                      fetchClassStudents(cls.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{cls.name}</p>
                        <p className="text-xs text-slate-500">
                          {cls.grade_level ? `Grade ${cls.grade_level} · ` : ""}
                          {cls.student_count || 0} students
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyClassCode(cls.class_code);
                        }}
                        title="Copy class code"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-mono">
                        {cls.class_code}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Class Details */}
          <div className="lg:col-span-2">
            {selectedClass ? (
              <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900">
                        {selectedClass.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Class Code: <span className="font-mono font-medium">{selectedClass.class_code}</span>
                        {" · "}Share this code with students to join
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {classStudents.length} students
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {classStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No students in this class yet</p>
                      <p className="text-xs text-slate-400">
                        Share the class code <span className="font-mono font-medium">{selectedClass.class_code}</span> with students
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classStudents.map((student) => (
                        <div
                          key={student.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-slate-900">
                              {student.profiles?.full_name || "Unknown Student"}
                            </span>
                            <span className="text-xs text-slate-500">
                              Joined {new Date(student.joined_at).toLocaleDateString()}
                            </span>
                          </div>
                          {student.test_attempts && student.test_attempts.length > 0 ? (
                            <div className="space-y-1">
                              {student.test_attempts.slice(0, 3).map((attempt: any) => (
                                <div
                                  key={attempt.id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-slate-600">
                                    {attempt.tests?.name || "Test"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-700">{attempt.score}%</span>
                                    <Badge className={`text-xs ${getTierColor(attempt.tier)}`}>
                                      {attempt.tier}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 p-1"
                                      onClick={() => navigate(`/results/${attempt.id}`)}
                                    >
                                      <FileText className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No completed tests yet</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 border-dashed">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Select a class to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
