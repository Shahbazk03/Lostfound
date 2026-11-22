import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { paymentsUnavailable, stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "../_lib/fulfillment";

/**
 * POST { sessionId } — called by the success page (Stripe appends
 * `session_id` to every success_url). Fulfils the purchase immediately so
 * the user doesn't depend on the webhook having arrived yet. Idempotent and
 * safe to call alongside the webhook.
 *
 * Responds { status: "completed" | "pending", type, itemId }.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!stripe) return paymentsUnavailable();

    const limit = rateLimit(`payments-confirm:${user.id}`, 30, 10 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const body = (await request.json().catch(() => null)) as { sessionId?: unknown } | null;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
    if (!/^cs_(test|live)_[A-Za-z0-9]{1,255}$/.test(sessionId)) {
      return badRequest("A valid sessionId is required");
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.warn("Confirm: could not retrieve checkout session", error);
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    // Only the buyer may confirm their own session.
    if (parseId(session.metadata?.userId) !== user.id) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    const type = session.metadata?.type ?? null;
    const itemId = parseId(session.metadata?.itemId);

    if (session.status !== "complete") {
      return NextResponse.json({ status: "pending", type, itemId });
    }

    const fulfilled = await fulfillCheckoutSession(stripe, session);
    return NextResponse.json({ status: fulfilled ? "completed" : "pending", type, itemId });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { error: "Could not confirm the payment yet. Please refresh in a moment." },
      { status: 500 }
    );
  }
}
