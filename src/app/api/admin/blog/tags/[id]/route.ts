import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogTags } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const tagId = parseInt(p.id);

    const [tag] = await db
      .select()
      .from(blogTags)
      .where(eq(blogTags.id, tagId))
      .limit(1);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const tagId = parseInt(p.id);
    const body = await req.json();

    const [updatedTag] = await db
      .update(blogTags)
      .set({
        name: body.name,
        slug: body.slug,
      })
      .where(eq(blogTags.id, tagId))
      .returning();

    if (!updatedTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag: updatedTag });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Tag slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const tagId = parseInt(p.id);

    await db.delete(blogTags).where(eq(blogTags.id, tagId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
