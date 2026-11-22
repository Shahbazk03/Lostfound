import { NextRequest, NextResponse } from "next/server";
import { parseId } from "@/lib/api-errors";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { unstable_cache } from "next/cache";
import { withDbRetry } from "@/db";
import { PUBLIC_CONTENT_TAG } from "@/lib/cache";
import { DEFAULT_MATCH_LIMIT, findMatches } from "@/lib/matching";

// Matches only change when items change, and every item write purges
// PUBLIC_CONTENT_TAG, so a short cache is safe and saves several slow
// database round trips per item view.
const findMatchesCached = unstable_cache(
  (itemId: number, limit: number) => withDbRetry(() => findMatches(itemId, { limit })),
  ["item-matches-v1"],
  { revalidate: 120, tags: [PUBLIC_CONTENT_TAG] }
);

type RouteContext = { params: Promise<{ id: string }> };

const MAX_LIMIT = 12;

/**
 * Public, like the item itself. Query: limit (default 6, max 12).
 * Response: { matches: ItemMatch[] } (see src/lib/matching.ts). 404 when the
 * item doesn't exist or isn't active. Never includes precise locations or
 * contact details.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const rl = rateLimit(`item-matches:${getClientIp(request)}`, 60, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const itemId = parseId((await params).id);
    if (!itemId) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const rawLimit = Number(request.nextUrl.searchParams.get("limit"));
    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_MATCH_LIMIT;

    const matches = await findMatchesCached(itemId, limit);
    if (!matches) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    return NextResponse.json({ matches }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get item matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
