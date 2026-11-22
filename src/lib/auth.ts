import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { users, userSubscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// The signing secret MUST come from the environment. A hardcoded fallback would
// let anyone who has seen the source code forge an admin token.
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short (min 32 chars). Set it in .env."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload: {
  userId: number;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      clockTolerance: 60,
    });
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * The session token: the browser's httpOnly cookie, or — for the mobile app,
 * which has no cookie jar it can rely on — an `Authorization: Bearer <jwt>`
 * header. Both carry the same signed JWT and go through the same checks.
 */
async function getRequestToken(): Promise<string | null> {
  // An explicit bearer token wins: browsers never send one on their own, and
  // the app's native cookie jar may hold a stale "token" cookie that would
  // otherwise shadow the app's real session.
  const authorization = (await headers()).get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (match) return match[1];

  const cookieStore = await cookies();
  return cookieStore.get("token")?.value ?? null;
}

/**
 * The mobile app sends `X-Client: mobile` on login/verify and gets the JWT in
 * the response body (it stores it in the device's secure storage). Browsers
 * never send this header, so for the website the token stays cookie-only.
 */
export function wantsTokenInBody(request: Request): boolean {
  return request.headers.get("x-client")?.toLowerCase() === "mobile";
}

export async function getCurrentUser() {
  const token = await getRequestToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // One round trip instead of two (the DB is ~250 ms away), and never pull the
  // password hash or the inline avatar image (can be 300 KB) — this runs on
  // every authenticated request.
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      verified: users.verified,
      bio: users.bio,
      position: users.position,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      // Remote avatar URLs are returned as-is; inline images are served by
      // /api/media/avatar/{id}, so only a flag is needed for those.
      avatarRemote: sql<string | null>`case when ${users.avatar} like 'data:%' then null else ${users.avatar} end`,
      avatarInline: sql<boolean>`coalesce(${users.avatar} like 'data:%', false)`,
      hasSubscription: sql<boolean>`exists (
        select 1 from ${userSubscriptions}
        where ${userSubscriptions.userId} = ${users.id}
          and ${userSubscriptions.status} = 'active'
          and ${userSubscriptions.currentPeriodEnd} > now()
      )`,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!row) return null;

  const { avatarRemote, avatarInline, ...user } = row;
  return {
    ...user,
    avatar: avatarInline
      ? `/api/media/avatar/${user.id}?v=${new Date(user.updatedAt).getTime()}`
      : avatarRemote,
    hasSubscription: Boolean(user.hasSubscription),
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}
