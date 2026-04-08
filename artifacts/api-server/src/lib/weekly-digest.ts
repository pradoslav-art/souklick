import { and, gte, inArray, eq, avg, count, sql, or, ne } from "drizzle-orm";
import { db, organizationsTable, usersTable, locationsTable, reviewsTable } from "@workspace/db";
import { sendWeeklyDigestEmail } from "./email";
import { logger } from "./logger";

interface LocationDigest {
  name: string;
  newReviews: number;
  avgRating: number | null;
  responseRate: number; // 0–100
  worstReview: { reviewerName: string; rating: number; reviewText: string | null } | null;
}

async function getLocationDigest(locationId: string, since: Date): Promise<LocationDigest> {
  const [location] = await db.select({ name: locationsTable.name }).from(locationsTable).where(eq(locationsTable.id, locationId));

  const [stats] = await db
    .select({ total: count(reviewsTable.id), avgRating: avg(reviewsTable.rating) })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.locationId, locationId), sql`${reviewsTable.reviewDate} >= ${since}`));

  const [responded] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.locationId, locationId), eq(reviewsTable.responseStatus, "responded"), sql`${reviewsTable.reviewDate} >= ${since}`));

  const total = Number(stats?.total ?? 0);
  const respCount = Number(responded?.count ?? 0);
  const responseRate = total > 0 ? Math.round((respCount / total) * 100) : 0;

  // Get the lowest-rated review this week (needs attention)
  const worstReviews = await db
    .select({ reviewerName: reviewsTable.reviewerName, rating: reviewsTable.rating, reviewText: reviewsTable.reviewText })
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.locationId, locationId),
        sql`${reviewsTable.reviewDate} >= ${since}`,
        sql`${reviewsTable.rating} <= 3`
      )
    )
    .orderBy(reviewsTable.rating)
    .limit(1);

  return {
    name: location?.name ?? "Unknown",
    newReviews: total,
    avgRating: stats?.avgRating != null ? Number(Number(stats.avgRating).toFixed(1)) : null,
    responseRate,
    worstReview: worstReviews[0] ?? null,
  };
}

export async function sendWeeklyDigests(): Promise<void> {
  // Only run on Mondays
  if (new Date().getDay() !== 1) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all orgs with an active subscription or unexpired trial
  const now = new Date();
  const activeOrgs = await db
    .select()
    .from(organizationsTable)
    .where(
      or(
        // Paid and active
        and(ne(organizationsTable.subscriptionPlan, "trial"), eq(organizationsTable.subscriptionStatus, "active")),
        // Trial still valid
        and(eq(organizationsTable.subscriptionPlan, "trial"), gte(organizationsTable.trialEndsAt, now))
      )
    );

  let sent = 0;
  let failed = 0;

  for (const org of activeOrgs) {
    try {
      const locations = await db
        .select({ id: locationsTable.id })
        .from(locationsTable)
        .where(and(eq(locationsTable.organizationId, org.id), eq(locationsTable.isActive, true)));

      if (locations.length === 0) continue;

      const digests = await Promise.all(locations.map((l) => getLocationDigest(l.id, sevenDaysAgo)));

      // Skip if there were no reviews at all this week — nothing useful to send
      const totalNewReviews = digests.reduce((sum, d) => sum + d.newReviews, 0);
      if (totalNewReviews === 0) continue;

      const users = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.organizationId, org.id));

      for (const user of users) {
        try {
          await sendWeeklyDigestEmail({
            to: user.email,
            fullName: user.fullName,
            weekStart: sevenDaysAgo,
            weekEnd: now,
            locations: digests,
          });
          sent++;
        } catch (err) {
          logger.error({ err, email: user.email }, "Failed to send weekly digest");
          failed++;
        }
      }
    } catch (err) {
      logger.error({ err, orgId: org.id }, "Failed to build weekly digest for org");
      failed++;
    }
  }

  logger.info({ sent, failed }, "Weekly digest run complete");
}
