import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  fulfillCheckoutSession,
  isPermanentDbError,
  markCheckoutFailed,
  syncSubscription,
} from "../_lib/fulfillment";

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error("Stripe webhook received but STRIPE_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not set, so Stripe webhooks cannot be verified and payments " +
        "will not be recorded. Copy the endpoint's signing secret (whsec_...) from the Stripe " +
        "dashboard into .env."
    );
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckoutSession(stripe, event.data.object);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await markCheckoutFailed(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object, event.type === "customer.subscription.deleted");
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    if (isPermanentDbError(error)) {
      console.error(
        `Webhook ${event.id} (${event.type}) hit a permanent DB error; not retrying:`,
        error
      );
      return NextResponse.json({ received: true });
    }
    // Transient failure (DB unreachable, Stripe API hiccup): 500 makes Stripe retry.
    console.error(`Webhook ${event.id} (${event.type}) processing error:`, error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
