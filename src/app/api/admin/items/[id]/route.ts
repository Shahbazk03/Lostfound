import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, payments, unlockedConversations, itemTypeEnum, itemStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { eq, and, inArray } from "drizzle-orm";
import { invalidatePublicContent } from "@/lib/cache";

type RouteContext = { params: Promise<{ id: string }> };

type ItemType = (typeof itemTypeEnum.enumValues)[number];
type ItemStatus = (typeof itemStatusEnum.enumValues)[number];
const ITEM_TYPES: readonly string[] = itemTypeEnum.enumValues;
const ITEM_STATUSES: readonly string[] = itemStatusEnum.enumValues;
// The admin pages offer "closed", which the DB calls "archived".
const STATUS_ALIASES: Record<string, ItemStatus> = { closed: "archived" };

// [field, label, max length]
const TEXT_FIELDS = [
  ["title", "Title", 200],
  ["description", "Description", 5000],
  ["category", "Category", 100],
  ["approximateLocation", "Approximate location", 255],
] as const;

type ItemUpdate = Partial<Pick<typeof items.$inferInsert, "title" | "description" | "category" | "approximateLocation" | "type" | "status">>;

/**
 * Body: the item object from the admin list. Only title, description, category,
 * approximateLocation, type and status (active | resolved | archived; "closed"
 * means archived) are applied; every other field is ignored.
 */
async function updateItem(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const itemId = parseId((await params).id);
    if (!itemId) return badRequest("Invalid item id");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const data: ItemUpdate = {};
    for (const [key, label, max] of TEXT_FIELDS) {
      const v = body[key];
      if (v === undefined || v === null) continue;
      if (typeof v !== "string" || v.trim() === "") return badRequest(`${label} can't be empty`);
      if (v.trim().length > max) return badRequest(`${label} must be at most ${max} characters`);
      data[key] = v.trim();
    }

    if (body.type !== undefined && body.type !== null) {
      if (typeof body.type !== "string" || !ITEM_TYPES.includes(body.type)) {
        return badRequest("Type must be lost or found");
      }
      data.type = body.type as ItemType;
    }

    if (body.status !== undefined && body.status !== null) {
      const status = typeof body.status === "string" ? (STATUS_ALIASES[body.status] ?? body.status) : "";
      if (!ITEM_STATUSES.includes(status)) {
        return badRequest(`Status must be one of: ${ITEM_STATUSES.join(", ")}`);
      }
      data.status = status as ItemStatus;
    }

    if (Object.keys(data).length === 0) return badRequest("Nothing to update");

    const [updated] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, itemId))
      .returning();

    if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Admin update item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateItemWithInvalidate(...args: Parameters<typeof updateItem>) {
  const res = await updateItem(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
export { updateItemWithInvalidate as PATCH, updateItemWithInvalidate as PUT };

/**
 * Same rule as DELETE /api/items/[id]: an item someone has paid for is archived
 * instead of deleted so the buyers' payment records survive.
 * Response: { success: true, archived: boolean }
 */
async function DELETEImpl(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const itemId = parseId((await params).id);
    if (!itemId) return badRequest("Invalid item id");

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: items.id })
        .from(items)
        .where(eq(items.id, itemId))
        .for("update");
      if (!existing) return null;

      const [payment] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(and(eq(payments.itemId, itemId), inArray(payments.status, ["completed", "pending"])))
        .limit(1);
      const [chatUnlock] = await tx
        .select({ id: unlockedConversations.id })
        .from(unlockedConversations)
        .where(eq(unlockedConversations.itemId, itemId))
        .limit(1);

      if (payment || chatUnlock) {
        await tx
          .update(items)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(items.id, itemId));
        return { archived: true };
      }

      await tx.delete(items).where(eq(items.id, itemId));
      return { archived: false };
    });

    if (!result) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json({ success: true, archived: result.archived });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Admin delete item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function DELETE(...args: Parameters<typeof DELETEImpl>) {
  const res = await DELETEImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
