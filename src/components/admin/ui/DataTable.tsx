"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SearchX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "../AdminStates";
import { DropdownMenu, type MenuItem } from "./Menu";
import { TableSkeletonRows } from "./Skeleton";
import { focusRing, iconButton, inputBase } from "./styles";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Enables sorting on this column. */
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right";
  /** Leave out of the stacked mobile card. */
  hideOnMobile?: boolean;
};

type RowId = string | number;

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => RowId;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Client-side search. `q` is lower-cased and trimmed. */
  search?: { placeholder: string; match: (row: T, q: string) => boolean };
  /** Filters shown next to the search box. */
  toolbar?: ReactNode;
  toolbarEnd?: ReactNode;
  rowActions?: (row: T) => MenuItem[];
  /** Small always-visible buttons rendered before the actions menu. */
  inlineActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  /** Accessible name for a clickable row. */
  rowLabel?: (row: T) => string;
  isRowActive?: (row: T) => boolean;
  empty: { icon?: ComponentType<{ className?: string }>; title: string; description?: ReactNode; action?: ReactNode };
  initialSort?: { id: string; dir: "asc" | "desc" };
  pageSize?: number;
  /** Changing this (e.g. the active filter) returns to page 1. */
  resetKey?: string;
  selection?: {
    selected: Set<RowId>;
    onChange: (next: Set<RowId>) => void;
    /** Shown in a bar above the table while rows are selected. */
    actions: (ids: RowId[]) => ReactNode;
  };
  caption: string;
};

const PAGE_SIZES = [10, 20, 50, 100];

function compare(a: string | number | null | undefined, b: string | number | null | undefined) {
  const aNil = a === null || a === undefined || a === "";
  const bNil = b === null || b === undefined || b === "";
  if (aNil && bNil) return 0;
  if (aNil) return 1;
  if (bNil) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function isInteractive(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("a,button,input,select,textarea,label,[role='menu']");
}

/**
 * Admin data table: search, sortable columns, client-side pagination, row
 * actions menu, optional selection, skeleton / empty / error states, sticky
 * header on desktop and stacked cards on mobile.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading,
  error,
  onRetry,
  search,
  toolbar,
  toolbarEnd,
  rowActions,
  inlineActions,
  onRowClick,
  rowLabel,
  isRowActive,
  empty,
  initialSort,
  pageSize: initialPageSize = 20,
  resetKey,
  selection,
  caption,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (search && q ? rows.filter((r) => search.match(r, q)) : rows),
    [rows, search, q]
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return filtered;
    const get = col.sortValue;
    const out = [...filtered].sort((a, b) => compare(get(a), get(b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const hasActions = !!rowActions || !!inlineActions;

  const toggleSort = (id: string) => {
    setSort((prev) => (prev?.id === id ? { id, dir: prev.dir === "asc" ? "desc" : "asc" } : { id, dir: "asc" }));
  };

  const pageIds = pageRows.map(getRowId);
  const allOnPageSelected = !!selection && pageIds.length > 0 && pageIds.every((id) => selection.selected.has(id));
  const someOnPageSelected = !!selection && pageIds.some((id) => selection.selected.has(id));

  const togglePage = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    selection.onChange(next);
  };
  const toggleRow = (id: RowId) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };

  const rowProps = (row: T) =>
    onRowClick
      ? {
          tabIndex: 0,
          "aria-label": rowLabel?.(row),
          onClick: (e: React.MouseEvent) => {
            if (!isInteractive(e.target)) onRowClick(row);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
              e.preventDefault();
              onRowClick(row);
            }
          },
        }
      : {};

  const renderActions = (row: T) => {
    const items = rowActions?.(row) ?? [];
    return (
      <div className="flex items-center justify-end gap-1">
        {inlineActions?.(row)}
        {items.length > 0 && <DropdownMenu items={items} label="Row actions" />}
      </div>
    );
  };

  const showBody = !loading && !error;
  const selectedCount = selection?.selected.size ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm [overflow:clip] dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      {(search || toolbar || toolbarEnd) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
            {search && (
              <div className="relative w-full md:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={search.placeholder}
                  aria-label={search.placeholder}
                  className={cn(inputBase, "h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {toolbar}
          </div>
          {toolbarEnd && <div className="flex shrink-0 items-center gap-2">{toolbarEnd}</div>}
        </div>
      )}

      {/* Bulk bar */}
      {selection && selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selection.onChange(new Set())}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            >
              Clear
            </button>
            {selection.actions(Array.from(selection.selected))}
          </div>
        </div>
      )}

      {loading && <TableSkeletonRows rows={6} cols={columns.length} />}
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}

      {showBody && sorted.length === 0 && (
        q ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            description={`Nothing matches “${query.trim()}”. Try a different search.`}
            action={
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                Clear search
              </button>
            }
          />
        ) : (
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />
        )
      )}

      {showBody && sorted.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block lg:overflow-visible">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  {selection && (
                    <th scope="col" className="sticky top-0 z-10 w-12 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                      <input
                        type="checkbox"
                        aria-label="Select all rows on this page"
                        checked={allOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                        }}
                        onChange={togglePage}
                        className="h-4 w-4 cursor-pointer rounded accent-emerald-600"
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const sorted = sort?.id === col.id ? sort.dir : null;
                    return (
                      <th
                        key={col.id}
                        scope="col"
                        aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                        className={cn(
                          "sticky top-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur first:pl-5 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400",
                          col.align === "right" && "text-right",
                          col.headerClassName
                        )}
                      >
                        {col.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.id)}
                            className={cn(
                              "group inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-slate-900 dark:hover:text-white",
                              focusRing,
                              col.align === "right" && "flex-row-reverse"
                            )}
                          >
                            {col.header}
                            {sorted === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80" aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                  {hasActions && (
                    <th scope="col" className="sticky top-0 z-10 w-px border-b border-slate-200 bg-slate-50/95 py-3 pl-2 pr-4 text-right backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageRows.map((row) => {
                  const id = getRowId(row);
                  const active = isRowActive?.(row);
                  return (
                    <tr
                      key={id}
                      {...rowProps(row)}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer focus-visible:bg-emerald-50/60 focus-visible:outline-none dark:focus-visible:bg-emerald-500/5",
                        active || selection?.selected.has(id)
                          ? "bg-emerald-50/50 dark:bg-emerald-500/5"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {selection && (
                        <td className="w-12 px-4 py-3.5">
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={selection.selected.has(id)}
                            onChange={() => toggleRow(id)}
                            className="h-4 w-4 cursor-pointer rounded accent-emerald-600"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-4 py-3.5 align-middle text-slate-700 first:pl-5 dark:text-slate-300",
                            col.align === "right" && "text-right",
                            col.className
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                      {hasActions && <td className="w-px py-2 pl-2 pr-3">{renderActions(row)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800" aria-label={caption}>
            {pageRows.map((row) => {
              const id = getRowId(row);
              const [first, ...rest] = columns;
              const others = rest.filter((c) => !c.hideOnMobile);
              return (
                <li
                  key={id}
                  {...rowProps(row)}
                  className={cn(
                    "px-4 py-4",
                    onRowClick && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/40",
                    (isRowActive?.(row) || selection?.selected.has(id)) && "bg-emerald-50/50 dark:bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {selection && (
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selection.selected.has(id)}
                        onChange={() => toggleRow(id)}
                        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-emerald-600"
                      />
                    )}
                    <div className="min-w-0 flex-1">{first.cell(row)}</div>
                    {hasActions && <div className="-mr-2 -mt-1 shrink-0">{renderActions(row)}</div>}
                  </div>
                  {others.length > 0 && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {others.map((col) => (
                        <div key={col.id} className="min-w-0">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            {col.header}
                          </dt>
                          <dd className="mt-0.5 min-w-0 text-sm text-slate-700 dark:text-slate-300">{col.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:text-slate-400">
            <p aria-live="polite">
              Showing <span className="font-medium text-slate-900 dark:text-white">{start + 1}</span>–
              <span className="font-medium text-slate-900 dark:text-white">{Math.min(start + pageSize, sorted.length)}</span> of{" "}
              <span className="font-medium text-slate-900 dark:text-white">{sorted.length}</span>
              {q && rows.length !== sorted.length && <> (filtered from {rows.length})</>}
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="hidden sm:inline">Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:h-8 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  aria-label="Rows per page"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current <= 1}
                  className={cn(iconButton, "border border-slate-200 dark:border-slate-700")}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[4.5rem] text-center tabular-nums">
                  {current} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current >= pageCount}
                  className={cn(iconButton, "border border-slate-200 dark:border-slate-700")}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
