"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect, useMemo, useRef, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Pencil,
  Trash2,
  CircleAlert,
  RefreshCcw,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { categories, countries, toItemCategory, cn } from "@/lib/utils";
import { ItemCard, ItemCardSkeleton, type ItemCardData } from "@/components/home/ItemCard";
import { CATEGORY_ICONS } from "@/components/home/category-icons";
import { fullDate } from "@/components/home/format";

interface Item {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  city: string | null;
  country: string | null;
  dateLostFound: string;
  timeframe: string | null;
  photos: string[] | null;
  status: string;
  createdAt: string;
  userId: number;
  userName: string | null;
}

interface BrowseResult {
  /** The request this result belongs to; differs from the current one while loading. */
  key: string;
  items: Item[];
  total: number;
  error: string;
  /** When the data arrived; anchors "3 days ago" labels. */
  fetchedAt: number;
}

type ItemType = "" | "lost" | "found";
type SortOrder = "newest" | "oldest";

interface Filters {
  type: ItemType;
  category: string;
  search: string;
  city: string;
  country: string;
  dateFrom: string;
  dateTo: string;
  sort: SortOrder;
}

const EMPTY_FILTERS: Filters = {
  type: "",
  category: "",
  search: "",
  city: "",
  country: "",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

const PAGE_SIZE = 48;
const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_COUNT = 8;
const MAX_TEXT = 200;

const TYPE_OPTIONS: { value: ItemType; label: string; dot?: string }[] = [
  { value: "", label: "All" },
  { value: "lost", label: "Lost", dot: "bg-rose-500" },
  { value: "found", label: "Found", dot: "bg-emerald-500" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
const FIELD =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const LABEL = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";
const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const isIsoDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

/**
 * Reads filters from the page URL. Accepts `search` (and the older `query`),
 * maps category aliases like "phones" to the canonical category and turns an
 * unknown category into a text search, so old links still find something.
 */
function parseFilters(sp: { get(name: string): string | null }): Filters {
  const type = sp.get("type");
  const sort = sp.get("sort");
  const country = sp.get("country") ?? "";
  const rawCategory = (sp.get("category") ?? "").trim();
  const category = toItemCategory(rawCategory) ?? "";
  let search = (sp.get("search") ?? sp.get("query") ?? "").slice(0, MAX_TEXT);
  if (rawCategory && !category && !search) search = rawCategory.slice(0, MAX_TEXT);
  return {
    type: type === "lost" || type === "found" ? type : "",
    category,
    search,
    city: (sp.get("city") ?? "").slice(0, MAX_TEXT),
    country: countries.includes(country) ? country : "",
    dateFrom: isIsoDate(sp.get("dateFrom")),
    dateTo: isIsoDate(sp.get("dateTo")),
    sort: sort === "oldest" ? "oldest" : "newest",
  };
}

/** Shareable page query; defaults are left out to keep links short. */
function toPageQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.search.trim()) p.set("search", f.search.trim());
  if (f.type) p.set("type", f.type);
  if (f.category) p.set("category", f.category);
  if (f.city.trim()) p.set("city", f.city.trim());
  if (f.country) p.set("country", f.country);
  if (f.dateFrom) p.set("dateFrom", f.dateFrom);
  if (f.dateTo) p.set("dateTo", f.dateTo);
  if (f.sort !== "newest") p.set("sort", f.sort);
  return p.toString();
}

/** Query for GET /api/items (which calls the text search `query`). */
function toApiQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.search.trim()) p.set("query", f.search.trim());
  if (f.type) p.set("type", f.type);
  if (f.category) p.set("category", f.category);
  if (f.city.trim()) p.set("city", f.city.trim());
  if (f.country) p.set("country", f.country);
  if (f.dateFrom) p.set("dateFrom", f.dateFrom);
  if (f.dateTo) p.set("dateTo", f.dateTo);
  p.set("sort", f.sort);
  return p.toString();
}

async function fetchItemsPage(params: string, offset: number, signal: AbortSignal) {
  const res = await fetch(`/api/items?${params}&limit=${PAGE_SIZE}&offset=${offset}`, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  const items: Item[] = data.items || [];
  const total: number = typeof data.total === "number" ? data.total : offset + items.length;
  return { items, total };
}

function toCard(item: Item): ItemCardData {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    category: item.category,
    area: item.approximateLocation,
    city: item.city,
    photo: item.photos?.[0] ?? null,
    date: item.dateLostFound,
    status: item.status,
  };
}

function BrowseHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between md:py-10 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">Browse listings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 md:text-base">
            Lost and found items reported by the community. Search, filter and share what you find.
          </p>
        </div>
        {children ?? <div className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 md:w-72" aria-hidden />}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={GRID} role="status" aria-label="Loading listings">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Decorative magnifier for the empty state. */
function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" aria-hidden>
      <circle cx="60" cy="60" r="56" className="fill-emerald-50 dark:fill-emerald-500/10" />
      <circle cx="60" cy="60" r="44" fill="none" strokeDasharray="3 6" strokeWidth="1.5" className="stroke-emerald-200 dark:stroke-emerald-500/30" />
      <circle cx="54" cy="54" r="20" fill="none" strokeWidth="6" className="stroke-emerald-600 dark:stroke-emerald-400" />
      <path d="M69 69 L84 84" strokeWidth="7" strokeLinecap="round" className="stroke-emerald-600 dark:stroke-emerald-400" />
      <path d="M47 50 q7 -7 14 0" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-emerald-300 dark:stroke-emerald-300/60" />
    </svg>
  );
}

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const urlKey = searchParams.toString();

  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [showFilters, setShowFilters] = useState(
    () => !!(filters.city || filters.country || filters.dateFrom || filters.dateTo)
  );
  const [result, setResult] = useState<BrowseResult | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const loadMoreController = useRef<AbortController | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  // Free-text fields are debounced so we don't fire a request per keystroke.
  const [debouncedText, setDebouncedText] = useState({
    search: filters.search,
    city: filters.city,
  });
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedText({ search: filters.search, city: filters.city }),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [filters.search, filters.city]);

  const effective = useMemo(
    () => ({ ...filters, search: debouncedText.search, city: debouncedText.city }),
    [filters, debouncedText]
  );
  const requestParams = useMemo(() => toApiQuery(effective), [effective]);
  const pageQuery = useMemo(() => toPageQuery(effective), [effective]);

  // ---- URL sync -------------------------------------------------------------
  // State is the source of truth; the URL mirrors it so searches stay
  // shareable. history.replaceState (which Next's router picks up) instead of
  // router.replace: no server round trip, no history spam, no scroll jump.
  const pendingWrites = useRef<string[]>([]);
  useEffect(() => {
    const current = new URLSearchParams(window.location.search).toString();
    if (current === pageQuery) return;
    if (pendingWrites.current.at(-1) !== pageQuery) pendingWrites.current.push(pageQuery);
    window.history.replaceState(window.history.state, "", pageQuery ? `${pathname}?${pageQuery}` : pathname);
  }, [pageQuery, pathname]);

  // If the URL changes for any other reason (e.g. the navbar's "Browse" link
  // while already here), adopt it instead of fighting it.
  const seenUrlKey = useRef(urlKey);
  useEffect(() => {
    if (urlKey === seenUrlKey.current) return;
    seenUrlKey.current = urlKey;
    const ours = pendingWrites.current.indexOf(urlKey);
    if (ours !== -1) {
      pendingWrites.current.splice(0, ours + 1);
      return;
    }
    const next = parseFilters(searchParams);
    // Syncing from an external source (the URL), so this has to be an effect.
    setFilters(next);
    setDebouncedText({ search: next.search, city: next.city });
  }, [urlKey, searchParams]);

  // Keep the active category chip in view (e.g. arriving with ?category=Toys).
  useEffect(() => {
    const container = chipsRef.current;
    const chip = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !chip) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < container.scrollLeft || right > container.scrollLeft + container.clientWidth) {
      container.scrollTo({ left: Math.max(0, left - 16) });
    }
  }, [filters.category]);

  // ---- data -----------------------------------------------------------------
  // Exactly one /api/items request per distinct filter set (requestKey).
  const requestKey = `${requestParams}#${reloadCount}`;
  const loading = result?.key !== requestKey;

  useEffect(() => {
    // Each new request aborts the previous one, so a slow stale response can
    // never overwrite newer results.
    const controller = new AbortController();
    loadMoreController.current?.abort();
    fetchItemsPage(requestParams, 0, controller.signal)
      .then(({ items, total }) => {
        setResult({ key: requestKey, items, total, error: "", fetchedAt: Date.now() });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          items: [],
          total: 0,
          error: err instanceof Error ? err.message : "Something went wrong",
          fetchedAt: Date.now(),
        });
      });
    return () => controller.abort();
  }, [requestKey, requestParams]);

  const items = result?.items ?? [];
  const hasMore = !!result && !result.error && items.length < result.total;

  const loadMore = async () => {
    if (!result || loadingMore) return;
    const key = result.key;
    const controller = new AbortController();
    loadMoreController.current?.abort();
    loadMoreController.current = controller;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const page = await fetchItemsPage(requestParams, result.items.length, controller.signal);
      setResult((prev) =>
        prev && prev.key === key
          ? {
              ...prev,
              items: [
                ...prev.items,
                ...page.items.filter((i) => !prev.items.some((p) => p.id === i.id)),
              ],
              total: page.total,
            }
          : prev
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        setLoadMoreError(err instanceof Error ? err.message : "Could not load more items");
      }
    } finally {
      if (loadMoreController.current === controller) {
        loadMoreController.current = null;
        setLoadingMore(false);
      }
    }
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Removing a text filter via its pill should apply immediately.
    if ((key === "search" || key === "city") && value === "") {
      setDebouncedText((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }));
    setDebouncedText({ search: "", city: "" });
  };

  const advancedCount = [filters.city, filters.country, filters.dateFrom, filters.dateTo].filter(Boolean).length;
  const hasActiveFilters =
    !!(filters.type || filters.category || filters.search.trim()) || advancedCount > 0;

  // Removable pills summarising what's applied.
  const activePills: { key: keyof Filters; label: string }[] = [];
  if (filters.type) activePills.push({ key: "type", label: filters.type === "lost" ? "Lost items" : "Found items" });
  if (filters.category) activePills.push({ key: "category", label: filters.category });
  if (filters.search.trim()) activePills.push({ key: "search", label: `“${filters.search.trim()}”` });
  if (filters.city.trim()) activePills.push({ key: "city", label: `City: ${filters.city.trim()}` });
  if (filters.country) activePills.push({ key: "country", label: filters.country });
  if (filters.dateFrom) activePills.push({ key: "dateFrom", label: `From ${fullDate(filters.dateFrom)}` });
  if (filters.dateTo) activePills.push({ key: "dateTo", label: `Until ${fullDate(filters.dateTo)}` });

  const handleDeleteItem = async (itemId: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await fetch(`/api/admin/items/${itemId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((i) => i.id !== itemId),
                  total: Math.max(0, prev.total - 1),
                }
              : prev
          );
        }
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Show skeletons until there is something real to dim behind "Updating…".
  const showSkeleton = loading && (!result || !!result.error || items.length === 0);
  const total = result?.total ?? items.length;
  const now = result?.fetchedAt ?? 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      <BrowseHeader>
        <div
          role="group"
          aria-label="Item type"
          className="grid w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 md:w-72"
        >
          {TYPE_OPTIONS.map((opt) => {
            const active = filters.type === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                aria-pressed={active}
                onClick={() => updateFilter("type", opt.value)}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                {opt.dot && <span className={cn("h-2 w-2 rounded-full", opt.dot)} aria-hidden />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </BrowseHeader>

      {/* Sticky filter bar: search, advanced filters toggle and category chips */}
      <div className="sticky top-16 z-30 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-xl backdrop-saturate-150 dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value.slice(0, MAX_TEXT))}
                aria-label="Search listings"
                placeholder="Search by title, description or place"
                enterKeyHint="search"
                className={cn(FIELD, "pl-11 text-base sm:text-sm")}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="browse-filters"
              className={cn(
                "relative flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-semibold shadow-sm transition-colors sm:px-4",
                FOCUS_RING,
                showFilters
                  ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Filters</span>
              <span className="sr-only sm:hidden">More filters</span>
              {advancedCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white">
                  {advancedCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div id="browse-filters" className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-800 lg:grid-cols-4">
              <div>
                <label htmlFor="browse-city" className={LABEL}>
                  City
                </label>
                <input
                  type="text"
                  id="browse-city"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value.slice(0, MAX_TEXT))}
                  placeholder="e.g. Lucknow"
                  className={FIELD}
                />
              </div>

              <div>
                <label htmlFor="browse-country" className={LABEL}>
                  Country
                </label>
                <select
                  id="browse-country"
                  value={filters.country}
                  onChange={(e) => updateFilter("country", e.target.value)}
                  className={FIELD}
                >
                  <option value="">All countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="browse-date-from" className={LABEL}>
                  From
                </label>
                <input
                  type="date"
                  id="browse-date-from"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className={cn(FIELD, "dark:[color-scheme:dark]")}
                />
              </div>

              <div>
                <label htmlFor="browse-date-to" className={LABEL}>
                  To
                </label>
                <input
                  type="date"
                  id="browse-date-to"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className={cn(FIELD, "dark:[color-scheme:dark]")}
                />
              </div>
            </div>
          )}

          {/* Category chips: scroll sideways when they don't fit */}
          <div className="relative -mx-4 mt-3 sm:mx-0">
            <div
              ref={chipsRef}
              role="group"
              aria-label="Category"
              className="flex gap-2 overflow-x-auto px-4 py-0.5 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%_-_24px),transparent)] [scrollbar-width:none] sm:px-0 sm:[mask-image:linear-gradient(to_right,black_calc(100%_-_32px),transparent)]"
            >
              {["", ...categories].map((cat) => {
                const active = filters.category === cat;
                const Icon = cat ? CATEGORY_ICONS[cat] : LayoutGrid;
                return (
                  <button
                    key={cat || "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilter("category", cat)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                      FOCUS_RING,
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                    )}
                  >
                    {Icon && <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} aria-hidden />}
                    {cat || "All categories"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Result count, applied filters and sort */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-h-9 flex-1 flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
            {result && !result.error && !showSkeleton && (
              <p className="mr-1">
                {items.length < total ? (
                  <>
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{items.length}</span> of{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">{total}</span> listings
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900 dark:text-white">{total}</span> listing{total === 1 ? "" : "s"}
                    {hasActiveFilters ? " match" : ""}
                  </>
                )}
              </p>
            )}
            {loading && result && !showSkeleton && (
              <span className="inline-flex items-center gap-2">
                <LoadingLogo className="h-4 w-4" />
                Updating…
              </span>
            )}
            {activePills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => updateFilter(pill.key, EMPTY_FILTERS[pill.key])}
                aria-label={`Remove filter ${pill.label}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full bg-white pl-3 pr-2 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800",
                  FOCUS_RING
                )}
              >
                <span className="max-w-[12rem] truncate">{pill.label}</span>
                <X className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={cn("rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10", FOCUS_RING)}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="relative">
            <label htmlFor="browse-sort" className="sr-only">
              Sort listings
            </label>
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <select
              id="browse-sort"
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value === "oldest" ? "oldest" : "newest")}
              className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Results */}
        {showSkeleton ? (
          <SkeletonGrid />
        ) : result?.error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center dark:border-red-900/50 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
              <CircleAlert className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">We couldn&apos;t load listings</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
              Something went wrong on our side or with your connection. Please try again.
            </p>
            <button
              type="button"
              onClick={() => setReloadCount((n) => n + 1)}
              disabled={loading}
              className={cn("mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50", FOCUS_RING)}
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin motion-reduce:animate-none")} aria-hidden />
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60 md:py-20">
            <EmptyIllustration />
            <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
              {hasActiveFilters
                ? filters.search.trim()
                  ? `No listings match “${filters.search.trim()}”`
                  : "No listings match these filters"
                : "No listings yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
              {hasActiveFilters
                ? "Try fewer filters or a broader word. If it isn't here yet, post a report so the right person can find you."
                : "Be the first to report something you've lost or found. The community will keep an eye out."}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/report"
                className={cn("inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700", FOCUS_RING)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Report an item
              </Link>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={cn("inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800", FOCUS_RING)}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <ul className={cn(GRID, "transition-opacity", loading && "opacity-60")}>
              {items.map((item) => (
                <li key={item.id} className="flex">
                  <ItemCard item={toCard(item)} now={now} className="w-full">
                    {user?.role === "admin" && (
                      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
                        <Link
                          href={`/admin?editItem=${item.id}`}
                          className="rounded-full bg-white/95 p-2.5 text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          title="Edit item (admin)"
                          aria-label={`Edit ${item.title} (admin)`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded-full bg-white/95 p-2.5 text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Delete item (admin)"
                          aria-label={`Delete ${item.title} (admin)`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </ItemCard>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore || loading}
                  className={cn("inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800", FOCUS_RING)}
                >
                  {loadingMore && <LoadingLogo className="h-4 w-4" />}
                  {loadingMore ? "Loading…" : `Load more (${total - items.length} left)`}
                </button>
                {loadMoreError && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {loadMoreError}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  // useSearchParams() needs a Suspense boundary so the rest of the page can
  // still be prerendered; the fallback mirrors the real layout to avoid a jump.
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
          <BrowseHeader />
          <div className="sticky top-16 z-30 border-b border-slate-200/80 bg-slate-50/85 dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8" aria-hidden>
              <div className="flex gap-2">
                <div className="h-11 flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
                <div className="h-11 w-11 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:w-28" />
              </div>
              <div className="mt-3 flex gap-2 overflow-hidden py-0.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-9 w-28 shrink-0 rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
                ))}
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-5 h-9" aria-hidden />
            <SkeletonGrid />
          </div>
        </div>
      }
    >
      <BrowsePageContent />
    </Suspense>
  );
}
