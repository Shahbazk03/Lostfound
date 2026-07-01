"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DynamicFooter from "@/components/DynamicFooter";
import { Megaphone, Download, Image as ImageIcon, FileText, ArrowRight } from "lucide-react";
import { PressContent, defaultPress } from "@/lib/content-constants";
import { LoadingLogo } from "@/components/LoadingLogo";

export default function PressPage() {
  const [content, setContent] = useState<PressContent>(defaultPress);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.metadata?.pressContent) {
          setContent(data.metadata.pressContent);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-slate-900 text-white">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-emerald-500/20 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[100px]" />
          </div>
          
          <motion.div 
            initial="hidden" animate="visible" variants={stagger}
            className="max-w-5xl mx-auto relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-semibold tracking-wide uppercase mb-6 border border-slate-700">
              <Megaphone className="w-4 h-4" /> Press & Media
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              {content.title}
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
              {content.subtitle}
            </motion.p>
          </motion.div>
        </section>

        {/* Brand Assets */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Brand Assets</h2>
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid md:grid-cols-2 gap-8"
            >
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Logos & Icons</h3>
                <p className="text-slate-600 mb-6">Download our official logo suite in SVG and PNG formats.</p>
                <button className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                  <Download className="w-5 h-5" /> Download ZIP (2.4 MB)
                </button>
              </motion.div>

              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Brand Guidelines</h3>
                <p className="text-slate-600 mb-6">Learn how to use our brand identity, colors, and typography.</p>
                <button className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  <Download className="w-5 h-5" /> Download PDF (5.1 MB)
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-20 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-10">Recent Press Releases</h2>
            <div className="space-y-6">
              {content.releases.map((release, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div>
                    <div className="text-sm font-semibold text-emerald-600 mb-2">{release.date}</div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{release.title}</h3>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors hidden md:block" />
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
