import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, unlockedConversations } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import {
  createConversationUnlockSession,
  getAppBaseUrl,
  getPlatformPricing,
  paymentsUnavailable,
  stripe,
} from "@/lib/stripe";

/**
 * POST { itemId } — one-time Checkout that unlocks messaging for an item.
 * Responds { sessionUrl, url } (same value) or { alreadyUnlocked: true }.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!stripe) return paymentsUnavailable();

    const body = (await request.json().catch(() => null)) as { itemId?: unknown } | null;
    const itemId = parseId(body?.itemId);
    if (!itemId) return badRequest("A valid itemId is required");

    const [item] = await db
      .select({ id: items.id, userId: items.userId, status: items.status })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Owners, admins and subscribers can already message — never charge them.
    if (item.userId === user.id || user.role === "admin" || user.hasSubscription) {
      return NextResponse.json({ alreadyUnlocked: true });
    }

    const [unlocked] = await db
      .select({ id: unlockedConversations.id })
      .from(unlockedConversations)
      .where(
        and(
          eq(unlockedConversations.userId, user.id),
          eq(unlockedConversations.itemId, itemId)
        )
      )
      .limit(1);
    if (unlocked) {
      return NextResponse.json({ alreadyUnlocked: true });
    }

    if (item.status !== "active") {
      return badRequest("This item is no longer active");
    }

    const pricing = await getPlatformPricing();
    const session = await createConversationUnlockSession({
      userId: user.id,
      itemId,
      amount: pricing.chatUnlockFee,
      currency: pricing.currency,
      baseUrl: getAppBaseUrl(request),
      customerEmail: user.email,
    });

    return NextResponse.json({ sessionUrl: session.url, url: session.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Conversation unlock checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
