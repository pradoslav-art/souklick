import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const privateFeedbackTable = pgTable("private_feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  funnelToken: text("funnel_token").notNull(),
  locationId: text("location_id").notNull(),
  organizationId: text("organization_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  feedbackText: text("feedback_text"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PrivateFeedback = typeof privateFeedbackTable.$inferSelect;
