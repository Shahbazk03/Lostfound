import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Skeleton } from "./Skeleton";

const POINTS = [
  {
    Icon: Sparkles,
    title: "Smart matching",
    text: "Every new report is compared with yours, so likely matches find you.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by default",
    text: "Chat inside LostFound. Your phone number and email stay hidden.",
  },
  {
    Icon: Lock,
    title: "Exact spots stay protected",
    text: "Precise locations are only shared with people who unlock them.",
  },
];

/**
 * Split layout for the sign-in pages: the form on one side, a calm brand
 * panel on the other (hidden on small screens).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-white dark:bg-slate-950 lg:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      <div className="flex min-w-0 flex-col px-4 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold tracking-wider text-white shadow-sm">
              LF
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Lost<span className="text-emerald-600 dark:text-emerald-400">Found</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[1.75rem]">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 lg:text-left">
          <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">
            Terms
          </Link>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
            Privacy
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-emerald-950 p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.35),transparent_70%),radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(20,184,166,0.18),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
        />
        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            The safer way to return lost things
          </p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Lost something? Found something? Let&apos;s get it home.
          </h2>
          <ul className="mt-10 space-y-6">
            {POINTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-emerald-100/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

/** Horizontal rule with a centred label ("or"). */
export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

/** Placeholder for an auth form while search params resolve. */
export function AuthFormSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="mx-auto h-4 w-2/3" />
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="h-11 rounded-xl" />
      <Skeleton className="h-11 rounded-xl" />
    </div>
  );
}
