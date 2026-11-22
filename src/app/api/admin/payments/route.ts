import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, users, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { desc, eq } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";

/** Intl throws on a malformed currency code; older rows weren't validated. */
function safeFormat(amount: number, currency: string) {
  try {
    return formatCurrency(amount, currency.toUpperCase());
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const results = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        stripeSessionId: payments.stripeSessionId,
        createdAt: payments.createdAt,
        itemId: payments.itemId,
        userName: users.name,
        itemTitle: items.title,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(items, eq(payments.itemId, items.id))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({
      payments: results.map((p) => ({
        ...p,
        amountFormatted: safeFormat(p.amount, p.currency),
      })),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
