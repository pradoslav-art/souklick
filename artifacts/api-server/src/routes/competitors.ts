import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, competitorsTable, competitorSnapshotsTable, locationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchPlaceRating } from "../lib/google-places";

const router: IRouter = Router();

// List competitors for a location
router.get("/competitors", requireAuth, async (req, res): Promise<void> => {
  const { locationId } = req.query as { locationId?: string };
  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  // Verify location belongs to org
  const [location] = await db.select().from(locationsTable).where(
    and(eq(locationsTable.id, locationId), eq(locationsTable.organizationId, req.session.organizationId!))
  );
  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const competitors = await db.select().from(competitorsTable).where(
    and(eq(competitorsTable.locationId, locationId), eq(competitorsTable.organizationId, req.session.organizationId!))
  );

  // For each competitor, get their last snapshot and 30-day history
  const result = await Promise.all(competitors.map(async (c) => {
    const snapshots = await db
      .select()
      .from(competitorSnapshotsTable)
      .where(eq(competitorSnapshotsTable.competitorId, c.id))
      .orderBy(desc(competitorSnapshotsTable.capturedAt))
      .limit(30);

    const latest = snapshots[0];
    return {
      id: c.id,
      name: c.name,
      googlePlaceId: c.googlePlaceId,
      currentRating: latest?.rating != null ? Number(latest.rating) : null,
      currentReviewCount: latest?.reviewCount ?? null,
      lastUpdated: latest?.capturedAt ?? null,
      snapshots: snapshots.reverse().map(s => ({
        rating: s.rating != null ? Number(s.rating) : null,
        reviewCount: s.reviewCount,
        capturedAt: s.capturedAt,
      })),
    };
  }));

  res.json({
    googleApiConfigured: !!process.env["GOOGLE_PLACES_API_KEY"],
    competitors: result,
  });
});

// Add a competitor
router.post("/competitors", requireAuth, async (req, res): Promise<void> => {
  const { locationId, name, googlePlaceId } = req.body as {
    locationId: string;
    name: string;
    googlePlaceId: string;
  };

  if (!locationId || !name || !googlePlaceId) {
    res.status(400).json({ error: "locationId, name, and googlePlaceId are required" });
    return;
  }

  // Verify location belongs to org
  const [location] = await db.select().from(locationsTable).where(
    and(eq(locationsTable.id, locationId), eq(locationsTable.organizationId, req.session.organizationId!))
  );
  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const [competitor] = await db.insert(competitorsTable).values({
    id: crypto.randomUUID(),
    organizationId: req.session.organizationId!,
    locationId,
    name,
    googlePlaceId,
  }).returning();

  // Immediately fetch their current rating
  try {
    const placeData = await fetchPlaceRating(googlePlaceId);
    if (placeData) {
      await db.insert(competitorSnapshotsTable).values({
        id: crypto.randomUUID(),
        competitorId: competitor.id,
        rating: placeData.rating != null ? String(placeData.rating) : null,
        reviewCount: placeData.reviewCount,
      });
    }
  } catch {
    // Non-fatal — snapshot will be picked up by next daily refresh
  }

  res.status(201).json({ id: competitor.id, name: competitor.name, googlePlaceId: competitor.googlePlaceId });
});

// Delete a competitor
router.delete("/competitors/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db.select().from(competitorsTable).where(
    and(eq(competitorsTable.id, id), eq(competitorsTable.organizationId, req.session.organizationId!))
  );
  if (!existing) {
    res.status(404).json({ error: "Competitor not found" });
    return;
  }

  await db.delete(competitorsTable).where(eq(competitorsTable.id, id));
  res.json({ success: true });
});

// Manual refresh — re-fetch ratings for all competitors at a location
router.post("/competitors/refresh", requireAuth, async (req, res): Promise<void> => {
  const { locationId } = req.body as { locationId: string };
  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  const competitors = await db.select().from(competitorsTable).where(
    and(eq(competitorsTable.locationId, locationId), eq(competitorsTable.organizationId, req.session.organizationId!))
  );

  const results = await Promise.allSettled(competitors.map(async (c) => {
    const data = await fetchPlaceRating(c.googlePlaceId);
    if (!data) return;
    await db.insert(competitorSnapshotsTable).values({
      id: crypto.randomUUID(),
      competitorId: c.id,
      rating: data.rating != null ? String(data.rating) : null,
      reviewCount: data.reviewCount,
    });
  }));

  const updated = results.filter(r => r.status === "fulfilled").length;
  res.json({ updated });
});

export default router;
