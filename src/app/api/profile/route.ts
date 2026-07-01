import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, items } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Fetch fresh user details
    const userDetails = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userDetails.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's reported items
    const userItems = await db
      .select()
      .from(items)
      .where(eq(items.userId, user.id))
      .orderBy(desc(items.createdAt));

    return NextResponse.json({
      user: userDetails[0],
      items: userItems,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, phone, avatar } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await db
      .update(users)
      .set({
        name,
        phone: phone || null,
        avatar: avatar || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
      });

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
