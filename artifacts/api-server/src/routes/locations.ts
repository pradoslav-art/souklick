import { Router, type IRouter } from "express";
import { eq, and, avg, count, sql } from "drizzle-orm";
import { db, locationsTable, reviewsTable, responsesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function getLocationWithStats(locationId: string) {
  const [location] = await db.select().from(locationsTable).where(eq(locationsTable.id, locationId));
  if (!location) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reviewStats = await db
    .select({
      avgRating: avg(reviewsTable.rating),
      reviewCount: count(reviewsTable.id),
    })
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.locationId, locationId),
        sql`${reviewsTable.reviewDate} >= ${thirtyDaysAgo}`
      )
    );

  const respondedCount = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.locationId, locationId),
        eq(reviewsTable.responseStatus, "responded"),
        sql`${reviewsTable.reviewDate} >= ${thirtyDaysAgo}`
      )
    );

  const totalCount = reviewStats[0]?.reviewCount ?? 0;
  const respCount = respondedCount[0]?.count ?? 0;
  const responseRate = totalCount > 0 ? (Number(respCount) / Number(totalCount)) * 100 : 0;

  return {
    id: location.id,
    organizationId: location.organizationId,
    name: location.name,
    address: location.address,
    googlePlaceId: location.googlePlaceId,
    zomatoRestaurantId: location.zomatoRestaurantId,
    tripadvisorLocationId: location.tripadvisorLocationId,
    isActive: location.isActive,
    createdAt: location.createdAt,
    averageRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
    reviewCount: Number(totalCount),
    responseRate: Math.round(responseRate),
  };
}

router.get("/locations", requireAuth, async (req, res): Promise<void> => {
  const locations = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  const locationsWithStats = await Promise.all(
    locations.map((loc) => getLocationWithStats(loc.id))
  );

  res.json(locationsWithStats.filter(Boolean));
});

router.post("/locations", requireAuth, async (req, res): Promise<void> => {
  const { name, address, googlePlaceId, zomatoRestaurantId, tripadvisorLocationId } = req.body;

  if (!name) {
    res.status(400).json({ error: "Location name is required" });
    return;
  }

  const [location] = await db.insert(locationsTable).values({
    organizationId: req.session.organizationId!,
    name,
    address,
    googlePlaceId,
    zomatoRestaurantId,
    tripadvisorLocationId,
  }).returning();

  res.status(201).json({
    id: location.id,
    organizationId: location.organizationId,
    name: location.name,
    address: location.address,
    googlePlaceId: location.googlePlaceId,
    zomatoRestaurantId: location.zomatoRestaurantId,
    tripadvisorLocationId: location.tripadvisorLocationId,
    isActive: location.isActive,
    createdAt: location.createdAt,
  });
});

router.get("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const locationWithStats = await getLocationWithStats(id);

  if (!locationWithStats || locationWithStats.organizationId !== req.session.organizationId) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  res.json(locationWithStats);
});

router.patch("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db.select().from(locationsTable).where(
    and(eq(locationsTable.id, id), eq(locationsTable.organizationId, req.session.organizationId!))
  );

  if (!existing) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  const { name, address, googlePlaceId, zomatoRestaurantId, tripadvisorLocationId, isActive } = req.body;
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (googlePlaceId !== undefined) updates.googlePlaceId = googlePlaceId;
  if (zomatoRestaurantId !== undefined) updates.zomatoRestaurantId = zomatoRestaurantId;
  if (tripadvisorLocationId !== undefined) updates.tripadvisorLocationId = tripadvisorLocationId;
  if (isActive !== undefined) updates.isActive = isActive;

  const [location] = await db
    .update(locationsTable)
    .set(updates)
    .where(eq(locationsTable.id, id))
    .returning();

  res.json({
    id: location.id,
    organizationId: location.organizationId,
    name: location.name,
    address: location.address,
    googlePlaceId: location.googlePlaceId,
    zomatoRestaurantId: location.zomatoRestaurantId,
    tripadvisorLocationId: location.tripadvisorLocationId,
    isActive: location.isActive,
    createdAt: location.createdAt,
  });
});

router.delete("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db.select().from(locationsTable).where(
    and(eq(locationsTable.id, id), eq(locationsTable.organizationId, req.session.organizationId!))
  );

  if (!existing) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  await db.delete(locationsTable).where(eq(locationsTable.id, id));

  res.json({ success: true, message: "Location deleted" });
});

export default router;
