"use client";

import { Radar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchList } from "./MatchList";
import { ShareMenu } from "./ShareMenu";
import { useItemMatches } from "./useItemMatches";

interface PossibleMatchesProps {
  itemId: number;
  itemType: "lost" | "found";
  title: string;
  place?: string | null;
  /** The owner gets a more prominent version with owner-focused copy. */
  isOwner: boolean;
}

/** "Possible matches" section of the item page (anchor: #matches). */
export function PossibleMatches({ itemId, itemType, title, place, isOwner }: PossibleMatchesProps) {
  const { matches, error, retry } = useItemMatches(itemId);
  const path = `/items/${itemId}`;
  const counterpart = itemType === "lost" ? "found" : "lost";

  const subtitle = isOwner
    ? itemType === "lost"
      ? "We compare your report with every found item nearby. These look closest, so open one to check the details."
      : "We compare this with every lost report nearby. If one of these is the owner, you can reach them safely."
    : `${counterpart === "lost" ? "Lost" : "Found"} reports that look like this item.`;

  return (
    <section
      id="matches"
      aria-labelledby="matches-heading"
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 sm:p-6 lg:p-8",
        isOwner
          ? "border-emerald-200 ring-1 ring-emerald-500/10 dark:border-emerald-500/30 dark:ring-0"
          : "border-slate-200/80 dark:border-slate-800"
      )}
    >
      <div className="mb-6 flex items-start gap-4">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            isOwner
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          )}
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="matches-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Possible matches
            </h2>
            {matches && matches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                {matches.length}
              </span>
            )}
            {isOwner && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                Smart Matching
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <MatchList
        matches={matches}
        error={error}
        onRetry={retry}
        empty={
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800/20">
            <div className="relative mb-4">
                            <span className="relative w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Radar className="w-7 h-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              </span>
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">No matches yet. We check every new report.</p>
            <p className="mt-1 mb-5 text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              Share this listing to reach more people.
            </p>
            <ShareMenu
              path={path}
              title={title}
              type={itemType}
              place={place}
              posterHref={`${path}/poster`}
              label="Share this listing"
              variant="primary"
              align="center"
            />
          </div>
        }
      />

      {!isOwner && matches && matches.length > 0 && (
        <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
          Is one of these yours? Compare photos and details carefully before reaching out.
        </p>
      )}
    </section>
  );
}
