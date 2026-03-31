import { pgTable, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { locationsTable } from "./locations";

export const platformEnum = pgEnum("platform", ["google", "zomato", "tripadvisor"]);
export const responseStatusEnum = pgEnum("response_status", ["pending", "draft_saved", "responded", "skipped"]);

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text("location_id").notNull().references(() => locationsTable.id),
  platform: platformEnum("platform").notNull(),
  platformReviewId: text("platform_review_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerProfileUrl: text("reviewer_profile_url"),
  rating: integer("rating").notNull(),
  reviewText: text("review_text"),
  reviewDate: timestamp("review_date", { withTimezone: true }).notNull(),
  responseStatus: responseStatusEnum("response_status").notNull().default("pending"),
  sentimentScore: numeric("sentiment_score", { precision: 4, scale: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
