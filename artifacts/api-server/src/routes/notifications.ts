import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/user/notifications", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    notificationEmail: user.notificationEmail,
    notificationPush: user.notificationPush,
    notificationMinRating: user.notificationMinRating,
    notificationPhone: user.notificationPhone,
    notificationSms: user.notificationSms,
    notificationWhatsapp: user.notificationWhatsapp,
  });
});

router.patch("/user/notifications", requireAuth, async (req, res): Promise<void> => {
  const { notificationEmail, notificationPush, notificationMinRating, notificationPhone, notificationSms, notificationWhatsapp } = req.body;

  const updates: Record<string, unknown> = {};
  if (notificationEmail !== undefined) updates.notificationEmail = notificationEmail;
  if (notificationPush !== undefined) updates.notificationPush = notificationPush;
  if (notificationMinRating !== undefined) updates.notificationMinRating = notificationMinRating;
  if (notificationPhone !== undefined) updates.notificationPhone = notificationPhone || null;
  if (notificationSms !== undefined) updates.notificationSms = notificationSms;
  if (notificationWhatsapp !== undefined) updates.notificationWhatsapp = notificationWhatsapp;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  res.json({
    notificationEmail: user.notificationEmail,
    notificationPush: user.notificationPush,
    notificationMinRating: user.notificationMinRating,
    notificationPhone: user.notificationPhone,
    notificationSms: user.notificationSms,
    notificationWhatsapp: user.notificationWhatsapp,
  });
});

export default router;
