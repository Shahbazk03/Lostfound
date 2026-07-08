import { db } from "@/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Blog | LostFound",
  description: "Read the latest news, success stories, and tips from the LostFound community.",
};

export default async function BlogListingPage() {
  const posts = await db
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
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20);

  const featuredPost = posts.find(p => p.featuredImage) || posts[0];
  const otherPosts = posts.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <main className="flex-1 pt-24 pb-20 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
            Our <span className="text-emerald-600 dark:text-emerald-500">Blog</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Insights, success stories, and tips on how to keep your belongings safe and recover lost items quickly.
          </p>
        </div>

        {featuredPost && (
          <div className="mb-20">
            <Link href={`/blog/${featuredPost.slug}`} className="group block">
              <div className="relative rounded-3xl overflow-hidden aspect-[2/1] md:aspect-[3/1] bg-slate-100 dark:bg-slate-900 mb-8">
                {featuredPost.featuredImage ? (
                  <img 
                    src={featuredPost.featuredImage} 
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-900/20">
                    <span className="text-emerald-600 dark:text-emerald-500 font-medium">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-3xl">
                  {featuredPost.category && (
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4"
                      style={{ backgroundColor: featuredPost.category.color || '#059669' }}
                    >
                      {featuredPost.category.name}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-300 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-slate-200 text-lg mb-6 line-clamp-2 md:line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      {featuredPost.author?.avatar ? (
                        <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
                          {featuredPost.author?.name?.charAt(0) || "A"}
                        </div>
                      )}
                      <span>{featuredPost.author?.name || "LostFound Team"}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(featuredPost.publishedAt?.toISOString() || new Date().toISOString())}</span>
                    <span>•</span>
                    <span>{featuredPost.readingTime || 5} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Latest Articles</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
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
          
          {otherPosts.length === 0 && (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No articles published yet. Check back soon!
            </div>
          )}
        </div>
      </main>
      
      <DynamicFooter />
    </div>
  );
}
