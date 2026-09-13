import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tachsPayments, dollars } from "@/lib/tachs";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function TachsPaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [paid, setPaid] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
      if (!sessionId || !orderId) { setStatus("error"); setMessage("Missing payment information."); return; }
      try {
        // The server retrieves the Stripe session and verifies it; the query string is never trusted.
        const res = await tachsPayments.verify(sessionId, orderId);
        if (res.success) {
          setStatus("success");
          setPaid(res.order?.amount_paid_cents ?? null);
          setMessage("Payment confirmed — TACHS unlocked. Taking you to the start page…");
          setTimeout(() => navigate("/tachs/start?unlocked=1", { replace: true }), 2500);
        } else {
          setStatus("error"); setMessage(res.message || "Payment could not be verified.");
        }
      } catch (e) {
        setStatus("error"); setMessage(e instanceof Error ? e.message : "Payment could not be verified.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEO title="TACHS Payment | D.E.Bs" description="Confirming your TACHS diagnostic payment." path="/tachs/payment-success" noIndex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === "loading" && "Confirming payment…"}
            {status === "success" && "Payment confirmed — TACHS unlocked"}
            {status === "error" && "Payment issue"}
          </CardTitle>
          <CardDescription>D.E.Bs TACHS Readiness Diagnostic</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
          {status === "error" && <XCircle className="h-12 w-12 text-destructive" />}
          <p className="text-center text-muted-foreground">{message}</p>
          {status === "success" && paid != null && <p className="text-sm">Amount paid: <strong>{dollars(paid)}</strong></p>}
          {status === "success" && <Button className="w-full" onClick={() => navigate("/tachs/start?unlocked=1")}>Go to Start diagnostic</Button>}
          {status === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/tachs/start")}>Back</Button>
              <Button onClick={() => navigate("/tachs/checkout")}>Complete payment</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
