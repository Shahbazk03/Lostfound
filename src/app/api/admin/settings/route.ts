import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { eq } from "drizzle-orm";
import { invalidatePublicContent } from "@/lib/cache";

const TEXT_LIMITS: Record<string, number> = {
  organizationName: 255,
  description: 10_000,
  contactEmail: 255,
  contactPhone: 50,
  address: 2000,
  city: 100,
  country: 100,
  supportEmail: 255,
  supportPhone: 50,
  timezone: 50,
  currency: 10,
};

export async function GET() {
  try {
    await requireAdmin();
    const [settings] = await db.select().from(organizationSettings).limit(1);
    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function PUTImpl(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    // A missing key leaves the stored value alone (drizzle skips undefined).
    const text: Record<string, string | null | undefined> = {};
    for (const [key, max] of Object.entries(TEXT_LIMITS)) {
      const v = body[key];
      if (v === undefined) continue;
      if (v === null || v === "") {
        text[key] = null;
        continue;
      }
      if (typeof v !== "string" || v.length > max) {
        return badRequest(`${key} must be text up to ${max} characters`);
      }
      text[key] = v;
    }

    const { organizationName, contactEmail } = text;
    if (!organizationName || !contactEmail) {
      return badRequest("Organization name and contact email are required");
    }

    const metadata = body.metadata ?? {};
    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      return badRequest("metadata must be an object");
    }

    const values = {
      organizationName,
      description: text.description,
      contactEmail,
      contactPhone: text.contactPhone,
      address: text.address,
      city: text.city,
      country: text.country,
      supportEmail: text.supportEmail,
      supportPhone: text.supportPhone,
      timezone: text.timezone,
      currency: text.currency,
      metadata: metadata as Record<string, unknown>,
    };

    const [existing] = await db
      .select({ id: organizationSettings.id })
      .from(organizationSettings)
      .limit(1);

    const [result] = existing
      ? await db
          .update(organizationSettings)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(organizationSettings.id, existing.id))
          .returning()
      : await db
          .insert(organizationSettings)
          .values({ ...values, timezone: text.timezone || "UTC", currency: text.currency || "USD" })
          .returning();

    return NextResponse.json({ settings: result });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function PUT(...args: Parameters<typeof PUTImpl>) {
  const res = await PUTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
