import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { db, reviewsTable, locationsTable, responsesTable, organizationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export const VALID_TAGS = ["food", "service", "wait time", "ambiance", "value", "cleanliness", "staff", "delivery"] as const;
export type ReviewTag = typeof VALID_TAGS[number];

export async function tagReview(reviewId: string, reviewText: string): Promise<void> {
  if (!reviewText?.trim()) return;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Classify this restaurant review into relevant topic tags.

Available tags: ${VALID_TAGS.join(", ")}

Review: "${reviewText}"

Return ONLY a JSON array of matching tags (e.g. ["food", "service"]). Return [] if nothing clearly applies. No explanation.`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const tags = parsed.filter((t): t is ReviewTag => VALID_TAGS.includes(t as ReviewTag));
    if (tags.length === 0) return;

    await db.update(reviewsTable).set({ tags }).where(eq(reviewsTable.id, reviewId));
  } catch (err) {
    logger.error({ err, reviewId }, "Review tagging failed");
  }
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || "dummy-key",
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

router.post("/ai/generate-response", requireAuth, async (req, res): Promise<void> => {
  const { reviewId, userNotes } = req.body;

  if (!reviewId) {
    res.status(400).json({ error: "reviewId is required" });
    return;
  }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
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

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, req.session.organizationId!));

  const isNegative = review.rating <= 3;
  const targetLength = isNegative ? "150-250 words" : "50-100 words";

  const formality = org?.brandVoiceFormality ?? "balanced";
  const emojiUsage = org?.brandVoiceEmojis ?? "sometimes";
  const signoff = org?.brandVoiceSignoff ?? `The ${org?.name ?? "Team"}`;
  const examples = org?.brandVoiceExamples ?? [];

  const examplesText = examples.length > 0
    ? `\n\nHere are examples of our brand's response style:\n${examples.map((e, i) => `Example ${i + 1}: "${e}"`).join("\n")}`
    : "";

  const prompt = `You are writing a review response for "${location.name}" restaurant/business.

Review details:
- Rating: ${review.rating}/5 stars
- Reviewer: ${review.reviewerName}
- Review: "${review.reviewText ?? "(No text provided, rating only)"}"
- Platform: ${review.platform}
${userNotes ? `- Manager's notes: ${userNotes}` : ""}

Brand voice guidelines:
- Formality level: ${formality} (${formality === "casual" ? "conversational and warm" : formality === "professional" ? "formal and polished" : "balanced — professional but approachable"})
- Emoji usage: ${emojiUsage} (${emojiUsage === "never" ? "do NOT use any emojis" : emojiUsage === "often" ? "use emojis thoughtfully throughout" : "use emojis sparingly if appropriate"})
- Sign off with: "${signoff}"${examplesText}

Instructions:
- Write a ${targetLength} response
- ${isNegative ? "Acknowledge the specific issue mentioned, apologize sincerely, explain any action being taken or improvement made, and offer a soft recovery (invitation to return or contact directly)" : "Express genuine gratitude for their kind words and encourage them to visit again"}
- Address the specific points mentioned in the review — be personal, not generic
- Sound like a real human manager, not a corporate template
- Do NOT start with "Dear" or "Hello" — start directly
- Match the brand voice guidelines exactly

Write only the response text, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const draftText = message.content[0].type === "text" ? message.content[0].text : "";

    const [response] = await db.insert(responsesTable).values({
      reviewId,
      draftText,
      draftedBy: req.session.userId ?? null,
    }).returning();

    await db.update(reviewsTable).set({ responseStatus: "draft_saved" }).where(eq(reviewsTable.id, reviewId));

    res.json({ draftText, responseId: response.id });
  } catch (err) {
    logger.error({ err }, "AI response generation failed");
    res.status(500).json({ error: "Failed to generate response", message: "AI service unavailable" });
  }
});

router.post("/ai/tag-review", requireAuth, async (req, res): Promise<void> => {
  const { reviewId } = req.body;

  if (!reviewId) {
    res.status(400).json({ error: "reviewId is required" });
    return;
  }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
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

  if (!review.reviewText?.trim()) {
    res.json({ tags: [] });
    return;
  }

  await tagReview(reviewId, review.reviewText);

  const [updated] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId));
  res.json({ tags: updated?.tags ?? [] });
});

export default router;
