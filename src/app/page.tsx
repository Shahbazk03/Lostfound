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
  Network,
  Cpu,
  Fingerprint
} from "lucide-react";
import RecentListings from "@/components/RecentListings";
import DynamicFooter from "@/components/DynamicFooter";
import Hero3D from "@/components/Hero3D";
import { db } from "@/db";
import { items, users, organizationSettings } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { defaultFounder } from "@/lib/content-constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
  const recoveredItemsCount = recoveredItemsData.count;

  const [usersData] = await db.select({ count: count() }).from(users);
  const usersCount = usersData.count;
  
  const [settings] = await db.select().from(organizationSettings).limit(1);
  const founder = (settings?.metadata as any)?.founderContent || defaultFounder;

  const [countriesData] = await db.select({
    count: sql<number>`count(distinct ${items.country})`
  }).from(items).where(sql`${items.country} IS NOT NULL`);
  const countriesCount = Number(countriesData.count);

  const [totalItemsData] = await db.select({ count: count() }).from(items);
  const totalItemsCount = totalItemsData.count;

  const successRate = totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white dark:bg-slate-950 pt-20">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text */}
            <div className="max-w-2xl z-10 relative">
              <h1 className="text-6xl md:text-[5.5rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-6">
                Find What Matters. <br/>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Reunite
                </span> With Confidence.
              </h1>
              <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                LostFound helps you find lost items or help others recover theirs. 
                Join our global community and make a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Browse Items
                </Link>
                <Link
                  href="/report"
                  className="inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Report an Item
                </Link>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Trusted by thousands. Safe, secure & reliable.
              </div>
            </div>

            {/* Right Column: 3D Image */}
            <div className="relative h-[400px] lg:h-[600px] w-full hidden md:flex items-center justify-center">
              <img 
                src="/hero-3d-illustration.png" 
                alt="LostFound Hero Illustration" 
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal z-10 relative scale-110" 
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-100 dark:border-emerald-900/30 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-emerald-50 dark:border-emerald-900/10 rounded-full" />
            </div>

          </div>

          {/* Advertisement Image Banner - Full Width (Below Hero) */}
          {(settings?.metadata?.heroAdImageUrl || "/premium-ad-banner.png") && (
            <div className="mt-16 w-full">
              <Link href={settings?.metadata?.heroAdLinkUrl || "#"} target="_blank" className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800/50 group cursor-pointer transition-all hover:shadow-emerald-500/20 hover:border-emerald-500/50 block bg-slate-900/5 dark:bg-slate-900/50">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img 
                  src={settings?.metadata?.heroAdImageUrl || "/premium-ad-banner.png"} 
                  alt="Advertisement" 
                  className="w-full h-auto object-cover max-h-[250px] transform group-hover:scale-[1.01] transition-transform duration-700" 
                />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose LostFound Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Why Choose LostFound?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Unlimited Searches
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Search without limits and find what you're looking for.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Priority Support
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Get faster assistance from our dedicated support team.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Ad-Free Experience
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Enjoy a clean, distraction-free experience while you search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Stats Section */}
      <section className="relative py-16 border-y border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800/50">
            <div className="text-center px-4">
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{recoveredItemsCount}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase">Assets Recovered</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black text-emerald-400 mb-2 tracking-tight">{countriesCount}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase">Operating Regions</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black text-emerald-400 mb-2 tracking-tight">{usersCount}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase">Verified Members</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black text-emerald-400 mb-2 tracking-tight">{successRate}%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-wide uppercase">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizational Workflow */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Systematic Resolution Workflow
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Our enterprise infrastructure utilizes advanced matching algorithms and secure communication protocols to facilitate asset recovery.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-slate-800 via-emerald-500/30 to-slate-800 -translate-y-1/2 -z-10" />

            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-10 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-colors group">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform group-hover:bg-emerald-500/10">
                <Network className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                1. Data Ingestion
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Log asset details into our encrypted ledger. Upload high-resolution imagery and precise geolocation data for maximum accuracy.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-10 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-colors group">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform group-hover:bg-emerald-500/10">
                <Cpu className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                2. Algorithmic Matching
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our systems continuously analyze temporal, spatial, and categorical data points to surface high-probability matches instantly.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-10 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-colors group">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform group-hover:bg-emerald-500/10">
                <Fingerprint className="w-8 h-8 text-emerald-400" />
              </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  3. Secure Facilitation
                </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Engage in end-to-end encrypted communication. Utilize secure payment gateways to unlock precise asset coordinates safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Feature Showcase */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 lg:p-16 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 tracking-wide">
                  <Lock className="w-4 h-4" />
                  Premium Enterprise Feature
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                  Encrypted Location <br/>
                  <span className="text-emerald-400">Unlocking Protocol</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Protecting finder privacy while ensuring owner success. Precise geographic coordinates are mathematically obscured until a secure transaction is authorized.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Pinpoint GPS coordinate decryption",
                    "Direct secure channel to the reporting party",
                    "Bank-grade payment processing via Stripe",
                    "Automated instant release mechanisms",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-xl shadow-white/5"
                >
                  Access Database
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              {/* Premium UI Mockup Element */}
              <div className="hidden lg:flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl transform -rotate-6" />
                  <div className="relative bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                      <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-lg tracking-wide">Secure Item Location</div>
                        <div className="text-sm text-emerald-400 font-medium flex items-center gap-1.5 mt-1">
                          <Lock className="w-3 h-3" /> Location Encrypted
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="h-4 bg-slate-700/50 rounded-md w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-700/50 rounded-md w-1/2 animate-pulse" />
                    </div>
                    <button suppressHydrationWarning className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <Lock className="w-4 h-4" />
                      Unlock Full Details (₹1.00)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Institutional Grade Security
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              We employ strict compliance standards and robust verification to maintain network integrity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Identity Verification",
                desc: "Rigorous vetting of all network participants to prevent fraudulent activity and protect legitimate claims.",
              },
              {
                icon: Lock,
                title: "Transaction Integrity",
                desc: "Leveraging SOC 2 Type II compliant infrastructure to secure all financial exchanges globally.",
              },
              {
                icon: Globe,
                title: "Global Compliance",
                desc: "Adherence to international data protection regulations ensuring privacy across jurisdictions.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900/50 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center hover:bg-white dark:bg-slate-900 transition-colors"
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate CTA & Founder Profile */}
      <section className="py-24 relative overflow-hidden border-t border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-emerald-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-emerald-500/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Founder Profile */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left bg-white/40 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-5 pointer-events-none">
                <Network className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border-4 border-emerald-500/30 shadow-lg relative z-10">
                <img src={founder.image} alt={founder.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 relative z-10">{founder.name}</h3>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-6 uppercase tracking-wider text-sm relative z-10">{founder.designation}</p>
              <div className="relative z-10">
                <span className="absolute -top-4 -left-4 text-4xl text-emerald-500/20 font-serif">"</span>
                <p className="text-slate-800 dark:text-slate-300 italic leading-relaxed relative z-10 font-medium">
                  {founder.details}
                </p>
              </div>
            </div>

            {/* Right Column: CTA */}
            <div className="text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                Initiate Recovery Protocol
              </h2>
              <p className="text-slate-700 dark:text-emerald-100/70 mb-10 text-xl font-medium lg:font-light leading-relaxed">
                Register your organization or individual account today and join the centralized global network for lost asset resolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 px-10 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02]"
                >
                  Initialize Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-10 py-4 rounded-xl font-bold hover:bg-slate-100 dark:bg-slate-800 transition-all hover:border-slate-500"
                >
                  View Public Ledger
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <DynamicFooter />
      </div>
    </div>
  );
}
