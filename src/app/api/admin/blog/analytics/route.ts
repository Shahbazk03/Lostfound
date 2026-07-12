import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogPosts, blogCategories, blogTags, blogComments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [totalPostsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    const [publishedPostsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, "published"));
    const [draftPostsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, "draft"));
    const [scheduledPostsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, "scheduled"));
    
    const [totalCategoriesResult] = await db.select({ count: sql<number>`count(*)` }).from(blogCategories);
    const [totalTagsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogTags);
    const [totalCommentsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogComments);
    
    const [totalViewsResult] = await db.select({ sum: sql<number>`sum(${blogPosts.views})` }).from(blogPosts);

    return NextResponse.json({
      totalPosts: Number(totalPostsResult?.count || 0),
      publishedPosts: Number(publishedPostsResult?.count || 0),
      draftPosts: Number(draftPostsResult?.count || 0),
      scheduledPosts: Number(scheduledPostsResult?.count || 0),
      totalCategories: Number(totalCategoriesResult?.count || 0),
      totalTags: Number(totalTagsResult?.count || 0),
      totalComments: Number(totalCommentsResult?.count || 0),
      totalViews: Number(totalViewsResult?.sum || 0),
    });
  } catch (error) {
    console.error("GET Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
