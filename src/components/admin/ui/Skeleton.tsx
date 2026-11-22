import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800", className)}
    />
  );
}

/** Generic page skeleton: header, a row of cards and a table. */
export function PageSkeleton({ cards = 4, rows = 6 }: { cards?: number; rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      {cards > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-4 h-7 w-20" />
              <Skeleton className="mt-4 h-8 w-full" />
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <Skeleton className="h-10 w-72 max-w-full rounded-xl" />
        </div>
        <TableSkeletonRows rows={rows} />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function TableSkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
          {Array.from({ length: Math.max(0, cols - 2) }).map((__, j) => (
            <Skeleton key={j} className="hidden h-5 w-20 rounded-full md:block" />
          ))}
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
