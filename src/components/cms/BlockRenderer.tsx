/* eslint-disable @next/next/no-img-element -- CMS blocks render arbitrary image URLs entered by admins. */
import React from 'react';
import { ContactForm } from './ContactForm';
import { sanitizeRichText } from '@/lib/sanitize';

// Not a client component: on public CMS pages ([slug]) this renders on the
// server, so rich-text HTML is sanitized there and sanitize-html never reaches
// the public client bundle. The admin page editor imports it from a client
// component for its live preview, which sanitizes in the browser (admin-only).

const RICH_TEXT = [
  "text-[17px] leading-relaxed text-slate-700 dark:text-slate-300",
  "[&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 dark:[&_h1]:text-white",
  "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-900 dark:[&_h2]:text-white",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white",
  "[&>*:first-child]:mt-0 [&_p]:mb-4",
  "[&_a]:font-medium [&_a]:text-emerald-700 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-emerald-400",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-200 [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-emerald-500/40",
  "[&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white",
  "[&_img]:my-6 [&_img]:rounded-2xl [&_hr]:my-8 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800",
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-slate-800",
].join(" ");

export function BlockRenderer({ block }: { block: any }) {
  const content = block.content;

  switch (block.type) {
    case 'hero':
      return (
        <section className="relative w-full py-24 lg:py-32 overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 z-0">
            {content.backgroundImage && (
              <img src={content.backgroundImage} alt="" decoding="async" className="w-full h-full object-cover opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950" />
          </div>
          <div className="relative z-10 max-w-4xl px-4 mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              {content.headline}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
              {content.subheading}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {content.primaryButtonText && (
                <a href={content.primaryButtonLink || "#"} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
                  {content.primaryButtonText}
                </a>
              )}
              {content.secondaryButtonText && (
                <a href={content.secondaryButtonLink || "#"} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  {content.secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </section>
      );

    case 'rich-text':
      return (
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* No typography plugin is installed, so rich text is styled here. */}
          <div
            className={RICH_TEXT}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.html) }}
          />
        </div>
      );

    case 'faq':
      return (
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title || "Frequently Asked Questions"}</h2>
          <div className="space-y-4">
            {content.items?.map((item: any, i: number) => (
              <details key={i} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'feature-grid':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.features?.map((feature: any, i: number) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {feature.icon ? (
                    <img src={feature.icon} className="h-6 w-6" alt="" loading="lazy" decoding="async" />
                  ) : (
                    <svg className="h-6 w-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
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
      return <ContactForm content={content} />;

    case 'statistics':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats?.map((stat: any, i: number) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 text-4xl font-bold tracking-tight text-emerald-600 tabular-nums dark:text-emerald-400">
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
        <section className="max-w-[1600px] mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.items?.map((item: any, i: number) => (
              <figure key={i} className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-4 mb-6">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name || ""} loading="lazy" decoding="async" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" aria-hidden="true">{item.name?.charAt(0) || 'U'}</div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
                <blockquote className="mb-4 leading-relaxed text-slate-600 dark:text-slate-300">&ldquo;{item.story}&rdquo;</blockquote>
                {item.recoveredItem && (
                  <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full mt-2">
                    Recovered: {item.recoveredItem}
                  </div>
                )}
              </figure>
            ))}
          </div>
        </section>
      );

    case 'team':
      return (
        <section className="max-w-6xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.members?.map((member: any, i: number) => (
              <div key={i} className="text-center group">
                <div className="relative mx-auto mb-5 aspect-square w-40 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
                  <img src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Team')}&background=random`} alt={member.name || ""} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h3>
                <p className="mb-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">{member.role}</p>
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
              <img key={i} src={logo.url} alt={logo.alt || 'Partner'} loading="lazy" decoding="async" className="h-8 md:h-10 object-contain grayscale transition duration-300 hover:grayscale-0" />
            ))}
          </div>
        </section>
      );

    case 'timeline':
      return (
        <section className="max-w-4xl mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <ol className="relative space-y-8 md:space-y-10">
            {/* The rail: left on mobile, centred from md up. */}
            <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-emerald-100 md:left-1/2 md:-translate-x-1/2 dark:bg-emerald-900/50" />
            {content.events?.map((event: any, i: number) => (
              <li key={i} className={`relative pl-8 md:flex md:pl-0 ${i % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-6 h-4 w-4 rounded-full border-4 border-slate-50 bg-emerald-500 md:left-1/2 md:-translate-x-1/2 dark:border-slate-950"
                />
                <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:w-[calc(50%-2rem)] dark:border-slate-800 dark:bg-slate-900">
                  <span className="mb-1.5 block text-sm font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">{event.year}</span>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{event.title}</h3>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-400">{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case 'gallery':
      return (
        <section className="max-w-[1600px] mx-auto px-4 py-16">
          {content.title && <h2 className="text-3xl font-bold tracking-tight text-center mb-10 text-slate-900 dark:text-white">{content.title}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.images?.map((img: any, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl group">
                <img src={img.url} alt={img.caption || ''} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
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
          <div className="relative overflow-hidden rounded-3xl bg-emerald-600 px-6 py-12 text-center shadow-sm sm:p-12 dark:bg-emerald-900/40 dark:ring-1 dark:ring-emerald-500/20">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <h2 className="relative z-10 mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">{content.headline}</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">{content.subheading}</p>
            {content.buttonText && (
              <a href={content.buttonLink || "#"} className="relative z-10 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600">
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
