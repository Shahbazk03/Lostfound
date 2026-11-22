"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, ArrowLeft } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-16 dark:bg-slate-950">
      <div role="alert" className="w-full max-w-lg text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-amber-100/70 dark:bg-amber-500/10" aria-hidden />
          <span className="absolute inset-2 rounded-full border border-dashed border-amber-300 dark:border-amber-500/30" aria-hidden />
          <AlertTriangle className="relative h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden />
        </div>
        <p className="mt-6 text-sm font-semibold text-amber-600 dark:text-amber-400">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          We hit a snag loading this page
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          It&apos;s usually temporary. Try again, and if it keeps happening, come back in a few minutes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
            Reference: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
