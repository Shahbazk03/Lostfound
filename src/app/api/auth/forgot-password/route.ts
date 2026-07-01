import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetOTP } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 1. Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUsers.length === 0) {
      // Return a success message even if the user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: "If an account exists, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Set expiration (e.g., 10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 4. Invalidate any existing reset tokens for this email
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

    // 5. Store the new token
    await db.insert(passwordResetTokens).values({
      email,
      token: otp,
      expiresAt,
    });

    // 6. Send the email
    await sendPasswordResetOTP(email, otp);

    return NextResponse.json(
      { message: "If an account exists, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
