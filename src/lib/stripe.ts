import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    })
  : null;

export const PREMIUM_AMOUNT = 100;
export const UNLOCK_AMOUNT = 100; // $1 in cents
export const SUBSCRIPTION_AMOUNT = 499; // $4.99 in cents

export async function createMessageUnlockSession({
  userId,
  messageId,
}: {
  userId: number;
  messageId: number;
}): Promise<string | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Message Unlock",
            description: "Unlock a message for $1",
          },
          unit_amount: UNLOCK_AMOUNT,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/messages?unlock=success&messageId=${messageId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/messages?unlock=cancelled`,
    metadata: {
      userId: userId.toString(),
      messageId: messageId.toString(),
      type: "message_unlock",
    },
  });

  return session.url;
}

export async function createConversationUnlockSession({
  userId,
  itemId,
  amount,
  currency = "usd",
}: {
  userId: number;
  itemId: number;
  amount: number;
  currency?: string;
}): Promise<string | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: "Unlock Chat",
            description: "Unlock messaging for this item",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}?unlock=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}?unlock=cancelled`,
    metadata: {
      userId: userId.toString(),
      itemId: itemId.toString(),
      type: "conversation_unlock",
    },
  });

  return session.url;
}

export async function createSubscriptionSession({
  userId,
  itemId,
  amount,
  currency = "usd",
}: {
  userId: number;
  itemId?: number;
  amount: number;
  currency?: string;
}): Promise<string | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: "LostFound Premium",
            description: "Unlimited messaging subscription",
          },
          unit_amount: amount,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: itemId ? `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}?subscribe=success` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribe=success`,
    cancel_url: itemId ? `${process.env.NEXT_PUBLIC_APP_URL}/items/${itemId}?subscribe=cancelled` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribe=cancelled`,
    metadata: {
      userId: userId.toString(),
      type: "monthly_subscription",
    },
  });

  return session.url;
}