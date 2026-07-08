import { db } from "@/db";
import { blogPosts, blogCategories, blogTags, blogPostTags, users } from "@/db/schema";
import { desc, eq, and, sql, not } from "drizzle-orm";
import Link from "next/link";
import DynamicFooter from "@/components/DynamicFooter";
import { formatDate } from "@/lib/utils";
import { Search, ChevronRight, TrendingUp, Mail, Tag as TagIcon, LayoutGrid } from "lucide-react";

export const metadata = {
  title: "Blog | LostFound",
  description: "Read the latest news, success stories, and tips from the LostFound community.",
};

export default async function BlogListingPage() {
  // Fetch all published posts
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
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
        position: users.position,
      }
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(30);

  const featuredPost = posts.find(p => p.featuredImage) || posts[0];
  const latestPosts = posts.filter(p => p.id !== featuredPost?.id).slice(0, 9);
  const trendingPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const categories = await db.select().from(blogCategories).limit(10);
  const tags = await db.select().from(blogTags).limit(15);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <main className="flex-1 pt-28 pb-20 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              LostFound <span className="text-emerald-600 dark:text-emerald-500">Journal</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Discover recovery stories, travel safety tips, AI updates, and community success stories.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-12 pb-4 overflow-x-auto hide-scrollbar">
          <Link href="/blog" className="px-5 py-2 rounded-full text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm transition-all hover:scale-105 whitespace-nowrap">
            All Articles
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              href={`/blog/category/${cat.slug}`}
              className="px-5 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Featured Hero Article */}
        {featuredPost && (
          <div className="mb-16">
            <Link href={`/blog/${featuredPost.slug}`} className="group block relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[2.5/1] bg-slate-900">
              {featuredPost.featuredImage ? (
                <img 
                  src={featuredPost.featuredImage} 
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <LayoutGrid className="w-12 h-12 text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl w-full">
                {featuredPost.category && (
                  <span 
                    className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4 uppercase tracking-wider backdrop-blur-md bg-white/20"
                    style={{ backgroundColor: featuredPost.category.color ? `${featuredPost.category.color}CC` : 'rgba(5, 150, 105, 0.8)' }}
                  >
                    {featuredPost.category.name}
                  </span>
                )}
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-300 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-slate-300 text-lg md:text-xl mb-6 line-clamp-2 md:line-clamp-3 hidden md:block max-w-3xl">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-3">
                    {featuredPost.author?.avatar ? (
                      <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white border-2 border-white/20 font-bold">
                        {featuredPost.author?.name?.charAt(0) || "A"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{featuredPost.author?.name || "LostFound Team"}</span>
                      <span className="text-xs text-slate-400">{featuredPost.author?.position || "Editorial"}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 border-l border-slate-700 pl-4 ml-2">
                    <span>{formatDate(featuredPost.publishedAt?.toISOString() || new Date().toISOString())}</span>
                    <span>•</span>
                    <span>{featuredPost.readingTime || 5} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area - Latest Articles */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-emerald-500" />
                Latest Articles
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full">
                  <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-2xl mb-5">
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
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: post.category.color || '#059669' }}
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

            {/* Pagination Placeholder */}
            <div className="mt-16 flex justify-center">
              <div className="inline-flex items-center bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
                <button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-not-allowed opacity-50">Previous</button>
                <button className="px-6 py-2 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">1</button>
                <button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">2</button>
                <button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">3</button>
                <button className="px-6 py-2 rounded-full text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Newsletter */}
            <div className="bg-emerald-600 dark:bg-emerald-900 rounded-3xl p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <Mail className="w-10 h-10 text-emerald-200 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Stay Updated with LostFound</h3>
              <p className="text-emerald-100 text-sm mb-6 leading-relaxed">
                Receive recovery stories, travel safety tips, AI updates, and community success stories directly in your inbox.
              </p>
              <form className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 rounded-xl bg-emerald-700/50 dark:bg-black/20 border border-emerald-500/50 text-white placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-white transition-all text-sm"
                  required
                />
                <button type="submit" className="w-full px-4 py-3 rounded-xl bg-white text-emerald-700 dark:text-emerald-900 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm">
                  Subscribe Now
                </button>
              </form>
            </div>

            {/* Trending Articles */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Trending
                </h3>
              </div>
              <div className="space-y-6">
                {trendingPosts.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-4 items-start">
                    <span className="text-3xl font-extrabold text-slate-200 dark:text-slate-800 group-hover:text-emerald-500 dark:group-hover:text-emerald-500 transition-colors mt-1">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(post.publishedAt?.toISOString() || new Date().toISOString())}</span>
                        <span>•</span>
                        <span>{post.readingTime} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-emerald-500" />
                  Popular Tags
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Link 
                    key={tag.id} 
                    href={`/blog/tag/${tag.slug}`}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      
      <DynamicFooter />
    </div>
  );
}
