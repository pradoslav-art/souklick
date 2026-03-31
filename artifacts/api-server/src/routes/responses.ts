import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, responsesTable, reviewsTable, locationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatResponse(r: typeof responsesTable.$inferSelect) {
  return {
    id: r.id,
    reviewId: r.reviewId,
    draftedBy: r.draftedBy,
    draftText: r.draftText,
    finalText: r.finalText,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

async function verifyReviewAccess(reviewId: string, organizationId: string) {
  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  if (!review) return null;

  const [location] = await db
    .select()
    .from(locationsTable)
    .where(and(eq(locationsTable.id, review.locationId), eq(locationsTable.organizationId, organizationId)));

  return location ? review : null;
}

router.post("/responses", requireAuth, async (req, res): Promise<void> => {
  const { reviewId, draftText } = req.body;

  if (!reviewId || !draftText) {
    res.status(400).json({ error: "reviewId and draftText are required" });
    return;
  }

  const review = await verifyReviewAccess(reviewId, req.session.organizationId!);
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const [response] = await db.insert(responsesTable).values({
    reviewId,
    draftedBy: req.session.userId,
    draftText,
  }).returning();

  await db.update(reviewsTable).set({ responseStatus: "draft_saved" }).where(eq(reviewsTable.id, reviewId));

  res.status(201).json(formatResponse(response));
});

router.patch("/responses/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [existing] = await db.select().from(responsesTable).where(eq(responsesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Response not found" });
    return;
  }

  const review = await verifyReviewAccess(existing.reviewId, req.session.organizationId!);
  if (!review) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updates: Record<string, unknown> = {};
  const { draftText, finalText, status } = req.body;
  if (draftText !== undefined) updates.draftText = draftText;
  if (finalText !== undefined) updates.finalText = finalText;
  if (status !== undefined) updates.status = status;

  const [updated] = await db
    .update(responsesTable)
    .set(updates)
    .where(eq(responsesTable.id, id))
    .returning();

  res.json(formatResponse(updated));
});

router.post("/responses/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { finalText } = req.body;

  if (!finalText) {
    res.status(400).json({ error: "finalText is required" });
    return;
  }

  const [existing] = await db.select().from(responsesTable).where(eq(responsesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Response not found" });
    return;
  }

  const review = await verifyReviewAccess(existing.reviewId, req.session.organizationId!);
  if (!review) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [updated] = await db
    .update(responsesTable)
    .set({ finalText, status: "posted" })
    .where(eq(responsesTable.id, id))
    .returning();

  await db.update(reviewsTable).set({ responseStatus: "responded" }).where(eq(reviewsTable.id, existing.reviewId));

  res.json(formatResponse(updated));
});

export default router;
