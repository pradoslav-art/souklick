import { useMemo } from "react";
import { Link } from "wouter";
import {
  useGetAnalyticsSummary,
  useGetRatingTrend,
  useGetPlatformBreakdown,
  getGetAnalyticsSummaryQueryKey,
  getGetRatingTrendQueryKey,
  getGetPlatformBreakdownQueryKey
} from "@workspace/api-client-react";
import { MessageSquare, Star, Reply, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

export default function Analytics() {
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary({
    query: { queryKey: getGetAnalyticsSummaryQueryKey() }
  });
  
  const { data: trendData, isLoading: loadingTrend } = useGetRatingTrend({
    query: { queryKey: getGetRatingTrendQueryKey() }
  });

  const { data: platformData, isLoading: loadingPlatform } = useGetPlatformBreakdown({
    query: { queryKey: getGetPlatformBreakdownQueryKey() }
  });

  const isLoading = loadingSummary || loadingTrend || loadingPlatform;

  // Format trend data for chart
  const formattedTrendData = useMemo(() => {
    if (!trendData) return [];
    return trendData.map(point => ({
      ...point,
      displayDate: format(new Date(point.date), "MMM d"),
    }));
  }, [trendData]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm border-border">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isLoading && summary?.totalReviews === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Performance Analytics</h1>
          <p className="text-muted-foreground">Track your reputation metrics across all channels.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No data yet</h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            Analytics will appear once reviews start coming in. Start by adding your locations.
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Performance Analytics</h1>
        <p className="text-muted-foreground">Track your reputation metrics across all channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Reviews</p>
            <h3 className="text-3xl font-bold text-foreground">
              {summary?.totalReviews.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-green-600 font-medium">+{summary?.reviewsThisWeek}</span> this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 fill-current" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Average Rating</p>
            <h3 className="text-3xl font-bold text-foreground flex items-baseline gap-1">
              {summary?.averageRating.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">/ 5.0</span>
            </h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Reply className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Response Rate</p>
            <h3 className="text-3xl font-bold text-foreground">
              {summary?.responseRate}%
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-amber-600 font-medium">{summary?.pendingReviews}</span> pending responses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Response Time</p>
            <h3 className="text-3xl font-bold text-foreground">
              {summary?.avgResponseTimeHours}h
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>90-Day Rating Trend</CardTitle>
            <CardDescription>Daily average rating across all locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageRating" 
                    name="Avg Rating"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Volume and rating by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {platformData?.map((p) => (
                <div key={p.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-foreground">{p.platform}</span>
                    <span className="text-sm font-medium">{p.reviewCount} reviews</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          p.platform === 'google' ? 'bg-[#4285F4]' : 
                          p.platform === 'zomato' ? 'bg-[#E23744]' : 
                          'bg-[#00AF87]'
                        }`}
                        style={{ width: `${(p.reviewCount / (summary?.totalReviews || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Avg: {p.averageRating.toFixed(1)} ★</span>
                    <span>Response: {p.responseRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}