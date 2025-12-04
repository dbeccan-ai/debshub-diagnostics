import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VerifyPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

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

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setStatus("success");
        setMessage("Payment successful! Redirecting to your test...");
        setTimeout(() => {
          navigate(`/test/${attemptId}`);
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to verify payment");
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
