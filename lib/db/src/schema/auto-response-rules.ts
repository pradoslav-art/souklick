import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";

export const autoResponseRulesTable = pgTable("auto_response_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id),
  locationId: text("location_id"),   // null = all locations
  platform: text("platform"),        // null = all platforms
  minRating: integer("min_rating").notNull().default(5),
  maxRating: integer("max_rating").notNull().default(5),
  responseText: text("response_text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AutoResponseRule = typeof autoResponseRulesTable.$inferSelect;
