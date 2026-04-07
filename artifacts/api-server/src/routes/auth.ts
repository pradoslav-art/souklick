import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/email";

function generateResetToken(userId: string): string {
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
  const secret = process.env.RESET_TOKEN_SECRET ?? process.env.SESSION_SECRET ?? "souklick-reset-fallback";
  const payload = `${userId}:${expiry}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyResetToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const firstColon = payload.indexOf(":");
    const userId = payload.slice(0, firstColon);
    const expiry = Number(payload.slice(firstColon + 1));
    if (!userId || isNaN(expiry) || Date.now() > expiry) return null;
    const secret = process.env.RESET_TOKEN_SECRET ?? process.env.SESSION_SECRET ?? "souklick-reset-fallback";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { userId };
  } catch {
    return null;
  }
}

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, user.organizationId));

  const adminEmail = process.env.ADMIN_EMAIL;
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    organizationId: user.organizationId,
    notificationEmail: user.notificationEmail,
    notificationPush: user.notificationPush,
    notificationMinRating: user.notificationMinRating,
    createdAt: user.createdAt,
    isAdmin: adminEmail ? user.email === adminEmail : false,
    subscriptionPlan: org?.subscriptionPlan ?? "trial",
    subscriptionStatus: org?.subscriptionStatus ?? "active",
    trialEndsAt: org?.trialEndsAt ?? null,
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, fullName, organizationName } = req.body;

  if (!email || !password || !fullName || !organizationName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingUser) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const [org] = await db.insert(organizationsTable).values({
    name: organizationName,
    trialEndsAt,
  }).returning();

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    fullName,
    organizationId: org.id,
    role: "owner",
  }).returning();

  req.session.userId = user.id;
  req.session.organizationId = org.id;

  // Fire welcome email — non-blocking, never fails the request
  sendWelcomeEmail({ to: user.email, fullName: user.fullName })
    .catch((err) => console.error("Welcome email failed:", err?.message));

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      organizationId: user.organizationId,
      notificationEmail: user.notificationEmail,
      notificationPush: user.notificationPush,
      notificationMinRating: user.notificationMinRating,
      createdAt: user.createdAt,
    },
    organization: {
      id: org.id,
      name: org.name,
      brandVoiceFormality: org.brandVoiceFormality,
      brandVoiceEmojis: org.brandVoiceEmojis,
      brandVoiceSignoff: org.brandVoiceSignoff,
      brandVoiceExamples: org.brandVoiceExamples,
      subscriptionPlan: org.subscriptionPlan,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, user.organizationId));

  req.session.userId = user.id;
  req.session.organizationId = user.organizationId;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      organizationId: user.organizationId,
      notificationEmail: user.notificationEmail,
      notificationPush: user.notificationPush,
      notificationMinRating: user.notificationMinRating,
      createdAt: user.createdAt,
    },
    organization: org ? {
      id: org.id,
      name: org.name,
      brandVoiceFormality: org.brandVoiceFormality,
      brandVoiceEmojis: org.brandVoiceEmojis,
      brandVoiceSignoff: org.brandVoiceSignoff,
      brandVoiceExamples: org.brandVoiceExamples,
      subscriptionPlan: org.subscriptionPlan,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
    } : null,
  });
});

router.patch("/user/profile", requireAuth, async (req, res): Promise<void> => {
  const { fullName, email } = req.body as { fullName?: string; email?: string };

  if (!fullName && !email) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  if (email) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing && existing.id !== req.session.userId) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (fullName) updates.fullName = fullName;
  if (email) updates.email = email;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  res.json({ fullName: updated.fullName, email: updated.email });
});

router.patch("/user/password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Both current and new password are required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // Always respond with success — never reveal whether email exists
  res.json({ success: true });

  // Send email in the background only if user exists
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) return;
    const token = generateResetToken(user.id);
    const origin = process.env.APP_URL ?? "http://localhost:5173";
    const resetUrl = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (err: any) {
    console.error("Forgot password error:", err?.message);
  }
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const payload = verifyResetToken(token);
  if (!payload) {
    res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

export default router;
