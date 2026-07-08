import Link from "next/link";
import {
  Search,
  MapPin,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  Lock,
  PlusCircle,
  Smartphone,
  Wallet,
  Key,
  Briefcase,
  FileText,
  Laptop,
  Gem,
  Dog,
  MessageCircle,
  Star,
  Users,
  Zap,
  Activity,
  Cpu
} from "lucide-react";
import RecentListings from "@/components/RecentListings";
import DynamicFooter from "@/components/DynamicFooter";
import ScrollReveal from "@/components/animations/ScrollReveal";
import { db } from "@/db";
import { items, users, organizationSettings, cmsHero, cmsStatistics, cmsCategories, cmsFeatures, cmsTestimonials, cmsPricingPlans } from "@/db/schema";
import { eq, sql, count, asc, desc } from "drizzle-orm";
import { defaultFounder } from "@/lib/content-constants";
import * as Icons from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
  const recoveredItemsCount = recoveredItemsData.count;

  const [usersData] = await db.select({ count: count() }).from(users);
  const usersCount = usersData.count;
  
  const [settings] = await db.select().from(organizationSettings).limit(1);

  const [countriesData] = await db.select({
    count: sql<number>`count(distinct ${items.country})`
  }).from(items).where(sql`${items.country} IS NOT NULL`);
  const countriesCount = Number(countriesData.count);

  const [totalItemsData] = await db.select({ count: count() }).from(items);
  const totalItemsCount = totalItemsData.count;

  const successRate = totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0;

  const [heroData] = await db.select().from(cmsHero).limit(1);
  const statisticsList = await db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex));
  const categoriesList = await db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex));
  const featuresList = await db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex));
  const testimonialsList = await db.select().from(cmsTestimonials).orderBy(desc(cmsTestimonials.createdAt));
  const pricingPlansList = await db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex));
  
  // Defaults in case CMS data is empty
  const hero = heroData || {
    headline: "Find What Matters.\nReconnect With Confidence.",
    highlightedWords: "Reconnect",
    subheading: "LostFound helps people recover lost belongings through AI-powered matching, real-time notifications, and a trusted community network.",
    primaryButtonText: "Browse Lost Items",
    primaryButtonLink: "/browse",
    secondaryButtonText: "Report Lost Item",
    secondaryButtonLink: "/report",
    backgroundImage: "",
    illustrationImage: "/hero-3d-illustration.png",
    illustrationAnimation: "float",
    trustBadges: ["Trusted Community", "AI Powered Matching", "Secure Platform", "Global Reach"],
  };

  const renderHeadline = () => {
    if (!hero.highlightedWords) return hero.headline;
    
    let result = hero.headline;
    const words = hero.highlightedWords.split(",").map(w => w.trim());
    
    words.forEach(word => {
      if (!word) return;
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, `<span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">$1</span>`);
    });
    
    // Also replace \n with <br/>
    result = result.replace(/\n/g, "<br/>");
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-200 font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white dark:bg-[#0B1120] pt-20">
        {/* Abstract Background Elements */}
        {hero.backgroundImage ? (
           <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${hero.backgroundImage})` }} />
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-10 pointer-events-none" />
          </>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <ScrollReveal animation="slide-in" className="max-w-2xl z-10 relative">
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-8">
                {renderHeadline()}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
                {hero.subheading}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                {hero.primaryButtonText && (
                  <Link
                    href={hero.primaryButtonLink || "#"}
                    className="inline-flex items-center justify-center bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-400 transition-all shadow-xl shadow-slate-900/20 dark:shadow-emerald-500/20 hover:-translate-y-0.5"
                  >
                    {hero.primaryButtonText}
                  </Link>
                )}
                {hero.secondaryButtonText && (
                  <Link
                    href={hero.secondaryButtonLink || "#"}
                    className="inline-flex items-center justify-center bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:-translate-y-0.5"
                  >
                    {hero.secondaryButtonText}
                  </Link>
                )}
              </div>

              {/* Trust Indicators */}
              {hero.trustBadges && hero.trustBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {hero.trustBadges.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {badge}
                    </div>
                  ))}
                </div>
              )}
            </ScrollReveal>

            {/* Right Column: 3D Image */}
            <ScrollReveal animation="fade-in" delay={0.2} className="relative h-[500px] lg:h-[700px] w-full hidden md:flex items-center justify-center">
              <img 
                src={hero.illustrationImage || "/hero-3d-illustration.png"} 
                alt="LostFound Premium Hero" 
                className={`w-full h-full object-contain drop-shadow-2xl z-10 relative animate-[${hero.illustrationAnimation === "none" ? "none" : hero.illustrationAnimation + "_6s_ease-in-out_infinite"}]`} 
                style={{ filter: "drop-shadow(0 25px 35px rgba(16, 185, 129, 0.15))" }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-emerald-500/10 rounded-full animate-[spin_60s_linear_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-emerald-500/5 rounded-full animate-[spin_90s_linear_infinite_reverse]" />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(Math.max(statisticsList.length || 4, 1), 4)} gap-8 divide-x divide-slate-200 dark:divide-slate-800`}>
            {statisticsList.length > 0 ? (
              statisticsList.filter(s => s.isActive).map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 0.1} className="text-center px-4">
                  <div className={`text-4xl md:text-5xl font-black mb-2 tracking-tight ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'blue' ? 'text-blue-500' : stat.color === 'purple' ? 'text-purple-500' : stat.color === 'orange' ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                    {stat.numberValue}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                </ScrollReveal>
              ))
            ) : (
              <>
                <ScrollReveal delay={0.1} className="text-center px-4">
                  <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    {recoveredItemsCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Recovered Items</div>
                </ScrollReveal>
                <ScrollReveal delay={0.2} className="text-center px-4">
                  <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    {usersCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active Users</div>
                </ScrollReveal>
                <ScrollReveal delay={0.3} className="text-center px-4">
                  <div className="text-4xl md:text-5xl font-black text-emerald-500 mb-2 tracking-tight">
                    {successRate}%
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Success Rate</div>
                </ScrollReveal>
                <ScrollReveal delay={0.4} className="text-center px-4">
                  <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    {countriesCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Countries</div>
                </ScrollReveal>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              How LostFound Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Three simple steps to reunite with your lost belongings using our intelligent global network.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 -translate-y-1/2 z-0" />
            
            {[
              {
                icon: Search,
                title: "1. Report Item",
                desc: "Upload details and photos of the item you've lost or found into our secure database.",
              },
              {
                icon: Cpu,
                title: "2. AI Match",
                desc: "Our smart matching system instantly scans the network to identify high-probability connections.",
              },
              {
                icon: CheckCircle,
                title: "3. Reconnect",
                desc: "Communicate securely through our encrypted messaging to arrange a safe return.",
              }
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15} className="relative z-10 bg-white dark:bg-slate-900 p-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25 rotate-3 hover:rotate-0 transition-transform">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {step.desc}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES SECTION */}
      <section className="py-24 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Browse by Category</h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categoriesList.length > 0 ? (
              categoriesList.filter(c => c.isActive).map((cat, i) => {
                // @ts-ignore
                const IconComponent = Icons[cat.icon] || Icons.Package;
                return (
                  <ScrollReveal key={cat.id} delay={i * 0.05}>
                    <Link href={`/browse?category=${encodeURIComponent(cat.name.toLowerCase())}`} className="group flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 transition-all duration-300 h-full">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-300 text-slate-600 dark:text-slate-400">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-center">{cat.name}</span>
                    </Link>
                  </ScrollReveal>
                );
              })
            ) : (
              [
                { icon: Smartphone, label: "Phones" },
                { icon: Wallet, label: "Wallets" },
                { icon: Key, label: "Keys" },
                { icon: Briefcase, label: "Bags" },
                { icon: FileText, label: "Documents" },
                { icon: Laptop, label: "Electronics" },
                { icon: Gem, label: "Jewelry" },
                { icon: Dog, label: "Pets" },
              ].map((cat, i) => (
                <ScrollReveal key={cat.label} delay={i * 0.05}>
                  <Link href={`/browse?category=${cat.label.toLowerCase()}`} className="group flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 transition-all duration-300 h-full">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-300 text-slate-600 dark:text-slate-400">
                      <cat.icon className="w-8 h-8" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{cat.label}</span>
                  </Link>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              Why Choose LostFound?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              We provide the most advanced tools and a secure environment to maximize your chances of recovery.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.length > 0 ? (
              featuresList.filter(f => f.isActive).map((feature, i) => {
                // @ts-ignore
                const IconComponent = Icons[feature.icon] || Icons.Shield;
                return (
                  <ScrollReveal key={feature.id} delay={i * 0.1} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors h-full">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                      <IconComponent className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </ScrollReveal>
                );
              })
            ) : (
              [
                { icon: Zap, title: "AI Smart Matching", desc: "Our algorithm scans descriptions, images, and locations to instantly surface potential matches." },
                { icon: Shield, title: "Verified Users", desc: "Identity verification ensures you're interacting with real people in a safe environment." },
                { icon: Activity, title: "Real-Time Alerts", desc: "Get instant push notifications the moment an item matching your description is found." },
                { icon: Lock, title: "Encrypted Messaging", desc: "Coordinate returns privately without exposing your personal contact information." },
                { icon: MapPin, title: "Location Intelligence", desc: "Advanced geospatial mapping helps pinpoint exact drop-off and retrieval spots." },
                { icon: Users, title: "Community Driven", desc: "Join a global network of honest individuals dedicated to helping each other." },
              ].map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 0.1} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors h-full">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. SUCCESS STORIES (Testimonial Carousel Simulation) */}
      <section className="py-32 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
              Success Stories
            </h2>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonialsList.length > 0 ? (
              testimonialsList.filter(t => t.isActive).map((testimonial, i) => (
                <ScrollReveal key={testimonial.id} delay={i * 0.15} className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col h-full">
                  <div className="flex text-amber-400 mb-6 gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} className={`w-5 h-5 ${j < testimonial.rating ? "fill-current" : "text-slate-200 dark:text-slate-700"}`} />)}
                  </div>
                  <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 flex-grow">"{testimonial.review}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    {testimonial.avatar ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={testimonial.avatar} alt={testimonial.customerName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-900 rounded-full flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-200 text-xl">
                        {testimonial.customerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{testimonial.customerName}</h4>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{testimonial.position}</span>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              [
                { name: "Sarah Jenkins", role: "Lost a MacBook", review: "I lost my laptop at a cafe. Within 2 hours of posting on LostFound, the barista had matched with me. Incredible platform!" },
                { name: "Michael Chen", role: "Found a Wallet", review: "Found a wallet on the train. LostFound's encrypted messaging made it so easy to verify the owner safely and return it." },
                { name: "Emma Thompson", role: "Lost Keys", review: "The AI smart matching instantly connected my lost keys post with someone who found them 3 blocks away. Lifesaver." },
              ].map((testimonial, i) => (
                <ScrollReveal key={i} delay={i * 0.15} className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col h-full">
                  <div className="flex text-amber-400 mb-6 gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 flex-grow">"{testimonial.review}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-900 rounded-full flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-200 text-xl">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</span>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 7. GLOBAL RECOVERY NETWORK */}
      <section className="py-32 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
        {/* Simplified Interactive World Map Illustration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <Globe className="w-[1200px] h-[1200px] text-emerald-500" strokeWidth={0.5} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Network
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Global Recovery Network
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Our platform operates across borders. See how items are being recovered worldwide in real-time.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2} className="relative aspect-video max-w-4xl mx-auto bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
             {/* Glowing markers to simulate map activity */}
             <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-ping" />
             <div className="absolute top-1/2 left-2/3 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
             <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse delay-700" />
             <p className="text-slate-500 font-medium z-10 bg-slate-900/80 px-6 py-3 rounded-full backdrop-blur-md border border-slate-800">
               Interactive Map Data Loading...
             </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. RECENT LOST & FOUND */}
      <RecentListings />

      {/* 9. PREMIUM MEMBERSHIP */}
      <section className="py-32 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
              Upgrade to Premium
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Unlock advanced tools to significantly increase your chances of recovering high-value items.
            </p>
          </ScrollReveal>

          {pricingPlansList.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {pricingPlansList.filter(p => p.isActive).map((plan, i) => (
                <ScrollReveal key={plan.id} delay={i * 0.2} className={`relative bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-10 border transition-all ${plan.isPopular ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105 z-10' : 'border-slate-800 shadow-xl'} overflow-hidden h-full flex flex-col`}>
                  {plan.isPopular && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />}
                  
                  <div className="relative z-10 flex-grow flex flex-col">
                    {plan.isPopular && <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mb-6 border border-emerald-500/30 self-start">MOST POPULAR</span>}
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-6 h-10">{plan.description}</p>
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-5xl font-extrabold text-white">${(plan.monthlyPrice / 100).toFixed(0)}</span>
                      <span className="text-slate-400 font-medium">/month</span>
                    </div>
                    
                    <ul className="space-y-4 mb-10 flex-grow">
                      {(plan.benefits as string[] || []).map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-sm">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={plan.buttonLink || "/register"} className={`block w-full text-center font-bold py-4 rounded-xl transition-colors shadow-lg ${plan.isPopular ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-slate-800 text-white hover:bg-slate-700'} mt-auto`}>
                      {plan.buttonText}
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal delay={0.2} className="max-w-md mx-auto bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden mt-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm mb-6 border border-emerald-500/30">PRO PLAN</span>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-extrabold text-white">₹199</span>
                  <span className="text-slate-400 font-medium">/month</span>
                </div>
                
                <ul className="space-y-4 mb-10">
                  {[
                    "Unlimited Searches",
                    "Priority AI Matching",
                    "Advanced Filters",
                    "Ad-Free Experience",
                    "Premium Support 24/7",
                    "Featured Listings",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/register" className="block w-full text-center bg-emerald-500 text-slate-950 font-bold py-4 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                  Upgrade to Premium
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 relative overflow-hidden bg-emerald-600 dark:bg-emerald-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">
              Ready to Find What You've Lost?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse" className="bg-white text-emerald-900 px-10 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-xl">
                Browse Items
              </Link>
              <Link href="/report" className="bg-emerald-800 dark:bg-emerald-950 text-white border border-emerald-500 dark:border-emerald-700 px-10 py-4 rounded-xl font-bold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors shadow-xl">
                Report Item
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 11. PREMIUM FOOTER */}
      <DynamicFooter />
    </div>
  );
}
