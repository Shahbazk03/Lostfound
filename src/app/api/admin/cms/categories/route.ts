import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

const MAX_ROWS = 100;

/** null for empty, false for invalid, otherwise the string. */
function text(v: unknown, max: number): string | null | false {
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" && v.length <= max ? v : false;
}

function toRow(raw: unknown, index: number): typeof cmsCategories.$inferInsert | string {
  if (!raw || typeof raw !== "object") return "must be an object";
  const r = raw as Record<string, unknown>;
  const name = text(r.name, 100);
  if (!name) return "name is required (up to 100 characters)";
  const description = text(r.description, 2000);
  const icon = text(r.icon, 7_000_000);
  const image = text(r.image, 7_000_000);
  const color = text(r.color, 50);
  if (description === false || icon === false || image === false || color === false) {
    return "description, icon, image or color is invalid or too long";
  }
  return { name, description, icon, image, color, orderIndex: index, isActive: r.isActive !== false };
}

/** Body: { categories: [...] }. Replaces the whole list; order is the array order. */
async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const list: unknown = body?.categories;
    if (!Array.isArray(list)) return badRequest("categories must be a list");
    if (list.length > MAX_ROWS) return badRequest(`At most ${MAX_ROWS} categories`);

    // Validate everything before touching the table.
    const rows: (typeof cmsCategories.$inferInsert)[] = [];
    for (const [i, raw] of list.entries()) {
      const row = toRow(raw, i);
      if (typeof row === "string") return badRequest(`Category ${i + 1}: ${row}`);
      rows.push(row);
    }

    await db.transaction(async (tx) => {
      await tx.delete(cmsCategories);
      if (rows.length > 0) await tx.insert(cmsCategories).values(rows);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
