import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandVoiceFormalityEnum = pgEnum("brand_voice_formality", ["casual", "balanced", "professional"]);
export const brandVoiceEmojisEnum = pgEnum("brand_voice_emojis", ["never", "sometimes", "often"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["trial", "starter", "growth", "enterprise", "monthly", "yearly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "cancelled"]);

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  brandVoiceFormality: brandVoiceFormalityEnum("brand_voice_formality").notNull().default("balanced"),
  brandVoiceEmojis: brandVoiceEmojisEnum("brand_voice_emojis").notNull().default("sometimes"),
  brandVoiceSignoff: text("brand_voice_signoff"),
  brandVoiceExamples: text("brand_voice_examples").array(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("trial"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("active"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
