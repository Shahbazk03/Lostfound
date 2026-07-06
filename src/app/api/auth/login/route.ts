import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userSubscriptions } from "@/db/schema";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = userResult[0];

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
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

    await setAuthCookie(token);

    return NextResponse.json({
      token,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
