import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, reviewRequestsTable, locationsTable, privateFeedbackTable } from "@workspace/db";
import { sendPrivateFeedbackAlertEmail } from "../lib/email";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const REVIEW_URLS: Record<string, (location: typeof locationsTable.$inferSelect) => string | null> = {
  google: (loc) => loc.googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${loc.googlePlaceId}`
    : null,
  zomato: (loc) => loc.zomatoRestaurantId
    ? `https://www.zomato.com/restaurant/${loc.zomatoRestaurantId}`
    : null,
  tripadvisor: (loc) => loc.tripadvisorLocationId
    ? `https://www.tripadvisor.com/Restaurant_Review-d${loc.tripadvisorLocationId}`
    : null,
};

// GET /api/funnel/:token — public, returns enough info to render the funnel page
router.get("/funnel/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token);

  const [request] = await db
    .select({
      id: reviewRequestsTable.id,
      customerName: reviewRequestsTable.customerName,
      platform: reviewRequestsTable.platform,
      locationName: locationsTable.name,
    })
    .from(reviewRequestsTable)
    .leftJoin(locationsTable, eq(reviewRequestsTable.locationId, locationsTable.id))
    .where(eq(reviewRequestsTable.funnelToken, token));

  if (!request) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    customerName: request.customerName,
    locationName: request.locationName,
    platform: request.platform,
  });
});

// POST /api/funnel/:token — public, handles the customer's response
// Body: { rating: 1-5, feedbackText?: string }
// Returns: { redirect: string } for happy customers, { ok: true } for private feedback
router.post("/funnel/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token);
  const { rating, feedbackText } = req.body as { rating?: number; feedbackText?: string };

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be 1–5" });
    return;
  }

  const [request] = await db
    .select()
    .from(reviewRequestsTable)
    .leftJoin(locationsTable, eq(reviewRequestsTable.locationId, locationsTable.id))
    .where(eq(reviewRequestsTable.funnelToken, token));

  if (!request) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const reqRow = request.review_requests;
  const location = request.locations;

  // Happy customer (4–5 stars) → mark completed, send them to the review platform
  if (rating >= 4) {
    await db
      .update(reviewRequestsTable)
      .set({ completedAt: new Date() })
      .where(eq(reviewRequestsTable.funnelToken, token));
    const reviewUrl = location ? REVIEW_URLS[reqRow.platform]?.(location) : null;
    res.json({ redirect: reviewUrl ?? null });
    return;
  }

  // Unhappy customer (1–3 stars) → store private feedback + alert business
  await db.insert(privateFeedbackTable).values({
    funnelToken: token,
    locationId: reqRow.locationId,
    organizationId: reqRow.organizationId,
    customerName: reqRow.customerName,
    rating,
    feedbackText: feedbackText ?? null,
  });

  // Alert the business owner by email (non-blocking)
  if (location) {
    sendPrivateFeedbackAlertEmail({
      organizationId: reqRow.organizationId,
      locationName: location.name,
      customerName: reqRow.customerName,
      rating,
      feedbackText: feedbackText ?? null,
    }).catch((err) => logger.error({ err }, "Failed to send private feedback alert"));
  }

  res.json({ ok: true });
});

// GET /api/private-feedback?locationId=... — authenticated, returns feedback for a location
router.get("/private-feedback", requireAuth, async (req, res): Promise<void> => {
  const locationId = String(req.query.locationId ?? "");
  if (!locationId) { res.status(400).json({ error: "locationId required" }); return; }

  const rows = await db
    .select()
    .from(privateFeedbackTable)
    .where(
      and(
        eq(privateFeedbackTable.locationId, locationId),
        eq(privateFeedbackTable.organizationId, req.session.organizationId!)
      )
    )
    .orderBy(desc(privateFeedbackTable.submittedAt));

  res.json(rows);
});

export default router;
