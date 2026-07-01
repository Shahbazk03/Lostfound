import { ShieldCheck, AlertTriangle, Eye, Lock, MapPin, BadgeCheck, ShieldAlert, Users, Book, FileQuestion } from "lucide-react";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { defaultSafetyPrinciples, defaultScamFlags } from "@/lib/content-constants";

// Helper to resolve string icon names to Lucide components
const IconMap: Record<string, any> = {
  MapPin, Eye, Lock, ShieldCheck, AlertTriangle, BadgeCheck, ShieldAlert, Users, Book, FileQuestion
};

export default async function SafetyTipsPage() {
  const settingsArray = await db.select().from(organizationSettings).limit(1);
  const settings = settingsArray[0] || {};
  
  const rawPrinciples = Array.isArray(settings.metadata?.safetyPrinciples) && settings.metadata.safetyPrinciples.length > 0
    ? settings.metadata.safetyPrinciples
    : defaultSafetyPrinciples;

  const principles = rawPrinciples.map((p: any) => ({
    ...p,
    icon: (() => {
      const IconCmp = IconMap[p.iconName] || ShieldCheck;
      return <IconCmp className="w-6 h-6" />;
    })()
  }));

  const scamFlags = Array.isArray(settings.metadata?.safetyFlags) && settings.metadata.safetyFlags.length > 0
    ? settings.metadata.safetyFlags
    : defaultScamFlags;
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-emerald-900 text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="w-20 h-20 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Trust & Safety Guidelines</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Your safety is our absolute priority. Follow these community guidelines to ensure a secure, successful experience when returning or claiming items.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Core Principles Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {principles.map((p: any, i: number) => {
            const colors = ["text-indigo-600", "text-rose-600", "text-amber-600"];
            return (
              <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-all flex flex-col">
                <div className={`w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 ${colors[i % colors.length]}`}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Deep Dive Section */}
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-24">
          <div className="lg:w-1/2">
            <div className="bg-emerald-100/50 p-2 rounded-2xl inline-block mb-6">
              <div className="bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-xl uppercase tracking-wider">Scam Prevention</div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">How to spot and avoid potential scams.</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              While our community is overwhelmingly honest, it's important to stay vigilant. Watch out for these red flags when communicating with other users.
            </p>
            
            <ul className="space-y-5">
              {scamFlags.map((flag: any, i: number) => (
                <li key={i} className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900">{flag.title}</h4>
                    <p className="text-slate-600">{flag.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-200">
              {/* Placeholder image for Scam Prevention */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <ShieldCheck className="w-32 h-32 opacity-20" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/10 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Verification Check */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 blur-3xl transform skew-x-12 translate-x-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/30">
              <BadgeCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">The "Describe It" Rule</h3>
              <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
                The golden rule of our platform: The person claiming the item must be able to describe it better than the photo shows. Don't post photos showing serial numbers, distinct engravings, or specific damage. Use these hidden details as your verification test.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
