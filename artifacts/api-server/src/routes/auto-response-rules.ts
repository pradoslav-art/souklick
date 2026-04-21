import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, autoResponseRulesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/auto-response-rules", requireAuth, async (req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(autoResponseRulesTable)
    .where(eq(autoResponseRulesTable.organizationId, req.session.organizationId!));
  res.json(rules);
});

router.post("/auto-response-rules", requireAuth, async (req, res): Promise<void> => {
  const { locationId, platform, minRating, maxRating, responseText } = req.body as {
    locationId?: string;
    platform?: string;
    minRating?: number;
    maxRating?: number;
    responseText?: string;
  };

  if (!responseText?.trim()) {
    res.status(400).json({ error: "responseText is required" });
    return;
  }
  const min = Number(minRating ?? 5);
  const max = Number(maxRating ?? 5);
  if (min < 1 || max > 5 || min > max) {
    res.status(400).json({ error: "Invalid rating range" });
    return;
  }

  const [rule] = await db.insert(autoResponseRulesTable).values({
    organizationId: req.session.organizationId!,
    locationId: locationId ?? null,
    platform: platform ?? null,
    minRating: min,
    maxRating: max,
    responseText,
  }).returning();

  res.status(201).json(rule);
});

router.patch("/auto-response-rules/:id", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { isActive, responseText } = req.body as { isActive?: boolean; responseText?: string };

  const updates: Partial<typeof autoResponseRulesTable.$inferInsert> = {};
  if (typeof isActive === "boolean") updates.isActive = isActive;
  if (responseText !== undefined) updates.responseText = responseText;

  await db
    .update(autoResponseRulesTable)
    .set(updates)
    .where(and(eq(autoResponseRulesTable.id, id), eq(autoResponseRulesTable.organizationId, req.session.organizationId!)));

  res.json({ ok: true });
});

router.delete("/auto-response-rules/:id", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await db
    .delete(autoResponseRulesTable)
    .where(and(eq(autoResponseRulesTable.id, id), eq(autoResponseRulesTable.organizationId, req.session.organizationId!)));
  res.json({ ok: true });
});

export default router;
