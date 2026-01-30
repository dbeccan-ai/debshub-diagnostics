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
import { useTranslation } from "@/hooks/useTranslation";
import { z } from "zod";

const ReadingRecoveryAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/reading-recovery/dashboard";
  const { t } = useTranslation();
  const rr = t.readingRecovery;

  const signupSchema = z.object({
    studentName: z.string().min(2, rr.studentName + " must be at least 2 characters"),
    parentEmail: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, rr.password + " must be at least 6 characters"),
    confirmPassword: z.string(),
    gradeLevel: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, rr.password + " is required"),
  });

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
        const { data: enrollment } = await supabase
          .from("reading_recovery_enrollments")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (!enrollment) {
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
                <span className="font-bold text-foreground">{rr.programmeTitle}</span>
                <p className="text-xs text-muted-foreground">{rr.programmeAccess}</p>
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
            <CardTitle className="text-2xl">{rr.createAccountTitle}</CardTitle>
            <CardDescription>
              {rr.createAccountDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">{t.auth.signUp}</TabsTrigger>
                <TabsTrigger value="login">{t.auth.signIn}</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">{rr.studentName} *</Label>
                    <Input
                      id="studentName"
                      placeholder={rr.studentName}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={errors.studentName ? "border-red-500" : ""}
                    />
                    {errors.studentName && (
                      <p className="text-sm text-red-500">{errors.studentName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">{rr.gradeLevel}</Label>
                    <select
                      id="gradeLevel"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">{rr.selectGrade}</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">{rr.parentEmail} *</Label>
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
                    <Label htmlFor="password">{rr.password} *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={rr.password}
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
                    <Label htmlFor="confirmPassword">{rr.confirmPassword} *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={rr.confirmPassword}
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
                        {rr.creatingAccount}
                      </>
                    ) : (
                      rr.createAccountBtn
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">{rr.parentEmail}</Label>
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
                    <Label htmlFor="loginPassword">{rr.password}</Label>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder={rr.password}
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
                        {rr.signingIn}
                      </>
                    ) : (
                      rr.signInBtn
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {rr.lookingForDiagnosticsLink}{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  {rr.goToDiagnosticHub}
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