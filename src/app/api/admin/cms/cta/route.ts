import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHomepageCta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

// Columns an admin may set (text max lengths). Anything else in the body is ignored.
const TEXT_FIELDS: Record<string, number> = {
  headline: 255,
  subheading: 2000,
  primaryButtonText: 50,
  primaryButtonLink: 255,
  secondaryButtonText: 50,
  secondaryButtonLink: 255,
};
const REQUIRED = ["headline"];
const BOOL_FIELDS = ["isActive"];

type CtaInsert = typeof cmsHomepageCta.$inferInsert;

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
  return data;
}

async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Invalid request body");

    const data = pickFields(body);
    if (typeof data === "string") return badRequest(data);

    const [existing] = await db.select({ id: cmsHomepageCta.id }).from(cmsHomepageCta).limit(1);

    if (existing) {
      if (Object.keys(data).length === 0) return badRequest("Nothing to update");
      const [updated] = await db
        .update(cmsHomepageCta)
        .set(data as Partial<CtaInsert>)
        .where(eq(cmsHomepageCta.id, existing.id))
        .returning();
      return NextResponse.json({ cta: updated });
    }

    if (!data.headline) return badRequest("headline is required");
    const [created] = await db.insert(cmsHomepageCta).values(data as CtaInsert).returning();
    return NextResponse.json({ cta: created });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating homepage CTA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
