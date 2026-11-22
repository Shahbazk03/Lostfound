"use client";

import Link from "next/link";
import { ArrowRight, Clock, ImageIcon, MapPin } from "lucide-react";
import type { ItemMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { STRENGTH_STYLES, matchStrength, relativeDay, shortDate } from "./match-ui";

const RING_RADIUS = 15.5;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Circular match-% badge, colored by strength. */
export function MatchScoreRing({ score, className }: { score: number; className?: string }) {
  const style = STRENGTH_STYLES[matchStrength(score)];
  return (
    <div
      role="img"
      aria-label={`${score}% match (${style.label.toLowerCase()})`}
      className={cn(
        "relative w-12 h-12 rounded-full bg-white/95 dark:bg-slate-950/90 backdrop-blur shadow-lg shadow-slate-900/10 ring-1 ring-black/5 dark:ring-white/10",
        className
      )}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={RING_RADIUS} fill="none" strokeWidth="3" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(Math.max(0, Math.min(100, score)) / 100) * RING_LENGTH} ${RING_LENGTH}`}
          className={style.stroke}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums text-slate-900 dark:text-white">
        {score}
        <span className="text-[8px] font-bold ml-px -mt-1">%</span>
      </span>
    </div>
  );
}

export function MatchCard({ match }: { match: ItemMatch }) {
  const strength = STRENGTH_STYLES[matchStrength(match.score)];
  const place = [match.approximateLocation, match.city].filter(Boolean).join(", ");
  const verb = match.type === "lost" ? "Lost" : "Found";

  return (
    <Link
      href={`/items/${match.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40 dark:hover:shadow-black/30 dark:focus-visible:ring-offset-slate-950"
    >
      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {match.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.photo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          </div>
        )}
        <span
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide text-white shadow-sm backdrop-blur-md",
            match.type === "lost" ? "bg-rose-500/90" : "bg-emerald-500/90"
          )}
        >
          {match.type.toUpperCase()}
        </span>
        <MatchScoreRing score={match.score} className="absolute top-2.5 right-2.5" />
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider", strength.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", strength.dot)} aria-hidden="true" />
          {strength.label}
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {match.title}
        </h3>
        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          {place && (
            <span className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate capitalize">{place}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5" title={shortDate(match.dateLostFound)}>
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {verb} {relativeDay(match.dateLostFound)}
          </span>
        </div>

        {match.reasons.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-1" aria-label="Why this matches">
            {match.reasons.slice(0, 3).map((reason) => (
              <li
                key={reason}
                className="max-w-full truncate px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Compare details
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse" aria-hidden="true">
      <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-3">
        <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="flex gap-1.5">
          <div className="h-4 w-16 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
