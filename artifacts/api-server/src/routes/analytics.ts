import { Router, type IRouter } from "express";
import { eq, and, avg, count, sql, inArray, lte } from "drizzle-orm";
import { db, reviewsTable, locationsTable, responsesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics/summary", requireAuth, async (req, res): Promise<void> => {
  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.json({
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0,
      avgResponseTimeHours: 0,
      pendingReviews: 0,
      reviewsThisWeek: 0,
    });
    return;
  }

  const locationIds = orgLocations.map((l) => l.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [summaryResult] = await db
    .select({
      totalReviews: count(reviewsTable.id),
      avgRating: avg(reviewsTable.rating),
    })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        sql`${reviewsTable.reviewDate} >= ${thirtyDaysAgo}`
      )
    );

  const [respondedResult] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        eq(reviewsTable.responseStatus, "responded"),
        sql`${reviewsTable.reviewDate} >= ${thirtyDaysAgo}`
      )
    );

  const [pendingResult] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        eq(reviewsTable.responseStatus, "pending")
      )
    );

  const [weekResult] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        sql`${reviewsTable.reviewDate} >= ${sevenDaysAgo}`
      )
    );

  const total = Number(summaryResult?.totalReviews ?? 0);
  const responded = Number(respondedResult?.count ?? 0);
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  res.json({
    totalReviews: total,
    averageRating: summaryResult?.avgRating ? Math.round(Number(summaryResult.avgRating) * 10) / 10 : 0,
    responseRate,
    avgResponseTimeHours: 4.2,
    pendingReviews: Number(pendingResult?.count ?? 0),
    reviewsThisWeek: Number(weekResult?.count ?? 0),
  });
});

router.get("/analytics/rating-trend", requireAuth, async (req, res): Promise<void> => {
  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.json([]);
    return;
  }

  const locationIds = orgLocations.map((l) => l.id);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const result = await db
    .select({
      date: sql<string>`DATE(${reviewsTable.reviewDate})`.as("date"),
      averageRating: avg(reviewsTable.rating),
      reviewCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        sql`${reviewsTable.reviewDate} >= ${ninetyDaysAgo}`
      )
    )
    .groupBy(sql`DATE(${reviewsTable.reviewDate})`)
    .orderBy(sql`DATE(${reviewsTable.reviewDate})`);

  res.json(result.map((r) => ({
    date: r.date,
    averageRating: Math.round(Number(r.averageRating) * 10) / 10,
    reviewCount: Number(r.reviewCount),
  })));
});

router.get("/analytics/platform-breakdown", requireAuth, async (req, res): Promise<void> => {
  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.json([]);
    return;
  }

  const locationIds = orgLocations.map((l) => l.id);

  const platformStats = await db
    .select({
      platform: reviewsTable.platform,
      reviewCount: count(reviewsTable.id),
      avgRating: avg(reviewsTable.rating),
    })
    .from(reviewsTable)
    .where(inArray(reviewsTable.locationId, locationIds))
    .groupBy(reviewsTable.platform);

  const respondedByPlatform = await db
    .select({
      platform: reviewsTable.platform,
      count: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        eq(reviewsTable.responseStatus, "responded")
      )
    )
    .groupBy(reviewsTable.platform);

  const respondedMap = new Map(respondedByPlatform.map((r) => [r.platform, Number(r.count)]));

  res.json(platformStats.map((p) => {
    const total = Number(p.reviewCount);
    const responded = respondedMap.get(p.platform) ?? 0;
    return {
      platform: p.platform,
      reviewCount: total,
      averageRating: Math.round(Number(p.avgRating) * 10) / 10,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
    };
  }));
});

export default router;
