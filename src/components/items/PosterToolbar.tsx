"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

/** Back link and Print button above the poster sheet; hidden when printing. */
export function PosterToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mx-auto mb-6 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to listing
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">A4 · prints best in colour</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          Print poster
        </button>
      </div>
    </div>
  );
}
