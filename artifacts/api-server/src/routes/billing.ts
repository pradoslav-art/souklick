import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { db, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

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

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: org.stripeCustomerId || undefined,
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
  } catch (err: any) {
    console.error("Stripe checkout error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to create checkout session" });
  }
});

// Confirm payment after redirect from Stripe
router.post("/billing/confirm", requireAuth, async (req, res): Promise<void> => {
  const { sessionId } = req.body as { sessionId: string };

  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }

  try {
    const stripe = getStripe();
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
  } catch (err: any) {
    console.error("Stripe confirm error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to confirm payment" });
  }
});

// Open Stripe Customer Portal for billing management (paid plans only)
router.post("/billing/portal", requireAuth, async (req, res): Promise<void> => {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, req.session.organizationId!));

  if (!org) {
    res.status(404).json({ error: "Organisation not found" });
    return;
  }

  if (!org.stripeCustomerId) {
    res.status(400).json({ error: "No billing account found. Please upgrade first." });
    return;
  }

  const origin = req.headers.origin || "http://localhost:5173";

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/upgrade`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to open billing portal" });
  }
});

// Stripe webhook handler — must receive raw body (registered before express.json() in app.ts)
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status =
          sub.status === "active" ? "active" :
          sub.status === "past_due" ? "past_due" :
          "cancelled";
        await db
          .update(organizationsTable)
          .set({ subscriptionStatus: status })
          .where(eq(organizationsTable.stripeCustomerId, sub.customer as string));
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .update(organizationsTable)
          .set({ subscriptionStatus: "cancelled" })
          .where(eq(organizationsTable.stripeCustomerId, sub.customer as string));
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await db
          .update(organizationsTable)
          .set({ subscriptionStatus: "past_due" })
          .where(eq(organizationsTable.stripeCustomerId, invoice.customer as string));
        break;
      }
      default:
        // Ignore other event types
        break;
    }
  } catch (err: any) {
    console.error("Webhook DB update failed:", err?.message);
    res.status(500).json({ error: "Failed to process webhook" });
    return;
  }

  res.json({ received: true });
}

export default router;
