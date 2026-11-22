import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { badRequest } from "@/lib/api-errors";
import {
  FIFTEEN_MINUTES,
  checkRateLimits,
  clearOtpFailures,
  emailEquals,
  findUserByEmail,
  getClientIp,
  normalizeEmail,
  normalizeOtp,
  passwordProblem,
  readJsonBody,
  registerOtpFailure,
  resetRateLimit,
  safeEqual,
} from "../_lib/auth-helpers";

function invalidCode(message = "Invalid or expired reset code") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** POST { email, token, password } — `token` is the 6-digit code (`otp` also accepted). */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const rawCode = body?.token ?? body?.otp;

    if (!body?.email || !rawCode || !body?.password) {
      return badRequest("Email, token, and new password are required");
    }

    const email = normalizeEmail(body.email);
    if (!email) return badRequest("Please enter a valid email address");
    const code = normalizeOtp(rawCode);
    if (!code) return invalidCode();
    const problem = passwordProblem(body.password);
    if (problem) return badRequest(problem);
    const password = body.password as string;

    const emailKey = `reset:email:${email}`;
    const limited = checkRateLimits([
      [`reset:ip:${getClientIp(request)}`, 30, FIFTEEN_MINUTES],
      [emailKey, 5, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          emailEquals(passwordResetTokens.email, email),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    const match = tokens.find((t) => safeEqual(code, t.token));
    if (!match) {
      if (tokens.length > 0 && registerOtpFailure("reset", email)) {
        // Durable lockout: a new code must be requested.
        await db
          .delete(passwordResetTokens)
          .where(emailEquals(passwordResetTokens.email, email));
        return invalidCode("Too many incorrect codes. Please request a new reset code.");
      }
      return invalidCode();
    }

    const user = await findUserByEmail(email);
    // Codes are single-use: drop every outstanding code for this address.
    await db.delete(passwordResetTokens).where(emailEquals(passwordResetTokens.email, email));
    if (!user) return invalidCode();

    const hashedPassword = await hashPassword(password);

    // Receiving the code proves control of the inbox, so the email counts as verified.
    await db
      .update(users)
      .set({ password: hashedPassword, verified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    clearOtpFailures("reset", email);
    resetRateLimit(emailKey);

    return NextResponse.json({ message: "Password has been successfully reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
