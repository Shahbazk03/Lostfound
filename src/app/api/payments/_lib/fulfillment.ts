// Checkout fulfilment shared by the Stripe webhook and /api/payments/confirm.
// Every function here is idempotent: Stripe re-delivers events, and the
// confirm endpoint may run before, after or alongside the webhook.
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, unlockedConversations, userSubscriptions } from "@/db/schema";
import { parseId } from "@/lib/api-errors";

type DbSubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete";

/** Map Stripe's statuses onto the DB enum (writing anything else would fail). */
function mapSubscriptionStatus(status: Stripe.Subscription.Status): DbSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "incomplete":
      return "incomplete";
    default:
      return "canceled"; // canceled, incomplete_expired
  }
}

function unixToDate(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Since API 2025-03-31.basil the period end lives on each subscription item;
 * the top-level field is only read as a fallback for older payloads.
 */
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  let latest: Date | null = null;
  for (const item of subscription.items?.data ?? []) {
    const end = unixToDate(item.current_period_end);
    if (end && (!latest || end > latest)) latest = end;
  }
  return (
    latest ??
    unixToDate((subscription as unknown as { current_period_end?: unknown }).current_period_end)
  );
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function fulfillItemUnlock(session: Stripe.Checkout.Session, userId: number) {
  const itemId = parseId(session.metadata?.itemId);
  if (!itemId) {
    console.warn(`Stripe: item_unlock session ${session.id} has no itemId`);
    return;
  }

  const updated = await db
    .update(payments)
    .set({ status: "completed" })
    .where(eq(payments.stripeSessionId, session.id))
    .returning({ id: payments.id });

  if (updated.length === 0) {
    // The pending row is missing (e.g. its insert failed after checkout was
    // created). The customer paid, so record it from the session.
    await db.insert(payments).values({
      userId,
      itemId,
      amount: session.amount_total ?? 0,
      currency: (session.currency ?? "usd").toUpperCase(),
      status: "completed",
      stripeSessionId: session.id,
    });
  }
}

async function fulfillConversationUnlock(session: Stripe.Checkout.Session, userId: number) {
  const itemId = parseId(session.metadata?.itemId);
  if (!itemId) {
    console.warn(`Stripe: conversation_unlock session ${session.id} has no itemId`);
    return;
  }

  const [existing] = await db
    .select({ id: unlockedConversations.id })
    .from(unlockedConversations)
    .where(
      and(eq(unlockedConversations.userId, userId), eq(unlockedConversations.itemId, itemId))
    )
    .limit(1);

  if (!existing) {
    await db.insert(unlockedConversations).values({ userId, itemId });
  }
}

async function fulfillSubscription(
  client: Stripe,
  session: Stripe.Checkout.Session,
  userId: number
) {
  const subscriptionId = idOf(session.subscription);
  const customerId = idOf(session.customer);
  if (!subscriptionId || !customerId) {
    console.warn(`Stripe: subscription session ${session.id} lacks subscription/customer`);
    return;
  }

  const subscription = await client.subscriptions.retrieve(subscriptionId);
  let currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
  if (!currentPeriodEnd) {
    // Never write an Invalid Date. A later customer.subscription.updated
    // event overwrites this estimate with the real value.
    console.warn(`Stripe: no period end on ${subscriptionId}; assuming one month`);
    currentPeriodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  }

  const values = {
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status: mapSubscriptionStatus(subscription.status),
    currentPeriodEnd,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: userSubscriptions.id })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(userSubscriptions).set(values).where(eq(userSubscriptions.id, existing.id));
  } else {
    await db.insert(userSubscriptions).values({ userId, plan: "premium", ...values });
  }
}

/**
 * Grant whatever a paid Checkout session bought. Returns false when the
 * session isn't paid yet (delayed payment methods finish later via
 * checkout.session.async_payment_succeeded).
 */
export async function fulfillCheckoutSession(
  client: Stripe,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (session.payment_status === "unpaid") return false;

  const type = session.metadata?.type;
  const userId = parseId(session.metadata?.userId);
  if (!userId) {
    console.warn(`Stripe: session ${session.id} has no userId metadata`);
    return false;
  }

  switch (type) {
    case "item_unlock":
      await fulfillItemUnlock(session, userId);
      return true;
    case "conversation_unlock":
      await fulfillConversationUnlock(session, userId);
      return true;
    case "monthly_subscription":
      await fulfillSubscription(client, session, userId);
      return true;
    default:
      console.warn(`Stripe: unhandled checkout type ${String(type)} (${session.id})`);
      return false;
  }
}

/** Expired / failed checkout: mark a still-pending location unlock as failed. */
export async function markCheckoutFailed(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== "item_unlock") return;
  await db
    .update(payments)
    .set({ status: "failed" })
    .where(and(eq(payments.stripeSessionId, session.id), eq(payments.status, "pending")));
}

export async function syncSubscription(subscription: Stripe.Subscription, deleted: boolean) {
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  await db
    .update(userSubscriptions)
    .set({
      status: deleted ? "canceled" : mapSubscriptionStatus(subscription.status),
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
}

/**
 * Postgres data/constraint errors (SQLSTATE classes 22 and 23) won't succeed
 * on retry, so callers log and acknowledge them instead of looping.
 */
export function isPermanentDbError(error: unknown): boolean {
  const err = error as { code?: unknown; cause?: { code?: unknown } } | null;
  const code = err?.code ?? err?.cause?.code;
  return typeof code === "string" && /^2[23]/.test(code);
}
