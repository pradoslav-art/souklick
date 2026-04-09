import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Star, MessageSquare, Reply, AlertCircle, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LocationStat {
  locationId: string;
  locationName: string;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  pendingReviews: number;
  reviewsLast30Days: number;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

function StatBadge({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

export default function Overview() {
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/locations", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLocations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalReviews = locations.reduce((s, l) => s + l.totalReviews, 0);
  const totalPending = locations.reduce((s, l) => s + l.pendingReviews, 0);
  const overallRating =
    locations.length > 0
      ? locations.reduce((s, l) => s + l.averageRating * l.totalReviews, 0) / (totalReviews || 1)
      : 0;
  const overallResponseRate =
    locations.length > 0
      ? Math.round(locations.reduce((s, l) => s + l.responseRate, 0) / locations.length)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Location Overview</h1>
          <p className="text-muted-foreground">All your locations at a glance.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No locations yet</h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            Add your first location to start tracking reviews.
          </p>
          <Link href="/locations">
            <Button className="gap-2">
              <MapPin className="w-4 h-4" />
              Add a location
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Location Overview</h1>
        <p className="text-muted-foreground">All your locations at a glance.</p>
      </div>

      {/* Org-wide summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-md border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{totalReviews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Total Reviews</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <Star className="w-4.5 h-4.5 fill-current" />
              </div>
            </div>
            <p className="text-2xl font-bold">{overallRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Avg Rating</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <Reply className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{overallResponseRate}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Response Rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{totalPending}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Pending Replies</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-location cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <Link key={loc.locationId} href={`/locations/${loc.locationId}`}>
            <Card className="shadow-md border-border hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold leading-tight">{loc.locationName}</CardTitle>
                  {loc.pendingReviews > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> {loc.pendingReviews} pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={loc.averageRating} />
                  <span className="text-sm font-semibold text-foreground">{loc.averageRating.toFixed(1)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <StatBadge
                    value={loc.totalReviews}
                    label="Total"
                    color="text-foreground"
                  />
                  <StatBadge
                    value={`${loc.responseRate}%`}
                    label="Responded"
                    color={loc.responseRate >= 80 ? "text-green-600" : loc.responseRate >= 50 ? "text-amber-600" : "text-red-600"}
                  />
                  <StatBadge
                    value={loc.reviewsLast30Days}
                    label="Last 30d"
                    color="text-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
