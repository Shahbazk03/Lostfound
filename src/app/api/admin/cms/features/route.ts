import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsFeatures } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

const MAX_ROWS = 100;

/** null for empty, false for invalid, otherwise the string. */
function text(v: unknown, max: number): string | null | false {
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" && v.length <= max ? v : false;
}

function toRow(raw: unknown, index: number): typeof cmsFeatures.$inferInsert | string {
  if (!raw || typeof raw !== "object") return "must be an object";
  const r = raw as Record<string, unknown>;
  const title = text(r.title, 255);
  if (!title) return "title is required (up to 255 characters)";
  const description = text(r.description, 5000);
  const icon = text(r.icon, 7_000_000);
  if (description === false || icon === false) return "description or icon is invalid or too long";
  return { title, description: description ?? "", icon, orderIndex: index, isActive: r.isActive !== false };
}

/** Body: { features: [...] }. Replaces the whole list; order is the array order. */
async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const list: unknown = body?.features;
    if (!Array.isArray(list)) return badRequest("features must be a list");
    if (list.length > MAX_ROWS) return badRequest(`At most ${MAX_ROWS} features`);

    // Validate everything before touching the table.
    const rows: (typeof cmsFeatures.$inferInsert)[] = [];
    for (const [i, raw] of list.entries()) {
      const row = toRow(raw, i);
      if (typeof row === "string") return badRequest(`Feature ${i + 1}: ${row}`);
      rows.push(row);
    }

    await db.transaction(async (tx) => {
      await tx.delete(cmsFeatures);
      if (rows.length > 0) await tx.insert(cmsFeatures).values(rows);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating features:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
