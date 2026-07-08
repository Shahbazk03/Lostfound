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

    case 'statistics':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats?.map((stat: any, i: number) => (
              <div key={i} className="text-center p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="text-4xl font-extrabold text-emerald-600 mb-2">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="max-w-7xl mx-auto px-4 py-16 bg-slate-50 dark:bg-slate-950/50 rounded-[3rem]">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.items?.map((item: any, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
                <div className="flex items-center gap-4 mb-6">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold text-xl">{item.name?.charAt(0) || 'U'}</div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic mb-4">"{item.story}"</p>
                {item.recoveredItem && (
                  <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full mt-2">
                    Recovered: {item.recoveredItem}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case 'team':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.members?.map((member: any, i: number) => (
              <div key={i} className="text-center group">
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                  <img src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Team')}&background=random`} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h3>
                <p className="text-emerald-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'logo-cloud':
      return (
        <section className="max-w-6xl mx-auto px-4 py-12 text-center">
          {content.title && <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">{content.title}</h2>}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 dark:opacity-40">
            {content.logos?.map((logo: any, i: number) => (
              <img key={i} src={logo.url} alt={logo.alt || 'Partner'} className="h-8 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
            ))}
          </div>
        </section>
      );

    case 'timeline':
      return (
        <section className="max-w-4xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="relative border-l-2 border-emerald-100 dark:border-emerald-900/50 ml-4 md:ml-1/2 space-y-12">
            {content.events?.map((event: any, i: number) => (
              <div key={i} className="relative pl-8 md:pl-0">
                <div className="md:hidden absolute w-4 h-4 bg-emerald-500 rounded-full -left-[9px] top-1 border-4 border-white dark:border-slate-950" />
                <div className={`md:flex items-center justify-between w-full ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:block w-5/12" />
                  <div className="hidden md:block absolute left-1/2 w-4 h-4 bg-emerald-500 rounded-full -translate-x-1/2 border-4 border-white dark:border-slate-950" />
                  <div className="w-full md:w-5/12 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <span className="text-emerald-600 font-bold text-sm tracking-wider mb-2 block">{event.year}</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="max-w-7xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.images?.map((img: any, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl group">
                <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {img.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white font-medium text-sm">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-emerald-600 dark:bg-emerald-900/40 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">{content.headline}</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">{content.subheading}</p>
            {content.buttonText && (
              <a href={content.buttonLink || "#"} className="inline-block bg-white text-emerald-600 font-bold px-8 py-4 rounded-full hover:bg-slate-50 transition-colors shadow-lg relative z-10">
                {content.buttonText}
              </a>
            )}
          </div>
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
