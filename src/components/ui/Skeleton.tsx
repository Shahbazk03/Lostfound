import { cn } from "@/lib/utils";

/** Grey placeholder block; size it with className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800", className)}
    />
  );
}
