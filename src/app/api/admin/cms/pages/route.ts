import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages, cmsPageBlocks, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

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
        authorName: users.name
      })
      .from(cmsPages)
      .leftJoin(users, eq(cmsPages.authorId, users.id))
      .orderBy(desc(cmsPages.updatedAt));

    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const [newPage] = await db.insert(cmsPages).values({
      title: body.title,
      slug: body.slug,
      status: body.status || "draft",
      authorId: admin.id,
    }).returning();

    return NextResponse.json(newPage);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation for slug
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
