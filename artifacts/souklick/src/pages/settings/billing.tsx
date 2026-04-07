import { useState } from "react";
import { CreditCard, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "trial") return <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">Trial</span>;
  if (plan === "monthly") return <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">Monthly</span>;
  if (plan === "yearly") return <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-semibold">Yearly</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-semibold">{plan}</span>;
}

function StatusRow({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function BillingSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  const plan = (user as any)?.subscriptionPlan ?? "trial";
  const status = (user as any)?.subscriptionStatus ?? "active";
  const trialEndsAt = (user as any)?.trialEndsAt ? new Date((user as any).trialEndsAt) : null;
  const isPaid = plan !== "trial";
  const isExpired = plan === "trial" && trialEndsAt && trialEndsAt < new Date();
  const daysLeft = trialEndsAt && !isExpired ? differenceInDays(trialEndsAt, new Date()) : 0;

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to open billing portal");
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Could not open billing portal", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Billing & Subscription</h2>
        <p className="text-sm text-muted-foreground">
          Your current plan and payment details.
        </p>
      </div>

      {/* Plan card */}
      <div className="bg-card border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Current Plan</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground capitalize">{plan === "trial" ? "Free Trial" : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}</span>
              <PlanBadge plan={plan} />
            </div>
          </div>
          <CreditCard className="w-8 h-8 text-muted-foreground/30" />
        </div>

        <div className="space-y-0 border rounded-lg overflow-hidden bg-muted/20 px-4">
          {isPaid ? (
            <>
              <StatusRow
                icon={status === "active" ? CheckCircle2 : AlertTriangle}
                color={status === "active" ? "text-green-500" : "text-yellow-500"}
                label="Status"
                value={status === "active" ? "Active" : status === "past_due" ? "Past due — update payment" : "Cancelled"}
              />
              <StatusRow
                icon={CreditCard}
                color="text-muted-foreground"
                label="Billing"
                value={plan === "monthly" ? "$29 / month" : "$295 / year"}
              />
            </>
          ) : (
            <>
              <StatusRow
                icon={isExpired ? AlertTriangle : Clock}
                color={isExpired ? "text-destructive" : "text-yellow-500"}
                label="Trial status"
                value={isExpired ? "Expired" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
              />
              {trialEndsAt && (
                <StatusRow
                  icon={Clock}
                  color="text-muted-foreground"
                  label={isExpired ? "Expired on" : "Expires on"}
                  value={format(trialEndsAt, "MMMM d, yyyy")}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPaid ? (
        <Button onClick={handlePortal} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Manage billing
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button asChild>
            <a href="/upgrade">Upgrade plan</a>
          </Button>
          {!isExpired && (
            <p className="text-sm text-muted-foreground self-center">
              Plans from $29/month. Cancel anytime.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
