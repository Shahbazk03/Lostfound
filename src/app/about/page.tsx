"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DynamicFooter from "@/components/DynamicFooter";
import { Globe2, ShieldCheck, Heart, Zap, Users, TrendingUp } from "lucide-react";
import { AboutContent, defaultAbout } from "@/lib/content-constants";
import { LoadingLogo } from "@/components/LoadingLogo";

// Map string icon names to Lucide components
const iconMap: Record<string, any> = {
  ShieldCheck, Heart, Zap
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultAbout);
  const [stats, setStats] = useState({
    recoveredItemsCount: 0,
    usersCount: 0,
    successRate: 0,
    countriesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/stats').then(res => res.json())
    ])
      .then(([settingsData, statsData]) => {
        if (settingsData.metadata?.aboutContent) {
          setContent(settingsData.metadata.aboutContent);
        }
        if (statsData && !statsData.error) {
          setStats({
            recoveredItemsCount: statsData.recoveredItemsCount || 0,
            usersCount: statsData.usersCount || 0,
            successRate: statsData.successRate || 0,
            countriesCount: statsData.countriesCount || 0
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingLogo className="w-12 h-12" />
      </div>
    );
  }

  // Helper to split the title by space and colorize the last word
  const words = content.title.split(" ");
  const lastWord = words.pop();
  const titleStart = words.join(" ");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={stagger}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold tracking-wide uppercase mb-6">
              <Globe2 className="w-4 h-4" /> Global Impact
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
              {titleStart} <span className="text-emerald-600 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">{lastWord}</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {content.subtitle}
            </motion.p>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              {[
                { label: "Items Recovered", value: stats.recoveredItemsCount, icon: Zap },
                { label: "Active Communities", value: stats.usersCount, icon: Users },
                { label: "Success Rate", value: `${stats.successRate}%`, icon: TrendingUp },
                { label: "Countries Served", value: stats.countriesCount, icon: Globe2 },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeIn} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                  <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">The principles that guide every decision we make at LOSTFOUND.</p>
            </div>

            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-8"
            >
              {content.values.map((value, i) => {
                const Icon = iconMap[value.iconName] || ShieldCheck;
                return (
                  <motion.div key={i} variants={fadeIn} className="relative group p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 z-10 relative">
                      <Icon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 relative z-10">{value.title}</h3>
                    <p className="text-slate-600 leading-relaxed relative z-10">{value.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </main>

      <DynamicFooter />
    </div>
  );
}
