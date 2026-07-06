import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens, userSubscriptions } from "@/db/schema";
import { createToken, setAuthCookie } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = existingUsers[0];

    // Find valid OTP
    const validTokens = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.email, email),
          eq(verificationTokens.token, otp),
          gt(verificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (validTokens.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user to verified
    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, user.id));

    // Delete the token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, validTokens[0].id));

    // Log the user in
    const jwt = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, user.id),
          eq(userSubscriptions.status, "active"),
          gt(userSubscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);

    await setAuthCookie(jwt);

    return NextResponse.json({
      message: "Email verified successfully",
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        hasSubscription: subscription.length > 0,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
