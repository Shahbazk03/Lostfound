import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHero } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

// Columns an admin may set (text max lengths). Anything else in the body is ignored.
const TEXT_FIELDS: Record<string, number> = {
  headline: 500,
  highlightedWords: 500,
  subheading: 2000,
  primaryButtonText: 50,
  primaryButtonLink: 255,
  secondaryButtonText: 50,
  secondaryButtonLink: 255,
  backgroundImage: 7_000_000,
  illustrationImage: 7_000_000,
  illustrationAnimation: 50,
};
const REQUIRED = ["headline", "subheading"];
const BOOL_FIELDS = ["isActive"];
const LIST_FIELDS = ["trustBadges"];

type HeroInsert = typeof cmsHero.$inferInsert;

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

export async function GET() {
  try {
    await requireAdmin();
    const [hero] = await db.select().from(cmsHero).limit(1);
    return NextResponse.json({ hero: hero || null });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error fetching hero:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Invalid request body");

    const data = pickFields(body);
    if (typeof data === "string") return badRequest(data);

    const [existing] = await db.select({ id: cmsHero.id }).from(cmsHero).limit(1);

    if (existing) {
      const [updated] = await db
        .update(cmsHero)
        .set({ ...(data as Partial<HeroInsert>), updatedAt: new Date() })
        .where(eq(cmsHero.id, existing.id))
        .returning();
      return NextResponse.json({ hero: updated });
    }

    if (!data.headline || !data.subheading) return badRequest("headline and subheading are required");
    const [created] = await db.insert(cmsHero).values(data as HeroInsert).returning();
    return NextResponse.json({ hero: created });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating hero:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
