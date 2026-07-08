import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages, cmsPageBlocks, cmsPageVersions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const pageId = parseInt(p.id);

    const [page] = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.id, pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const blocks = await db
      .select()
      .from(cmsPageBlocks)
      .where(eq(cmsPageBlocks.pageId, pageId))
      .orderBy(asc(cmsPageBlocks.orderIndex));

    return NextResponse.json({ page, blocks });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const p = await params;
    const pageId = parseInt(p.id);
    const body = await req.json();

    // Start a transaction if possible, or just sequential updates
    // Save version history first
    const [existingPage] = await db.select().from(cmsPages).where(eq(cmsPages.id, pageId)).limit(1);
    const existingBlocks = await db.select().from(cmsPageBlocks).where(eq(cmsPageBlocks.pageId, pageId)).orderBy(asc(cmsPageBlocks.orderIndex));

    if (existingPage) {
      await db.insert(cmsPageVersions).values({
        pageId,
        title: existingPage.title,
        blocks: existingBlocks,
        seoMetadata: {
          seoTitle: existingPage.seoTitle,
          seoDescription: existingPage.seoDescription,
          keywords: existingPage.keywords
        },
        createdBy: admin.id
      });
    }

    // Update page
    const [updatedPage] = await db
      .update(cmsPages)
      .set({
        title: body.page.title,
        slug: body.page.slug,
        status: body.page.status,
        visibility: body.page.visibility,
        seoTitle: body.page.seoTitle,
        seoDescription: body.page.seoDescription,
        keywords: body.page.keywords,
        ogImage: body.page.ogImage,
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, pageId))
      .returning();

    // Update blocks (delete all and re-insert)
    await db.delete(cmsPageBlocks).where(eq(cmsPageBlocks.pageId, pageId));
    
    let insertedBlocks: any[] = [];
    if (body.blocks && body.blocks.length > 0) {
      insertedBlocks = await db.insert(cmsPageBlocks).values(
        body.blocks.map((block: any, index: number) => ({
          pageId,
          type: block.type,
          content: block.content,
          orderIndex: index,
        }))
      ).returning();
    }

    return NextResponse.json({ page: updatedPage, blocks: insertedBlocks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const pageId = parseInt(p.id);

    await db.delete(cmsPages).where(eq(cmsPages.id, pageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or failed to delete" }, { status: 500 });
  }
}
