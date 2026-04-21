import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetLocations, getGetLocationsQueryKey } from "@workspace/api-client-react";

interface Rule {
  id: string;
  locationId: string | null;
  platform: string | null;
  minRating: number;
  maxRating: number;
  responseText: string;
  isActive: boolean;
}

const STAR_RANGE_LABEL: Record<string, string> = {
  "5-5": "5 stars only",
  "4-5": "4–5 stars",
  "3-5": "3–5 stars",
  "1-3": "1–3 stars (negative)",
  "1-2": "1–2 stars (very negative)",
};

const PLATFORM_LABEL: Record<string, string> = {
  google: "Google",
  zomato: "Zomato",
  tripadvisor: "TripAdvisor",
};

function ratingKey(min: number, max: number) { return `${min}-${max}`; }

export default function AutoResponsesSettings() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newPlatform, setNewPlatform] = useState("all");
  const [newLocationId, setNewLocationId] = useState("all");
  const [newRatingRange, setNewRatingRange] = useState("5-5");
  const [newText, setNewText] = useState("");

  const { data: locations } = useGetLocations({ query: { queryKey: getGetLocationsQueryKey() } });

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/auto-response-rules", { credentials: "include" });
      if (res.ok) setRules(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const toggleActive = async (rule: Rule) => {
    await fetch(`/api/auto-response-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
      credentials: "include",
    });
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/auto-response-rules/${id}`, { method: "DELETE", credentials: "include" });
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Rule deleted" });
  };

  const createRule = async () => {
    if (!newText.trim()) {
      toast({ variant: "destructive", title: "Response text is required" });
      return;
    }
    setCreating(true);
    try {
      const [min, max] = newRatingRange.split("-").map(Number);
      const body: any = { minRating: min, maxRating: max, responseText: newText };
      if (newPlatform !== "all") body.platform = newPlatform;
      if (newLocationId !== "all") body.locationId = newLocationId;

      const res = await fetch("/api/auto-response-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create rule");
      const rule = await res.json();
      setRules((prev) => [...prev, rule]);
      setShowNew(false);
      setNewText("");
      setNewPlatform("all");
      setNewLocationId("all");
      setNewRatingRange("5-5");
      toast({ title: "Auto-response rule created", className: "bg-green-50 border-green-200" });
    } catch {
      toast({ variant: "destructive", title: "Failed to create rule" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold">Auto-Response Rules</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automatically post a response when a review matches your criteria — no action needed.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add rule
        </Button>
      </div>

      {/* New rule form */}
      {showNew && (
        <div className="mt-6 border border-border rounded-xl p-5 bg-muted/30 space-y-4">
          <p className="text-sm font-medium">New rule</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Star rating</p>
              <Select value={newRatingRange} onValueChange={setNewRatingRange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAR_RANGE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Platform</p>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="zomato">Zomato</SelectItem>
                  <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Location</p>
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {(locations ?? []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Response text</p>
            <Textarea
              placeholder="e.g. Thank you so much for the kind words! We're thrilled you had a great experience and look forward to welcoming you back."
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowNew(false); setNewText(""); }}>Cancel</Button>
            <Button size="sm" onClick={createRule} disabled={creating} className="gap-2">
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save rule
            </Button>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="mt-6 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && rules.length === 0 && !showNew && (
          <div className="text-center py-10 text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No auto-response rules yet.</p>
            <p className="text-xs mt-1">Add a rule to automatically respond to 5-star reviews.</p>
          </div>
        )}

        {rules.map((rule) => {
          const locationName = (locations ?? []).find((l: any) => l.id === rule.locationId)?.name;
          return (
            <div key={rule.id} className={`border rounded-xl p-4 transition-opacity ${rule.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {STAR_RANGE_LABEL[ratingKey(rule.minRating, rule.maxRating)] ?? `${rule.minRating}–${rule.maxRating} stars`}
                    </Badge>
                    {rule.platform && (
                      <Badge variant="outline" className="text-xs">{PLATFORM_LABEL[rule.platform] ?? rule.platform}</Badge>
                    )}
                    {locationName && (
                      <Badge variant="outline" className="text-xs">{locationName}</Badge>
                    )}
                    {!rule.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Paused</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground italic line-clamp-2">"{rule.responseText}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(rule)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={rule.isActive ? "Pause rule" : "Activate rule"}
                  >
                    {rule.isActive
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6" />
                    }
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
