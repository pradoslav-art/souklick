import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { db, reviewsTable, locationsTable, responsesTable, organizationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export const VALID_TAGS = ["service", "value", "cleanliness", "staff", "wait time", "quality", "communication", "delivery"] as const;
export type ReviewTag = typeof VALID_TAGS[number];

export async function tagReview(reviewId: string, reviewText: string): Promise<void> {
  if (!reviewText?.trim()) return;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Classify this business review into relevant topic tags.

Available tags: ${VALID_TAGS.join(", ")}

Review: "${reviewText}"

Return ONLY a JSON array of matching tags (e.g. ["service", "value"]). Return [] if nothing clearly applies. No explanation.`,
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
  const hasReviewText = !!review.reviewText?.trim();

  const formality = org?.brandVoiceFormality ?? "balanced";
  const emojiUsage = org?.brandVoiceEmojis ?? "sometimes";
  const signoff = org?.brandVoiceSignoff ?? `The ${org?.name ?? "Team"}`;
  const examples = org?.brandVoiceExamples ?? [];

  const examplesText = examples.length > 0
    ? `\nExamples of how we write responses (match this style closely):\n${examples.map((e, i) => `Example ${i + 1}: "${e}"`).join("\n")}`
    : "";

  const lengthGuide = !hasReviewText
    ? "2–3 sentences only — there is no review text to reference so keep it brief"
    : isNegative
    ? "150–220 words — thorough and genuine, but not an essay"
    : "60–100 words — warm and specific, but concise";

  const prompt = `You are a real manager at "${location.name}" writing a personal reply to a customer review. Write exactly as a thoughtful human would — genuine, specific to what was said, never robotic.

REVIEW:
- Stars: ${review.rating}/5
- Reviewer: ${review.reviewerName}
- Text: "${review.reviewText ?? "(no text — star rating only)"}"
- Platform: ${review.platform}
${userNotes ? `- Internal notes from manager: ${userNotes}` : ""}

BRAND VOICE:
- Tone: ${formality === "casual" ? "casual and warm — write like you're talking to a regular, not composing an email" : formality === "professional" ? "professional and composed — polished but still human" : "balanced — friendly and approachable, but not overly casual"}
- Emojis: ${emojiUsage === "never" ? "none whatsoever" : emojiUsage === "often" ? "use naturally where they fit the tone" : "one at most, only if it genuinely fits"}
- End with this sign-off: "${signoff}"
${examplesText}

RULES — every one is mandatory:
1. OPENING: Hook on something SPECIFIC from the review — a detail they mentioned, a feeling they expressed, a person they named. NEVER open with "Thank you for your review", "Thank you for taking the time", "We appreciate your feedback", or any variation. Start mid-thought if needed.
2. SPECIFICITY: If the reviewer mentioned a staff name, a specific product, a specific problem — address it directly by name. Vague responses feel fake.
3. REVIEWER NAME: Use their first name once, naturally. Don't repeat it. Don't force it.
4. LENGTH: ${lengthGuide}
5. ${isNegative
    ? "NEGATIVE REVIEW HANDLING: Acknowledge the exact issue they described — don't be vague or deflect. Take ownership without making excuses. One genuine apology is enough — don't grovel. Say what is being done or invite them to contact you directly. Leave the door open without begging."
    : "POSITIVE REVIEW HANDLING: Match their energy. If they're enthusiastic, be warm. If they're brief, be brief. Don't pad the response with filler. Make them feel heard, not processed."}
6. BANNED PHRASES — never use any of these: "valued customer", "valued guest", "your feedback is important", "your feedback is invaluable", "we strive to", "we endeavour to", "going forward", "at ${location.name} we", "thank you for your patronage", "we look forward to serving you", "do not hesitate to", "kind regards", "we hope to see you again soon", "it was a pleasure serving you".
7. TONE CHECK: Read it back. If it sounds like it came from a template or a robot, rewrite it. It must sound like a real person typed it.

Write only the response text. Nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
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
