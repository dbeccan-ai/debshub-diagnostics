import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Trophy, BarChart3, CheckCircle2, XCircle, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { 
  getPassage, 
  interpretationGuide, 
  type Passage 
} from "@/data/reading-recovery-content";

interface DiagnosticResult {
  id: string;
  student_name: string;
  grade_band: string;
  version: string;
  passage_title: string;
  transcript: string | null;
  detected_errors: any;
  confirmed_errors: any;
  final_error_count: number | null;
  created_at: string;
}

const ReadingRecoveryResults = () => {
  const { transcriptId } = useParams<{ transcriptId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!transcriptId) {
        toast.error("Invalid result ID");
        navigate("/dashboard");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to view results");
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("reading_diagnostic_transcripts")
          .select("*")
          .eq("id", transcriptId)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          toast.error("Result not found");
          navigate("/dashboard");
          return;
        }

        setResult(data as DiagnosticResult);

        // Load the passage for context
        const p = getPassage(data.grade_band, data.version as "A" | "B" | "C");
        setPassage(p || null);
      } catch (err) {
        console.error("Error fetching result:", err);
        toast.error("Failed to load result");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [transcriptId, navigate]);

  const calculateTier = (errorCount: number | null) => {
    if (errorCount === null) return { tier: "Unknown", color: "bg-muted" };
    if (errorCount <= 3) return { tier: "Tier 1", color: "bg-emerald-500" };
    if (errorCount <= 7) return { tier: "Tier 2", color: "bg-amber-500" };
    return { tier: "Tier 3", color: "bg-red-500" };
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case "Tier 1":
        return "Excellent mastery – Student demonstrates strong reading fluency and comprehension.";
      case "Tier 2":
        return "Good progress – Student shows understanding but needs targeted practice in specific areas.";
      case "Tier 3":
        return "Needs support – Student requires significant intervention and guided reading practice.";
      default:
        return "Unable to determine tier from available data.";
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-muted-foreground">Result not found</p>
      </div>
    );
  }

  const { tier, color } = calculateTier(result.final_error_count);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                DEB
              </div>
              <div>
                <span className="font-bold text-foreground">Reading Recovery Results</span>
                <p className="text-xs text-muted-foreground">{result.student_name}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/reading-recovery/diagnostic")}>
            <BookOpen className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Results Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Score Circle */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center`}>
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{result.student_name}</h2>
                  <Badge className={`${color} text-white text-lg px-4 py-1 mt-2`}>
                    {tier}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    Assessment Date
                  </div>
                  <div className="font-semibold mt-1">{formatDate(result.created_at)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BookOpen className="w-4 h-4" />
                    Grade Band
                  </div>
                  <div className="font-semibold mt-1">Grades {result.grade_band}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Errors
                  </div>
                  <div className="font-semibold mt-1">{result.final_error_count ?? "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Tier Summary</h3>
            <p className="text-muted-foreground">{getTierDescription(tier)}</p>
          </CardContent>
        </Card>

        {/* Passage Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Passage: {result.passage_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <Badge variant="outline">Grade Band: {result.grade_band}</Badge>
              <Badge variant="outline">Version: {result.version}</Badge>
              {passage && (
                <>
                  <Badge variant="outline">Word Count: {passage.metadata.wordCount}</Badge>
                  <Badge variant="outline">Lexile: {passage.metadata.lexile}</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>21-Day Recovery Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tier === "Tier 1" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">Enrichment Focus</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Continue with grade-level reading materials</li>
                    <li>• Introduce more challenging vocabulary</li>
                    <li>• Encourage independent reading time</li>
                    <li>• Explore different genres and text types</li>
                  </ul>
                </div>
              )}
              {tier === "Tier 2" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Targeted Practice</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Focus on identified weak areas</li>
                    <li>• Use guided reading sessions (15-20 min daily)</li>
                    <li>• Practice comprehension strategies</li>
                    <li>• Build vocabulary through context clues</li>
                  </ul>
                </div>
              )}
              {tier === "Tier 3" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Intensive Support</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Daily one-on-one reading sessions</li>
                    <li>• Focus on phonics and decoding fundamentals</li>
                    <li>• Use leveled readers below current grade</li>
                    <li>• Build sight word recognition</li>
                    <li>• Consider professional reading intervention</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/reading-recovery/diagnostic")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Start New Assessment
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReadingRecoveryResults;
