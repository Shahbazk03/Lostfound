import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { sendVerificationOTP } from "@/lib/email";
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
  message: "If this account still needs verification, a new code has been sent.",
};

/** POST { email } — send a fresh email-verification code. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const email = normalizeEmail(body?.email);
    if (!email) return badRequest("Please enter a valid email address");

    const limited = checkRateLimits([
      [`resend-otp:ip:${getClientIp(request)}`, 10, FIFTEEN_MINUTES],
      // Shared with /api/auth/register: max 3 verification emails per address.
      [`otp-send:verify:${email}`, 3, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    const user = await findUserByEmail(email);
    // Same answer whether or not the account exists / is verified (no enumeration).
    if (!user || user.verified) return NextResponse.json(GENERIC_RESPONSE);

    const otp = generateOtp();
    await db.delete(verificationTokens).where(emailEquals(verificationTokens.email, email));
    await db.insert(verificationTokens).values({
      email,
      token: otp,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    clearOtpFailures("verify", email);

    try {
      await sendVerificationOTP(email, otp);
    } catch (emailError) {
      console.error("Failed to resend OTP email:", emailError);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
