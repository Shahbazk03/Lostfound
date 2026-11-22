import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitorSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Column lengths from visitorSessions in src/db/schema.ts.
const VISITOR_ID_MAX = 255;
const PATH_MAX = 255;
const MAX_DURATION_SECONDS = 2_147_483_647; // int4 max

export async function POST(request: Request) {
  // The tracker sends one heartbeat per tab every 30s plus one per navigation.
  const limit = rateLimit(`heartbeat:ip:${getClientIp(request)}`, 120, 5 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: { visitorId?: unknown; path?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    // fall through to the validation error below
  }

  const visitorId =
    typeof body?.visitorId === "string"
      ? body.visitorId.trim().slice(0, VISITOR_ID_MAX)
      : "";
  if (!visitorId) {
    return NextResponse.json({ error: "Missing visitorId" }, { status: 400 });
  }

  const path =
    typeof body?.path === "string" && body.path.startsWith("/")
      ? body.path.slice(0, PATH_MAX)
      : null;

  try {
    const [existingSession] = await db
      .select()
      .from(visitorSessions)
      .where(eq(visitorSessions.visitorId, visitorId))
      .limit(1);

    if (existingSession) {
      const now = new Date();
      const startTime = new Date(existingSession.startTime);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const durationSeconds = Number.isFinite(elapsed)
        ? Math.min(Math.max(elapsed, 0), MAX_DURATION_SECONDS)
        : existingSession.durationSeconds;

      await db
        .update(visitorSessions)
        .set({
          lastHeartbeat: now,
          durationSeconds,
          path: path ?? existingSession.path,
        })
        .where(eq(visitorSessions.visitorId, visitorId));
    } else {
      // Two first heartbeats can race; the unique visitorId makes the second a no-op.
      await db
        .insert(visitorSessions)
        .values({ visitorId, path: path ?? "/" })
        .onConflictDoNothing({ target: visitorSessions.visitorId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Failed to log heartbeat" }, { status: 500 });
  }
}
