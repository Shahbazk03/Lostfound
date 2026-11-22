import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { eq } from "drizzle-orm";
import { invalidatePublicContent } from "@/lib/cache";

// Columns an admin may set, with max lengths. Anything else in the body is ignored.
const TEXT_FIELDS: Record<string, number> = {
  organizationName: 255,
  description: 10_000,
  contactEmail: 255,
  contactPhone: 50,
  address: 2000,
  city: 100,
  country: 100,
  logo: 7_000_000,
  banner: 7_000_000,
  supportEmail: 255,
  supportPhone: 50,
  timezone: 50,
  currency: 10,
};
const REQUIRED = ["organizationName", "contactEmail"];

type OrgInsert = typeof organizationSettings.$inferInsert;

function pickFields(body: Record<string, unknown>): Record<string, unknown> | string {
  const data: Record<string, unknown> = {};
  for (const [key, max] of Object.entries(TEXT_FIELDS)) {
    const v = body[key];
    if (v === undefined) continue;
    if (v === null || v === "") {
      if (REQUIRED.includes(key)) return `${key} is required`;
      data[key] = null;
      continue;
    }
    if (typeof v !== "string" || v.length > max) return `${key} must be text up to ${max} characters`;
    data[key] = v;
  }
  if (body.metadata !== undefined) {
    const m = body.metadata;
    if (m !== null && (typeof m !== "object" || Array.isArray(m))) return "metadata must be an object";
    data.metadata = m ?? {};
  }
  return data;
}

export async function GET() {
  try {
    await requireAdmin();

    // There should only ever be one row.
    const [settings] = await db.select().from(organizationSettings).limit(1);
    if (settings) return NextResponse.json(settings);

    const [created] = await db
      .insert(organizationSettings)
      .values({
        organizationName: "Global Lost and Found Platform",
        contactEmail: "contact@example.com",
        timezone: "UTC",
        currency: "USD",
      })
      .returning();
    return NextResponse.json(created);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error fetching organization settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

async function PUTImpl(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const data = pickFields(body);
    if (typeof data === "string") return badRequest(data);

    const [existing] = await db
      .select({ id: organizationSettings.id })
      .from(organizationSettings)
      .limit(1);

    if (!existing) {
      if (!data.organizationName || !data.contactEmail) {
        return badRequest("organizationName and contactEmail are required");
      }
      const [created] = await db
        .insert(organizationSettings)
        .values(data as OrgInsert)
        .returning();
      return NextResponse.json(created);
    }

    const [updated] = await db
      .update(organizationSettings)
      .set({ ...(data as Partial<OrgInsert>), updatedAt: new Date() })
      .where(eq(organizationSettings.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating organization settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function PUT(...args: Parameters<typeof PUTImpl>) {
  const res = await PUTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
