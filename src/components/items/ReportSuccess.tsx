"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard, Plus, Printer, Radar, Sparkles } from "lucide-react";
import { MatchList } from "./MatchList";
import { ShareMenu } from "./ShareMenu";
import { useItemMatches } from "./useItemMatches";

export interface CreatedItem {
  id: number;
  type: "lost" | "found";
  title: string;
  approximateLocation: string;
  city: string | null;
}

/** Check mark that pops in and draws itself (CSS only; static when animations are reduced). */
function CelebrationCheck() {
  return (
    <div className="relative mx-auto h-20 w-20" aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-emerald-400/25 opacity-0 motion-safe:scale-[1.8] motion-safe:transition motion-safe:duration-1000 motion-safe:ease-out motion-safe:starting:scale-75 motion-safe:starting:opacity-100" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/25 motion-safe:transition motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:starting:scale-50 motion-safe:starting:opacity-0">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-white">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24"
            className="[stroke-dashoffset:0] motion-safe:transition-[stroke-dashoffset] motion-safe:delay-200 motion-safe:duration-500 motion-safe:ease-out motion-safe:starting:[stroke-dashoffset:24]"
          />
        </svg>
      </div>
    </div>
  );
}

/** Shown on /report after a listing is created: celebration, instant matches, sharing. */
export function ReportSuccess({ item, onReportAnother }: { item: CreatedItem; onReportAnother: () => void }) {
  const { matches, error, retry } = useItemMatches(item.id);
  const path = `/items/${item.id}`;
  const place = [item.approximateLocation, item.city].filter(Boolean).join(", ");
  const counterpart = item.type === "lost" ? "found" : "lost";
  const count = matches?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-sm transition duration-300 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 sm:px-10">
        <CelebrationCheck />
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Your listing is live
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{item.title}&rdquo;</span> is now
          visible to everyone on LostFound. We&apos;ve already compared it with every {counterpart} report, and
          we&apos;ll keep checking as new ones come in.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href={path}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            View listing
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <ShareMenu
            path={path}
            title={item.title}
            type={item.type}
            place={place}
            posterHref={`${path}/poster`}
            label="Share"
            align="center"
            fullWidth={false}
            className="[&>button]:w-full"
          />
          <button
            type="button"
            onClick={onReportAnother}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Report another
          </button>
        </div>
      </div>

      <section
        aria-labelledby="instant-matches-heading"
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition delay-150 duration-300 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="instant-matches-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              {matches === null && !error
                ? "Checking for matches…"
                : count > 0
                ? `We found ${count} possible ${count === 1 ? "match" : "matches"}`
                : "Instant matches"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {count > 0
                ? `These ${counterpart} reports look like yours. Open one to compare the details.`
                : `Comparing your report with ${counterpart} items nearby.`}
            </p>
          </div>
        </div>

        <MatchList
          matches={matches}
          error={error}
          onRetry={retry}
          layout="narrow"
          empty={
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20 p-6">
              <span className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Radar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">No matches yet, and that&apos;s completely normal.</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Most matches come from reports made in the days after. Every new {counterpart} report is checked
                  against yours, and any match will show up on your listing and your dashboard.
                </p>
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    Go to dashboard
                  </Link>
                  <Link
                    href={`${path}/poster`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    Print a poster
                  </Link>
                </div>
              </div>
            </div>
          }
        />
      </section>
    </div>
  );
}
