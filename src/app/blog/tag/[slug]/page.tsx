import { db } from "@/db";
import { blogPosts, blogCategories, blogTags, blogPostTags, users } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, p.slug)).limit(1);
  if (!tag) return { title: "Tag Not Found" };
  
  return {
    title: `${tag.name} | LostFound Blog`,
    description: `Articles tagged with ${tag.name}`,
  };
}

export default async function BlogTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, p.slug)).limit(1);
  
  if (!tag) notFound();

  // Find posts with this tag
  const postIdsQuery = await db
    .select({ postId: blogPostTags.postId })
    .from(blogPostTags)
    .where(eq(blogPostTags.tagId, tag.id));
    
  const postIds = postIdsQuery.map(r => r.postId);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-20 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to All Posts
          </Link>
        </div>

        <div className="mb-16 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <TagIcon className="w-10 h-10 text-emerald-500" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              #{tag.name}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            {posts.length} {posts.length === 1 ? 'Article' : 'Articles'} found
          </p>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full">
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-2xl mb-5 shadow-sm">
                  {post.featuredImage ? (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-400">No Image</span>
                    </div>
                  )}
                  {post.category && (
                    <div className="absolute top-4 left-4">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm backdrop-blur-md"
                        style={{ backgroundColor: post.category.color ? `${post.category.color}E6` : 'rgba(5,150,105,0.9)' }}
                      >
                        {post.category.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-5 line-clamp-3 flex-1 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto">
                    <div className="flex items-center gap-2">
                      {post.author?.avatar ? (
                        <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          {post.author?.name?.charAt(0) || "A"}
                        </div>
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{post.author?.name}</span>
                    </div>
                    <span>{formatDate(post.publishedAt?.toISOString() || new Date().toISOString())}</span>
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
