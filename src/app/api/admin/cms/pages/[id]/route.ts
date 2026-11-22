import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages, cmsPageBlocks, cmsPageVersions, cmsPageStatusEnum } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

type RouteContext = { params: Promise<{ id: string }> };
type PageStatus = (typeof cmsPageStatusEnum.enumValues)[number];
type PageUpdate = Partial<typeof cmsPages.$inferInsert>;
type BlockInput = { type: string; content: unknown };

const PAGE_STATUSES: readonly string[] = cmsPageStatusEnum.enumValues;
const VISIBILITIES = ["public", "private", "password"];
const SLUG_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const MAX_BLOCKS = 200;

function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** Whitelisted page fields. Fields that are absent are left unchanged. */
function validatePage(raw: unknown): PageUpdate | string {
  if (!raw || typeof raw !== "object") return "page is required";
  const p = raw as Record<string, unknown>;
  const data: PageUpdate = {};

  if (p.title !== undefined) {
    if (typeof p.title !== "string" || !p.title.trim() || p.title.length > 255) {
      return "Title is required (up to 255 characters)";
    }
    data.title = p.title.trim();
  }
  if (p.slug !== undefined) {
    if (typeof p.slug !== "string" || p.slug.length > 255 || !SLUG_PATTERN.test(p.slug.trim())) {
      return "Slug may only contain letters, numbers, -, _ and /";
    }
    data.slug = p.slug.trim();
  }
  if (p.status !== undefined) {
    if (typeof p.status !== "string" || !PAGE_STATUSES.includes(p.status)) return "Invalid status";
    data.status = p.status as PageStatus;
  }
  if (p.visibility !== undefined) {
    if (typeof p.visibility !== "string" || !VISIBILITIES.includes(p.visibility)) {
      return "Visibility must be public, private or password";
    }
    data.visibility = p.visibility;
  }

  const optional: [keyof PageUpdate & string, number][] = [
    ["seoTitle", 255],
    ["seoDescription", 5000],
    ["keywords", 2000],
    ["ogImage", 7_000_000],
  ];
  for (const [key, max] of optional) {
    const v = p[key];
    if (v === undefined) continue;
    if (v === null || v === "") (data as Record<string, unknown>)[key] = null;
    else if (typeof v !== "string" || v.length > max) return `${key} must be text up to ${max} characters`;
    else (data as Record<string, unknown>)[key] = v;
  }
  return data;
}

function validateBlocks(raw: unknown): BlockInput[] | string {
  if (!Array.isArray(raw)) return "blocks must be a list";
  if (raw.length > MAX_BLOCKS) return `A page can have at most ${MAX_BLOCKS} blocks`;
  const blocks: BlockInput[] = [];
  for (const [i, b] of raw.entries()) {
    if (!b || typeof b !== "object") return `Block ${i + 1} is invalid`;
    const { type, content } = b as Record<string, unknown>;
    if (typeof type !== "string" || !type || type.length > 50) return `Block ${i + 1} needs a type`;
    if (content === undefined) return `Block ${i + 1} has no content`;
    blocks.push({ type, content });
  }
  return blocks;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const pageId = parseId((await params).id);
    if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.id, pageId)).limit(1);
    if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const blocks = await db
      .select()
      .from(cmsPageBlocks)
      .where(eq(cmsPageBlocks.pageId, pageId))
      .orderBy(asc(cmsPageBlocks.orderIndex));

    return NextResponse.json({ page, blocks });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error loading page:", error);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}

/**
 * Body: { page: {...}, blocks?: [{ type, content }] }. Everything is validated
 * first; then, in one transaction, the old version is snapshotted, the page is
 * updated and (if `blocks` was sent) the blocks are replaced.
 */
async function PUTImpl(req: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const pageId = parseId((await params).id);
    if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const pageData = validatePage(body?.page);
    if (typeof pageData === "string") return badRequest(pageData);
    const blocks = body?.blocks === undefined ? null : validateBlocks(body.blocks);
    if (typeof blocks === "string") return badRequest(blocks);

    const result = await db.transaction(async (tx) => {
      const [existingPage] = await tx
        .select()
        .from(cmsPages)
        .where(eq(cmsPages.id, pageId))
        .for("update");
      if (!existingPage) return null;

      const existingBlocks = await tx
        .select()
        .from(cmsPageBlocks)
        .where(eq(cmsPageBlocks.pageId, pageId))
        .orderBy(asc(cmsPageBlocks.orderIndex));

      await tx.insert(cmsPageVersions).values({
        pageId,
        title: existingPage.title,
        blocks: existingBlocks,
        seoMetadata: {
          seoTitle: existingPage.seoTitle,
          seoDescription: existingPage.seoDescription,
          keywords: existingPage.keywords,
        },
        createdBy: admin.id,
      });

      const [updatedPage] = await tx
        .update(cmsPages)
        .set({ ...pageData, updatedAt: new Date() })
        .where(eq(cmsPages.id, pageId))
        .returning();

      if (blocks === null) return { page: updatedPage, blocks: existingBlocks };

      await tx.delete(cmsPageBlocks).where(eq(cmsPageBlocks.pageId, pageId));
      const insertedBlocks =
        blocks.length > 0
          ? await tx
              .insert(cmsPageBlocks)
              .values(blocks.map((b, index) => ({ pageId, type: b.type, content: b.content, orderIndex: index })))
              .returning()
          : [];
      return { page: updatedPage, blocks: insertedBlocks };
    });

    if (!result) return NextResponse.json({ error: "Page not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (isUniqueViolation(error)) return badRequest("Slug already exists");
    console.error("Error updating page:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

async function DELETEImpl(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const pageId = parseId((await params).id);
    if (!pageId) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const deleted = await db
      .delete(cmsPages)
      .where(eq(cmsPages.id, pageId))
      .returning({ id: cmsPages.id });
    if (deleted.length === 0) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error deleting page:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function PUT(...args: Parameters<typeof PUTImpl>) {
  const res = await PUTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}

export async function DELETE(...args: Parameters<typeof DELETEImpl>) {
  const res = await DELETEImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
