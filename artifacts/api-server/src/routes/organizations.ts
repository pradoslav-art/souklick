import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, organizationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/organizations/me", requireAuth, async (req, res): Promise<void> => {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, req.session.organizationId!));

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  res.json({
    id: org.id,
    name: org.name,
    brandVoiceFormality: org.brandVoiceFormality,
    brandVoiceEmojis: org.brandVoiceEmojis,
    brandVoiceSignoff: org.brandVoiceSignoff,
    brandVoiceExamples: org.brandVoiceExamples,
    subscriptionPlan: org.subscriptionPlan,
    subscriptionStatus: org.subscriptionStatus,
    trialEndsAt: org.trialEndsAt,
    createdAt: org.createdAt,
  });
});

router.patch("/organizations/me", requireAuth, async (req, res): Promise<void> => {
  const { name, brandVoiceFormality, brandVoiceEmojis, brandVoiceSignoff, brandVoiceExamples } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (brandVoiceFormality !== undefined) updates.brandVoiceFormality = brandVoiceFormality;
  if (brandVoiceEmojis !== undefined) updates.brandVoiceEmojis = brandVoiceEmojis;
  if (brandVoiceSignoff !== undefined) updates.brandVoiceSignoff = brandVoiceSignoff;
  if (brandVoiceExamples !== undefined) updates.brandVoiceExamples = brandVoiceExamples;

  const [org] = await db
    .update(organizationsTable)
    .set(updates)
    .where(eq(organizationsTable.id, req.session.organizationId!))
    .returning();

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  res.json({
    id: org.id,
    name: org.name,
    brandVoiceFormality: org.brandVoiceFormality,
    brandVoiceEmojis: org.brandVoiceEmojis,
    brandVoiceSignoff: org.brandVoiceSignoff,
    brandVoiceExamples: org.brandVoiceExamples,
    subscriptionPlan: org.subscriptionPlan,
    subscriptionStatus: org.subscriptionStatus,
    trialEndsAt: org.trialEndsAt,
    createdAt: org.createdAt,
  });
});

export default router;
