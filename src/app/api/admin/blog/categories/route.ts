import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogCategories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await db
      .select()
      .from(blogCategories)
      .orderBy(desc(blogCategories.createdAt));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const [newCategory] = await db
      .insert(blogCategories)
      .values({
        name: body.name,
        slug: body.slug,
        color: body.color,
        description: body.description,
        featuredImage: body.featuredImage,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
      })
      .returning();

    return NextResponse.json({ category: newCategory });
  } catch (error: any) {
    console.error("POST Category Error:", error);
    if (error?.code === "23505") { // unique constraint violation
      return NextResponse.json({ error: "Category slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
