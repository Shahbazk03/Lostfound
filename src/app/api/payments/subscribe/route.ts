import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, parseId } from "@/lib/api-errors";
import {
  createSubscriptionSession,
  getAppBaseUrl,
  getPlatformPricing,
  paymentsUnavailable,
  stripe,
} from "@/lib/stripe";

/**
 * POST { itemId? } — monthly premium subscription Checkout. itemId only picks
 * the page Stripe returns to. Responds { sessionUrl, url } or { alreadySubscribed: true }.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!stripe) return paymentsUnavailable();

    if (user.hasSubscription) {
      return NextResponse.json({ alreadySubscribed: true });
    }

    const body = (await request.json().catch(() => null)) as { itemId?: unknown } | null;
    const itemId = parseId(body?.itemId) ?? undefined;

    const pricing = await getPlatformPricing();
    const session = await createSubscriptionSession({
      userId: user.id,
      itemId,
      amount: pricing.subscriptionFee,
      currency: pricing.currency,
      baseUrl: getAppBaseUrl(request),
      customerEmail: user.email,
    });

    return NextResponse.json({ sessionUrl: session.url, url: session.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
