import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { locationsTable } from "./locations";

export const reviewRequestsTable = pgTable("review_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id),
  locationId: text("location_id").notNull().references(() => locationsTable.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  platform: text("platform").notNull(), // "google" | "zomato" | "tripadvisor"
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  sentBy: text("sent_by"), // userId
});

export type ReviewRequest = typeof reviewRequestsTable.$inferSelect;
