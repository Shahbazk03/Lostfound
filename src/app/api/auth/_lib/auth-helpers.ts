// Shared helpers for the /api/auth/* route handlers. The leading underscore on
// the folder keeps Next.js from treating it as a route segment.
import { randomBytes, randomInt, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { asc, sql, type AnyColumn } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import {
  getClientIp,
  rateLimit,
  resetRateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";

export const EMAIL_MAX_LENGTH = 255;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const OTP_TTL_MS = 10 * 60 * 1000;
/** Wrong codes allowed for one email before its codes are deleted from the DB. */
export const MAX_OTP_FAILURES = 5;
export const FIFTEEN_MINUTES = 15 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Parse a JSON object body; null for invalid JSON or a non-object body. */
export async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Trim + lowercase + format check. Returns null when the value isn't a usable email. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return null;
  }
  return email;
}

/** Returns an error message, or null when the password is acceptable. */
export function passwordProblem(value: unknown): string | null {
  if (typeof value !== "string" || value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function normalizeOtp(value: unknown): string | null {
  const text =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : "";
  return /^\d{6}$/.test(text) ? text : null;
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** `lower(column) = email` — legacy rows may hold mixed-case addresses. */
export function emailEquals(column: AnyColumn, email: string) {
  return sql`lower(${column}) = ${email}`;
}

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(emailEquals(users.email, email))
    .orderBy(asc(users.id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Runs each [key, limit, windowMs] check in order and returns a 429 response
 * for the first one that is exhausted, or null when all pass.
 */
export function checkRateLimits(
  checks: Array<[key: string, limit: number, windowMs: number]>
): NextResponse | null {
  for (const [key, limit, windowMs] of checks) {
    const result = rateLimit(key, limit, windowMs);
    if (!result.ok) return tooManyRequests(result.retryAfter);
  }
  return null;
}

export { getClientIp, resetRateLimit };

type OtpScope = "verify" | "reset";

/**
 * Record a wrong code for this email. Returns true once MAX_OTP_FAILURES is
 * reached; the caller must then delete that email's codes from the database
 * (the durable part — in-memory counters alone don't survive restarts).
 */
export function registerOtpFailure(scope: OtpScope, email: string): boolean {
  const key = `otp-fail:${scope}:${email}`;
  const result = rateLimit(key, MAX_OTP_FAILURES, FIFTEEN_MINUTES);
  if (!result.ok || result.remaining === 0) {
    resetRateLimit(key);
    return true;
  }
  return false;
}

export function clearOtpFailures(scope: OtpScope, email: string) {
  resetRateLimit(`otp-fail:${scope}:${email}`);
}

/** Random password hash for accounts that must not be reachable by password. */
export async function randomPasswordHash(): Promise<string> {
  return hashPassword(randomBytes(32).toString("hex"));
}

let dummyHash: Promise<string> | null = null;
/** A real bcrypt hash to compare against when the user doesn't exist (evens out timing). */
export function getDummyPasswordHash(): Promise<string> {
  dummyHash ??= randomPasswordHash();
  return dummyHash;
}

/**
 * Public base URL: NEXT_PUBLIC_APP_URL when set, otherwise the request's own
 * origin (honouring a reverse proxy's x-forwarded-* headers).
 */
export function getAppBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.error("NEXT_PUBLIC_APP_URL is not a valid URL; using the request origin.");
    }
  }
  const host = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )
    ?.split(",")[0]
    .trim();
  if (host) {
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim();
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const proto =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : isLocal
          ? "http"
          : "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

// Short-lived cookies for the Google OAuth round trip (see /api/auth/google).
export const GOOGLE_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_NEXT_COOKIE = "google_oauth_next";
export const GOOGLE_COOKIE_PATH = "/api/auth/google";

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || value.length > 512) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}
