"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DynamicFooter from "@/components/DynamicFooter";
import { Mail, MessageSquare, MapPin, Send, PhoneCall } from "lucide-react";
import { ContactContent, defaultContact } from "@/lib/content-constants";
import { LoadingLogo } from "@/components/LoadingLogo";

const iconMap: Record<string, any> = {
  MessageSquare, Mail, PhoneCall
};

export default function ContactPage() {
  const [content, setContent] = useState<ContactContent>(defaultContact);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.metadata?.contactContent) {
          setContent(data.metadata.contactContent);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setTimeout(() => {
      setFormLoading(false);
      setSuccess(true);
    }, 1500);
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
        <section className="relative pt-32 pb-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 to-slate-50 -z-10" />
          
          <motion.div 
            initial="hidden" animate="visible" variants={stagger}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
              {titleStart} <span className="text-emerald-600">{lastWord}</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-slate-600 max-w-2xl mx-auto">
              {content.subtitle}
            </motion.p>
          </motion.div>
        </section>

        {/* Contact Channels */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid md:grid-cols-3 gap-8"
            >
              {content.channels.map((channel, i) => {
                const Icon = iconMap[channel.iconName] || MessageSquare;
                return (
                  <motion.div key={i} variants={fadeIn} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{channel.title}</h3>
                    <p className="text-slate-600 mb-4">{channel.desc}</p>
                    <a href={`mailto:${channel.contact}`} className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                      {channel.contact}
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Contact Form & Location */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a message</h2>
              {success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-800 mb-2">Message Sent!</h3>
                  <p className="text-emerald-600">We'll get back to you as soon as possible.</p>
                  <button onClick={() => setSuccess(false)} className="mt-6 text-sm text-emerald-700 font-bold hover:underline">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                    <textarea required rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" />
                  </div>
                  <button disabled={formLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                    {formLoading ? "Sending..." : <><Send className="w-5 h-5" /> Send Message</>}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Location Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="lg:pt-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Visit our Headquarters</h2>
              <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-8 border border-slate-200 shadow-sm bg-slate-200">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548345680-f5475ea5df84?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-slate-900/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-600/30">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">LOSTFOUND Global HQ</h3>
                <p className="text-slate-600 text-lg">123 Innovation Drive<br/>San Francisco, CA 94103<br/>United States</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <DynamicFooter />
    </div>
  );
}
