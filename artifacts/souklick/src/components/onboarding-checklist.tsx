import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, ArrowRight, Sparkles } from "lucide-react";
import { useGetCurrentUser, getGetCurrentUserQueryKey, useGetLocations, getGetLocationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "onboarding_checklist_dismissed";
const COLLAPSED_KEY = "onboarding_checklist_collapsed";
const AI_USED_KEY = "souklick_ai_used";

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "true");

  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });
  const { data: locations } = useGetLocations({ query: { queryKey: getGetLocationsQueryKey() } });

  if (dismissed) return null;

  const hasLocation = (locations?.length ?? 0) > 0;
  const hasPlatform = locations?.some(
    (l: any) => l.googlePlaceId || l.zomatoRestaurantId || l.tripadvisorLocationId
  ) ?? false;
  const hasAlerts = !!(user as any)?.notificationEmail || !!(user as any)?.notificationPush;
  const hasUsedAI = localStorage.getItem(AI_USED_KEY) === "true";

  const steps: Step[] = [
    {
      id: "account",
      title: "Create your account",
      description: "You're in. Welcome to Souklick.",
      href: "/dashboard",
      done: true,
    },
    {
      id: "location",
      title: "Add your first location",
      description: "Add the business you want to manage reviews for.",
      href: "/locations",
      done: hasLocation,
    },
    {
      id: "platform",
      title: "Connect a review platform",
      description: "Link Google, TripAdvisor, or Zomato to start pulling in reviews.",
      href: "/settings/platforms",
      done: hasPlatform,
    },
    {
      id: "alerts",
      title: "Enable review alerts",
      description: "Get notified the moment a new review comes in.",
      href: "/settings/notifications",
      done: hasAlerts,
    },
    {
      id: "ai",
      title: "Generate your first AI response",
      description: "Open any review and hit 'Generate AI Draft' to see the magic.",
      href: "/dashboard",
      done: hasUsedAI,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={handleCollapse}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {allDone ? (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-orange-600">{completedCount}/{steps.length}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {allDone ? "You're all set!" : "Get started with Souklick"}
            </p>
            {!allDone && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-32">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{progress}% complete</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {allDone && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground h-7 px-2"
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Dismiss
            </Button>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronUp className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-border divide-y divide-border">
          {steps.map((step) => (
            <div key={step.id} className={`flex items-center gap-4 px-5 py-3.5 ${step.done ? "opacity-60" : ""}`}>
              <div className="shrink-0">
                {step.done
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <Link href={step.href}>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1">
                    Start <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
