import { Router, type IRouter } from "express";
import { eq, and, lte, gte, desc, asc, sql, count, inArray } from "drizzle-orm";
import { db, reviewsTable, locationsTable, responsesTable, usersTable, autoResponseRulesTable } from "@workspace/db";
import { or, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { sendReviewAlerts } from "../lib/email";
import { sendSmsAlert, sendWhatsAppAlert } from "../lib/sms";
import { tagReview } from "./ai";

const router: IRouter = Router();

function formatReview(review: typeof reviewsTable.$inferSelect, locationName: string) {
  return {
    id: review.id,
    locationId: review.locationId,
    platform: review.platform,
    platformReviewId: review.platformReviewId,
    reviewerName: review.reviewerName,
    reviewerProfileUrl: review.reviewerProfileUrl,
    rating: review.rating,
    reviewText: review.reviewText,
    reviewDate: review.reviewDate,
    responseStatus: review.responseStatus,
    sentimentScore: review.sentimentScore ? Number(review.sentimentScore) : null,
    tags: review.tags ?? [],
    locationName,
    createdAt: review.createdAt,
  };
}

router.get("/reviews/priority-count", requireAuth, async (req, res): Promise<void> => {
  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.json({ count: 0 });
    return;
  }

  const locationIds = orgLocations.map((l) => l.id);

  const [result] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(
      and(
        inArray(reviewsTable.locationId, locationIds),
        lte(reviewsTable.rating, 3),
        eq(reviewsTable.responseStatus, "pending")
      )
    );

  res.json({ count: Number(result?.count ?? 0) });
});

router.get("/reviews", requireAuth, async (req, res): Promise<void> => {
  const { locationId, platform, rating, status, priorityOnly, page = "1", limit = "20" } = req.query;

  const orgLocations = await db
    .select({ id: locationsTable.id, name: locationsTable.name })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.json({ reviews: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    return;
  }

  const locationMap = new Map(orgLocations.map((l) => [l.id, l.name]));
  let allowedLocationIds = orgLocations.map((l) => l.id);

  if (locationId && typeof locationId === "string") {
    if (!locationMap.has(locationId)) {
      res.status(403).json({ error: "Access denied to this location" });
      return;
    }
    allowedLocationIds = [locationId];
  }

  const pageNum = Math.max(1, parseInt(String(page), 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [inArray(reviewsTable.locationId, allowedLocationIds)];

  if (platform && typeof platform === "string") {
    conditions.push(eq(reviewsTable.platform, platform as "google" | "zomato" | "tripadvisor"));
  }

  if (rating && typeof rating === "string") {
    conditions.push(eq(reviewsTable.rating, parseInt(rating, 10)));
  }

  if (status && typeof status === "string") {
    conditions.push(eq(reviewsTable.responseStatus, status as "pending" | "draft_saved" | "responded" | "skipped"));
  }

  if (priorityOnly === "true") {
    conditions.push(lte(reviewsTable.rating, 3));
    conditions.push(eq(reviewsTable.responseStatus, "pending"));
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ count: count(reviewsTable.id) })
    .from(reviewsTable)
    .where(whereClause);

  const total = Number(totalResult?.count ?? 0);

  const orderBy = priorityOnly === "true"
    ? asc(reviewsTable.reviewDate)
    : desc(reviewsTable.reviewDate);

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  const formattedReviews = reviews.map((r) =>
    formatReview(r, locationMap.get(r.locationId) ?? "Unknown Location")
  );

  res.json({
    reviews: formattedReviews,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const { locationId, platform, reviewerName, rating, reviewText, reviewDate } = req.body;

  if (!locationId || !platform || !reviewerName || !rating) {
    res.status(400).json({ error: "Missing required fields" });
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

  const ratingNum = parseInt(String(rating), 10);

  const [review] = await db.insert(reviewsTable).values({
    locationId,
    platform,
    platformReviewId: `manual-${crypto.randomUUID()}`,
    reviewerName,
    rating: ratingNum,
    reviewText,
    reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
  }).returning();

  // Send alerts to org users who meet the rating threshold
  try {
    const alertUsers = await db
      .select({
        email: usersTable.email,
        notificationEmail: usersTable.notificationEmail,
        notificationPhone: usersTable.notificationPhone,
        notificationSms: usersTable.notificationSms,
        notificationWhatsapp: usersTable.notificationWhatsapp,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.organizationId, location.organizationId),
          gte(usersTable.notificationMinRating, ratingNum)
        )
      );

    const origin = req.headers.origin || process.env.APP_URL || "http://localhost:5173";
    const stars = "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);
    const excerpt = reviewText ? reviewText.slice(0, 120) + (reviewText.length > 120 ? "…" : "") : "";
    const smsBody = `${stars} New ${ratingNum}★ review at ${location.name}\nFrom: ${reviewerName}${excerpt ? `\n"${excerpt}"` : ""}\nRespond: ${origin}`;

    const emailRecipients = alertUsers.filter((u) => u.notificationEmail).map((u) => u.email);
    if (emailRecipients.length > 0) {
      sendReviewAlerts({
        to: emailRecipients,
        reviewerName,
        rating: ratingNum,
        reviewText: reviewText ?? null,
        locationName: location.name,
        platform,
        appUrl: origin,
      }).catch((err) => console.error("Email alert failed:", err?.message));
    }

    for (const user of alertUsers) {
      if (!user.notificationPhone) continue;
      if (user.notificationSms) {
        sendSmsAlert({ to: user.notificationPhone, message: smsBody })
          .catch((err) => console.error("SMS alert failed:", err?.message));
      }
      if (user.notificationWhatsapp) {
        sendWhatsAppAlert({ to: user.notificationPhone, message: smsBody })
          .catch((err) => console.error("WhatsApp alert failed:", err?.message));
      }
    }
  } catch (err: any) {
    console.error("Alert query failed:", err?.message);
  }

  // Auto-tag in background (non-blocking)
  if (reviewText) {
    tagReview(review.id, reviewText).catch(() => {});
  }

  // Apply auto-response rules (non-blocking)
  applyAutoResponseRules(review.id, location.organizationId, locationId, platform, ratingNum).catch(() => {});

  res.status(201).json(formatReview(review, location.name));
});

router.get("/reviews/export", requireAuth, async (req, res): Promise<void> => {
  const { locationId, platform, rating, status } = req.query;

  const orgLocations = await db
    .select({ id: locationsTable.id, name: locationsTable.name })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  if (orgLocations.length === 0) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=reviews.csv");
    res.send("No reviews found");
    return;
  }

  const locationMap = new Map(orgLocations.map((l) => [l.id, l.name]));
  let allowedLocationIds = orgLocations.map((l) => l.id);

  if (locationId && typeof locationId === "string" && locationMap.has(locationId)) {
    allowedLocationIds = [locationId];
  }

  const conditions = [inArray(reviewsTable.locationId, allowedLocationIds)];
  if (platform && typeof platform === "string") conditions.push(eq(reviewsTable.platform, platform as any));
  if (rating && typeof rating === "string") conditions.push(eq(reviewsTable.rating, parseInt(rating, 10)));
  if (status && typeof status === "string") conditions.push(eq(reviewsTable.responseStatus, status as any));

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(...conditions))
    .orderBy(desc(reviewsTable.reviewDate));

  const escape = (v: string | null | undefined) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };

  const header = "Date,Location,Platform,Reviewer,Rating,Status,Review Text,Tags";
  const rows = reviews.map((r) => [
    r.reviewDate ? new Date(r.reviewDate).toISOString().split("T")[0] : "",
    escape(locationMap.get(r.locationId) ?? ""),
    r.platform,
    escape(r.reviewerName),
    r.rating,
    r.responseStatus,
    escape(r.reviewText),
    escape((r.tags ?? []).join("; ")),
  ].join(","));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=reviews-${new Date().toISOString().split("T")[0]}.csv`);
  res.send([header, ...rows].join("\n"));
});

router.post("/reviews/bulk-skip", requireAuth, async (req, res): Promise<void> => {
  const { reviewIds } = req.body as { reviewIds: string[] };

  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    res.status(400).json({ error: "reviewIds must be a non-empty array" });
    return;
  }

  // Verify all reviews belong to this org
  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  const locationIds = orgLocations.map((l) => l.id);

  await db
    .update(reviewsTable)
    .set({ responseStatus: "skipped" })
    .where(and(inArray(reviewsTable.id, reviewIds), inArray(reviewsTable.locationId, locationIds)));

  res.json({ success: true, count: reviewIds.length });
});

router.post("/reviews/bulk-respond", requireAuth, async (req, res): Promise<void> => {
  const { reviewIds, responseText } = req.body as { reviewIds: string[]; responseText: string };

  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    res.status(400).json({ error: "reviewIds must be a non-empty array" });
    return;
  }
  if (!responseText?.trim()) {
    res.status(400).json({ error: "responseText is required" });
    return;
  }

  const orgLocations = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(eq(locationsTable.organizationId, req.session.organizationId!));

  const locationIds = orgLocations.map((l) => l.id);

  // Fetch matching reviews
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(and(inArray(reviewsTable.id, reviewIds), inArray(reviewsTable.locationId, locationIds)));

  // Insert approved responses for each
  for (const review of reviews) {
    await db.insert(responsesTable).values({
      reviewId: review.id,
      draftText: responseText,
      finalText: responseText,
      draftedBy: req.session.userId ?? null,
      status: "approved",
    });
    await db.update(reviewsTable).set({ responseStatus: "responded" }).where(eq(reviewsTable.id, review.id));
  }

  res.json({ success: true, count: reviews.length });
});

router.get("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, review.locationId), eq(locationsTable.organizationId, req.session.organizationId!)));

  if (!location) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const responses = await db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.reviewId, id))
    .orderBy(desc(responsesTable.createdAt));

  res.json({
    ...formatReview(review, location.name),
    responses: responses.map((r) => ({
      id: r.id,
      reviewId: r.reviewId,
      draftedBy: r.draftedBy,
      draftText: r.draftText,
      finalText: r.finalText,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
});

router.patch("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, review.locationId), eq(locationsTable.organizationId, req.session.organizationId!)));

  if (!location) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const { responseStatus } = req.body;

  const [updated] = await db
    .update(reviewsTable)
    .set({ responseStatus })
    .where(eq(reviewsTable.id, id))
    .returning();

  res.json(formatReview(updated, location.name));
});

async function applyAutoResponseRules(
  reviewId: string,
  organizationId: string,
  locationId: string,
  platform: string,
  rating: number
): Promise<void> {
  const rules = await db
    .select()
    .from(autoResponseRulesTable)
    .where(
      and(
        eq(autoResponseRulesTable.organizationId, organizationId),
        eq(autoResponseRulesTable.isActive, true),
        lte(autoResponseRulesTable.minRating, rating),
        gte(autoResponseRulesTable.maxRating, rating),
        or(isNull(autoResponseRulesTable.locationId), eq(autoResponseRulesTable.locationId, locationId)),
        or(isNull(autoResponseRulesTable.platform), eq(autoResponseRulesTable.platform, platform))
      )
    )
    .limit(1);

  if (rules.length === 0) return;

  const rule = rules[0];

  await db.insert(responsesTable).values({
    reviewId,
    draftedBy: null,
    draftText: rule.responseText,
    finalText: rule.responseText,
    status: "posted",
  });

  await db
    .update(reviewsTable)
    .set({ responseStatus: "responded" })
    .where(eq(reviewsTable.id, reviewId));
}

export default router;
