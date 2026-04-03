import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, organizationsTable } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId: string;
    organizationId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "You must be logged in" });
    return;
  }
  next();
}

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.organizationId) {
    next();
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, req.session.organizationId));

  if (!org) {
    next();
    return;
  }

  if (org.subscriptionPlan === "trial") {
    if (org.trialEndsAt && org.trialEndsAt < new Date()) {
      res.status(402).json({ error: "trial_expired", message: "Your free trial has ended. Please upgrade to continue." });
      return;
    }
  } else if (org.subscriptionStatus !== "active") {
    res.status(402).json({ error: "subscription_inactive", message: "Your subscription is no longer active. Please update your billing." });
    return;
  }

  next();
}
