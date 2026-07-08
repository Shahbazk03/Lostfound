import { db } from "@/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Share2, Clock, Eye } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, p.slug)).limit(1);
  if (!post) return { title: "Post Not Found" };
  
  return {
    title: `${post.seoTitle || post.title} | LostFound Blog`,
    description: post.seoDescription || post.excerpt,
    keywords: post.seoKeywords,
    alternates: {
      canonical: post.canonicalUrl,
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      featuredImage: blogPosts.featuredImage,
      publishedAt: blogPosts.publishedAt,
      readingTime: blogPosts.readingTime,
      views: blogPosts.views,
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
    .where(eq(blogPosts.slug, p.slug))
    .limit(1);

  if (!post) notFound();

  // Increment views asynchronously
  db.update(blogPosts).set({ views: sql`${blogPosts.views} + 1` }).where(eq(blogPosts.id, post.id)).execute().catch(console.error);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <main className="flex-1 pt-24 pb-20">
        <article className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="mb-10 pt-8">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {post.category && (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: post.category.color || '#059669' }}
                >
                  {post.category.name}
                </span>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readingTime || 5} min read</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {post.views} views</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between py-6 border-y border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">
                    {post.author?.name?.charAt(0) || "A"}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{post.author?.name || "LostFound Team"}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Published on {formatDate(post.publishedAt?.toISOString() || new Date().toISOString())}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {post.featuredImage && (
            <div className="mb-12 rounded-3xl overflow-hidden aspect-[21/9] bg-slate-100 dark:bg-slate-900 shadow-sm">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div 
            className="prose prose-lg dark:prose-invert prose-emerald max-w-none prose-headings:font-bold prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-2xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>
      </main>
      
      <DynamicFooter />
    </div>
  );
}
