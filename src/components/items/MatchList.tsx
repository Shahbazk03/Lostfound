"use client";

import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ItemMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";
import { MatchCard, MatchCardSkeleton } from "./MatchCard";

interface MatchListProps {
  /** null while loading. */
  matches: ItemMatch[] | null;
  error?: boolean;
  onRetry?: () => void;
  /** Shown when the list loaded and is empty. */
  empty: ReactNode;
  /** "wide" fits 3 columns on large screens, "narrow" at most 2. */
  layout?: "wide" | "narrow";
  skeletons?: number;
}

export function MatchList({ matches, error, onRetry, empty, layout = "wide", skeletons = 3 }: MatchListProps) {
  const grid = cn("grid gap-4 sm:grid-cols-2", layout === "wide" && "xl:grid-cols-3");

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-sm text-slate-600 dark:text-slate-300"
      >
        <span className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          We couldn&apos;t check for matches right now.
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!matches) {
    return (
      <div className={grid} role="status" aria-label="Looking for matches">
        {Array.from({ length: layout === "narrow" ? Math.min(skeletons, 2) : skeletons }, (_, i) => (
          // The third placeholder only shows once there are three columns.
          <div key={i} className={cn(i >= 2 && "hidden xl:block")}>
            <MatchCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) return <>{empty}</>;

  return (
    <ul className={grid}>
      {matches.map((match) => (
        <li key={match.id} className="min-w-0">
          <MatchCard match={match} />
        </li>
      ))}
    </ul>
  );
}
