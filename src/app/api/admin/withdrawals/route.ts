import { NextResponse } from "next/server";
import { db } from "@/db";
import { withdrawalRequests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: withdrawalRequests.id,
        userId: withdrawalRequests.userId,
        amount: withdrawalRequests.amount,
        currency: withdrawalRequests.currency,
        status: withdrawalRequests.status,
        createdAt: withdrawalRequests.createdAt,
        updatedAt: withdrawalRequests.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.createdAt));

    // `user` is kept for anything still reading the old nested shape.
    const withdrawals = rows.map((w) => ({
      ...w,
      user: { name: w.userName, email: w.userEmail },
    }));

    return NextResponse.json({ withdrawals });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error fetching admin withdrawals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
