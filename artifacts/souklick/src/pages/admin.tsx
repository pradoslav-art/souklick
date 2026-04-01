import { useQuery } from "@tanstack/react-query";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, Activity, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Download, Star, Clock, Zap,
  BarChart2, RefreshCw, ShieldAlert, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

// ── Data fetching ─────────────────────────────────────────────────────────

async function adminFetch(path: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ── Small reusable components ─────────────────────────────────────────────

function StatCard({
  label, value, sub, trend, icon: Icon, color = "text-foreground",
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend >= 0 ? "+" : ""}{trend}% vs last week
              </div>
            )}
          </div>
          {Icon && <Icon className={`w-8 h-8 opacity-20 ${color}`} />}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

function PlaceholderCard({ title, reason }: { title: string; reason: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">{reason}</p>
      </CardContent>
    </Card>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    trial: "bg-yellow-100 text-yellow-800",
    starter: "bg-blue-100 text-blue-800",
    growth: "bg-purple-100 text-purple-800",
    enterprise: "bg-green-100 text-green-800",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[plan] ?? "bg-muted text-muted-foreground"}`}>{plan}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    approved: "bg-blue-100 text-blue-700",
    posted: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    active: "bg-green-100 text-green-700",
    past_due: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

// ── Main dashboard ────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: currentUser } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey() } });

  const { data: stats, error: statsError, isLoading: loadingStats, dataUpdatedAt } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminFetch("/admin/stats"),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => adminFetch("/admin/activity"),
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminFetch("/admin/users"),
    refetchInterval: 60_000,
    retry: false,
  });

  // ── Access denied ───────────────────────────────────────────────────────
  if (statsError && (statsError as any).status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          This dashboard is restricted to admin users.<br />
          Set the <code className="bg-muted px-1 rounded text-xs">ADMIN_EMAIL</code> environment variable to your email to get access.
        </p>
      </div>
    );
  }

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const s = stats;
  if (!s) return null;

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: { msg: string; level: "red" | "yellow" | "green" }[] = [];
  if (s.alerts.noSignupsIn24h) alerts.push({ msg: "No new signups in the last 24 hours", level: "yellow" });
  if (s.alerts.noActivityIn24h) alerts.push({ msg: "No user activity in the last 24 hours", level: "red" });
  if (!s.alerts.noSignupsIn24h && !s.alerts.noActivityIn24h) alerts.push({ msg: "All systems healthy", level: "green" });

  const alertColors = { red: "bg-red-50 border-red-200 text-red-800", yellow: "bg-yellow-50 border-yellow-200 text-yellow-800", green: "bg-green-50 border-green-200 text-green-800" };
  const AlertIcon = { red: XCircle, yellow: AlertTriangle, green: CheckCircle };

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.email} · Last updated {dataUpdatedAt ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true }) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          Auto-refreshes every 60s
        </div>
      </div>

      {/* ── Alerts ── */}
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const Icon = AlertIcon[a.level];
          return (
            <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${alertColors[a.level]}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {a.msg}
            </div>
          );
        })}
      </div>

      {/* ── User Metrics ── */}
      <section>
        <SectionHeader title="User Metrics" description="All-time and recent user counts" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={s.users.total.toLocaleString()} icon={Users} />
          <StatCard label="New This Week" value={s.users.newThisWeek} sub={`${s.users.newLastWeek} last week`} trend={s.users.newThisWeekPct} icon={TrendingUp} />
          <StatCard label="Active This Week" value={s.users.activeThisWeek} sub="Drafted a response" icon={Activity} />
          <StatCard label="Active Today" value={s.users.dauToday} sub="Daily active users" icon={Zap} />
        </div>
      </section>

      {/* ── Main Actions (Respond to a Review) ── */}
      <section>
        <SectionHeader title="Review Responses" description="Primary action: monitoring → alert → AI draft → approval → post" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Responses" value={s.actions.total.toLocaleString()} icon={BarChart2} />
          <StatCard label="This Week" value={s.actions.thisWeek} sub={`${s.actions.lastWeek} last week`} trend={s.actions.thisWeekPct} icon={TrendingUp} />
          <StatCard label="Today" value={s.actions.today} sub="Responses drafted today" icon={Activity} />
          <StatCard label="Avg Per User" value={s.actions.avgPerUser} sub="Responses per user (all time)" icon={Users} />
        </div>

        {/* Response status breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {s.features.responsesByStatus.map((r: { status: string; count: number }) => (
            <StatCard key={r.status} label={r.status.replace("_", " ")} value={r.count.toLocaleString()} />
          ))}
          {s.features.responsesByStatus.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-4">No response data yet.</p>
          )}
        </div>

        {/* Recent activity feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Last 50 Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left pb-2 pr-4 font-medium">User</th>
                      <th className="text-left pb-2 pr-4 font-medium">Reviewer</th>
                      <th className="text-left pb-2 pr-4 font-medium">Platform</th>
                      <th className="text-left pb-2 pr-4 font-medium">Rating</th>
                      <th className="text-left pb-2 pr-4 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activity ?? []).map((row: any) => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{row.userName ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{row.userEmail}</div>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.reviewerName ?? "—"}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs">{row.reviewPlatform ?? "—"}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          {row.reviewRating && (
                            <span className="flex items-center gap-0.5 text-xs">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {row.reviewRating}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4"><StatusBadge status={row.status} /></td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {row.createdAt ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {(!activity || activity.length === 0) && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Secondary Actions ── */}
      <section>
        <SectionHeader title="Secondary Actions" description="Feature-level action tracking" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <PlaceholderCard title="Spelling Check" reason="Not yet tracked — add an event log when this action fires to see counts here." />
          <PlaceholderCard title="Custom action 2" reason="Not yet tracked." />
          <PlaceholderCard title="Custom action 3" reason="Not yet tracked." />
        </div>
      </section>

      {/* ── Revenue & Subscriptions ── */}
      <section>
        <SectionHeader title="Revenue & Subscriptions" description="Based on subscription plan data. Connect a payment provider (e.g. Stripe) for actual revenue figures." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Paying Orgs" value={s.subscriptions.paying} sub="Starter, Growth, Enterprise" color="text-green-600" />
          <StatCard label="On Trial" value={s.subscriptions.trial} sub="14-day free trial" color="text-yellow-600" />
          {s.subscriptions.byPlan.map((p: { plan: string; count: number }) => (
            <StatCard key={p.plan} label={`${p.plan} plan`} value={p.count} />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PlaceholderCard title="Total Revenue" reason="Needs Stripe / payment integration." />
          <PlaceholderCard title="Revenue This Month" reason="Needs Stripe / payment integration." />
          <PlaceholderCard title="Revenue This Week" reason="Needs Stripe / payment integration." />
          <PlaceholderCard title="Recent Transactions" reason="Needs Stripe / payment integration." />
        </div>
      </section>

      {/* ── Retention & Engagement ── */}
      <section>
        <SectionHeader title="Retention & Engagement" description="Based on response activity as a proxy for user engagement" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Day 1 Retention</p>
              <p className="text-3xl font-bold">{s.retention.day1Rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{s.retention.day1Retained} of {s.retention.day1Eligible} eligible users</p>
              <p className="text-xs text-muted-foreground mt-1">% who took action within 24h of signup</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Week 1 Retention</p>
              <p className="text-3xl font-bold">{s.retention.week1Rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{s.retention.week1Retained} of {s.retention.week1Eligible} eligible users</p>
              <p className="text-xs text-muted-foreground mt-1">% who took action within 7 days of signup</p>
            </CardContent>
          </Card>
          <StatCard
            label="At-Risk Users"
            value={s.retention.atRisk}
            sub="Active 7-30 days ago, gone silent"
            color={s.retention.atRisk > 0 ? "text-orange-500" : "text-foreground"}
          />
          <PlaceholderCard title="Daily Streaks" reason="Needs login/session event tracking." />
        </div>
      </section>

      {/* ── Conversion Funnel ── */}
      <section>
        <SectionHeader title="Conversion Funnel" description="Signup → first action → return → power user" />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4 flex-wrap">
              {[
                { label: "Signed Up", value: s.funnel.signedUp, color: "bg-blue-500" },
                { label: "First Action", value: s.funnel.firstAction, color: "bg-purple-500" },
                { label: "Return Visit", value: s.funnel.returningUsers, color: "bg-orange-500" },
                { label: "Power User (5+ days)", value: s.funnel.powerUsers, color: "bg-green-500" },
              ].map((stage, i, arr) => {
                const pct = arr[0].value > 0 ? Math.round((stage.value / arr[0].value) * 100) : 0;
                const drop = i > 0 && arr[i - 1].value > 0 ? Math.round(((arr[i - 1].value - stage.value) / arr[i - 1].value) * 100) : null;
                return (
                  <div key={stage.label} className="flex-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{stage.label}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-sm font-bold">{stage.value.toLocaleString()}</div>
                    {drop !== null && (
                      <div className="text-xs text-red-500 mt-0.5">↓ {drop}% drop-off</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Speed Metrics ── */}
      <section>
        <SectionHeader title="Speed Metrics" description="How fast do users engage?" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Time to First Action</p>
              <p className="text-3xl font-bold">
                {s.speed.avgHoursToFirstAction != null ? `${s.speed.avgHoursToFirstAction}h` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg hours from signup to first response</p>
            </CardContent>
          </Card>
          <PlaceholderCard title="Avg Session Length" reason="Needs session event tracking." />
          <PlaceholderCard title="Actions Per Session" reason="Needs session event tracking." />
          <PlaceholderCard title="Pages Per Session" reason="Needs frontend analytics (e.g. PostHog)." />
        </div>
      </section>

      {/* ── Feature Usage ── */}
      <section>
        <SectionHeader title="Feature Usage" description="Which features are being used" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Reviews Monitored" value={s.features.totalReviews.toLocaleString()} sub="Across all locations & platforms" />
          <StatCard label="Locations Added" value={s.features.totalLocations.toLocaleString()} sub="Active & inactive" />
          <StatCard label="Responses Drafted" value={s.actions.total.toLocaleString()} sub="AI or manual drafts" />
          <PlaceholderCard title="Feature Adoption %" reason="Needs per-feature event tracking." />
        </div>
      </section>

      {/* ── Power Users ── */}
      <section>
        <SectionHeader title="Power Users" description="Top 10 most active users this all-time" />
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 pr-4 font-medium">#</th>
                    <th className="text-left pb-2 pr-4 font-medium">User</th>
                    <th className="text-left pb-2 pr-4 font-medium">Joined</th>
                    <th className="text-left pb-2 pr-4 font-medium">Total Actions</th>
                    <th className="text-left pb-2 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.powerUsers as any[]).map((u, i) => (
                    <tr key={u.userId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">#{i + 1}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{u.fullName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-2 pr-4 font-bold">{u.totalActions.toLocaleString()}</td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {u.lastActive ? formatDistanceToNow(new Date(u.lastActive), { addSuffix: true }) : "Never"}
                      </td>
                    </tr>
                  ))}
                  {s.powerUsers.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Charts ── */}
      <section>
        <SectionHeader title="Charts & Visualizations" description="Last 30 days" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Users over time */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">New Users — Last 30 Days</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={s.charts.dailySignups}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, "Signups"]} labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} />
                  <Line type="monotone" dataKey="count" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Responses over time */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Responses Drafted — Last 30 Days</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={s.charts.dailyActions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, "Responses"]} labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} />
                  <Line type="monotone" dataKey="count" stroke="hsl(220 70% 50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity by day of week */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Activity by Day of Week</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.charts.activityByDow}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity by hour */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Activity by Hour of Day</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={s.charts.activityByHour}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(220 70% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Geography / Devices / Errors / Search ── */}
      <section>
        <SectionHeader title="Geography, Devices & More" description="These sections need additional instrumentation" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PlaceholderCard title="Users by Country" reason="No IP/location data collected yet." />
          <PlaceholderCard title="Mobile vs Desktop" reason="No user-agent tracking yet." />
          <PlaceholderCard title="Recent Errors" reason="No error logging yet — add a logs table or connect Sentry." />
          <PlaceholderCard title="Top Searches" reason="No search event tracking yet." />
        </div>
      </section>

      {/* ── All Users Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="All Users" />
          <a
            href="/api/admin/export/users"
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </a>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left pb-2 pr-4 font-medium">Name</th>
                      <th className="text-left pb-2 pr-4 font-medium">Email</th>
                      <th className="text-left pb-2 pr-4 font-medium">Organisation</th>
                      <th className="text-left pb-2 pr-4 font-medium">Plan</th>
                      <th className="text-left pb-2 pr-4 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users ?? []).map((u: any) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-4 font-medium">{u.fullName}</td>
                        <td className="py-2 pr-4 text-muted-foreground text-xs">{u.email}</td>
                        <td className="py-2 pr-4 text-xs">{u.orgName ?? "—"}</td>
                        <td className="py-2 pr-4"><PlanBadge plan={u.subscriptionPlan ?? "trial"} /></td>
                        <td className="py-2 pr-4"><StatusBadge status={u.subscriptionStatus ?? "active"} /></td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No users yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Export Activity ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Activity Export" />
          <a
            href="/api/admin/export/activity"
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
          >
            <Download className="w-3 h-3" />
            Export Activity CSV
          </a>
        </div>
        <p className="text-sm text-muted-foreground">Downloads the last 5,000 response events with user, reviewer, platform, rating, and timestamp.</p>
      </section>

    </div>
  );
}
