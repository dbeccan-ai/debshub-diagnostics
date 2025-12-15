import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(100, "Password must be less than 100 characters")
});

const AdminAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
      }
    });
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
              <Label htmlFor="password" className="text-slate-300">Password</Label>
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
