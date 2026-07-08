import { db } from "@/db";
import { blogPosts, blogTags, blogPostTags, blogCategories, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, p.slug)).limit(1);
  if (!tag) return { title: "Tag Not Found" };
  
  return {
    title: `Posts tagged "${tag.name}" | LostFound Blog`,
    description: `Read all posts tagged with ${tag.name} on the LostFound Blog.`,
  };
}

export default async function BlogTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, p.slug)).limit(1);
  
  if (!tag) notFound();

  // Find post IDs with this tag
  const postTagRecords = await db.select().from(blogPostTags).where(eq(blogPostTags.tagId, tag.id));
  const postIds = postTagRecords.map(pt => pt.postId);

  let posts: any[] = [];
  if (postIds.length > 0) {
    posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        readingTime: blogPosts.readingTime,
        category: {
          name: blogCategories.name,
          slug: blogCategories.slug,
          color: blogCategories.color,
        },
        author: {
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(inArray(blogPosts.id, postIds))
      .orderBy(desc(blogPosts.publishedAt));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <main className="flex-1 pt-24 pb-20 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to All Posts
          </Link>
        </div>

        <div className="mb-16 max-w-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-200 dark:bg-slate-800 shadow-sm text-slate-500">
              <Tag className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              #{tag.name}
            </h1>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {post.featuredImage ? (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-400">No Image</span>
                    </div>
                  )}
                  {post.category && (
                    <div className="absolute top-4 left-4">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: post.category.color || '#059669' }}
                      >
                        {post.category.name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span>{formatDate(post.publishedAt?.toISOString() || new Date().toISOString())}</span>
                    <span>{post.readingTime || 5} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {posts.length === 0 && (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No articles found with this tag.
            </div>
          )}
        </div>
      </main>
      
      <DynamicFooter />
    </div>
  );
}
