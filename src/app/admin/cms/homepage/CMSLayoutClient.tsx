"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  Globe2,
  HelpCircle,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  PanelBottom,
  PencilLine,
  PieChart,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/admin/ui/styles";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useUnsavedChanges } from "@/components/admin/ui/SaveBar";
import { useCMS, type SectionKey } from "@/app/admin/cms/homepage/CMSProvider";

// The homepage preview pulls in the public homepage components; load it on
// demand so the editor itself stays light.
const HomepageVisuals = dynamic(() => import("@/components/home/HomepageVisuals"), {
  ssr: false,
  loading: () => <PreviewSkeleton />,
});

const sections: { title: string; icon: LucideIcon; href: string; key?: SectionKey }[] = [
  { title: "Hero", icon: LayoutTemplate, href: "/admin/cms/homepage/hero", key: "hero" },
  { title: "Statistics", icon: PieChart, href: "/admin/cms/homepage/statistics", key: "statisticsList" },
  { title: "Categories", icon: LayoutGrid, href: "/admin/cms/homepage/categories", key: "categoriesList" },
  { title: "Features", icon: Star, href: "/admin/cms/homepage/features", key: "featuresList" },
  { title: "Premium plans", icon: CreditCard, href: "/admin/cms/homepage/premium", key: "pricingPlansList" },
  { title: "Recent items", icon: Clock, href: "/admin/cms/homepage/recent-items" },
  { title: "Global network", icon: Globe2, href: "/admin/cms/homepage/global-network", key: "globalNetwork" },
  { title: "FAQ", icon: HelpCircle, href: "/admin/cms/homepage/faq", key: "faq" },
  { title: "Call to action", icon: Megaphone, href: "/admin/cms/homepage/cta", key: "cta" },
  { title: "Footer", icon: PanelBottom, href: "/admin/cms/homepage/footer", key: "footer" },
];

function PreviewSkeleton() {
  return (
    <div className="space-y-6 p-8" role="status" aria-label="Loading preview">
      <Skeleton className="mx-auto h-10 w-2/3" />
      <Skeleton className="mx-auto h-4 w-1/2" />
      <div className="flex justify-center gap-3">
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function HomepageCMSLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, dirtyKeys, revision } = useCMS();
  const [showPreview, setShowPreview] = useState(false);

  // Edits survive switching sections (they live in the provider), but not a reload.
  useUnsavedChanges(dirtyKeys.length > 0);

  const dirtyCount = dirtyKeys.length;

  return (
    <div className="flex h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden bg-white xl:flex-row dark:bg-slate-950">
      {/* Section nav: vertical on xl, scrollable tabs below */}
      <nav
        aria-label="Homepage sections"
        className="shrink-0 border-b border-slate-200 bg-slate-50/70 xl:flex xl:w-60 xl:flex-col xl:border-b-0 xl:border-r dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="hidden px-5 pb-3 pt-5 xl:block">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Homepage builder</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {dirtyCount > 0
              ? `${dirtyCount} section${dirtyCount === 1 ? "" : "s"} with unpublished changes`
              : "Every section is live"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 xl:block xl:flex-1 xl:overflow-y-auto xl:px-3 xl:py-0">
          <ul className="flex flex-1 gap-1 overflow-x-auto xl:flex-col xl:overflow-visible">
            {sections.map((section) => {
              const isActive = pathname === section.href;
              const dirty = section.key ? dirtyKeys.includes(section.key) : false;
              return (
                <li key={section.href} className="shrink-0">
                  <Link
                    href={section.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setShowPreview(false)}
                    className={cn(
                      "flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors",
                      focusRing,
                      isActive
                        ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-emerald-400 dark:ring-slate-700"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    )}
                  >
                    <section.icon className="h-4 w-4 shrink-0" />
                    <span className="xl:flex-1">{section.title}</span>
                    {dirty && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Unpublished changes">
                        <span className="sr-only">(unpublished changes)</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition xl:hidden",
              focusRing,
              showPreview
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            )}
          >
            {showPreview ? <PencilLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        <div className="hidden border-t border-slate-200 p-3 xl:block dark:border-slate-800">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
              focusRing
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Open live site
          </a>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1">
        {/* Editor */}
        <div
          className={cn(
            "min-h-0 w-full flex-col border-slate-200 xl:flex xl:w-[480px] xl:shrink-0 xl:border-r 2xl:w-[540px] dark:border-slate-800",
            showPreview ? "hidden" : "flex"
          )}
        >
          <div key={revision} className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </div>

        {/* Live preview */}
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col bg-slate-100 xl:flex dark:bg-slate-900",
            showPreview ? "flex" : "hidden"
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">Live preview</span>
              <span className="hidden truncate sm:inline">· updates as you type, publish to go live</span>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20",
                focusRing
              )}
            >
              Open live site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="relative flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-[1400px] origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              <div className="pointer-events-none select-none [zoom:0.8]" aria-hidden="true" inert>
                <HomepageVisuals data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
