import Link from "next/link";
import { ArrowRight, Inbox, Plus } from "lucide-react";
import { ItemCard, ItemCardSkeleton, type ItemCardData } from "@/components/home/ItemCard";
import { AdminDeleteItem } from "@/components/home/AdminDeleteItem";

/**
 * "Recently reported" grid on the homepage. Rendered on the server from the
 * cached homepage data (no client fetch, no loading flash). `items` is
 * undefined only in the admin CMS preview, which shows placeholders.
 */
export default function RecentListings({ items, now }: { items?: ItemCardData[]; now: number }) {
  return (
    <section
      aria-labelledby="recent-listings-heading"
      className="bg-slate-50 py-16 dark:bg-slate-900/40 md:py-24"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Fresh from the community</p>
            <h2 id="recent-listings-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Recently reported
            </h2>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
              The newest lost and found reports. If one of these is yours, open it and get in touch.
            </p>
          </div>
          <Link
            href="/browse"
            className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl px-1 py-1 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 sm:self-auto"
          >
            View all listings
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-10">
          {!items ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: 3 }, (_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                <Inbox className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No reports yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                Be the first: report something you&apos;ve lost or found and the community will keep an eye out.
              </p>
              <Link
                href="/report"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Report an item
              </Link>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="flex">
                  <ItemCard item={item} now={now} className="w-full">
                    <AdminDeleteItem id={item.id} title={item.title} />
                  </ItemCard>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
