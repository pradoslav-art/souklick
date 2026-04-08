import { db, competitorsTable, competitorSnapshotsTable } from "@workspace/db";
import { fetchPlaceRating } from "./google-places";
import { logger } from "./logger";

export async function refreshAllCompetitors(): Promise<void> {
  const competitors = await db.select().from(competitorsTable);
  if (competitors.length === 0) return;

  let updated = 0;
  let failed = 0;

  for (const competitor of competitors) {
    try {
      const data = await fetchPlaceRating(competitor.googlePlaceId);
      if (!data) { failed++; continue; }

      await db.insert(competitorSnapshotsTable).values({
        id: crypto.randomUUID(),
        competitorId: competitor.id,
        rating: data.rating != null ? String(data.rating) : null,
        reviewCount: data.reviewCount,
      });
      updated++;
    } catch (err) {
      logger.error({ err, competitorId: competitor.id }, "Failed to refresh competitor rating");
      failed++;
    }
  }

  logger.info({ updated, failed }, "Competitor refresh complete");
}
