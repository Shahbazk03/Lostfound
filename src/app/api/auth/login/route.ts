import { NextRequest, NextResponse } from "next/server";
import { avatarUrl } from "@/lib/media";
import { db } from "@/db";
import { userSubscriptions } from "@/db/schema";
import { verifyPassword, createToken, setAuthCookie, wantsTokenInBody } from "@/lib/auth";
import { badRequest } from "@/lib/api-errors";
import { eq, and, gt } from "drizzle-orm";
import {
  FIFTEEN_MINUTES,
  PASSWORD_MAX_LENGTH,
  checkRateLimits,
  findUserByEmail,
  getClientIp,
  getDummyPasswordHash,
  normalizeEmail,
  readJsonBody,
  resetRateLimit,
} from "../_lib/auth-helpers";

function invalidCredentials() {
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const password = body?.password;

    if (!body?.email || typeof password !== "string" || !password) {
      return badRequest("Email and password are required");
    }
    const email = normalizeEmail(body.email);
    if (!email) return badRequest("Please enter a valid email address");

    const ip = getClientIp(request);
    const pairKey = `login:ip-email:${ip}:${email}`;
    const limited = checkRateLimits([
      [`login:ip:${ip}`, 100, FIFTEEN_MINUTES],
      [pairKey, 10, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    if (password.length > PASSWORD_MAX_LENGTH) return invalidCredentials();

    const user = await findUserByEmail(email);
    if (!user) {
      // Spend the same bcrypt time as a real check so response timing
      // doesn't reveal which emails are registered.
      await verifyPassword(password, await getDummyPasswordHash());
      return invalidCredentials();
    }

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) return invalidCredentials();

    resetRateLimit(pairKey);

    // Unverified users may still log in (email delivery isn't set up yet);
    // `verified` is returned so the UI can nudge them.
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const subscription = await db
      .select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, user.id),
          eq(userSubscriptions.status, "active"),
          gt(userSubscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);

    // Browsers get the JWT only as the httpOnly cookie. The mobile app asks for
    // it in the body instead (see wantsTokenInBody) and gets no cookie, so
    // signing out in the app can't leave a stale session in its cookie jar.
    const mobile = wantsTokenInBody(request);
    if (!mobile) await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: avatarUrl(user.id, user.avatar, user.updatedAt),
        verified: user.verified,
        hasSubscription: subscription.length > 0,
      },
      ...(mobile ? { token } : {}),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
