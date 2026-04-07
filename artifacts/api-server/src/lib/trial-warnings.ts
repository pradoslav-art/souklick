import { and, gte, lte, eq } from "drizzle-orm";
import { db, organizationsTable, usersTable } from "@workspace/db";
import { sendTrialWarningEmail } from "./email";
import { logger } from "./logger";

// Send trial expiry warnings for orgs ending in ~3 days and ~1 day.
// Uses a ±12h window around each milestone so running this daily hits each org once per level.
export async function checkAndSendTrialWarnings(): Promise<void> {
  const now = new Date();

  const windows = [
    {
      label: "3 days",
      daysLeft: 3,
      from: new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000),
      to:   new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000),
    },
    {
      label: "1 day",
      daysLeft: 1,
      from: new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000),
      to:   new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const window of windows) {
    const orgs = await db
      .select()
      .from(organizationsTable)
      .where(
        and(
          eq(organizationsTable.subscriptionPlan, "trial"),
          gte(organizationsTable.trialEndsAt, window.from),
          lte(organizationsTable.trialEndsAt, window.to)
        )
      );

    for (const org of orgs) {
      const users = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.organizationId, org.id));

      for (const user of users) {
        try {
          await sendTrialWarningEmail({
            to: user.email,
            fullName: user.fullName,
            daysLeft: window.daysLeft,
          });
          logger.info({ orgId: org.id, email: user.email, daysLeft: window.daysLeft }, "Trial warning sent");
        } catch (err) {
          logger.error({ err, email: user.email }, "Failed to send trial warning");
        }
      }
    }
  }
}
