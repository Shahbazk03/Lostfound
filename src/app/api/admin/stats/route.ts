import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, items, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { count, desc, eq, sql } from "drizzle-orm";

/**
 * Response: { stats: { totalUsers, totalItems, totalTransactions,
 *   revenueByCurrency: [{ currency, amount (cents), count }],
 *   itemsByType: [{ type, count }], itemsByStatus: [{ status, count }], recentItems } }
 * All counts are numbers. Revenue is never summed across currencies.
 */
export async function GET() {
  try {
    await requireAdmin();

    const paymentCurrency = sql<string>`upper(${payments.currency})`;

    const [[userCount], [itemCount], revenueRows, itemsByType, itemsByStatus, recentItems] =
      await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(items),
        db
          .select({
            currency: paymentCurrency,
            amount: sql<string>`coalesce(sum(${payments.amount}), 0)`,
            count: count(),
          })
          .from(payments)
          .where(eq(payments.status, "completed"))
          .groupBy(paymentCurrency),
        db.select({ type: items.type, count: count() }).from(items).groupBy(items.type),
        db.select({ status: items.status, count: count() }).from(items).groupBy(items.status),
        db
          .select({
            id: items.id,
            title: items.title,
            type: items.type,
            status: items.status,
            createdAt: items.createdAt,
          })
          .from(items)
          .orderBy(desc(items.createdAt))
          .limit(5),
      ]);

    const revenueByCurrency = revenueRows
      .map((r) => ({ currency: r.currency, amount: Number(r.amount), count: r.count }))
      .sort((a, b) => a.currency.localeCompare(b.currency));

    return NextResponse.json({
      stats: {
        totalUsers: userCount?.count ?? 0,
        totalItems: itemCount?.count ?? 0,
        totalTransactions: revenueByCurrency.reduce((sum, r) => sum + r.count, 0),
        revenueByCurrency,
        itemsByType,
        itemsByStatus,
        recentItems,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
