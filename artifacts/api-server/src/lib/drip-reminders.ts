import { db, reviewRequestsTable, locationsTable } from "@workspace/db";
import { eq, and, isNull, lt, gte } from "drizzle-orm";
import { sendReminderEmail } from "./email";
import { sendSmsReviewRequest } from "./sms";
import { logger } from "./logger";

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

// Reminders fire at day 3 and day 7 after the initial send.
// Each reminder uses a ±12h window to avoid missing requests due to timing drift.
const SCHEDULE = [
  { reminderNumber: 1 as const, targetDays: 3 },
  { reminderNumber: 2 as const, targetDays: 7 },
];

export async function sendDripReminders(): Promise<void> {
  const now = new Date();

  for (const { reminderNumber, targetDays } of SCHEDULE) {
    const windowStart = new Date(now.getTime() - (targetDays * 24 + 12) * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() - (targetDays * 24 - 12) * 60 * 60 * 1000);

    const requests = await db
      .select({
        id: reviewRequestsTable.id,
        customerName: reviewRequestsTable.customerName,
        customerEmail: reviewRequestsTable.customerEmail,
        customerPhone: reviewRequestsTable.customerPhone,
        sendVia: reviewRequestsTable.sendVia,
        platform: reviewRequestsTable.platform,
        funnelToken: reviewRequestsTable.funnelToken,
        remindersSent: reviewRequestsTable.remindersSent,
        locationName: locationsTable.name,
      })
      .from(reviewRequestsTable)
      .leftJoin(locationsTable, eq(reviewRequestsTable.locationId, locationsTable.id))
      .where(
        and(
          isNull(reviewRequestsTable.completedAt),
          eq(reviewRequestsTable.remindersSent, reminderNumber - 1),
          gte(reviewRequestsTable.sentAt, windowStart),
          lt(reviewRequestsTable.sentAt, windowEnd)
        )
      );

    for (const req of requests) {
      if (!req.funnelToken || !req.locationName) continue;

      const funnelUrl = `${APP_URL}/feedback/${req.funnelToken}`;

      try {
        const via = req.sendVia ?? "email";

        if (via === "email" || via === "both") {
          await sendReminderEmail({
            to: req.customerEmail,
            customerName: req.customerName,
            locationName: req.locationName,
            platform: req.platform,
            reviewUrl: funnelUrl,
            reminderNumber,
          });
        }

        if ((via === "sms" || via === "both") && req.customerPhone) {
          await sendSmsReviewRequest({
            to: req.customerPhone,
            customerName: req.customerName,
            locationName: req.locationName,
            funnelUrl,
          });
        }

        await db
          .update(reviewRequestsTable)
          .set({ remindersSent: reminderNumber })
          .where(eq(reviewRequestsTable.id, req.id));

        logger.info({ requestId: req.id, reminderNumber, via }, "Drip reminder sent");
      } catch (err) {
        logger.error({ err, requestId: req.id, reminderNumber }, "Failed to send drip reminder");
      }
    }
  }
}
