import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts, blogCategories, users, blogPostTags, blogTags } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc, inArray, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        status: blogPosts.status,
        featuredImage: blogPosts.featuredImage,
        views: blogPosts.views,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        category: {
          id: blogCategories.id,
          name: blogCategories.name,
        },
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id));

    if (status) {
      query = query.where(eq(blogPosts.status, status as any)) as any;
    }

    const posts = await query.orderBy(desc(blogPosts.createdAt));

    // For tags and comments, we could fetch them separately or aggregate, but for list view, tags might not be strictly needed, but let's fetch them if possible
    // A quick way for list view is just fetching the basic info.

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET Posts Error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const [newPost] = await db
      .insert(blogPosts)
      .values({
        title: body.title || "Untitled Post",
        slug: body.slug || `untitled-${Date.now()}`,
        excerpt: body.excerpt,
        content: body.content,
        featuredImage: body.featuredImage,
        categoryId: body.categoryId || null,
        authorId: body.authorId || admin.id,
        status: body.status || "draft",
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    if (body.tags && Array.isArray(body.tags)) {
      if (body.tags.length > 0) {
        await db.insert(blogPostTags).values(
          body.tags.map((tagId: number) => ({
            postId: newPost.id,
            tagId,
          }))
        );
      }
    }

    return NextResponse.json({ post: newPost });
  } catch (error: any) {
    console.error("POST Post Error:", error);
    if (error?.code === "23505") { // unique constraint violation
      return NextResponse.json({ error: "Post slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
