"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DynamicFooter from "@/components/DynamicFooter";
import { Briefcase, Laptop, HeartPulse, GraduationCap, MapPin, ArrowRight } from "lucide-react";
import { CareersContent, defaultCareers } from "@/lib/content-constants";
import { LoadingLogo } from "@/components/LoadingLogo";

// Map string icon names to Lucide components
const iconMap: Record<string, any> = {
  Laptop, HeartPulse, GraduationCap, Briefcase
};

export default function CareersPage() {
  const [content, setContent] = useState<CareersContent>(defaultCareers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.metadata?.careersContent) {
          setContent(data.metadata.careersContent);
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
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingLogo className="w-12 h-12" />
      </div>
    );
  }

  // Helper to colorize last word of title
  const words = content.title.split(" ");
  const lastWord = words.pop();
  const titleStart = words.join(" ");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/2 -translate-y-1/4" />
          
          <motion.div 
            initial="hidden" animate="visible" variants={stagger}
            className="max-w-5xl mx-auto text-center relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold tracking-wide uppercase mb-6">
              <Briefcase className="w-4 h-4" /> Join Our Team
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {titleStart} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">{lastWord}</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              {content.subtitle}
            </motion.p>
          </motion.div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900">Why LOSTFOUND?</h2>
            </div>
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid md:grid-cols-3 gap-8"
            >
              {content.benefits.map((benefit, i) => {
                const Icon = iconMap[benefit.iconName] || Laptop;
                return (
                  <motion.div key={i} variants={fadeIn} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
                    <div className={`w-16 h-16 rounded-2xl ${benefit.bgClass} ${benefit.textClass} flex items-center justify-center mb-6`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                    <p className="text-slate-600">{benefit.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Open Roles */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-10">Open Positions</h2>
            <div className="space-y-4">
              {content.roles.map((role, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{role.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                      <span className="bg-slate-100 px-3 py-1 rounded-full">{role.team}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {role.location}</span>
                    </div>
                  </div>
                  <button className="hidden md:flex w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <DynamicFooter />
    </div>
  );
}
