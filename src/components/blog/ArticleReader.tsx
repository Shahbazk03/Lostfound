"use client";

import { useEffect, useState } from "react";
import { Share2, Link as LinkIcon, MessageCircle } from "lucide-react";

export default function ArticleReader({ content, title, url }: { content: string, title: string, url: string }) {
  const [progress, setProgress] = useState(0);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Progress bar
    const updateProgress = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setProgress((currentScrollY / scrollHeight) * 100);
      }
    };
    window.addEventListener("scroll", updateProgress);
    updateProgress();

    // Generate TOC
    const articleContent = document.getElementById("article-content");
    if (articleContent) {
      const elements = Array.from(articleContent.querySelectorAll("h2, h3"));
      const extractedHeadings = elements.map((el, index) => {
        const text = el.textContent || "";
        const id = el.id || `heading-${index}`;
        if (!el.id) el.id = id;
        return {
          id,
          text,
          level: el.tagName === "H2" ? 2 : 3,
        };
      });
      setHeadings(extractedHeadings);
    }

    return () => window.removeEventListener("scroll", updateProgress);
  }, [content]);

  useEffect(() => {
    // Intersection Observer for Active TOC item
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-900 z-50">
        <div 
          className="h-full bg-emerald-500 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-12 relative max-w-7xl mx-auto">
        {/* Share Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 sticky top-32 h-fit">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Share</p>
          <button onClick={copyLink} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors tooltip" title="Copy Link">
            <LinkIcon className="w-4 h-4" />
          </button>
          {typeof navigator !== "undefined" && navigator.share && (
            <button onClick={() => navigator.share({ title, url })} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-500 dark:bg-slate-800 hover:text-white dark:hover:bg-emerald-500 text-slate-600 dark:text-slate-400 transition-colors tooltip" title="Share via Device">
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-3xl">
          <div 
            id="article-content"
            className="prose prose-lg dark:prose-invert prose-emerald max-w-none prose-headings:font-bold prose-headings:scroll-mt-24 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-2xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* TOC Sidebar */}
        <div className="hidden xl:block w-72 shrink-0">
          <div className="sticky top-32">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              Table of Contents
            </h4>
            <nav className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar pr-4">
              {headings.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No headings found.</p>
              ) : (
                headings.map(h => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`text-sm transition-colors block py-1 ${h.level === 3 ? 'ml-4' : ''} ${activeId === h.id ? 'text-emerald-600 dark:text-emerald-500 font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {h.text}
                  </a>
                ))
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
