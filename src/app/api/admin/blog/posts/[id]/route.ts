import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts, blogPostTags } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const postId = parseInt(p.id);

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postTags = await db
      .select({ tagId: blogPostTags.tagId })
      .from(blogPostTags)
      .where(eq(blogPostTags.postId, postId));

    return NextResponse.json({ 
      post: {
        ...post,
        tags: postTags.map((t) => t.tagId)
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const postId = parseInt(p.id);
    const body = await req.json();

    const updateData: any = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featuredImage: body.featuredImage,
      galleryImages: body.galleryImages || [],
      categoryId: body.categoryId || null,
      authorId: body.authorId,
      status: body.status,
      featured: body.featured,
      allowComments: body.allowComments,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      canonicalUrl: body.canonicalUrl,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      updatedAt: new Date(),
    };

    if (body.status === "published") {
      updateData.publishedAt = new Date();
    }

    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, postId))
      .returning();

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (body.tags && Array.isArray(body.tags)) {
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
      if (body.tags.length > 0) {
        await db.insert(blogPostTags).values(
          body.tags.map((tagId: number) => ({
            postId: postId,
            tagId,
          }))
        );
      }
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error: any) {
    console.error("PUT post error:", error);
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Post slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const postId = parseInt(p.id);

    await db.delete(blogPosts).where(eq(blogPosts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
