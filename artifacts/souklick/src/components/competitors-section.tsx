import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Star, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Snapshot {
  rating: number | null;
  reviewCount: number | null;
  capturedAt: string;
}

interface Competitor {
  id: string;
  name: string;
  googlePlaceId: string;
  currentRating: number | null;
  currentReviewCount: number | null;
  lastUpdated: string | null;
  snapshots: Snapshot[];
}

interface CompetitorsData {
  googleApiConfigured: boolean;
  competitors: Competitor[];
}

const CHART_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

interface Props {
  locationId: string;
  locationName: string;
  locationRating: number | null;
}

export default function CompetitorsSection({ locationId, locationName, locationRating }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<CompetitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlaceId, setNewPlaceId] = useState("");
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/competitors?locationId=${locationId}`, { credentials: "include" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim() || !newPlaceId.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, name: newName.trim(), googlePlaceId: newPlaceId.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error ?? "Failed to add competitor");
      }
      toast({ title: "Competitor added", className: "bg-green-50 border-green-200" });
      setNewName("");
      setNewPlaceId("");
      setAddOpen(false);
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to add", description: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      await load();
    } catch {
      toast({ variant: "destructive", title: "Failed to delete competitor" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/competitors/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to refresh");
      await load();
      toast({ title: "Ratings refreshed", className: "bg-green-50 border-green-200" });
    } catch {
      toast({ variant: "destructive", title: "Failed to refresh ratings" });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Build chart data — one entry per snapshot date
  const buildChartData = (competitors: Competitor[]) => {
    if (competitors.length === 0) return [];
    const dateMap: Record<string, Record<string, number | null>> = {};

    competitors.forEach((c) => {
      c.snapshots.forEach((s) => {
        const d = formatDate(s.capturedAt);
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d][c.name] = s.rating;
      });
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, values]) => ({ date, ...values }));
  };

  if (loading) {
    return (
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Competitor Tracking</h2>
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  const competitors = data?.competitors ?? [];
  const hasSnapshots = competitors.some((c) => c.snapshots.length > 1);
  const chartData = buildChartData(competitors);

  return (
    <div className="mt-12 pb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold mr-auto">Competitor Tracking</h2>
        {competitors.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        )}
        <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Add competitor
        </Button>
      </div>

      {/* No API key banner */}
      {!data?.googleApiConfigured && (
        <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Google Places API key not configured</p>
            <p className="mt-0.5 text-amber-700">Add <code className="bg-amber-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> to your Replit Secrets to enable automatic rating fetching.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {competitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card/50">
          <TrendingUp className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium mb-1">No competitors tracked yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add a competitor's Google Place ID to monitor their rating over time.</p>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add competitor
          </Button>
        </div>
      ) : (
        <>
          {/* Competitor cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Your location card */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">You</p>
              <p className="font-semibold truncate mb-2">{locationName}</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold">
                  {locationRating != null ? locationRating.toFixed(1) : "—"}
                </span>
              </div>
            </div>

            {/* Competitor cards */}
            {competitors.map((c, i) => {
              const delta =
                locationRating != null && c.currentRating != null
                  ? c.currentRating - locationRating
                  : null;

              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 relative group">
                  <button
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Competitor</p>
                  <p className="font-semibold truncate pr-6 mb-2">{c.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xl font-bold">
                        {c.currentRating != null ? c.currentRating.toFixed(1) : "—"}
                      </span>
                    </div>
                    {delta != null && (
                      <span className={`flex items-center gap-0.5 text-sm font-medium ${delta > 0 ? "text-destructive" : delta < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {delta > 0
                          ? <TrendingUp className="w-3.5 h-3.5" />
                          : delta < 0
                          ? <TrendingDown className="w-3.5 h-3.5" />
                          : <Minus className="w-3.5 h-3.5" />
                        }
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)} vs you
                      </span>
                    )}
                  </div>
                  {c.currentReviewCount != null && (
                    <p className="text-xs text-muted-foreground mt-1.5">{c.currentReviewCount.toLocaleString()} reviews</p>
                  )}
                  {c.lastUpdated && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Updated {formatDate(c.lastUpdated)}</p>
                  )}

                  {/* Color strip matching chart line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              );
            })}
          </div>

          {/* Rating history chart */}
          {hasSnapshots && chartData.length > 1 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold mb-4">Rating history</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[3, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickCount={5} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)} ★`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {competitors.map((c, i) => (
                    <Line
                      key={c.id}
                      type="monotone"
                      dataKey={c.name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Add competitor dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setNewName(""); setNewPlaceId(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add a competitor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Enter the competitor's name and their Google Place ID. You can find the Place ID at{" "}
            <span className="font-mono text-xs bg-muted px-1 rounded">maps.googleapis.com/maps/api/place/findplacefromtext</span>{" "}
            or using the <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" className="underline">Place ID Finder</a>.
          </p>
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-sm font-medium block mb-1.5">Competitor Name</label>
              <Input
                placeholder="e.g. The Spice House"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Google Place ID</label>
              <Input
                placeholder="ChIJ..."
                value={newPlaceId}
                onChange={(e) => setNewPlaceId(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={adding || !newName.trim() || !newPlaceId.trim()} className="gap-2">
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add competitor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
