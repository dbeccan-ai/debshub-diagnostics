import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, KeyRound, Loader2, CheckCircle } from "lucide-react";

const SchoolSetup = () => {
  const navigate = useNavigate();
  const [setupCode, setSetupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in first to set up your school.");
        navigate("/auth?redirect=/school-setup");
        return;
      }

      // Check if user already has a school
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profile?.school_id) {
        toast.info("You're already associated with a school.");
        navigate("/dashboard");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleClaimSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setupCode.trim()) {
      toast.error("Please enter your setup code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-school", {
        body: { setupCode: setupCode.trim() },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setSchoolName(data.school.name);
      setClaimed(true);
      toast.success(`Successfully claimed ${data.school.name}!`);
    } catch (err: any) {
      console.error("Claim error:", err);
      toast.error(err.message || "Failed to claim school.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-amber-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-amber-50 p-4">
        <Card className="w-full max-w-md border-emerald-200 bg-white shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome, Admin!</h2>
            <p className="text-slate-600 mb-6">
              You are now the administrator for <strong>{schoolName}</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              You can invite teachers, manage classes, and view all student results for your school.
            </p>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-amber-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">School Setup</CardTitle>
          <CardDescription className="text-slate-600">
            Enter your school's setup code to become the administrator
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleClaimSchool}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setupCode" className="text-slate-700">Setup Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="setupCode"
                  type="text"
                  placeholder="Enter your 8-character code"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
                  className="pl-10 uppercase tracking-widest font-mono"
                  maxLength={8}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-500">
                This code was provided when your school purchased DEBs Diagnostic Hub.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || setupCode.length < 8}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim School"
              )}
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              className="w-full text-slate-600"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SchoolSetup;
