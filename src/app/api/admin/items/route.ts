import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, users, itemStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { eq, desc } from "drizzle-orm";

type ItemStatus = (typeof itemStatusEnum.enumValues)[number];
const ITEM_STATUSES: readonly string[] = itemStatusEnum.enumValues;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    // An unknown status is ignored (lists everything) rather than failing.
    const status = request.nextUrl.searchParams.get("status");
    const where =
      status && ITEM_STATUSES.includes(status) ? eq(items.status, status as ItemStatus) : undefined;

    const results = await db
      .select({
        id: items.id,
        type: items.type,
        title: items.title,
        description: items.description,
        category: items.category,
        approximateLocation: items.approximateLocation,
        preciseLocation: items.preciseLocation,
        city: items.city,
        country: items.country,
        dateLostFound: items.dateLostFound,
        status: items.status,
        createdAt: items.createdAt,
        userId: items.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .where(where)
      .orderBy(desc(items.createdAt));

    return NextResponse.json({ items: results });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get admin items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
