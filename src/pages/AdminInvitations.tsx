import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Clock, CheckCircle, AlertCircle, Copy, Mail } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: "teacher" | "admin";
  school_name: string | null;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

const AdminInvitations = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const [schoolName, setSchoolName] = useState("");

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
    } else {
      setInvitations(data as Invitation[]);
    }
  };

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please sign in to access this page.");
          navigate("/auth");
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          setIsAdmin(false);
          toast.error("Admin access required.");
          return;
        }

        setIsAdmin(true);
        await fetchInvitations();
      } catch (err) {
        console.error("Error:", err);
        toast.error("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoad();
  }, [navigate]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { email: email.trim(), role, schoolName: schoolName.trim() || undefined },
      });

      if (error) throw new Error(error.message);
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(
        data.emailSent 
          ? `Invitation sent to ${email}` 
          : `Invitation created! Share this link: ${data.invitation.registerUrl}`
      );
      
      // Reset form
      setEmail("");
      setSchoolName("");
      
      // Refresh invitations list
      await fetchInvitations();
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invitation link copied to clipboard");
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-600">Admin privileges required.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => !i.accepted_at && !isExpired(i.expires_at));
  const acceptedInvitations = invitations.filter(i => i.accepted_at);
  const expiredInvitations = invitations.filter(i => !i.accepted_at && isExpired(i.expires_at));

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
              <h1 className="text-lg font-bold text-slate-900">Invite Teachers & Admins</h1>
              <p className="text-xs text-slate-500">Send invitations to join DEBs Diagnostic Hub</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            Admin
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{pendingInvitations.length}</p>
                <p className="text-xs text-amber-600">Pending Invitations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">{acceptedInvitations.length}</p>
                <p className="text-xs text-emerald-600">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-slate-500" />
              <div>
                <p className="text-2xl font-bold text-slate-700">{invitations.length}</p>
                <p className="text-xs text-slate-500">Total Invitations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Invitation Form */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900">Send New Invitation</CardTitle>
              <CardDescription className="text-xs">
                Invite a teacher or admin to join the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs">Role *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "teacher" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school" className="text-xs">School Name (optional)</Label>
                  <Input
                    id="school"
                    placeholder="Lincoln Elementary"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  disabled={sending}
                >
                  {sending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Invitations List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900">Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {pendingInvitations.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No pending invitations</p>
                ) : (
                  pendingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{inv.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {inv.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {inv.school_name && `${inv.school_name} · `}
                          Expires {formatDate(inv.expires_at)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(inv.token)}
                        className="text-xs"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy Link
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {acceptedInvitations.length > 0 && (
              <Card className="border-emerald-200">
                <CardHeader className="border-b border-emerald-100 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-800">Accepted Invitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {acceptedInvitations.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-slate-700">{inv.email}</span>
                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                          {inv.role}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        Joined {formatDate(inv.accepted_at!)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminInvitations;
