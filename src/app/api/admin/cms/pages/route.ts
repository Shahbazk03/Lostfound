import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages, users, cmsPageStatusEnum } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

type PageStatus = (typeof cmsPageStatusEnum.enumValues)[number];
const PAGE_STATUSES: readonly string[] = cmsPageStatusEnum.enumValues;
const SLUG_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function GET() {
  try {
    await requireAdmin();
    const pages = await db
      .select({
        id: cmsPages.id,
        title: cmsPages.title,
        slug: cmsPages.slug,
        status: cmsPages.status,
        updatedAt: cmsPages.updatedAt,
        authorName: users.name,
      })
      .from(cmsPages)
      .leftJoin(users, eq(cmsPages.authorId, users.id))
      .orderBy(desc(cmsPages.updatedAt));

    return NextResponse.json(pages);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error listing pages:", error);
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 });
  }
}

async function POSTImpl(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 255) return badRequest("Title is required (up to 255 characters)");
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug || slug.length > 255 || !SLUG_PATTERN.test(slug)) {
      return badRequest("Slug may only contain letters, numbers, -, _ and /");
    }
    const status = body?.status ?? "draft";
    if (typeof status !== "string" || !PAGE_STATUSES.includes(status)) return badRequest("Invalid status");

    const [newPage] = await db
      .insert(cmsPages)
      .values({ title, slug, status: status as PageStatus, authorId: admin.id })
      .returning();

    return NextResponse.json(newPage);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (isUniqueViolation(error)) return badRequest("Slug already exists");
    console.error("Error creating page:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
