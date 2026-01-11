import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSelector } from "@/components/LanguageSelector";

// Check if password has been leaked using HaveIBeenPwned API (k-anonymity)
const checkLeakedPassword = async (password: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    });
    
    if (!response.ok) {
      console.error('HIBP API error:', response.status);
      return false;
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix && parseInt(count) > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking leaked password:', error);
    return false;
  }
};

// Validation schemas
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password must be less than 100 characters");

const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  parentEmail: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters")
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
  password: z.string().min(1, "Password is required").max(100, "Password must be less than 100 characters")
});

const resetSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters")
});

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check URL for recovery tokens FIRST
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    // If this is a recovery link with tokens, handle it exclusively
    if (type === 'recovery' && accessToken && refreshToken) {
      // Sign out any existing session first
      supabase.auth.signOut().then(() => {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (error) {
            console.error('Error setting recovery session:', error);
            toast.error("Password reset link is invalid or has expired. Please request a new one.");
            setInitializing(false);
          } else {
            setIsPasswordReset(true);
            setIsLoggedIn(false);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
            setInitializing(false);
          }
        });
      });
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
        setIsLoggedIn(false);
        setInitializing(false);
      } else if (event === 'SIGNED_IN' && !isPasswordReset) {
        setIsLoggedIn(true);
        setInitializing(false);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setInitializing(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isPasswordReset) {
        setIsLoggedIn(true);
      }
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearErrors = () => setErrors({});

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ username, password });
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

        const { data: emailData, error: lookupError } = await supabase
          .rpc('get_email_from_username', { input_username: validation.data.username });
        
        if (lookupError || !emailData) {
          toast.error("Invalid username or password");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: emailData,
          password: validation.data.password,
        });

        if (error) {
          toast.error("Invalid username or password");
          setLoading(false);
          return;
        }
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        const validation = signupSchema.safeParse({ 
          username, 
          password, 
          parentEmail, 
          fullName 
        });
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

        const isLeaked = await checkLeakedPassword(validation.data.password);
        if (isLeaked) {
          setErrors({ password: "This password has appeared in a data breach. Please choose a different password." });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: validation.data.parentEmail,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: validation.data.fullName,
              username: validation.data.username,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
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
      const validation = resetSchema.safeParse({ username });
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

      const { data: emailData, error: lookupError } = await supabase
        .rpc('get_email_from_username', { input_username: validation.data.username });
      
      if (lookupError || !emailData) {
        toast.success("If this username exists, a reset link was sent to the parent's email");
        setIsForgotPassword(false);
        setUsername("");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailData, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      
      toast.success("Password reset link sent to parent's email!");
      setIsForgotPassword(false);
      setUsername("");
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
      if (newPassword.length < 6) {
        setErrors({ password: "Password must be at least 6 characters" });
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: "Passwords don't match" });
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
        setIsPasswordReset(false);
        setNewPassword("");
        setConfirmPassword("");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Password reset form
  if (isPasswordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Set New Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={100}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={100}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t.auth.alreadyLoggedIn}
            </CardTitle>
            <CardDescription className="text-center">
              {t.auth.alreadyLoggedInDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="w-full"
            >
              {t.auth.goToDashboard}
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              className="w-full"
            >
              {t.auth.signOut}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t.auth.resetPassword}
            </CardTitle>
            <CardDescription className="text-center">
              {t.auth.resetDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-username">{t.auth.username}</Label>
                <Input
                  id="reset-username"
                  type="text"
                  placeholder="student123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={50}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t.auth.resetSent}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.auth.sending : t.auth.sendResetLink}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setUsername("");
                  clearErrors();
                }}
                className="text-primary hover:underline"
              >
                {t.auth.backToSignIn}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? t.auth.signInDesc : t.auth.signUpDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.auth.studentName}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">{t.auth.parentEmail}</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    maxLength={255}
                  />
                  {errors.parentEmail && (
                    <p className="text-xs text-destructive">{errors.parentEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t.auth.parentEmailDesc}
                  </p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{t.auth.username}</Label>
              <Input
                id="username"
                type="text"
                placeholder="student123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  {t.auth.usernameDesc}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.loading : isLogin ? t.auth.signIn : t.auth.signUp}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-primary hover:underline block w-full"
              >
                {t.auth.forgotPassword}
              </button>
            )}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearErrors();
              }}
              className="text-primary hover:underline block w-full"
            >
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
