import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHomepageFaq } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

// Columns an admin may set (text max lengths). Anything else in the body is ignored.
const TEXT_FIELDS: Record<string, number> = {
  title: 255,
  description: 5000,
};
const REQUIRED = ["title"];
const BOOL_FIELDS = ["isActive"];
const LIST_FIELDS = ["items"];

type FaqInsert = typeof cmsHomepageFaq.$inferInsert;

function pickFields(body: Record<string, unknown>): Record<string, unknown> | string {
  const data: Record<string, unknown> = {};
  for (const [key, max] of Object.entries(TEXT_FIELDS)) {
    const v = body[key];
    if (v === undefined) continue;
    if (v === null || v === "") {
      if (REQUIRED.includes(key)) return `${key} is required`;
      data[key] = null;
    } else if (typeof v !== "string" || v.length > max) {
      return `${key} must be text up to ${max} characters`;
    } else data[key] = v;
  }
  for (const key of BOOL_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "boolean") return `${key} must be true or false`;
    data[key] = body[key];
  }
  for (const key of LIST_FIELDS) {
    const v = body[key];
    if (v === undefined) continue;
    if (!Array.isArray(v) || v.length > 100) return `${key} must be a list of up to 100 entries`;
    data[key] = v;
  }
  return data;
}

async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Invalid request body");

    const data = pickFields(body);
    if (typeof data === "string") return badRequest(data);

    const [existing] = await db.select({ id: cmsHomepageFaq.id }).from(cmsHomepageFaq).limit(1);

    if (existing) {
      if (Object.keys(data).length === 0) return badRequest("Nothing to update");
      const [updated] = await db
        .update(cmsHomepageFaq)
        .set(data as Partial<FaqInsert>)
        .where(eq(cmsHomepageFaq.id, existing.id))
        .returning();
      return NextResponse.json({ faq: updated });
    }

    if (!data.title) return badRequest("title is required");
    const [created] = await db.insert(cmsHomepageFaq).values(data as FaqInsert).returning();
    return NextResponse.json({ faq: created });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating homepage FAQ:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
