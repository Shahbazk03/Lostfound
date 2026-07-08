import React from 'react';
import { motion } from 'framer-motion';

export function BlockRenderer({ block }: { block: any }) {
  const content = block.content;

  switch (block.type) {
    case 'hero':
      return (
        <section className="relative w-full py-24 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 z-0">
            {content.backgroundImage && (
              <img src={content.backgroundImage} alt="" className="w-full h-full object-cover opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950" />
          </div>
          <div className="relative z-10 max-w-4xl px-4 mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {content.headline}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
              {content.subheading}
            </p>
            <div className="flex gap-4 justify-center">
              {content.primaryButtonText && (
                <a href={content.primaryButtonLink || "#"} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg shadow-emerald-500/30">
                  {content.primaryButtonText}
                </a>
              )}
              {content.secondaryButtonText && (
                <a href={content.secondaryButtonLink || "#"} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-full font-medium transition-colors shadow-sm">
                  {content.secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </section>
      );

    case 'rich-text':
      return (
        <div className="max-w-4xl mx-auto px-4 py-12 prose prose-lg dark:prose-invert prose-emerald">
          <div dangerouslySetInnerHTML={{ __html: content.html }} />
        </div>
      );

    case 'faq':
      return (
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title || "Frequently Asked Questions"}</h2>
          <div className="space-y-4">
            {content.items?.map((item: any, i: number) => (
              <details key={i} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer">
                <summary className="font-semibold text-lg list-none flex justify-between items-center text-slate-900 dark:text-white">
                  {item.question}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'feature-grid':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.features?.map((feature: any, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon ? (
                    <img src={feature.icon} className="w-8 h-8" alt="icon" />
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'spacer':
      return <div style={{ height: `${content.height || 64}px` }} aria-hidden="true" />;

    case 'divider':
      return <div className="max-w-6xl mx-auto px-4 py-8"><hr className="border-slate-200 dark:border-slate-800" /></div>;

    case 'contact-form':
      return (
        <section className="max-w-xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">{content.title || "Get in Touch"}</h2>
          <p className="text-slate-500 mb-8">{content.subtitle || "Fill out the form below and we'll get back to you shortly."}</p>
          <form className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
              <input type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Message</label>
              <textarea rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 font-medium transition-colors shadow-lg shadow-emerald-500/30">
              {content.buttonText || "Send Message"}
            </button>
          </form>
        </section>
      );

    default:
      return (
        <div className="p-4 border-2 border-dashed border-rose-500 text-rose-500 rounded bg-rose-500/10 text-center mx-4 my-8">
          Unsupported block type: {block.type}
        </div>
      );
  }
}
