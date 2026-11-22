import { NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { sendPasswordResetOTP } from "@/lib/email";
import { badRequest } from "@/lib/api-errors";
import {
  FIFTEEN_MINUTES,
  OTP_TTL_MS,
  checkRateLimits,
  clearOtpFailures,
  emailEquals,
  findUserByEmail,
  generateOtp,
  getClientIp,
  normalizeEmail,
  readJsonBody,
} from "../_lib/auth-helpers";

const GENERIC_RESPONSE = {
  message: "If an account exists, a password reset code has been sent.",
};

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body?.email) return badRequest("Email is required");
    const email = normalizeEmail(body.email);
    if (!email) return badRequest("Please enter a valid email address");

    // Applied before the user lookup so the limit says nothing about whether
    // the account exists.
    const limited = checkRateLimits([
      [`forgot:ip:${getClientIp(request)}`, 10, FIFTEEN_MINUTES],
      [`otp-send:reset:${email}`, 3, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    const user = await findUserByEmail(email);
    if (!user) return NextResponse.json(GENERIC_RESPONSE);

    const otp = generateOtp();

    // Only the newest code is valid.
    await db.delete(passwordResetTokens).where(emailEquals(passwordResetTokens.email, email));
    await db.insert(passwordResetTokens).values({
      email,
      token: otp,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    clearOtpFailures("reset", email);

    try {
      await sendPasswordResetOTP(email, otp);
    } catch (emailError) {
      // Don't turn a mail failure into a different response for existing
      // accounts — that would leak which emails are registered.
      console.error("Failed to send password reset email:", emailError);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
