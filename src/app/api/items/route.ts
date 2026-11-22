import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { items, users, itemTypeEnum, itemStatusEnum } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { majorToCents, normalizeCurrency } from "@/lib/wallet";
import { eq, asc, desc, and, ilike, or, gte, lte, count, sql, type SQL } from "drizzle-orm";
import { invalidatePublicContent } from "@/lib/cache";
import { firstPhoto, mediaRefColumns, resolveMediaRef } from "@/lib/media-sql";

type ItemType = (typeof itemTypeEnum.enumValues)[number];
type ItemStatus = (typeof itemStatusEnum.enumValues)[number];
const ITEM_TYPES: readonly string[] = itemTypeEnum.enumValues;
const ITEM_STATUSES: readonly string[] = itemStatusEnum.enumValues;

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;
const MAX_FILTER_LENGTH = 200;
const SORTS = ["newest", "oldest"] as const;

// ---- validation (kept in sync with PATCH in ./[id]/route.ts) ----
const MAX_PHOTOS = 6;
const MAX_PHOTO_CHARS = 1.5 * 1024 * 1024;
const PHOTO_PREFIXES = ["data:image/", "/uploads/", "https://"];
const MIN_UNLOCK_CENTS = 50; // 0.50
const MAX_UNLOCK_CENTS = 1_000_000; // 10,000.00
const DEFAULT_UNLOCK_CENTS = 100;

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

type NewItemFields = Omit<typeof items.$inferInsert, "id" | "userId" | "status" | "createdAt" | "updatedAt">;

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

function validateNewItem(body: Record<string, unknown>): { data: NewItemFields } | { error: string } {
  const text: Record<string, string | null> = {};
  for (const [key, label, max, required] of TEXT_FIELDS) {
    const v = body[key];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      if (required) return { error: `${label} is required` };
      text[key] = null;
      continue;
    }
    if (typeof v !== "string") return { error: `${label} must be text` };
    if (v.trim().length > max) return { error: `${label} must be at most ${max} characters` };
    text[key] = v.trim();
  }

  if (typeof body.type !== "string" || !ITEM_TYPES.includes(body.type)) {
    return { error: "Type must be lost or found" };
  }

  const date = typeof body.dateLostFound === "string" || typeof body.dateLostFound === "number"
    ? new Date(body.dateLostFound)
    : null;
  if (!date || Number.isNaN(date.getTime())) return { error: "A valid date is required" };

  let photos: string[] = [];
  if (body.photos !== undefined) {
    const result = validatePhotos(body.photos);
    if (typeof result === "string") return { error: result };
    photos = result;
  }

  let unlockAmount = DEFAULT_UNLOCK_CENTS;
  if (body.unlockAmount !== undefined && body.unlockAmount !== null && body.unlockAmount !== "") {
    const cents = majorToCents(body.unlockAmount);
    if (cents === null || cents < MIN_UNLOCK_CENTS || cents > MAX_UNLOCK_CENTS) {
      return { error: "Unlock amount must be between 0.50 and 10,000" };
    }
    unlockAmount = cents;
  }

  let currency = "USD";
  if (body.currency !== undefined && body.currency !== null && body.currency !== "") {
    const c = normalizeCurrency(body.currency);
    if (!c) return { error: "Unsupported currency" };
    currency = c;
  }

  return {
    data: {
      type: body.type as ItemType,
      title: text.title!,
      description: text.description!,
      category: text.category!,
      approximateLocation: text.approximateLocation!,
      preciseLocation: text.preciseLocation,
      city: text.city,
      country: text.country,
      timeframe: text.timeframe,
      dateLostFound: date,
      photos,
      unlockAmount,
      currency,
    },
  };
}

/** Escape LIKE wildcards so user input is matched literally. */
function likeLiteral(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function filterParam(sp: URLSearchParams, key: string) {
  const v = sp.get(key)?.trim();
  return v ? v.slice(0, MAX_FILTER_LENGTH) : null;
}

function parseDateParam(value: string | null): Date | null | "invalid" {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "invalid" : d;
}

/**
 * Query params: type, status (active|resolved|archived|all), category, query,
 * city, country, dateFrom, dateTo, limit (default 48, max 100), offset,
 * mine=1 (signed-in user's own items; default status then is "all"),
 * sort (newest|oldest, by creation time; default newest).
 * Response: { items, total, limit, offset }. Each item has only its first photo.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const conditions: SQL[] = [];

    const sort = sp.get("sort") || "newest";
    if (!(SORTS as readonly string[]).includes(sort)) return badRequest("Invalid sort");
    const orderBy =
      sort === "oldest"
        ? [asc(items.createdAt), asc(items.id)]
        : [desc(items.createdAt), desc(items.id)];

    const mine = sp.get("mine") === "1" || sp.get("mine") === "true";
    if (mine) {
      const user = await requireAuth();
      conditions.push(eq(items.userId, user.id));
    }

    const status = sp.get("status") || (mine ? "all" : "active");
    if (status !== "all") {
      if (!ITEM_STATUSES.includes(status)) return badRequest("Invalid status");
      conditions.push(eq(items.status, status as ItemStatus));
    }

    const type = sp.get("type");
    if (type) {
      if (!ITEM_TYPES.includes(type)) return badRequest("Invalid type");
      conditions.push(eq(items.type, type as ItemType));
    }

    const category = filterParam(sp, "category");
    if (category) conditions.push(ilike(items.category, likeLiteral(category)));
    const city = filterParam(sp, "city");
    if (city) conditions.push(ilike(items.city, `%${likeLiteral(city)}%`));
    const country = filterParam(sp, "country");
    if (country) conditions.push(ilike(items.country, likeLiteral(country)));

    const dateFrom = parseDateParam(sp.get("dateFrom"));
    const dateTo = parseDateParam(sp.get("dateTo"));
    if (dateFrom === "invalid" || dateTo === "invalid") return badRequest("Invalid date");
    if (dateFrom) conditions.push(gte(items.dateLostFound, dateFrom));
    if (dateTo) conditions.push(lte(items.dateLostFound, dateTo));

    const query = filterParam(sp, "query");
    if (query) {
      const pattern = `%${likeLiteral(query)}%`;
      conditions.push(
        or(
          ilike(items.title, pattern),
          ilike(items.description, pattern),
          ilike(items.approximateLocation, pattern)
        )!
      );
    }

    const rawLimit = Number(sp.get("limit"));
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
    const rawOffset = Number(sp.get("offset"));
    const offset = Number.isInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0;

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: items.id,
          type: items.type,
          title: items.title,
          description: items.description,
          category: items.category,
          approximateLocation: items.approximateLocation,
          city: items.city,
          country: items.country,
          dateLostFound: items.dateLostFound,
          timeframe: items.timeframe,
          // A URL for the first photo, never the base64 image itself (lists
          // would otherwise ship hundreds of KB per item).
          photoRef: mediaRefColumns(firstPhoto(items.photos)),
          updatedAt: items.updatedAt,
          status: items.status,
          unlockAmount: items.unlockAmount,
          currency: items.currency,
          createdAt: items.createdAt,
          userId: items.userId,
          userName: users.name,
        })
        .from(items)
        .leftJoin(users, eq(items.userId, users.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(items).where(where),
    ]);

    const results = rows.map(({ photoRef, ...item }) => {
      const photo = resolveMediaRef(photoRef, `/api/media/items/${item.id}/0`, item.updatedAt);
      return { ...item, photos: photo ? [photo] : [] };
    });

    return NextResponse.json({ items: results, total, limit, offset });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function POSTImpl(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const result = validateNewItem(body);
    if ("error" in result) return badRequest(result.error);

    const [newItem] = await db
      .insert(items)
      .values({ ...result.data, userId: user.id })
      .returning();

    return NextResponse.json({ item: newItem });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
