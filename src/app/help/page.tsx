import Link from "next/link";
import { Search, ArrowRight, LifeBuoy, Book, MessageCircle, ShieldAlert, FileQuestion, Users, MapPin, Eye, Lock } from "lucide-react";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { defaultHelpCategories } from "@/lib/content-constants";

// Helper to resolve string icon names to Lucide components
const IconMap: Record<string, any> = {
  Book, FileQuestion, ShieldAlert, Users, MapPin, Eye, Lock
};

export default async function HelpCenterPage() {
  const settingsArray = await db.select().from(organizationSettings).limit(1);
  const settings = settingsArray[0] || {};
  
  const rawCategories = Array.isArray(settings.metadata?.helpContent) && settings.metadata.helpContent.length > 0
    ? settings.metadata.helpContent
    : defaultHelpCategories;

  const categories = rawCategories.map((c: any) => ({
    ...c,
    icon: (() => {
      const IconCmp = IconMap[c.iconName] || Book;
      return <IconCmp className="w-6 h-6 text-emerald-500" />;
    })()
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="bg-[#0b1120] text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">How can we help you?</h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Search our knowledge base or browse categories below to find answers to your questions.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for articles, guides, or keywords..." 
              className="w-full bg-white text-slate-900 pl-14 pr-6 py-4 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/50 shadow-2xl transition-all"
            />
            <button className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-medium transition-colors">
              Search
            </button>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-400">
            <span>Popular searches:</span>
            <a href="#" className="hover:text-white underline underline-offset-4 decoration-slate-600">Claiming an item</a>
            <a href="#" className="hover:text-white underline underline-offset-4 decoration-slate-600">Reward payments</a>
            <a href="#" className="hover:text-white underline underline-offset-4 decoration-slate-600">Account recovery</a>
          </div>
        </div>
      </div>

      {/* Main Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((cat, idx) => (
            <Link key={idx} href={cat.link} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-100 transition-all group flex flex-col h-full">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{cat.title}</h3>
              <p className="text-slate-600 mb-6 flex-1">{cat.description}</p>
              <div className="text-emerald-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all mt-auto">
                Browse Articles <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Still need help CTA */}
      <div className="max-w-4xl mx-auto px-4 mt-24">
        <div className="bg-emerald-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-600/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <LifeBuoy className="w-12 h-12 text-emerald-100 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-emerald-50 text-lg mb-8 max-w-xl mx-auto">
            Can't find what you're looking for? Our dedicated support team is here to assist you with any issues.
          </p>
          <button className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-colors inline-flex items-center gap-2 shadow-lg">
            <MessageCircle className="w-5 h-5" /> Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
