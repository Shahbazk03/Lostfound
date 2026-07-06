import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { userSubscriptions, unlockedConversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;
        const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
        
        if (!userId) break;

        if (type === "monthly_subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          
          if (!subscriptionId || !customerId) break;
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Check if subscription exists
          const existing = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
          
          if (existing.length > 0) {
            await db.update(userSubscriptions)
              .set({
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                status: subscription.status as any,
                currentPeriodEnd: new Date((subscription as Stripe.Subscription).current_period_end * 1000),
                updatedAt: new Date(),
              })
              .where(eq(userSubscriptions.userId, userId));
          } else {
            await db.insert(userSubscriptions).values({
              userId,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              status: subscription.status as any,
              plan: "premium",
              currentPeriodEnd: new Date((subscription as Stripe.Subscription).current_period_end * 1000),
            });
          }
        } else if (type === "conversation_unlock") {
          const itemId = session.metadata?.itemId ? parseInt(session.metadata.itemId) : null;
          
          if (!itemId) break;
          
          await db.insert(unlockedConversations).values({
            userId,
            itemId,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await db.update(userSubscriptions)
          .set({
            status: subscription.status as any,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}