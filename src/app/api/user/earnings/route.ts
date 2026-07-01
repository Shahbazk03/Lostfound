import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, payments, withdrawalRequests, gameRewards } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Group by currency in JS to simplify since we need to merge three queries
    // Fetch all completed payments for user's items
    const userPayments = await db.select({
      amount: payments.amount,
      currency: payments.currency,
    })
    .from(payments)
    .innerJoin(items, eq(payments.itemId, items.id))
    .where(
      and(
        eq(items.userId, user.id),
        eq(payments.status, "completed")
      )
    );

    // Fetch all withdrawals
    const userWithdrawals = await db.select({
      amount: withdrawalRequests.amount,
      currency: withdrawalRequests.currency,
      status: withdrawalRequests.status,
    })
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.userId, user.id));

    // Fetch all game rewards
    const userRewards = await db.select({
      amount: gameRewards.amount,
      currency: gameRewards.currency,
    })
    .from(gameRewards)
    .where(eq(gameRewards.userId, user.id));

    const currencyMap = new Map<string, {
      currency: string;
      totalEarned: number;
      totalWithdrawn: number;
      pendingWithdrawal: number;
      availableBalance: number;
    }>();

    userPayments.forEach(p => {
      if (!currencyMap.has(p.currency)) {
        currencyMap.set(p.currency, { currency: p.currency, totalEarned: 0, totalWithdrawn: 0, pendingWithdrawal: 0, availableBalance: 0 });
      }
      currencyMap.get(p.currency)!.totalEarned += p.amount;
    });

    userRewards.forEach(r => {
      if (!currencyMap.has(r.currency)) {
        currencyMap.set(r.currency, { currency: r.currency, totalEarned: 0, totalWithdrawn: 0, pendingWithdrawal: 0, availableBalance: 0 });
      }
      currencyMap.get(r.currency)!.totalEarned += Number(r.amount);
    });

    userWithdrawals.forEach(w => {
      if (!currencyMap.has(w.currency)) {
        currencyMap.set(w.currency, { currency: w.currency, totalEarned: 0, totalWithdrawn: 0, pendingWithdrawal: 0, availableBalance: 0 });
      }
      const entry = currencyMap.get(w.currency)!;
      if (w.status === "completed") {
        entry.totalWithdrawn += w.amount;
      } else if (w.status === "pending") {
        entry.pendingWithdrawal += w.amount;
      }
    });

    const balances = Array.from(currencyMap.values()).map(b => ({
      ...b,
      availableBalance: b.totalEarned - b.totalWithdrawn - b.pendingWithdrawal
    }));

    return NextResponse.json({ balances });

  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
