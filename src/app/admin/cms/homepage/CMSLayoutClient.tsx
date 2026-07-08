"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Layout, Type, PieChart, Grid, Star, CreditCard, Clock, Globe2, HelpCircle, ArrowUpRight } from "lucide-react";
import HomepageVisuals from "@/components/home/HomepageVisuals";
import { useCMS } from "./CMSProvider";

const sections = [
  { title: "Hero Section", icon: Layout, href: "/admin/cms/homepage/hero" },
  { title: "Statistics", icon: PieChart, href: "/admin/cms/homepage/statistics" },
  { title: "Categories", icon: Grid, href: "/admin/cms/homepage/categories" },
  { title: "Features", icon: Star, href: "/admin/cms/homepage/features" },
  { title: "Testimonials", icon: Type, href: "/admin/cms/homepage/testimonials" },
  { title: "Premium Plans", icon: CreditCard, href: "/admin/cms/homepage/premium" },
  { title: "Recent Items", icon: Clock, href: "/admin/cms/homepage/recent-items" },
  { title: "Global Network", icon: Globe2, href: "/admin/cms/homepage/global-network" },
  { title: "FAQ", icon: HelpCircle, href: "/admin/cms/homepage/faq" },
  { title: "Footer", icon: Layout, href: "/admin/cms/homepage/footer" },
];

export default function HomepageCMSLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data } = useCMS();

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-slate-950">
      
      {/* 1. Sections Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Page Builder</h2>
          <p className="text-xs text-slate-500 mt-1">Select a section to edit</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map((section) => {
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.title}
                href={section.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20"
                    : "text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800 hover:shadow-sm"
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Editor Pane */}
      <div className="w-[450px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 overflow-y-auto">
        {children}
      </div>

      {/* 3. Live Preview Pane */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex flex-col">
        <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            <div className="ml-4 bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-full text-xs text-slate-500 font-mono flex items-center gap-2">
              localhost:3000/
            </div>
          </div>
          <a href="/" target="_blank" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
            Preview Fullscreen <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        
        {/* Native Live Preview */}
        <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar relative">
          <div className="w-full min-h-full origin-top" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
             <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden bg-white pointer-events-none">
                <HomepageVisuals data={data} />
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
