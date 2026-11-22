import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, payments } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import {
  MIN_CHARGE_CENTS,
  createItemUnlockSession,
  getAppBaseUrl,
  paymentsUnavailable,
  stripe,
} from "@/lib/stripe";

/**
 * POST { itemId } — start a Checkout session that unlocks an item's precise
 * location. Responds { url, sessionUrl } (same value) or { alreadyUnlocked: true }.
 * The webhook marks the pending payments row "completed".
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!stripe) return paymentsUnavailable();

    const body = (await request.json().catch(() => null)) as { itemId?: unknown } | null;
    const itemId = parseId(body?.itemId);
    if (!itemId) return badRequest("A valid itemId is required");

    const [item] = await db
      .select({
        id: items.id,
        userId: items.userId,
        title: items.title,
        status: items.status,
        unlockAmount: items.unlockAmount,
        currency: items.currency,
      })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.userId === user.id) {
      return badRequest("You can't buy access to your own item");
    }
    if (user.role === "admin") {
      return NextResponse.json({ alreadyUnlocked: true });
    }
    if (item.status !== "active") {
      return badRequest("This item is no longer active");
    }

    const [completed] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.userId, user.id),
          eq(payments.itemId, itemId),
          eq(payments.status, "completed")
        )
      )
      .limit(1);
    if (completed) {
      return NextResponse.json({ alreadyUnlocked: true });
    }

    if (!Number.isInteger(item.unlockAmount) || item.unlockAmount < MIN_CHARGE_CENTS) {
      return badRequest("This item's unlock price is below the minimum card payment");
    }

    const session = await createItemUnlockSession({
      userId: user.id,
      itemId,
      itemTitle: item.title,
      amount: item.unlockAmount,
      currency: item.currency,
      baseUrl: getAppBaseUrl(request),
      customerEmail: user.email,
    });

    await db.insert(payments).values({
      userId: user.id,
      itemId,
      amount: item.unlockAmount,
      currency: item.currency,
      status: "pending",
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url, sessionUrl: session.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create item unlock checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
