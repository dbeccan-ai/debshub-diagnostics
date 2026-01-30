import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";
import { z } from "zod";

const signupSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  parentEmail: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  gradeLevel: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const ReadingRecoveryAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/reading-recovery/dashboard";

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  // Signup form
  const [studentName, setStudentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if enrolled in Reading Recovery
        const { data: enrollment } = await supabase
          .from("reading_recovery_enrollments")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (enrollment) {
          navigate(redirectTo);
        } else {
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [navigate, redirectTo]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = signupSchema.safeParse({
      studentName,
      parentEmail,
      password,
      confirmPassword,
      gradeLevel,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parentEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/reading-recovery/dashboard`,
          data: {
            full_name: studentName,
            programme: "reading_recovery",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
          setActiveTab("login");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (authData.user) {
        // Create enrollment record
        const { error: enrollError } = await supabase
          .from("reading_recovery_enrollments")
          .insert({
            user_id: authData.user.id,
            student_name: studentName,
            parent_email: parentEmail,
            grade_level: gradeLevel ? parseInt(gradeLevel) : null,
          });

        if (enrollError) {
          console.error("Enrollment error:", enrollError);
        }

        toast.success("Welcome to the Reading Recovery Programme!");
        navigate(redirectTo);
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast.error("Invalid email or password");
        return;
      }

      if (data.user) {
        // Check if enrolled in Reading Recovery
        const { data: enrollment } = await supabase
          .from("reading_recovery_enrollments")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (!enrollment) {
          // Create enrollment for existing user
          const { error: enrollError } = await supabase
            .from("reading_recovery_enrollments")
            .insert({
              user_id: data.user.id,
              student_name: data.user.user_metadata?.full_name || "Student",
              parent_email: data.user.email || loginEmail,
            });

          if (enrollError) {
            console.error("Enrollment error:", enrollError);
          }
        }

        toast.success("Welcome back!");
        navigate(redirectTo);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-sky-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/reading-recovery" className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-foreground">Reading Recovery</span>
                <p className="text-xs text-muted-foreground">Programme Access</p>
              </div>
            </div>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-md">
        <Card className="shadow-lg border-emerald-100">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Reading Recovery Programme</CardTitle>
            <CardDescription>
              Create your account to access the full programme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Sign In</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student's Name *</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter student's full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={errors.studentName ? "border-red-500" : ""}
                    />
                    {errors.studentName && (
                      <p className="text-sm text-red-500">{errors.studentName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <select
                      id="gradeLevel"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select grade level</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent/Guardian Email *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className={errors.parentEmail ? "border-red-500" : ""}
                    />
                    {errors.parentEmail && (
                      <p className="text-sm text-red-500">{errors.parentEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account & Access Programme"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email Address</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      placeholder="parent@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In to Programme"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Looking for diagnostic tests?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Go to Diagnostic Hub
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReadingRecoveryAuth;
