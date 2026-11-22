import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | LOSTFOUND",
  robots: { index: false },
};

/** A "lost" page, drawn as a missing-item tag. Decorative. */
function LostTagIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-36 w-44" aria-hidden>
      <circle cx="100" cy="80" r="72" className="fill-emerald-50 dark:fill-emerald-500/10" />
      <circle cx="100" cy="80" r="58" fill="none" strokeWidth="1.5" strokeDasharray="3 7" className="stroke-emerald-200 dark:stroke-emerald-500/30" />
      <g transform="rotate(-8 100 80)">
        <path
          d="M62 52 h62 l22 28 l-22 28 h-62 a8 8 0 0 1 -8 -8 v-40 a8 8 0 0 1 8 -8 z"
          strokeWidth="2"
          className="fill-white stroke-slate-200 dark:fill-slate-900 dark:stroke-slate-700"
        />
        <circle cx="126" cy="80" r="5" strokeWidth="2" className="fill-emerald-50 stroke-emerald-500 dark:fill-slate-950" />
        <text x="66" y="77" className="fill-slate-400 dark:fill-slate-500" fontSize="9" fontWeight="700" letterSpacing="1.5">
          ERROR
        </text>
        <text x="65" y="98" className="fill-emerald-600 dark:fill-emerald-400" fontSize="22" fontWeight="800" letterSpacing="-0.5">
          404
        </text>
      </g>
      <path d="M131 80 q20 -24 38 -10" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-slate-300 dark:stroke-slate-600" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-lg text-center">
        <LostTagIllustration />
        <p className="mt-6 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Page not found</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          This page has gone missing
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          We looked everywhere. The link may be wrong, or the page was moved or removed.
        </p>

        {/* Plain GET form: works without JavaScript. */}
        <form action="/browse" role="search" className="mx-auto mt-8 flex max-w-md gap-2">
          <label htmlFor="nf-search" className="sr-only">
            Search listings
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="nf-search"
              name="search"
              type="search"
              maxLength={200}
              placeholder="Search listings instead"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-400"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Report an item
          </Link>
        </div>
      </div>
    </div>
  );
}
