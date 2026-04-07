import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { sendTeamInviteEmail } from "../lib/email";

const router: IRouter = Router();

function generateInviteToken(orgId: string, email: string, role: string): string {
  const expiry = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
  const secret = process.env.RESET_TOKEN_SECRET ?? process.env.SESSION_SECRET ?? "souklick-invite-fallback";
  const payload = `${orgId}:${email}:${role}:${expiry}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyInviteToken(token: string): { orgId: string; email: string; role: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    // parts: [orgId, email, role, expiry, sig] — 5 parts
    if (parts.length !== 5) return null;
    const [orgId, email, role, expiryStr, sig] = parts;
    const expiry = Number(expiryStr);
    if (!orgId || !email || !role || isNaN(expiry) || Date.now() > expiry) return null;
    const secret = process.env.RESET_TOKEN_SECRET ?? process.env.SESSION_SECRET ?? "souklick-invite-fallback";
    const payload = `${orgId}:${email}:${role}:${expiryStr}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { orgId, email, role };
  } catch {
    return null;
  }
}

// List team members
router.get("/team", requireAuth, async (req, res): Promise<void> => {
  const members = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.organizationId, req.session.organizationId!));

  res.json(members);
});

// Send invite
router.post("/team/invite", requireAuth, async (req, res): Promise<void> => {
  const requester = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .then((rows) => rows[0]);

  if (!requester || requester.role !== "owner") {
    res.status(403).json({ error: "Only the account owner can invite team members" });
    return;
  }

  const { email, role } = req.body as { email?: string; role?: string };
  if (!email || !role || !["manager", "staff"].includes(role)) {
    res.status(400).json({ error: "Email and a valid role (manager or staff) are required" });
    return;
  }

  // Don't invite someone already in the org
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "A user with that email already exists" });
    return;
  }

  const token = generateInviteToken(req.session.organizationId!, email, role);
  const origin = req.headers.origin || process.env.APP_URL || "http://localhost:5173";
  const inviteUrl = `${origin}/accept-invite?token=${token}`;

  try {
    await sendTeamInviteEmail({ to: email, inviteUrl, role });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Invite email failed:", err?.message);
    res.status(500).json({ error: "Failed to send invite email" });
  }
});

// Remove a team member (owner only)
router.delete("/team/:userId", requireAuth, async (req, res): Promise<void> => {
  const requester = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .then((rows) => rows[0]);

  if (!requester || requester.role !== "owner") {
    res.status(403).json({ error: "Only the account owner can remove team members" });
    return;
  }

  const { userId } = req.params;
  if (userId === req.session.userId) {
    res.status(400).json({ error: "You cannot remove yourself" });
    return;
  }

  const [member] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.organizationId, req.session.organizationId!)));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// Accept invite — public endpoint
router.post("/auth/accept-invite", async (req, res): Promise<void> => {
  const { token, fullName, password } = req.body as { token?: string; fullName?: string; password?: string };

  if (!token || !fullName || !password) {
    res.status(400).json({ error: "Token, name, and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const payload = verifyInviteToken(token);
  if (!payload) {
    res.status(400).json({ error: "This invite link is invalid or has expired. Ask your team owner to send a new one." });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, payload.email));
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists. Try signing in instead." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(usersTable).values({
    email: payload.email,
    passwordHash,
    fullName,
    organizationId: payload.orgId,
    role: payload.role as "manager" | "staff",
  });

  res.status(201).json({ success: true });
});

export default router;
