"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DynamicFooter from "@/components/DynamicFooter";
import { Handshake, Network, ShieldCheck, ArrowRight, Server, Building2 } from "lucide-react";
import { PartnersContent, defaultPartners } from "@/lib/content-constants";
import { LoadingLogo } from "@/components/LoadingLogo";

const iconMap: Record<string, any> = {
  Server, Building2, ShieldCheck
};

export default function PartnersPage() {
  const [content, setContent] = useState<PartnersContent>(defaultPartners);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.metadata?.partnersContent) {
          setContent(data.metadata.partnersContent);
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

  // Colorize last word
  const words = content.title.split(" ");
  const lastWord = words.pop();
  const titleStart = words.join(" ");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-slate-800 rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-slate-700 rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-900/50 rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>
          
          <motion.div 
            initial="hidden" animate="visible" variants={stagger}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-6">
              <Handshake className="w-4 h-4" /> Partner Network
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              {titleStart} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{lastWord}</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              {content.subtitle}
            </motion.p>
            <motion.div variants={fadeIn} className="flex justify-center gap-4">
              <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-xl font-bold transition-all text-lg flex items-center gap-2">
                Become a Partner <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Value Prop */}
        <section className="py-24 px-4 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Partner with Us?</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">Enhance your business offerings with our industry-leading recovery tools.</p>
            </div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid md:grid-cols-3 gap-8"
            >
              {content.benefits.map((prop, i) => {
                const Icon = iconMap[prop.iconName] || Server;
                return (
                  <motion.div key={i} variants={fadeIn} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{prop.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{prop.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Trusted By Grid */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Trusted by Industry Leaders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="h-24 bg-white rounded-2xl border border-slate-200 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                >
                  <Network className="w-8 h-8 text-emerald-600" />
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
