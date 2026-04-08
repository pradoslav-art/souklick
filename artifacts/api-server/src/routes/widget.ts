import { Router, type IRouter } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { db, locationsTable, reviewsTable } from "@workspace/db";
import { requireAuth as auth } from "../middlewares/auth";

const router: IRouter = Router();

// Public widget data endpoint — no auth, CORS open
router.get("/api/widget/:token", async (req, res): Promise<void> => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.widgetToken, token));

  if (!location) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  // Top 5 reviews rated 4★ or above, most recent first
  const reviews = await db
    .select({
      reviewerName: reviewsTable.reviewerName,
      rating: reviewsTable.rating,
      reviewText: reviewsTable.reviewText,
      reviewDate: reviewsTable.reviewDate,
      platform: reviewsTable.platform,
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.locationId, location.id), gte(reviewsTable.rating, 4)))
    .orderBy(desc(reviewsTable.reviewDate))
    .limit(5);

  res.json({
    locationName: location.name,
    reviews: reviews.map((r) => ({
      reviewerName: r.reviewerName,
      rating: r.rating,
      reviewText: r.reviewText,
      reviewDate: r.reviewDate,
      platform: r.platform,
    })),
  });
});

// Generate (or reveal) the widget token for a location — protected
router.post("/api/locations/:id/widget-token", auth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, id), eq(locationsTable.organizationId, req.session.organizationId!)));

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  // Reuse existing token or generate a new one
  const token = location.widgetToken ?? crypto.randomUUID();

  if (!location.widgetToken) {
    await db.update(locationsTable).set({ widgetToken: token }).where(eq(locationsTable.id, id));
  }

  res.json({ token });
});

export default router;
