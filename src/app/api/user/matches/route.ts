import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getMatchSummaries } from "@/lib/matching";

/**
 * Signed-in user. For each of the caller's active items:
 * { matches: { [itemId]: { count, topScore } } } (count 0 / topScore 0 when
 * nothing matches yet).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const rl = rateLimit(`user-matches:${user.id}`, 30, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const matches = await getMatchSummaries(user.id);
    return NextResponse.json({ matches }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get user matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
