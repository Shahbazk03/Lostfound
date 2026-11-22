"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, findActiveItem, type NavBadgeKey } from "./nav";
import { focusRing } from "./ui/styles";

export type NavCounts = Partial<Record<NavBadgeKey, number>>;

type Tip = { label: string; top: number } | null;

/**
 * Admin navigation. Grouped sections, active state, count badges, an
 * icon-only collapsed mode (desktop) and the same content in the mobile drawer.
 */
export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  counts,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  counts?: NavCounts | null;
  /** Called after a link is clicked (closes the mobile drawer). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const active = findActiveItem(pathname);
  const [tip, setTip] = useState<Tip>(null);

  const showTip = (label: string, el: HTMLElement) => {
    if (!collapsed) return;
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2 });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800", collapsed ? "justify-center px-2" : "px-5")}>
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn("flex items-center gap-2.5 rounded-lg", focusRing)}
          aria-label="LostFound admin dashboard"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold tracking-wider text-white shadow-sm">
            LF
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-white">LostFound</span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Admin console</span>
            </span>
          )}
        </Link>
      </div>

      {/* Groups */}
      <nav
        aria-label="Admin"
        className={cn("flex-1 overflow-y-auto overscroll-contain py-4", collapsed ? "px-2" : "px-3")}
        onScroll={() => tip && setTip(null)}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title} className={cn(gi > 0 && "mt-5")}>
            {collapsed ? (
              gi > 0 && <div className="mx-auto mb-3 h-px w-8 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active?.href === item.href;
                const count = item.badge ? counts?.[item.badge] ?? 0 : 0;
                const Icon = item.icon;
                const label = count > 0 ? `${item.title} (${count})` : item.title;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={collapsed ? label : undefined}
                      onMouseEnter={(e) => showTip(label, e.currentTarget)}
                      onMouseLeave={() => setTip(null)}
                      onFocus={(e) => showTip(label, e.currentTarget)}
                      onBlur={() => setTip(null)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                        focusRing,
                        collapsed ? "h-11 justify-center" : "h-11 px-3 lg:h-10",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                      )}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-600 dark:bg-emerald-400"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative">
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {collapsed && count > 0 && (
                          <span
                            className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          {count > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                              {count > 99 ? "99+" : count}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn("shrink-0 space-y-1 border-t border-slate-200 py-3 dark:border-slate-800", collapsed ? "px-2" : "px-3")}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={collapsed ? "View live site (opens in a new tab)" : undefined}
          onMouseEnter={(e) => showTip("View live site", e.currentTarget)}
          onMouseLeave={() => setTip(null)}
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
            focusRing,
            collapsed ? "justify-center" : "px-3"
          )}
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>View live site</span>}
        </a>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={() => {
              setTip(null);
              onToggleCollapse();
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onMouseEnter={(e) => showTip("Expand sidebar", e.currentTarget)}
            onMouseLeave={() => setTip(null)}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
              focusRing,
              collapsed ? "justify-center" : "px-3"
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>

      {/* Tooltip for the icon-only mode (fixed, so the scrolling nav can't clip it). */}
      {collapsed && tip && (
        <div
          role="tooltip"
          style={{ top: tip.top, left: 80 }}
          className="pointer-events-none fixed z-[150] -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-700"
        >
          {tip.label}
        </div>
      )}
    </div>
  );
}
