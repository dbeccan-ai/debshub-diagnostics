import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { tachsPayments, dollars, type TachsQuote } from "@/lib/tachs";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

export default function TachsCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<TachsQuote | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/tachs/checkout"); return; }
      try {
        const res = await tachsPayments.quote();
        if (res.alreadyEntitled) { toast.success("TACHS is already unlocked for this account."); navigate("/tachs/start", { replace: true }); return; }
        setQuote(res.quote); setOrderId(res.order?.id ?? null);
        if (params.get("canceled")) toast.info("Payment was not completed. Your order is saved — you can finish whenever you're ready.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load pricing.");
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    setBusy(true);
    try {
      const res = await tachsPayments.session();
      if (res.alreadyEntitled) { navigate("/tachs/start"); return; }
      if (res.verifyPending && res.sessionId && res.order?.id) { navigate(`/tachs/payment-success?session_id=${res.sessionId}&order_id=${res.order.id}`); return; }
      if (res.url) { window.location.href = res.url; return; }
      throw new Error("Stripe did not return a checkout link.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout.");
      setBusy(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="TACHS Diagnostic Checkout | D.E.Bs" description="Unlock the D.E.Bs TACHS Readiness Diagnostic." path="/tachs/checkout" noIndex />
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tachs/start")} aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-bold text-primary">Unlock the TACHS Readiness Diagnostic</h1>
        </div>
      </header>
      <main className="container mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>D.E.Bs TACHS Readiness Diagnostic</CardTitle>
            <CardDescription>One-time payment. Six timed, adaptive sections (200 questions, 130 testing minutes) with an immediate parent report.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {quote && (
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between p-3"><span>Base price</span><span className="font-medium">{dollars(quote.net_cents)}</span></div>
                <div className="flex justify-between p-3"><span>Processing fee <span className="text-muted-foreground">(card processing, not a tax)</span></span><span className="font-medium">{dollars(quote.fee_cents)}</span></div>
                <div className="flex justify-between p-3 text-base font-bold"><span>Total due today</span><span>{dollars(quote.total_cents)} {quote.currency.toUpperCase()}</span></div>
              </div>
            )}
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Payment unlocks one full TACHS diagnostic for this student account only.</li>
              <li>Other diagnostics (ELA, Math, Reading) are priced separately and do not include TACHS.</li>
              <li>Promotion codes can be entered on the secure Stripe page.</li>
            </ul>
            <Button className="w-full" size="lg" onClick={pay} disabled={busy || !orderId}>
              <Lock className="mr-2 h-4 w-4" /> {busy ? "Opening secure checkout…" : `Pay ${quote ? dollars(quote.total_cents) : ""} with Stripe`}
            </Button>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Independent, TACHS-aligned readiness diagnostic by D.E.Bs. Not affiliated with or endorsed by the official TACHS program; it does not produce official scores.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
