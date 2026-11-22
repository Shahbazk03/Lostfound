import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sendVerificationOTP } from "@/lib/email";
import { badRequest } from "@/lib/api-errors";
import {
  FIFTEEN_MINUTES,
  NAME_MAX_LENGTH,
  OTP_TTL_MS,
  PHONE_MAX_LENGTH,
  checkRateLimits,
  clearOtpFailures,
  emailEquals,
  findUserByEmail,
  generateOtp,
  getClientIp,
  normalizeEmail,
  passwordProblem,
  readJsonBody,
} from "../_lib/auth-helpers";

function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: unknown; cause?: { code?: unknown } } | null;
  return err?.code === "23505" || err?.cause?.code === "23505";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (!body) return badRequest("Invalid request body");

    const email = normalizeEmail(body.email);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = body.password;
    const phone =
      typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;

    if (!body.email || !password || !name) {
      return badRequest("Email, password, and name are required");
    }
    if (!email) return badRequest("Please enter a valid email address");
    if (name.length > NAME_MAX_LENGTH) {
      return badRequest(`Name must be at most ${NAME_MAX_LENGTH} characters`);
    }
    if (phone && phone.length > PHONE_MAX_LENGTH) {
      return badRequest(`Phone number must be at most ${PHONE_MAX_LENGTH} characters`);
    }
    const problem = passwordProblem(password);
    if (problem) return badRequest(problem);

    const limited = checkRateLimits([
      [`register:ip:${getClientIp(request)}`, 10, FIFTEEN_MINUTES],
      // Shared with /api/auth/resend-otp: max 3 verification emails per address.
      [`otp-send:verify:${email}`, 3, FIFTEEN_MINUTES],
    ]);
    if (limited) return limited;

    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password as string);

    let newUser;
    try {
      [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
          phone,
          verified: false,
        })
        .returning({ email: users.email });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      throw error;
    }

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
      // The account exists either way; the user can ask for a new code.
      console.error("Failed to send OTP email:", emailError);
    }

    return NextResponse.json({
      requireVerification: true,
      email: newUser.email,
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
