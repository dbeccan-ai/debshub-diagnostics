import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_LABELS, PAYMENT_PLANS, TIER_CTAS, CTA_STYLES } from "@/lib/tierConfig";
import { CheckCircle, CreditCard, Mail } from "lucide-react";

type TierKey = "green" | "yellow" | "red";

const PROGRAM_NAMES: Record<TierKey, string> = {
  green: "Enrichment Pod",
  yellow: "Skill Builder Program",
  red: "Intensive Intervention Plan",
};

function getPaymentPlan(tier: TierKey, plan: string | null) {
  if (tier === "red") {
    return plan === "dual" ? PAYMENT_PLANS.red_dual : PAYMENT_PLANS.red_single;
  }
  return PAYMENT_PLANS[tier];
}

function getPlanLabel(tier: TierKey, plan: string | null) {
  if (tier === "red" && plan === "dual") return "Dual Subject";
  if (tier === "red") return "Single Subject";
  return null;
}

const Enroll = () => {
  const [searchParams] = useSearchParams();
  const tierParam = searchParams.get("tier") as TierKey | null;
  const planParam = searchParams.get("plan");

  const validTiers: TierKey[] = ["green", "yellow", "red"];
  const tier = tierParam && validTiers.includes(tierParam) ? tierParam : null;

  if (!tier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invalid Enrollment Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This enrollment link appears to be invalid. Please contact us for assistance.
            </p>
            <a href="mailto:info@debslearnacademy.com">
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Contact Us
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = TIER_LABELS[tier];
  const paymentPlan = getPaymentPlan(tier, planParam);
  const cta = TIER_CTAS[tier];
  const subjectLabel = getPlanLabel(tier, planParam);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            D.E.Bs LEARNING ACADEMY
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enrollment &amp; Payment Options
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Tier badge & program info */}
        <div className="text-center space-y-3">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${tierInfo.badgeClass}`}>
            {tierInfo.badge} — {PROGRAM_NAMES[tier]}
          </span>
          {subjectLabel && (
            <p className="text-sm text-muted-foreground font-medium">{subjectLabel}</p>
          )}
          <p className="text-3xl font-bold text-slate-900">
            Total Investment: ${paymentPlan.fullPrice.toLocaleString()}
          </p>
        </div>

        {/* Two option cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option A — Pay in Full */}
          <Card className={`border-2 ${tierInfo.borderClass} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${CTA_STYLES[tier].split(" ")[0]}`} />
            <CardHeader className="text-center pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Option A
              </p>
              <CardTitle className="text-xl">Pay in Full</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 pt-2">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  ${paymentPlan.fullPrice.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg py-2 px-3">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Immediate enrollment confirmation</span>
              </div>

              <a
                href={cta.primary.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className={`w-full text-base py-6 ${CTA_STYLES[tier]}`}>
                  {tier === "red" ? "Book Consultation & Pay" : "Pay Now"}
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Option B — Structured Tuition Plan */}
          <Card className={`border-2 ${tierInfo.borderClass} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${CTA_STYLES[tier].split(" ")[0]}`} />
            <CardHeader className="text-center pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Option B
              </p>
              <CardTitle className="text-xl">Structured Tuition Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <p className="text-sm text-center text-muted-foreground">
                {paymentPlan.installments.length} payments — same total cost
              </p>

              <div className="space-y-3">
                {paymentPlan.installments.map((inst, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-lg p-3 ${tierInfo.bgClass}`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${tierInfo.textClass}`}>
                        {idx + 1}. {inst.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">${inst.amount.toLocaleString()}</span>
                      <a
                        href={inst.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <CreditCard className="h-3 w-3" />
                          Pay
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <a
                  href={paymentPlan.installments[0].paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className={`w-full text-base py-6 border-2 ${tierInfo.borderClass} ${tierInfo.textClass} hover:${tierInfo.bgClass}`}
                  >
                    Start with Deposit — ${paymentPlan.installments[0].amount.toLocaleString()}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-muted-foreground space-y-1 pt-4">
          <p>Questions? Reach out anytime.</p>
          <a
            href="mailto:info@debslearnacademy.com"
            className="text-primary underline underline-offset-2"
          >
            info@debslearnacademy.com
          </a>
        </div>
      </main>
    </div>
  );
};

export default Enroll;
