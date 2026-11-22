/**
 * Class-string recipes for the admin panel, taken from the shared design
 * system (DESIGN.md). Combine with `cn()` from "@/lib/utils" to override.
 */

export const card =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

export const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:border-red-500 aria-[invalid=true]:focus:ring-red-500/10 dark:aria-[invalid=true]:border-red-500/60";

export const input = `${inputBase} h-11`;
export const textarea = `${inputBase} py-2.5 leading-relaxed`;
export const select = `${inputBase} h-11 pr-9`;

export const label = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
export const muted = "text-sm text-slate-500 dark:text-slate-400";
export const sectionTitle = "text-base font-semibold text-slate-900 dark:text-white";

export const iconButton =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:w-9 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white " +
  focusRing;

export const kbd =
  "inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 font-sans text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
