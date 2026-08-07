import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecking(false);
      }
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Recovery link error:", err);
      }

      window.history.replaceState(null, "", "/reset-password");

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setReady(!!session);
      setChecking(false);
    };

    init();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      toast.error(updateError.message || "Could not update password. Request a new reset link.");
      return;
    }
    toast.success("Password updated. Please sign in with your new password.");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-slate-50">Set a new password</CardTitle>
          <CardDescription className="text-slate-400">
            {checking
              ? "Verifying your reset link..."
              : ready
                ? "Choose a new password for your account."
                : "This reset link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!checking && ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-200">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/60 text-slate-50"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-200">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-slate-900/60 text-slate-50"
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
          {!checking && !ready && (
            <div className="space-y-3">
              <Button className="w-full" onClick={() => navigate("/auth")}>Back to student sign in</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/login")}>
                Back to admin sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
