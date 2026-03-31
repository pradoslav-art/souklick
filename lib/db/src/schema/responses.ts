import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reviewsTable } from "./reviews";
import { usersTable } from "./users";

export const responseApprovalStatusEnum = pgEnum("response_approval_status", ["draft", "approved", "posted", "failed"]);

export const responsesTable = pgTable("responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reviewId: text("review_id").notNull().references(() => reviewsTable.id),
  draftedBy: text("drafted_by").references(() => usersTable.id),
  draftText: text("draft_text").notNull(),
  finalText: text("final_text"),
  status: responseApprovalStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResponseSchema = createInsertSchema(responsesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responsesTable.$inferSelect;
