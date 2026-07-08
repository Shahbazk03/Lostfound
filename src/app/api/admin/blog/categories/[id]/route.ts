import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const categoryId = parseInt(p.id);

    const [category] = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.id, categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const categoryId = parseInt(p.id);
    const body = await req.json();

    const [updatedCategory] = await db
      .update(blogCategories)
      .set({
        name: body.name,
        slug: body.slug,
        color: body.color,
        description: body.description,
        featuredImage: body.featuredImage,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        updatedAt: new Date(),
      })
      .where(eq(blogCategories.id, categoryId))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category: updatedCategory });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Category slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const categoryId = parseInt(p.id);

    await db.delete(blogCategories).where(eq(blogCategories.id, categoryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
