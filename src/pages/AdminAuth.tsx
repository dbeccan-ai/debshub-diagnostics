import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, Lock, KeyRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(100, "Password must be less than 100 characters")
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AdminAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    
    const handleRecovery = async () => {
      // Check URL for recovery tokens FIRST - synchronously detect recovery mode
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // If this is a recovery link with tokens, handle it exclusively
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Sign out any existing session first to prevent "already logged in" state
          await supabase.auth.signOut();
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!isMounted) return;
          
          if (error) {
            console.error('Error setting recovery session:', error);
            toast.error("Password reset link is invalid or has expired. Please request a new one.");
          } else {
            setIsPasswordReset(true);
            setIsLoggedIn(false);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (err) {
          console.error('Recovery error:', err);
          if (isMounted) {
            toast.error("Password reset link is invalid or has expired. Please request a new one.");
          }
        }
        if (isMounted) setInitializing(false);
        return true; // Indicate we handled recovery
      }
      return false; // Not a recovery link
    };

    handleRecovery().then((wasRecovery) => {
      if (wasRecovery) return; // Don't set up other listeners if handling recovery
      
      // Set up auth state listener only if not recovery
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordReset(true);
          setIsLoggedIn(false);
          setInitializing(false);
        } else if (event === 'SIGNED_IN') {
          // Only set logged in if we're not in password reset mode
          if (!isPasswordReset) {
            setIsLoggedIn(true);
          }
          setInitializing(false);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setInitializing(false);
        }
      });

      // Check for existing session (only if not a recovery link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (isMounted && session && !isPasswordReset) {
          setIsLoggedIn(true);
        }
        if (isMounted) setInitializing(false);
      });

      // Cleanup
      return () => subscription.unsubscribe();
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const clearErrors = () => setErrors({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        toast.error("Invalid email or password");
        setLoading(false);
        return;
      }

      // Check if user has admin or teacher role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .in('role', ['admin', 'teacher'])
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Access denied. This login is for administrators and teachers only.");
        setLoading(false);
        return;
      }

      toast.success(`Logged in as ${roleData.role}!`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    toast.success("Signed out successfully");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const emailValidation = z.string().trim().email("Please enter a valid email address").safeParse(email);
      if (!emailValidation.success) {
        setErrors({ email: emailValidation.error.errors[0].message });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.data, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (error) {
        toast.error("Failed to send reset email. Please try again.");
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
        setEmail("");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const validation = passwordSchema.safeParse({ password: newPassword, confirmPassword });
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error("Failed to update password. Please try again.");
      } else {
        toast.success("Password updated successfully! Please sign in.");
        // Sign out after password update so user can log in fresh
        await supabase.auth.signOut();
        setIsPasswordReset(false);
        setIsLoggedIn(false);
        setNewPassword("");
        setConfirmPassword("");
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-slate-100">
              Already Logged In
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              You're currently signed in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPasswordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-600/20 p-4">
                <KeyRound className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-slate-100">
                Set New Password
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Enter your new password below
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={100}
                  className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={100}
                  className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-600/20 p-4">
                <Lock className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-slate-100">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Enter your email to receive a password reset link
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                  clearErrors();
                }}
                className="w-full text-center text-sm text-emerald-500 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-600/20 p-4">
              <Shield className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-slate-100">
              Admin & Teacher Portal
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Sign in with your administrator or teacher credentials
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setPassword("");
                    clearErrors();
                  }}
                  className="text-xs text-emerald-500 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={100}
                  className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-center text-sm text-slate-500">
              This portal is for school administrators and teachers only.
            </p>
            <p className="text-center text-sm text-slate-500 mt-2">
              Students should use the{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-emerald-500 hover:underline"
              >
                Student Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
