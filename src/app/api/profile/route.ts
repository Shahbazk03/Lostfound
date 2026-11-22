import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, items } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { eq, desc } from "drizzle-orm";

const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 50;
const MAX_AVATAR_CHARS = 1.5 * 1024 * 1024;
const AVATAR_PREFIXES = ["data:image/", "/uploads/", "https://"];

const PROFILE_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  avatar: users.avatar,
};

export async function GET() {
  try {
    const user = await requireAuth();

    const [userDetails] = await db
      .select(PROFILE_COLUMNS)
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userItems = await db
      .select()
      .from(items)
      .where(eq(items.userId, user.id))
      .orderBy(desc(items.createdAt));

    return NextResponse.json({ user: userDetails, items: userItems });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Body: { name, phone?, avatar? } */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("Name is required");
    if (name.length > NAME_MAX_LENGTH) return badRequest(`Name must be at most ${NAME_MAX_LENGTH} characters`);

    const phone = body?.phone;
    if (phone && (typeof phone !== "string" || phone.trim().length > PHONE_MAX_LENGTH)) {
      return badRequest(`Phone must be at most ${PHONE_MAX_LENGTH} characters`);
    }

    const avatar = body?.avatar;
    if (avatar) {
      if (
        typeof avatar !== "string" ||
        !AVATAR_PREFIXES.some((p) => avatar.startsWith(p)) ||
        avatar.startsWith("data:image/svg")
      ) {
        return badRequest("Avatar must be an uploaded image");
      }
      if (avatar.length > MAX_AVATAR_CHARS) return badRequest("Avatar must be smaller than about 1.5 MB");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        phone: phone ? phone.trim() : null,
        avatar: avatar || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning(PROFILE_COLUMNS);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
