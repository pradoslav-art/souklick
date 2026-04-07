import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Loader2, Zap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";

const FEATURES = [
  "Unlimited review monitoring",
  "AI-powered response drafts",
  "All platform integrations",
  "Priority queue management",
  "Analytics & reporting",
  "Brand voice customisation",
  "Email notifications",
  "Team management",
];

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"monthly" | "yearly" | "portal" | null>(null);
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  const isPaidPlan = (user as any)?.subscriptionPlan && (user as any).subscriptionPlan !== "trial";
  const planLabel = (user as any)?.subscriptionPlan === "yearly" ? "Yearly" : "Monthly";

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to open billing portal");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({
        title: "Could not open billing portal",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Could not start checkout",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  if (isPaidPlan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-6">
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            You're on the {planLabel} plan
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Manage your subscription, update your payment method, or view invoices via the Stripe billing portal.
          </p>
          <Button
            className="w-full mb-4"
            onClick={handlePortal}
            disabled={loading === "portal"}
          >
            {loading === "portal" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening portal…</>
            ) : (
              <><CreditCard className="w-4 h-4 mr-2" /> Manage billing</>
            )}
          </Button>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            Upgrade your plan
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-base">
            Everything you need to manage and respond to reviews — no hidden fees.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly */}
          <div className="border border-border rounded-2xl p-8 bg-card flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Monthly</h2>
              <p className="text-muted-foreground text-sm">Flexible, month-to-month billing.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-foreground">$29</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleCheckout("monthly")}
              disabled={loading !== null}
            >
              {loading === "monthly" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting checkout…</>
              ) : (
                "Get started monthly"
              )}
            </Button>
          </div>

          {/* Yearly */}
          <div className="border-2 border-primary rounded-2xl p-8 bg-card flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Save $53 — best value
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Yearly</h2>
              <p className="text-muted-foreground text-sm">One payment, full year of access.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold text-foreground">$295</span>
              <span className="text-muted-foreground ml-1">/year</span>
              <p className="text-sm text-primary mt-1 font-medium">That's $24.58/month</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleCheckout("yearly")}
              disabled={loading !== null}
            >
              {loading === "yearly" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting checkout…</>
              ) : (
                "Get started yearly"
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Payments are processed securely by Stripe. Cancel anytime from your billing settings.
        </p>

        <div className="text-center mt-4">
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
