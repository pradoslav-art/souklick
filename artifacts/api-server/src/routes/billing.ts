import { Router } from "express";
import Stripe from "stripe";
import { db, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const PLANS = {
  monthly: {
    amount: 2900,
    interval: "month" as const,
    label: "Monthly",
  },
  yearly: {
    amount: 29500,
    interval: "year" as const,
    label: "Yearly",
  },
};

// Create a Stripe Checkout session
router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  const { plan } = req.body as { plan: "monthly" | "yearly" };

  if (!PLANS[plan]) {
    res.status(400).json({ error: "Invalid plan. Must be 'monthly' or 'yearly'." });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, req.session.organizationId!));

  if (!org) {
    res.status(404).json({ error: "Organisation not found" });
    return;
  }

  const origin = req.headers.origin || "http://localhost:5173";
  const selectedPlan = PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: org.stripeCustomerId || undefined,
    customer_creation: org.stripeCustomerId ? undefined : "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Souklick ${selectedPlan.label} Plan`,
          },
          recurring: {
            interval: selectedPlan.interval,
          },
          unit_amount: selectedPlan.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade`,
    metadata: {
      organizationId: org.id,
      plan,
    },
  });

  res.json({ url: session.url });
});

// Confirm payment after redirect from Stripe
router.post("/billing/confirm", requireAuth, async (req, res): Promise<void> => {
  const { sessionId } = req.body as { sessionId: string };

  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.payment_status !== "paid") {
    res.status(400).json({ error: "Payment not completed" });
    return;
  }

  const plan = session.metadata?.plan as "monthly" | "yearly";
  const subscription = session.subscription as Stripe.Subscription;

  await db
    .update(organizationsTable)
    .set({
      subscriptionPlan: plan,
      subscriptionStatus: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription?.id,
    })
    .where(eq(organizationsTable.id, req.session.organizationId!));

  res.json({ success: true, plan });
});

export default router;
