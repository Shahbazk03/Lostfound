"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SparkPoint } from "./Sparkline";

// recharts is only downloaded by pages that render a sparkline.
const Sparkline = dynamic(() => import("./Sparkline"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

export type StatTone = "emerald" | "rose" | "amber" | "sky" | "violet" | "slate";

const ICON_TONES: Record<StatTone, string> = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export type StatDelta = {
  /** Percentage change; null when there is no previous value to compare. */
  value: number | null;
  label?: string;
  /** Set false when a rise is bad news (e.g. open tickets). */
  upIsGood?: boolean;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  sub,
  delta,
  trend,
  trendFormat,
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: StatTone;
  sub?: ReactNode;
  delta?: StatDelta;
  trend?: SparkPoint[];
  trendFormat?: (v: number) => string;
  href?: string;
  className?: string;
}) {
  const up = delta?.value !== null && delta?.value !== undefined && delta.value > 0;
  const down = delta?.value !== null && delta?.value !== undefined && delta.value < 0;
  const good = delta?.upIsGood === false ? down : up;
  const bad = delta?.upIsGood === false ? up : down;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", ICON_TONES[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</div>
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {delta && delta.value !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
              good && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
              bad && "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
              !good && !bad && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            ) : down ? (
              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
            ) : null}
            {up ? "+" : ""}
            {Math.round(delta.value)}%
          </span>
        )}
        {delta?.label && <span className="text-slate-500 dark:text-slate-400">{delta.label}</span>}
        {sub && <span className="text-slate-500 dark:text-slate-400">{sub}</span>}
      </div>
      {trend && trend.length > 1 && (
        <div className="-mx-1 mt-3 h-10" aria-hidden="true">
          <Sparkline data={trend} format={trendFormat} />
        </div>
      )}
      {href && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
          View details
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </span>
      )}
    </>
  );

  const base = cn(
    "flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "group transition hover:border-emerald-300/70 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:border-emerald-500/40"
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}
