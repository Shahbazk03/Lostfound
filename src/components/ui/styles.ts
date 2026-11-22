/**
 * Class strings from the shared design system (DESIGN.md recipes).
 * Combine with `cn()` so later classes (e.g. error borders) win.
 */
export const ui = {
  card: "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
  btnPrimary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  btnSecondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50",
  btnDanger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  /** Icon-only button; always pair with aria-label. */
  iconBtn:
    "inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50",
  input:
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400",
  textarea:
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500",
  inputInvalid:
    "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/60 dark:focus:border-red-500",
  label: "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300",
  badge: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  pageTitle: "text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white",
  muted: "text-sm text-slate-500 dark:text-slate-400",
  container: "mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8",
} as const;

/** Colour pairs for `ui.badge`. */
export const badgeTone = {
  lost: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  found:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  neutral:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/10",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
  warning:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
} as const;

/** Badge colours for an item status. */
export function statusTone(status: string) {
  if (status === "active") return badgeTone.found;
  if (status === "resolved") return badgeTone.info;
  return badgeTone.neutral;
}

export function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "resolved") return "Resolved";
  if (status === "archived") return "Archived";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
