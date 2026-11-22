import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, Package } from "lucide-react";
import { CATEGORY_ICONS } from "./category-icons";
import { daysAgo, fullDate, placeLabel } from "./format";
import { cn, toItemCategory } from "@/lib/utils";

/** Public fields of a listing, as both the homepage and /browse show it. */
export interface ItemCardData {
  id: number;
  type: "lost" | "found";
  title: string;
  category: string;
  /** Approximate area (never the precise location). */
  area: string | null;
  city: string | null;
  /** First photo URL (/api/media/..., https://...), if any. */
  photo: string | null;
  /** ISO date the item was lost or found. */
  date: string;
  status?: string;
}

export function TypeBadge({ type, className }: { type: "lost" | "found"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-inset ring-white/20",
        type === "lost" ? "bg-rose-600" : "bg-emerald-600",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
      {type === "lost" ? "Lost" : "Found"}
    </span>
  );
}

/**
 * Listing card: photo with a LOST/FOUND badge, category, title,
 * area · city and how long ago it was lost or found. The whole card is one
 * link (stretched over the card). `children` render on top (admin actions).
 */
export function ItemCard({
  item,
  now,
  className,
  children,
}: {
  item: ItemCardData;
  /** Reference time (ms) for "3 days ago", supplied by the caller. */
  now: number;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = CATEGORY_ICONS[toItemCategory(item.category) ?? ""] ?? Package;
  const place = placeLabel(item.area, item.city);
  const when = daysAgo(item.date, now);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 ease-out hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/[0.07] motion-safe:hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/30",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-emerald-500 has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-white dark:has-[a:focus-visible]:ring-offset-slate-950",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <Icon className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <TypeBadge type={item.type} />
          {item.status === "resolved" && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
              Reunited
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{item.category}</span>
          </span>
          {when && (
            <time dateTime={item.date} title={fullDate(item.date)} className="shrink-0">
              {item.type === "lost" ? "Lost" : "Found"} {when}
            </time>
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
          <Link href={`/items/${item.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        {place && (
          <p className="mt-auto flex min-w-0 items-center gap-1.5 pt-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        )}
      </div>

      {children}
    </article>
  );
}

/** Same footprint as ItemCard, so nothing jumps when data arrives. */
export function ItemCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
      aria-hidden
    >
      <div className="aspect-[4/3] animate-pulse bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
      <div className="p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
        <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
        <div className="mt-5 flex justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
