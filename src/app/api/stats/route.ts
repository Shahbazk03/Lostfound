import { NextResponse } from "next/server";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { authErrorResponse } from "@/lib/api-errors";
import { eq, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [[recovered], [userTotal], [countries], [itemTotal]] = await Promise.all([
      db.select({ count: count() }).from(items).where(eq(items.status, "resolved")),
      db.select({ count: count() }).from(users),
      db
        .select({ count: sql<number>`count(distinct ${items.country})`.mapWith(Number) })
        .from(items)
        .where(sql`${items.country} IS NOT NULL`),
      db.select({ count: count() }).from(items),
    ]);

    const recoveredItemsCount = recovered?.count ?? 0;
    const totalItemsCount = itemTotal?.count ?? 0;
    const successRate =
      totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0;

    return NextResponse.json({
      recoveredItemsCount,
      usersCount: userTotal?.count ?? 0,
      countriesCount: countries?.count ?? 0,
      successRate,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
