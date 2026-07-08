import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogComments, blogPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = db
      .select({
        id: blogComments.id,
        authorName: blogComments.authorName,
        authorEmail: blogComments.authorEmail,
        message: blogComments.message,
        status: blogComments.status,
        createdAt: blogComments.createdAt,
        post: {
          id: blogPosts.id,
          title: blogPosts.title,
        }
      })
      .from(blogComments)
      .leftJoin(blogPosts, eq(blogComments.postId, blogPosts.id));

    if (status) {
      query = query.where(eq(blogComments.status, status as any)) as any;
    }

    const comments = await query.orderBy(desc(blogComments.createdAt));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET Comments Error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
