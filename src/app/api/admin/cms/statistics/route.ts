import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsStatistics } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

const MAX_ROWS = 50;

/** null for empty, false for invalid, otherwise the string. */
function text(v: unknown, max: number): string | null | false {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") v = String(v);
  return typeof v === "string" && v.length <= max ? v : false;
}

// Only these columns are written; ids and timestamps from the client are ignored.
function toRow(raw: unknown, index: number): typeof cmsStatistics.$inferInsert | string {
  if (!raw || typeof raw !== "object") return "must be an object";
  const r = raw as Record<string, unknown>;
  const label = text(r.label, 100);
  if (!label) return "label is required (up to 100 characters)";
  const numberValue = text(r.numberValue, 50);
  if (!numberValue) return "value is required (up to 50 characters)";
  const icon = text(r.icon, 50);
  const color = text(r.color, 50);
  if (icon === false || color === false) return "icon or color is invalid or too long";
  return { label, numberValue, icon, color, orderIndex: index, isActive: r.isActive !== false };
}

/** Body: { statistics: [...] }. Replaces the whole list; order is the array order. */
async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const list: unknown = body?.statistics;
    if (!Array.isArray(list)) return badRequest("statistics must be a list");
    if (list.length > MAX_ROWS) return badRequest(`At most ${MAX_ROWS} statistics`);

    // Validate everything before touching the table.
    const rows: (typeof cmsStatistics.$inferInsert)[] = [];
    for (const [i, raw] of list.entries()) {
      const row = toRow(raw, i);
      if (typeof row === "string") return badRequest(`Statistic ${i + 1}: ${row}`);
      rows.push(row);
    }

    await db.transaction(async (tx) => {
      await tx.delete(cmsStatistics);
      if (rows.length > 0) await tx.insert(cmsStatistics).values(rows);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating statistics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
