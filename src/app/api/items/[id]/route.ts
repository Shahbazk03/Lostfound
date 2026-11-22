import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  items,
  users,
  payments,
  unlockedConversations,
  itemTypeEnum,
  itemStatusEnum,
} from "@/db/schema";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { majorToCents, normalizeCurrency } from "@/lib/wallet";
import { eq, and, inArray } from "drizzle-orm";
import { invalidatePublicContent } from "@/lib/cache";

type RouteContext = { params: Promise<{ id: string }> };

type ItemType = (typeof itemTypeEnum.enumValues)[number];
type ItemStatus = (typeof itemStatusEnum.enumValues)[number];
const ITEM_TYPES: readonly string[] = itemTypeEnum.enumValues;
const ITEM_STATUSES: readonly string[] = itemStatusEnum.enumValues;

// ---- validation (kept in sync with POST in ../route.ts) ----
const MAX_PHOTOS = 6;
const MAX_PHOTO_CHARS = 1.5 * 1024 * 1024;
const PHOTO_PREFIXES = ["data:image/", "/uploads/", "https://"];
const MIN_UNLOCK_CENTS = 50; // 0.50
const MAX_UNLOCK_CENTS = 1_000_000; // 10,000.00

// [field, label, max length, required]
const TEXT_FIELDS = [
  ["title", "Title", 200, true],
  ["description", "Description", 5000, true],
  ["category", "Category", 100, true],
  ["approximateLocation", "Approximate location", 255, true],
  ["preciseLocation", "Precise location", 1000, false],
  ["city", "City", 100, false],
  ["country", "Country", 100, false],
  ["timeframe", "Timeframe", 100, false],
] as const;

type ItemUpdate = Partial<Omit<typeof items.$inferInsert, "id" | "userId" | "createdAt">>;

function validatePhotos(value: unknown): string[] | string {
  if (value === null) return [];
  if (!Array.isArray(value)) return "Photos must be a list";
  if (value.length > MAX_PHOTOS) return `You can add at most ${MAX_PHOTOS} photos`;
  for (const p of value) {
    if (typeof p !== "string" || !PHOTO_PREFIXES.some((prefix) => p.startsWith(prefix))) {
      return "Each photo must be an uploaded image";
    }
    if (p.startsWith("data:image/svg")) return "SVG images aren't allowed";
    if (p.length > MAX_PHOTO_CHARS) return "Each photo must be smaller than about 1.5 MB";
  }
  return value as string[];
}

/** Only these fields can be changed; anything else in the body is ignored. */
function validateItemUpdate(body: Record<string, unknown>): { data: ItemUpdate } | { error: string } {
  const data: ItemUpdate = {};
  const text = data as Record<string, string | null>;

  for (const [key, label, max, required] of TEXT_FIELDS) {
    const v = body[key];
    if (v === undefined) continue;
    if (v === null || (typeof v === "string" && v.trim() === "")) {
      if (required) return { error: `${label} can't be empty` };
      text[key] = null;
      continue;
    }
    if (typeof v !== "string") return { error: `${label} must be text` };
    if (v.trim().length > max) return { error: `${label} must be at most ${max} characters` };
    text[key] = v.trim();
  }

  if (body.type !== undefined) {
    if (typeof body.type !== "string" || !ITEM_TYPES.includes(body.type)) {
      return { error: "Type must be lost or found" };
    }
    data.type = body.type as ItemType;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !ITEM_STATUSES.includes(body.status)) {
      return { error: `Status must be one of: ${ITEM_STATUSES.join(", ")}` };
    }
    data.status = body.status as ItemStatus;
  }

  if (body.dateLostFound !== undefined) {
    const v = body.dateLostFound;
    const date = typeof v === "string" || typeof v === "number" ? new Date(v) : null;
    if (!date || Number.isNaN(date.getTime())) return { error: "Invalid date" };
    data.dateLostFound = date;
  }

  if (body.photos !== undefined) {
    const result = validatePhotos(body.photos);
    if (typeof result === "string") return { error: result };
    data.photos = result;
  }

  // Major units (5.00), same as the create endpoint.
  if (body.unlockAmount !== undefined) {
    const cents = majorToCents(body.unlockAmount);
    if (cents === null || cents < MIN_UNLOCK_CENTS || cents > MAX_UNLOCK_CENTS) {
      return { error: "Unlock amount must be between 0.50 and 10,000" };
    }
    data.unlockAmount = cents;
  }

  if (body.currency !== undefined) {
    const c = normalizeCurrency(body.currency);
    if (!c) return { error: "Unsupported currency" };
    data.currency = c;
  }

  return { data };
}

/**
 * Response: { item, hasUnlocked, hasUnlockedChat }. The owner's email and phone
 * are never included; the paid chat is the contact channel.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const itemId = parseId((await params).id);
    if (!itemId) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    const user = await getCurrentUser();

    const [item] = await db
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
        timeframe: items.timeframe,
        photos: items.photos,
        status: items.status,
        unlockAmount: items.unlockAmount,
        currency: items.currency,
        createdAt: items.createdAt,
        userId: items.userId,
        userName: users.name,
      })
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .where(eq(items.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Precise location needs a completed payment; chat needs a chat unlock.
    let hasUnlocked = false;
    let hasUnlockedChat = false;

    if (user) {
      if (item.userId === user.id || user.role === "admin") {
        hasUnlocked = true;
        hasUnlockedChat = true;
      } else {
        const [paymentRecord] = await db
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.userId, user.id),
              eq(payments.itemId, itemId),
              eq(payments.status, "completed")
            )
          )
          .limit(1);
        hasUnlocked = !!paymentRecord;

        const [chatUnlockRecord] = await db
          .select({ id: unlockedConversations.id })
          .from(unlockedConversations)
          .where(
            and(
              eq(unlockedConversations.userId, user.id),
              eq(unlockedConversations.itemId, itemId)
            )
          )
          .limit(1);
        hasUnlockedChat = !!chatUnlockRecord;
      }
    }

    return NextResponse.json({
      item: { ...item, preciseLocation: hasUnlocked ? item.preciseLocation : null },
      hasUnlocked,
      hasUnlockedChat,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Owner or admin. Accepted fields: title, description, category,
 * approximateLocation, preciseLocation, city, country, timeframe, type, status,
 * dateLostFound, photos, unlockAmount (major units), currency.
 */
async function PATCHImpl(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const itemId = parseId((await params).id);
    if (!itemId) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const [existing] = await db
      .select({ userId: items.userId })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = validateItemUpdate(body);
    if ("error" in result) return badRequest(result.error);
    if (Object.keys(result.data).length === 0) return badRequest("Nothing to update");

    const [updated] = await db
      .update(items)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(items.id, itemId))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Deleting an item cascades to its payments and chat unlocks, which would erase
 * buyers' purchase records. If anyone has paid for this item (or a payment is
 * still in flight) the item is archived instead: { success: true, archived: true }.
 */
async function DELETEImpl(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const itemId = parseId((await params).id);
    if (!itemId) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ userId: items.userId })
        .from(items)
        .where(eq(items.id, itemId))
        .for("update");

      if (!existing) return { status: 404 as const };
      if (existing.userId !== user.id && user.role !== "admin") return { status: 403 as const };

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
        return { status: 200 as const, archived: true };
      }

      await tx.delete(items).where(eq(items.id, itemId));
      return { status: 200 as const, archived: false };
    });

    if (result.status === 404) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (result.status === 403) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ success: true, archived: result.archived });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function PATCH(...args: Parameters<typeof PATCHImpl>) {
  const res = await PATCHImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}

export async function DELETE(...args: Parameters<typeof DELETEImpl>) {
  const res = await DELETEImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
