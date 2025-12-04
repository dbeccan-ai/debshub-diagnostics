import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("*")
        .eq("id", attemptData.test_id)
        .single();

      if (testError) throw testError;

      setAttempt(attemptData);
      setTest(testData);
    } catch (error: any) {
      toast.error("Failed to load checkout details");
      navigate("/tests");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Create Stripe checkout session via edge function
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { attemptId },
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("Failed to create checkout session");

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!attempt || !test) {
    return null;
  }

  const amount = attempt.grade_level <= 6 ? 99 : 120;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Checkout</h1>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
              <CardTitle className="text-2xl">Complete Your Purchase</CardTitle>
              <CardDescription>
                Secure payment for {test.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Test Name:</span>
                  <span className="text-muted-foreground">{test.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Grade Level:</span>
                  <span className="text-muted-foreground">Grade {attempt.grade_level}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Duration:</span>
                  <span className="text-muted-foreground">{test.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <span className="font-bold text-lg">Total Amount:</span>
                  <span className="font-bold text-2xl text-primary">${amount}.00</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">What's Included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Full access to diagnostic test</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Detailed tier placement analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Official certificate with tier badge</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Strengths and areas for improvement</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Certificate emailed to parent</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay ${amount}.00
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe. Your payment information is encrypted and secure.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
