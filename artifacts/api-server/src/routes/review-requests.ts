import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, locationsTable, reviewRequestsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { sendReviewRequestEmail } from "../lib/email";
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

router.post("/review-requests", requireAuth, async (req, res): Promise<void> => {
  const { locationId, customerName, customerEmail, platform } = req.body as {
    locationId?: string;
    customerName?: string;
    customerEmail?: string;
    platform?: string;
  };

  if (!locationId || !customerName || !customerEmail || !platform) {
    res.status(400).json({ error: "locationId, customerName, customerEmail, and platform are required" });
    return;
  }

  if (!["google", "zomato", "tripadvisor"].includes(platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, locationId), eq(locationsTable.organizationId, req.session.organizationId!)));

  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const reviewUrl = REVIEW_URLS[platform]?.(location);
  if (!reviewUrl) {
    res.status(400).json({ error: `No ${platform} ID configured for this location` });
    return;
  }

  // Save record first
  await db.insert(reviewRequestsTable).values({
    organizationId: req.session.organizationId!,
    locationId,
    customerName,
    customerEmail,
    platform,
    sentBy: req.session.userId ?? null,
  });

  // Send email (non-blocking — don't fail the request if email fails)
  sendReviewRequestEmail({
    to: customerEmail,
    customerName,
    locationName: location.name,
    platform,
    reviewUrl,
  }).catch((err) => logger.error({ err, customerEmail }, "Failed to send review request email"));

  res.status(201).json({ success: true });
});

export default router;
