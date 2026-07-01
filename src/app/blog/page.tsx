import { Sparkles, ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { defaultStories } from "@/lib/content-constants";

export default async function BlogPage() {
  const settingsArray = await db.select().from(organizationSettings).limit(1);
  const settings = settingsArray[0] || {};
  
  const stories = Array.isArray(settings.metadata?.blogContent) && settings.metadata.blogContent.length > 0
    ? settings.metadata.blogContent
    : defaultStories;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-[#0b1120] text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" /> Real community stories
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Success Stories</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Read heartwarming stories of people reuniting with their most cherished belongings, made possible by the honesty of our community.
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story: any) => (
            <Link key={story.id} href={`#`} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={story.image} 
                  alt={story.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 tracking-wide uppercase">
                  {story.category}
                </div>
              </div>
              
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {story.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {story.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  {story.title}
                </h3>
                
                <p className="text-slate-600 mb-6 flex-1 text-sm leading-relaxed">
                  {story.excerpt}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all">
                  Read full story <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Load More Button */}
        <div className="mt-16 text-center">
          <button className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors">
            Load More Stories
          </button>
        </div>
      </div>
    </div>
  );
}
