import { NextRequest, NextResponse } from "next/server";
import { avatarUrl } from "@/lib/media";
import { db } from "@/db";
import { users, verificationTokens, userSubscriptions } from "@/db/schema";
import { createToken, setAuthCookie, wantsTokenInBody } from "@/lib/auth";
import { badRequest } from "@/lib/api-errors";
import { eq, and, gt } from "drizzle-orm";
import {
  FIFTEEN_MINUTES,
  checkRateLimits,
  clearOtpFailures,
  emailEquals,
  findUserByEmail,
  getClientIp,
  normalizeEmail,
  normalizeOtp,
  readJsonBody,
  registerOtpFailure,
  resetRateLimit,
  safeEqual,
} from "../_lib/auth-helpers";

function invalidCode(message = "Invalid or expired code") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const email = normalizeEmail(body?.email);
    const otp = normalizeOtp(body?.otp);

    if (!email || !otp) {
      return badRequest("A valid email and 6-digit code are required");
    }

    const emailKey = `verify:email:${email}`;
    const limited = checkRateLimits([
      [`verify:ip:${getClientIp(request)}`, 30, FIFTEEN_MINUTES],
      [emailKey, 5, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    const tokens = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          emailEquals(verificationTokens.email, email),
          gt(verificationTokens.expiresAt, new Date())
        )
      );

    const match = tokens.find((t) => safeEqual(otp, t.token));
    if (!match) {
      if (tokens.length > 0 && registerOtpFailure("verify", email)) {
        // Durable lockout: the attacker has to request (and receive) a new code.
        await db
          .delete(verificationTokens)
          .where(emailEquals(verificationTokens.email, email));
        return invalidCode("Too many incorrect codes. Please request a new code.");
      }
      return invalidCode();
    }

    const user = await findUserByEmail(email);
    await db.delete(verificationTokens).where(emailEquals(verificationTokens.email, email));
    if (!user) return invalidCode();

    await db
      .update(users)
      .set({ verified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    clearOtpFailures("verify", email);
    resetRateLimit(emailKey);

    // Log the user in.
    const jwt = await createToken({
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

    // Same rule as /api/auth/login: cookie for browsers, body token for the app.
    const mobile = wantsTokenInBody(request);
    if (!mobile) await setAuthCookie(jwt);

    return NextResponse.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: avatarUrl(user.id, user.avatar, user.updatedAt),
        verified: true,
        hasSubscription: subscription.length > 0,
      },
      ...(mobile ? { token: jwt } : {}),
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
