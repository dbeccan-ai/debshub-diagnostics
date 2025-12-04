import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

// Check if password has been leaked using HaveIBeenPwned API (k-anonymity)
const checkLeakedPassword = async (password: string): Promise<boolean> => {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Send only first 5 characters (k-anonymity)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    });
    
    if (!response.ok) {
      console.error('HIBP API error:', response.status);
      return false; // Fail open - don't block signup if API is down
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our password suffix is in the results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix && parseInt(count) > 0) {
        return true; // Password has been leaked
      }
    }
    
    return false; // Password not found in breaches
  } catch (error) {
    console.error('Error checking leaked password:', error);
    return false; // Fail open
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
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const clearErrors = () => setErrors({});

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login inputs
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

        // First, get the parent's email from the username
        const { data: emailData, error: lookupError } = await supabase
          .rpc('get_email_from_username', { input_username: validation.data.username });
        
        // Use generic error message to prevent username enumeration
        if (lookupError || !emailData) {
          toast.error("Invalid username or password");
          setLoading(false);
          return;
        }

        // Now authenticate with the parent's email
        const { error } = await supabase.auth.signInWithPassword({
          email: emailData,
          password: validation.data.password,
        });
        // Use generic error message for auth failures too
        if (error) {
          toast.error("Invalid username or password");
          setLoading(false);
          return;
        }
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        // Validate signup inputs
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

        // Check if password has been leaked
        const isLeaked = await checkLeakedPassword(validation.data.password);
        if (isLeaked) {
          setErrors({ password: "This password has appeared in a data breach. Please choose a different password." });
          setLoading(false);
          return;
        }

        // Sign up with parent's email but store username
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
      // Validate reset inputs
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

      // Get the parent's email from the username
      const { data: emailData, error: lookupError } = await supabase
        .rpc('get_email_from_username', { input_username: validation.data.username });
      
      // Use generic success message regardless of whether username exists (prevents enumeration)
      if (lookupError || !emailData) {
        toast.success("If this username exists, a reset link was sent to the parent's email");
        setIsForgotPassword(false);
        setUsername("");
        setLoading(false);
        return;
      }

      // Send password reset email
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

  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Already Logged In
            </CardTitle>
            <CardDescription className="text-center">
              You're currently signed in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your username to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-username">Username</Label>
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
                  We'll send a reset link to your parent's email
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
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
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Sign in to access your diagnostic tests"
              : "Sign up to start your diagnostic journey"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Student's Full Name</Label>
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
                  <Label htmlFor="parentEmail">Parent's Email</Label>
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
                    This email will be used for password recovery
                  </p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
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
                  Letters, numbers, and underscores only
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-primary hover:underline block w-full"
              >
                Forgot Password?
              </button>
            )}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearErrors();
              }}
              className="text-primary hover:underline block w-full"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
