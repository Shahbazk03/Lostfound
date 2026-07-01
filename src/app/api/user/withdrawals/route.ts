import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, payments, withdrawalRequests } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, or, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, currency } = await request.json();

    if (!amount || typeof amount !== "number" || amount <= 0 || !currency) {
      return NextResponse.json({ error: "Invalid amount or currency" }, { status: 400 });
    }

    // Calculate available balance to verify
    const earnedQuery = await db.select({
      total: sql<number>`sum(${payments.amount})`
    })
    .from(payments)
    .innerJoin(items, eq(payments.itemId, items.id))
    .where(
      and(
        eq(items.userId, user.id),
        eq(payments.status, "completed"),
        eq(payments.currency, currency)
      )
    );

    const totalEarned = Number(earnedQuery[0]?.total || 0);

    const withdrawnQuery = await db.select({
      total: sql<number>`sum(${withdrawalRequests.amount})`
    })
    .from(withdrawalRequests)
    .where(
      and(
        eq(withdrawalRequests.userId, user.id),
        or(eq(withdrawalRequests.status, "completed"), eq(withdrawalRequests.status, "pending")),
        eq(withdrawalRequests.currency, currency)
      )
    );

    const totalWithdrawnAndPending = Number(withdrawnQuery[0]?.total || 0);
    const availableBalance = totalEarned - totalWithdrawnAndPending;

    if (amount > availableBalance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Insert new withdrawal request
    const newRequest = await db.insert(withdrawalRequests).values({
      userId: user.id,
      amount: amount,
      currency: currency,
      status: "pending"
    }).returning();

    return NextResponse.json(newRequest[0], { status: 201 });

  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
