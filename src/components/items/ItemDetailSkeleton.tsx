import { Skeleton } from "@/components/ui/Skeleton";

/** Placeholder that mirrors the item page layout, so nothing jumps on load. */
export function ItemDetailSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950" role="status" aria-label="Loading listing">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <Skeleton className="h-4 w-56" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-8">
            <div>
              <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-[16/10]" />
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-20 rounded-xl sm:h-[4.5rem] sm:w-24" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
