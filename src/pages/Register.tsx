import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, UserPlus } from "lucide-react";

interface InvitationData {
  email: string;
  role: string;
  school_name: string | null;
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("No invitation token provided. Please use the link from your invitation email.");
        setLoading(false);
        return;
      }

      try {
        // Call the validate_invitation function
        const { data, error: validateError } = await supabase.rpc("validate_invitation", {
          invite_token: token,
        });

        if (validateError) {
          console.error("Validation error:", validateError);
          setError("Invalid or expired invitation token.");
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setError("This invitation has expired or has already been used.");
          setLoading(false);
          return;
        }

        setInvitation(data[0] as InvitationData);
      } catch (err) {
        console.error("Error validating token:", err);
        setError("Failed to validate invitation.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation!.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Failed to create account");
      }

      // Accept the invitation (assigns the role)
      const { data: acceptResult, error: acceptError } = await supabase.rpc("accept_invitation", {
        invite_token: token!,
        user_id: signUpData.user.id,
      });

      if (acceptError) {
        console.error("Error accepting invitation:", acceptError);
        // Continue anyway - the account was created
      }

      if (!acceptResult) {
        console.warn("Invitation acceptance returned false");
      }

      toast.success("Account created successfully! Please check your email to verify your account.");
      
      // Redirect to auth page
      navigate("/auth");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <p className="text-sm font-medium text-slate-600">Validating invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 gap-4 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Invitation</h1>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleName = invitation?.role === "admin" ? "Administrator" : "Teacher";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50 p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 text-lg font-bold text-slate-900 mx-auto mb-2">
            DEB
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Create Your {roleName} Account
          </CardTitle>
          <CardDescription className="text-sm">
            You've been invited to join DEBs Diagnostic Hub
            {invitation?.school_name && ` for ${invitation.school_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-emerald-800">Valid Invitation</p>
              <p className="text-emerald-700">{invitation?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-medium">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={submitting}
            >
              {submitting ? (
                "Creating Account..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-4">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
