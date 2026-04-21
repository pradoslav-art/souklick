import { Router, type IRouter } from "express";
import { eq, and, count, sql, gte, lt, desc, isNotNull } from "drizzle-orm";
import Stripe from "stripe";
import {
  db,
  usersTable,
  organizationsTable,
  locationsTable,
  reviewsTable,
  responsesTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

// ─── GET /api/admin/stats ──────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 14);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const twentyFourHoursAgo = new Date(now); twentyFourHoursAgo.setHours(now.getHours() - 24);

  const [
    [{ totalUsers }],
    [{ newThisWeek }],
    [{ newLastWeek }],
    [{ activeThisWeek }],
    [{ dauToday }],
    [{ totalActions }],
    [{ actionsThisWeek }],
    [{ actionsLastWeek }],
    [{ actionsToday }],
    orgsByPlan,
    dailySignups,
    dailyActions,
    activityByDow,
    activityByHour,
    [{ totalReviews }],
    [{ totalLocations }],
    responsesByStatus,
    powerUsers,
    allUsers,
    activityByUser,
    hadActivityBefore,
    hadActivityRecent,
    [{ signupsIn24h }],
    [{ activityIn24h }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ newThisWeek: count() }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo)),
    db.select({ newLastWeek: count() }).from(usersTable).where(and(gte(usersTable.createdAt, fourteenDaysAgo), lt(usersTable.createdAt, sevenDaysAgo))),
    db.select({ activeThisWeek: sql<number>`COUNT(DISTINCT ${responsesTable.draftedBy})` }).from(responsesTable).where(and(gte(responsesTable.updatedAt, sevenDaysAgo), isNotNull(responsesTable.draftedBy))),
    db.select({ dauToday: sql<number>`COUNT(DISTINCT ${responsesTable.draftedBy})` }).from(responsesTable).where(and(gte(responsesTable.updatedAt, todayStart), isNotNull(responsesTable.draftedBy))),
    db.select({ totalActions: count() }).from(responsesTable),
    db.select({ actionsThisWeek: count() }).from(responsesTable).where(gte(responsesTable.createdAt, sevenDaysAgo)),
    db.select({ actionsLastWeek: count() }).from(responsesTable).where(and(gte(responsesTable.createdAt, fourteenDaysAgo), lt(responsesTable.createdAt, sevenDaysAgo))),
    db.select({ actionsToday: count() }).from(responsesTable).where(gte(responsesTable.createdAt, todayStart)),
    db.select({ plan: organizationsTable.subscriptionPlan, count: count() }).from(organizationsTable).groupBy(organizationsTable.subscriptionPlan),
    // Daily signups chart (last 30 days)
    db.select({ date: sql<string>`DATE(${usersTable.createdAt})`.as("date"), count: count() }).from(usersTable).where(gte(usersTable.createdAt, thirtyDaysAgo)).groupBy(sql`DATE(${usersTable.createdAt})`).orderBy(sql`DATE(${usersTable.createdAt})`),
    // Daily actions chart (last 30 days)
    db.select({ date: sql<string>`DATE(${responsesTable.createdAt})`.as("date"), count: count() }).from(responsesTable).where(gte(responsesTable.createdAt, thirtyDaysAgo)).groupBy(sql`DATE(${responsesTable.createdAt})`).orderBy(sql`DATE(${responsesTable.createdAt})`),
    // Activity by day of week
    db.select({ dow: sql<number>`EXTRACT(DOW FROM ${responsesTable.createdAt})`.as("dow"), count: count() }).from(responsesTable).where(gte(responsesTable.createdAt, thirtyDaysAgo)).groupBy(sql`EXTRACT(DOW FROM ${responsesTable.createdAt})`).orderBy(sql`EXTRACT(DOW FROM ${responsesTable.createdAt})`),
    // Activity by hour of day
    db.select({ hour: sql<number>`EXTRACT(HOUR FROM ${responsesTable.createdAt})`.as("hour"), count: count() }).from(responsesTable).where(gte(responsesTable.createdAt, thirtyDaysAgo)).groupBy(sql`EXTRACT(HOUR FROM ${responsesTable.createdAt})`).orderBy(sql`EXTRACT(HOUR FROM ${responsesTable.createdAt})`),
    db.select({ totalReviews: count() }).from(reviewsTable),
    db.select({ totalLocations: count() }).from(locationsTable),
    db.select({ status: responsesTable.status, count: count() }).from(responsesTable).groupBy(responsesTable.status),
    // Top 10 most active users
    db.select({
      userId: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
      totalActions: sql<number>`COUNT(${responsesTable.id})`.as("total_actions"),
      lastActive: sql<string>`MAX(${responsesTable.updatedAt})`.as("last_active"),
    })
      .from(usersTable)
      .leftJoin(responsesTable, eq(responsesTable.draftedBy, usersTable.id))
      .groupBy(usersTable.id)
      .orderBy(desc(sql`COUNT(${responsesTable.id})`))
      .limit(10),
    // All users for retention calculation
    db.select({ id: usersTable.id, createdAt: usersTable.createdAt }).from(usersTable),
    // Activity per user for retention + funnel
    db.select({
      draftedBy: responsesTable.draftedBy,
      firstAction: sql<string>`MIN(${responsesTable.createdAt})`.as("first_action"),
      lastAction: sql<string>`MAX(${responsesTable.updatedAt})`.as("last_action"),
      actionDays: sql<number>`COUNT(DISTINCT DATE(${responsesTable.createdAt}))`.as("action_days"),
    })
      .from(responsesTable)
      .where(isNotNull(responsesTable.draftedBy))
      .groupBy(responsesTable.draftedBy),
    // At-risk: had activity 30-7 days ago
    db.select({ draftedBy: responsesTable.draftedBy }).from(responsesTable).where(and(isNotNull(responsesTable.draftedBy), gte(responsesTable.updatedAt, thirtyDaysAgo), lt(responsesTable.updatedAt, sevenDaysAgo))),
    // Recent: had activity in last 7 days
    db.select({ draftedBy: responsesTable.draftedBy }).from(responsesTable).where(and(isNotNull(responsesTable.draftedBy), gte(responsesTable.updatedAt, sevenDaysAgo))),
    db.select({ signupsIn24h: count() }).from(usersTable).where(gte(usersTable.createdAt, twentyFourHoursAgo)),
    db.select({ activityIn24h: count() }).from(responsesTable).where(gte(responsesTable.createdAt, twentyFourHoursAgo)),
  ]);

  // ── Retention (computed in JS) ─────────────────────────────────────────
  const activityMap = new Map(
    activityByUser.map((r) => [r.draftedBy, { firstAction: r.firstAction, lastAction: r.lastAction, actionDays: Number(r.actionDays) }])
  );

  const DAY_MS = 24 * 60 * 60 * 1000;
  const day1Eligible = allUsers.filter((u) => now.getTime() - new Date(u.createdAt).getTime() > DAY_MS);
  const day1Retained = day1Eligible.filter((u) => {
    const a = activityMap.get(u.id);
    return a != null && new Date(a.firstAction).getTime() - new Date(u.createdAt).getTime() <= DAY_MS;
  });

  const week1Eligible = allUsers.filter((u) => now.getTime() - new Date(u.createdAt).getTime() > 7 * DAY_MS);
  const week1Retained = week1Eligible.filter((u) => {
    const a = activityMap.get(u.id);
    return a != null && new Date(a.firstAction).getTime() - new Date(u.createdAt).getTime() <= 7 * DAY_MS;
  });

  const recentSet = new Set(hadActivityRecent.map((r) => r.draftedBy));
  const atRiskCount = new Set(hadActivityBefore.filter((r) => !recentSet.has(r.draftedBy)).map((r) => r.draftedBy)).size;

  // ── Funnel ─────────────────────────────────────────────────────────────
  const usersWithAnyAction = activityByUser.length;
  const returningUsers = activityByUser.filter((r) => Number(r.actionDays) >= 2).length;
  const powerUserCount = activityByUser.filter((r) => Number(r.actionDays) >= 5).length;

  // ── Time to first action ───────────────────────────────────────────────
  const firstActionDelays = allUsers.map((u) => {
    const a = activityMap.get(u.id);
    if (!a) return null;
    return (new Date(a.firstAction).getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60);
  }).filter((v): v is number => v !== null);
  const avgHoursToFirstAction = firstActionDelays.length > 0
    ? Math.round(firstActionDelays.reduce((a, b) => a + b, 0) / firstActionDelays.length * 10) / 10
    : null;

  // ── Subscriptions ──────────────────────────────────────────────────────
  const planMap = new Map(orgsByPlan.map((p) => [p.plan, Number(p.count)]));
  const payingCount = (planMap.get("starter") ?? 0) + (planMap.get("growth") ?? 0) + (planMap.get("enterprise") ?? 0);

  function pctChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const totalUsersNum = Number(totalUsers);
  const newThisWeekNum = Number(newThisWeek);
  const actionsThisWeekNum = Number(actionsThisWeek);

  res.json({
    users: {
      total: totalUsersNum,
      newThisWeek: newThisWeekNum,
      newLastWeek: Number(newLastWeek),
      newThisWeekPct: pctChange(newThisWeekNum, Number(newLastWeek)),
      activeThisWeek: Number(activeThisWeek),
      dauToday: Number(dauToday),
    },
    actions: {
      total: Number(totalActions),
      thisWeek: actionsThisWeekNum,
      lastWeek: Number(actionsLastWeek),
      thisWeekPct: pctChange(actionsThisWeekNum, Number(actionsLastWeek)),
      today: Number(actionsToday),
      avgPerUser: totalUsersNum > 0 ? Math.round((Number(totalActions) / totalUsersNum) * 10) / 10 : 0,
    },
    subscriptions: {
      byPlan: orgsByPlan.map((p) => ({ plan: p.plan, count: Number(p.count) })),
      paying: payingCount,
      trial: planMap.get("trial") ?? 0,
    },
    charts: {
      dailySignups: dailySignups.map((d) => ({ date: d.date, count: Number(d.count) })),
      dailyActions: dailyActions.map((d) => ({ date: d.date, count: Number(d.count) })),
      activityByDow: activityByDow.map((d) => ({
        dow: Number(d.dow),
        label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][Number(d.dow)] ?? String(d.dow),
        count: Number(d.count),
      })),
      activityByHour: activityByHour.map((d) => ({
        hour: Number(d.hour),
        label: `${String(Number(d.hour)).padStart(2, "0")}:00`,
        count: Number(d.count),
      })),
    },
    funnel: {
      signedUp: totalUsersNum,
      firstAction: usersWithAnyAction,
      returningUsers,
      powerUsers: powerUserCount,
    },
    retention: {
      day1Eligible: day1Eligible.length,
      day1Retained: day1Retained.length,
      day1Rate: day1Eligible.length > 0 ? Math.round((day1Retained.length / day1Eligible.length) * 100) : 0,
      week1Eligible: week1Eligible.length,
      week1Retained: week1Retained.length,
      week1Rate: week1Eligible.length > 0 ? Math.round((week1Retained.length / week1Eligible.length) * 100) : 0,
      atRisk: atRiskCount,
    },
    features: {
      totalReviews: Number(totalReviews),
      totalLocations: Number(totalLocations),
      responsesByStatus: responsesByStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    },
    powerUsers: powerUsers.map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      createdAt: u.createdAt,
      totalActions: Number(u.totalActions),
      lastActive: u.lastActive,
    })),
    speed: {
      avgHoursToFirstAction,
    },
    alerts: {
      noSignupsIn24h: Number(signupsIn24h) === 0,
      noActivityIn24h: Number(activityIn24h) === 0,
    },
  });
});

// ─── GET /api/admin/activity ───────────────────────────────────────────────
router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: responsesTable.id,
      status: responsesTable.status,
      draftText: responsesTable.draftText,
      createdAt: responsesTable.createdAt,
      updatedAt: responsesTable.updatedAt,
      userName: usersTable.fullName,
      userEmail: usersTable.email,
      reviewerName: reviewsTable.reviewerName,
      reviewRating: reviewsTable.rating,
      reviewPlatform: reviewsTable.platform,
    })
    .from(responsesTable)
    .leftJoin(usersTable, eq(responsesTable.draftedBy, usersTable.id))
    .leftJoin(reviewsTable, eq(responsesTable.reviewId, reviewsTable.id))
    .orderBy(desc(responsesTable.createdAt))
    .limit(50);

  res.json(rows);
});

// ─── GET /api/admin/users ──────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      orgId: organizationsTable.id,
      orgName: organizationsTable.name,
      subscriptionPlan: organizationsTable.subscriptionPlan,
      subscriptionStatus: organizationsTable.subscriptionStatus,
      trialEndsAt: organizationsTable.trialEndsAt,
    })
    .from(usersTable)
    .leftJoin(organizationsTable, eq(usersTable.organizationId, organizationsTable.id))
    .orderBy(desc(usersTable.createdAt));

  res.json(rows);
});

// ─── PATCH /api/admin/orgs/:orgId/plan ────────────────────────────────────
router.patch("/admin/orgs/:orgId/plan", requireAdmin, async (req, res): Promise<void> => {
  const orgId = String(req.params.orgId);
  const { plan } = req.body as { plan: string };
  const allowed = ["trial", "starter", "growth", "enterprise", "monthly", "yearly"];
  if (!allowed.includes(plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  await db
    .update(organizationsTable)
    .set({ subscriptionPlan: plan as any, trialEndsAt: null })
    .where(eq(organizationsTable.id, orgId));
  res.json({ ok: true });
});

// ─── GET /api/admin/export/users ──────────────────────────────────────────
router.get("/admin/export/users", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      orgName: organizationsTable.name,
      subscriptionPlan: organizationsTable.subscriptionPlan,
      subscriptionStatus: organizationsTable.subscriptionStatus,
    })
    .from(usersTable)
    .leftJoin(organizationsTable, eq(usersTable.organizationId, organizationsTable.id))
    .orderBy(desc(usersTable.createdAt));

  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = "id,name,email,role,org,plan,status,joined\n";
  const csvRows = rows.map((r) =>
    [r.id, r.fullName, r.email, r.role, r.orgName, r.subscriptionPlan, r.subscriptionStatus, r.createdAt?.toISOString()].map(escape).join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  res.send(header + csvRows.join("\n"));
});

// ─── GET /api/admin/export/activity ───────────────────────────────────────
router.get("/admin/export/activity", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: responsesTable.id,
      status: responsesTable.status,
      createdAt: responsesTable.createdAt,
      userName: usersTable.fullName,
      userEmail: usersTable.email,
      reviewerName: reviewsTable.reviewerName,
      reviewRating: reviewsTable.rating,
      reviewPlatform: reviewsTable.platform,
    })
    .from(responsesTable)
    .leftJoin(usersTable, eq(responsesTable.draftedBy, usersTable.id))
    .leftJoin(reviewsTable, eq(responsesTable.reviewId, reviewsTable.id))
    .orderBy(desc(responsesTable.createdAt))
    .limit(5000);

  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = "id,user,email,reviewer,rating,platform,status,created_at\n";
  const csvRows = rows.map((r) =>
    [r.id, r.userName, r.userEmail, r.reviewerName, r.reviewRating, r.reviewPlatform, r.status, r.createdAt?.toISOString()].map(escape).join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=activity.csv");
  res.send(header + csvRows.join("\n"));
});

// ─── GET /api/admin/revenue ───────────────────────────────────────────────
router.get("/admin/revenue", requireAdmin, async (_req, res): Promise<void> => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY not set" });
    return;
  }

  const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  const now = new Date();
  const startOfMonth = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);

  try {
    const [subscriptions, invoicesThisMonth, recentInvoices] = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.invoices.list({ status: "paid", created: { gte: startOfMonth }, limit: 100 }),
      stripe.invoices.list({ status: "paid", limit: 10 }),
    ]);

    // MRR: sum monthly value of every active subscription
    const mrr = subscriptions.data.reduce((sum, sub) => {
      const item = sub.items.data[0];
      if (!item) return sum;
      const cents = item.price.unit_amount ?? 0;
      const interval = item.price.recurring?.interval;
      return sum + (interval === "year" ? cents / 12 : cents) / 100;
    }, 0);

    const revenueThisMonth = invoicesThisMonth.data.reduce(
      (sum, inv) => sum + (inv.amount_paid ?? 0) / 100, 0
    );

    const transactions = recentInvoices.data.map((inv) => ({
      id: inv.id,
      amount: (inv.amount_paid ?? 0) / 100,
      currency: inv.currency.toUpperCase(),
      date: inv.created,
      customerEmail: inv.customer_email ?? "—",
      description: inv.lines.data[0]?.description ?? "Subscription",
    }));

    res.json({ mrr, revenueThisMonth, transactions });
  } catch (err: any) {
    console.error("Stripe revenue error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to fetch revenue data" });
  }
});

export default router;
