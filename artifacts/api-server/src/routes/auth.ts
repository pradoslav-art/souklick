import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

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
