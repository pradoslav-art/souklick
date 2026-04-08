import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { locationsTable } from "./locations";

export const competitorsTable = pgTable("competitors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id),
  locationId: text("location_id").notNull().references(() => locationsTable.id),
  name: text("name").notNull(),
  googlePlaceId: text("google_place_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const competitorSnapshotsTable = pgTable("competitor_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  competitorId: text("competitor_id").notNull().references(() => competitorsTable.id, { onDelete: "cascade" }),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  reviewCount: integer("review_count"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Competitor = typeof competitorsTable.$inferSelect;
export type CompetitorSnapshot = typeof competitorSnapshotsTable.$inferSelect;
