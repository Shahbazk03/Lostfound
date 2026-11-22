import { NextResponse } from "next/server";

/**
 * Small fixed-window rate limiter kept in process memory.
 *
 * Good enough for a single Node server (`next start`). On serverless with many
 * instances each instance keeps its own counters, so for that setup move this
 * to Redis/Upstash. Security-critical paths (OTP checks) additionally delete
 * the code from the database after too many failures, which IS durable.
 */
type Bucket = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as { __rlBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (globalForRl.__rlBuckets ??= new Map());

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();

  if (buckets.size > 20_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  bucket.count++;
  return { ok: true, retryAfter: 0, remaining: limit - bucket.count };
}

/** Forget a key, e.g. after a successful login. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
