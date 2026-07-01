import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { withdrawalRequests, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db
      .select({
        id: withdrawalRequests.id,
        userId: withdrawalRequests.userId,
        amount: withdrawalRequests.amount,
        status: withdrawalRequests.status,
        createdAt: withdrawalRequests.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(withdrawalRequests)
      .innerJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.createdAt));

    return NextResponse.json(requests);

  } catch (error) {
    console.error("Error fetching admin withdrawals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
