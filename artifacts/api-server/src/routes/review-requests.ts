import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, locationsTable, reviewRequestsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { sendReviewRequestEmail } from "../lib/email";
import { sendSmsReviewRequest } from "../lib/sms";
import { logger } from "../lib/logger";
import crypto from "crypto";

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
  const { locationId, customerName, customerEmail, customerPhone, platform, sendVia } = req.body as {
    locationId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    platform?: string;
    sendVia?: "email" | "sms" | "both";
  };

  const via = sendVia ?? "email";

  if (!locationId || !customerName || !platform) {
    res.status(400).json({ error: "locationId, customerName, and platform are required" });
    return;
  }
  if ((via === "email" || via === "both") && !customerEmail) {
    res.status(400).json({ error: "customerEmail is required when sending by email" });
    return;
  }
  if ((via === "sms" || via === "both") && !customerPhone) {
    res.status(400).json({ error: "customerPhone is required when sending by SMS" });
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

  const funnelToken = crypto.randomBytes(20).toString("hex");
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  const funnelUrl = `${appUrl}/feedback/${funnelToken}`;

  await db.insert(reviewRequestsTable).values({
    organizationId: req.session.organizationId!,
    locationId,
    customerName,
    customerEmail: customerEmail ?? "",
    customerPhone: customerPhone ?? null,
    sendVia: via,
    platform,
    funnelToken,
    sentBy: req.session.userId ?? null,
  });

  if (via === "email" || via === "both") {
    sendReviewRequestEmail({
      to: customerEmail!,
      customerName,
      locationName: location.name,
      platform,
      reviewUrl: funnelUrl,
    }).catch((err) => logger.error({ err, customerEmail }, "Failed to send review request email"));
  }

  if (via === "sms" || via === "both") {
    sendSmsReviewRequest({
      to: customerPhone!,
      customerName,
      locationName: location.name,
      funnelUrl,
    }).catch((err) => logger.error({ err, customerPhone }, "Failed to send SMS review request"));
  }

  res.status(201).json({ success: true });
});

router.post("/review-requests/bulk", requireAuth, async (req, res): Promise<void> => {
  const { locationId, platform, sendVia, contacts } = req.body as {
    locationId?: string;
    platform?: string;
    sendVia?: "email" | "sms" | "both";
    contacts?: Array<{ name: string; email?: string; phone?: string }>;
  };

  const via = sendVia ?? "email";

  if (!locationId || !platform || !Array.isArray(contacts) || contacts.length === 0) {
    res.status(400).json({ error: "locationId, platform, and contacts are required" });
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

  if (!location) { res.status(404).json({ error: "Location not found" }); return; }

  const reviewUrl = REVIEW_URLS[platform]?.(location);
  if (!reviewUrl) {
    res.status(400).json({ error: `No ${platform} ID configured for this location` });
    return;
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  let sent = 0;

  for (const contact of contacts.slice(0, 500)) {
    if (!contact.name?.trim()) continue;
    if ((via === "email" || via === "both") && !contact.email) continue;
    if ((via === "sms" || via === "both") && !contact.phone) continue;

    const funnelToken = crypto.randomBytes(20).toString("hex");
    const funnelUrl = `${appUrl}/feedback/${funnelToken}`;

    await db.insert(reviewRequestsTable).values({
      organizationId: req.session.organizationId!,
      locationId,
      customerName: contact.name,
      customerEmail: contact.email ?? "",
      customerPhone: contact.phone ?? null,
      sendVia: via,
      platform,
      funnelToken,
      sentBy: req.session.userId ?? null,
    });

    if (via === "email" || via === "both") {
      sendReviewRequestEmail({ to: contact.email!, customerName: contact.name, locationName: location.name, platform, reviewUrl: funnelUrl })
        .catch((err) => logger.error({ err }, "Bulk email failed"));
    }
    if ((via === "sms" || via === "both") && contact.phone) {
      sendSmsReviewRequest({ to: contact.phone, customerName: contact.name, locationName: location.name, funnelUrl })
        .catch((err) => logger.error({ err }, "Bulk SMS failed"));
    }

    sent++;
  }

  res.status(201).json({ sent });
});

export default router;
