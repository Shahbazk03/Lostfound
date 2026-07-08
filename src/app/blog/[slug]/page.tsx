import { db } from "@/db";
import { blogPosts, blogCategories, blogComments, blogPostTags, blogTags, users } from "@/db/schema";
import { eq, sql, desc, ne, and, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Mail, MessageSquare } from "lucide-react";
import ArticleReader from "@/components/blog/ArticleReader";

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
      slug: blogPosts.slug,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      featuredImage: blogPosts.featuredImage,
      publishedAt: blogPosts.publishedAt,
      readingTime: blogPosts.readingTime,
      views: blogPosts.views,
      categoryId: blogPosts.categoryId,
      category: {
        name: blogCategories.name,
        slug: blogCategories.slug,
        color: blogCategories.color,
      },
      author: {
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
        position: users.position,
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

  // Fetch Tags
  const postTagsData = await db
    .select({
      id: blogTags.id,
      name: blogTags.name,
      slug: blogTags.slug,
    })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
    .where(eq(blogPostTags.postId, post.id));

  // Fetch Comments
  const comments = await db
    .select()
    .from(blogComments)
    .where(and(eq(blogComments.postId, post.id), eq(blogComments.status, "approved")))
    .orderBy(desc(blogComments.createdAt));

  // Fetch Related Posts (same category, not this post)
  let relatedPosts: any[] = [];
  if (post.categoryId) {
    relatedPosts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.categoryId, post.categoryId), ne(blogPosts.id, post.id), eq(blogPosts.status, "published")))
      .limit(3);
  }

  const articleUrl = `https://lostfound.com/blog/${post.slug}`; // Change to real domain in production

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-20">
        
        {/* Article Header */}
        <header className="max-w-4xl mx-auto px-6 sm:px-8 mb-10 pt-8 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {post.category && (
              <Link href={`/blog/category/${post.category.slug}`}>
                <span 
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm uppercase tracking-wider"
                  style={{ backgroundColor: post.category.color || '#059669' }}
                >
                  {post.category.name}
                </span>
              </Link>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readingTime || 5} min read</span>
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {post.views} views</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            {post.title}
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-3xl mx-auto">
            {post.excerpt}
          </p>
        </header>

        {/* Hero Image */}
        {post.featuredImage && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
            <div className="rounded-3xl overflow-hidden aspect-[16/9] lg:aspect-[21/9] bg-slate-100 dark:bg-slate-900 shadow-lg">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Author Info Bar */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-y border-slate-200 dark:border-slate-800 gap-6">
            <div className="flex items-center gap-4">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100 dark:border-emerald-900" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xl border-2 border-slate-200 dark:border-slate-700">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-lg">{post.author?.name || "LostFound Team"}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {post.author?.position || "Editorial"} • {formatDate(post.publishedAt?.toISOString() || new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Reader Component (Progress, TOC, Content, Share) */}
        <div className="px-6 sm:px-8 max-w-7xl mx-auto mb-20">
          <ArticleReader content={post.content || ""} title={post.title} url={articleUrl} />
          
          {/* Post Tags */}
          {postTagsData.length > 0 && (
            <div className="max-w-3xl mx-auto lg:ml-12 xl:ml-[4.5rem] mt-12 flex flex-wrap gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white mr-2 self-center">Tags:</span>
              {postTagsData.map(tag => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="px-3 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Author Bio Box */}
        {post.author && (
          <div className="max-w-3xl mx-auto px-6 sm:px-8 mb-20">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left border border-slate-100 dark:border-slate-800">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-24 h-24 rounded-full object-cover shadow-sm shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-3xl shrink-0">
                  {post.author.name?.charAt(0) || "A"}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">Written By</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{post.author.name}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {post.author.bio || "A valued contributor to the LostFound community, sharing insights and stories to help make the world a safer place."}
                </p>
                <Link href="/blog" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                  View more posts by {post.author.name.split(' ')[0]} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Callout */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 mb-20">
          <div className="bg-emerald-600 dark:bg-emerald-900 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-emerald-600/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black opacity-10 rounded-full blur-3xl"></div>
            
            <Mail className="w-12 h-12 text-emerald-200 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4 relative z-10">Stay Updated with LostFound</h3>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto relative z-10">
              Receive recovery stories, travel safety tips, AI updates, and community success stories directly in your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative z-10">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-5 py-4 rounded-xl bg-emerald-700/50 dark:bg-black/20 border border-emerald-500/50 text-white placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                required
              />
              <button type="submit" className="px-6 py-4 rounded-xl bg-white text-emerald-700 dark:text-emerald-900 font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap">
                Subscribe Now
              </button>
            </form>
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-3xl mx-auto px-6 sm:px-8 mb-20">
          <div className="flex items-center gap-3 mb-10 border-b border-slate-200 dark:border-slate-800 pb-4">
            <MessageSquare className="w-6 h-6 text-slate-900 dark:text-white" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Discussion ({comments.length})
            </h3>
          </div>
          
          {comments.length > 0 ? (
            <div className="space-y-8">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold shrink-0">
                    {comment.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-slate-900 dark:text-white">{comment.authorName}</h5>
                      <span className="text-xs text-slate-500">{formatDate(comment.createdAt.toISOString())}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                      {comment.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">Be the first to share your thoughts.</p>
            </div>
          )}
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Related Articles</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex flex-col h-full">
                  <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-2xl mb-4">
                    {rp.featuredImage ? (
                      <img 
                        src={rp.featuredImage} 
                        alt={rp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {rp.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-auto pt-2">
                    {formatDate(rp.publishedAt?.toISOString() || new Date().toISOString())}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
      
      <DynamicFooter />
    </div>
  );
}
