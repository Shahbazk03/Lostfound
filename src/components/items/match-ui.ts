/** Client-safe helpers for showing Smart Matching results. */

export type MatchStrength = "strong" | "good" | "possible";

export function matchStrength(score: number): MatchStrength {
  if (score >= 75) return "strong";
  if (score >= 55) return "good";
  return "possible";
}

export const STRENGTH_STYLES: Record<
  MatchStrength,
  { label: string; text: string; stroke: string; soft: string; dot: string }
> = {
  strong: {
    label: "Strong match",
    text: "text-emerald-600 dark:text-emerald-400",
    stroke: "stroke-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  good: {
    label: "Good match",
    text: "text-sky-600 dark:text-sky-400",
    stroke: "stroke-sky-500",
    soft: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
    dot: "bg-sky-500",
  },
  possible: {
    label: "Possible match",
    text: "text-amber-600 dark:text-amber-400",
    stroke: "stroke-amber-500",
    soft: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "today", "yesterday", "3 days ago", "2 weeks ago", "5 months ago". */
export function relativeDay(iso: string, now: number = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "today";
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}

/** "Jun 10, 2026". Dates are stored as midnight UTC, so format in UTC. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
