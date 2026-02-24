import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const VerifyPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionId = searchParams.get("session_id");
  const attemptId = searchParams.get("attempt_id");

  useEffect(() => {
    if (sessionId && attemptId) {
      verifyPayment();
    } else {
      setStatus("error");
      setMessage("Missing payment information");
    }
  }, [sessionId, attemptId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId, attemptId },
      });

      if (error) throw new Error(error.message);

      if (data.success) {
        setStatus("success");
        if (data.couponCode) {
          setCouponCode(data.couponCode);
          setMessage("Payment successful! Your bundle coupon code is below.");
        } else {
          setMessage("Payment successful! Redirecting to your test...");
          setTimeout(() => {
            navigate(`/test/${attemptId}`);
          }, 2000);
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to verify payment");
    }
  };

  const handleCopy = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast.success("Coupon code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Payment..."}
            {status === "success" && "Payment Verified!"}
            {status === "error" && "Payment Issue"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we confirm your payment"}
            {status === "success" && "Your payment has been processed successfully"}
            {status === "error" && "There was a problem with your payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
          
          <p className="text-center text-muted-foreground">{message}</p>

          {/* Bundle coupon display */}
          {couponCode && status === "success" && (
            <div className="w-full space-y-4">
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Coupon Code for the Second Test</p>
                <p className="text-3xl font-bold tracking-widest text-primary mb-3">{couponCode}</p>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This code has also been emailed to you. Use it at checkout for your second diagnostic test.
              </p>
              <Button className="w-full" onClick={() => navigate(`/test/${attemptId}`)}>
                Continue to Your Test →
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/tests")}>
                Back to Tests
              </Button>
              {attemptId && (
                <Button onClick={() => navigate(`/checkout/${attemptId}`)}>
                  Try Again
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyPayment;
