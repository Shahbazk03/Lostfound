import { NextResponse } from "next/server";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
    const recoveredItemsCount = recoveredItemsData.count;

    const [usersData] = await db.select({ count: count() }).from(users);
    const usersCount = usersData.count;

    const [countriesData] = await db.select({
      count: sql<number>`count(distinct ${items.country})`
    }).from(items).where(sql`${items.country} IS NOT NULL`);
    const countriesCount = Number(countriesData.count);

    const [totalItemsData] = await db.select({ count: count() }).from(items);
    const totalItemsCount = totalItemsData.count;

    const successRate = totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0;

    return NextResponse.json({
      recoveredItemsCount,
      usersCount,
      countriesCount,
      successRate
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
