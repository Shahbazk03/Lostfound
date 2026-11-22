"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronRight, ExternalLink, LogOut, Menu, Moon, Search, Settings, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getNavCounts } from "@/app/admin/actions";
import { AdminFeedbackProvider } from "./AdminFeedback";
import { AdminSidebar, type NavCounts } from "./AdminSidebar";
import { CommandPalette } from "./CommandPalette";
import { getBreadcrumbs } from "./nav";
import { DropdownMenu } from "./ui/Menu";
import { useOverlay } from "./ui/Overlay";
import { focusRing, iconButton, kbd } from "./ui/styles";
import { useStoredFlag } from "./ui/useStoredFlag";

type ShellContextValue = {
  counts: NavCounts | null;
  /** Re-fetch the sidebar badge counts (call after changing tickets / withdrawals). */
  refreshCounts: () => void;
  openPalette: () => void;
};

const ShellContext = createContext<ShellContextValue>({
  counts: null,
  refreshCounts: () => {},
  openPalette: () => {},
});

export function useAdminShell() {
  return useContext(ShellContext);
}

const noopSubscribe = () => () => {};

function useIsMac() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/i.test(navigator.userAgent),
    () => false
  );
}

function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminFeedbackProvider>
      <ShellFrame>{children}</ShellFrame>
    </AdminFeedbackProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useStoredFlag("lf-admin:sidebar-collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts | null>(null);
  const lastFetch = useRef(0);

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  const refreshCounts = useCallback(() => {
    lastFetch.current = Date.now();
    getNavCounts()
      .then(setCounts)
      .catch(() => {
        // Badges are a convenience; never block the page on them.
      });
  }, []);

  // Fetch on first load and on navigation, at most every 20 seconds.
  useEffect(() => {
    if (Date.now() - lastFetch.current < 20_000) return;
    refreshCounts();
  }, [pathname, refreshCounts]);

  // Ctrl/⌘+K anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTheme = useCallback(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"), [resolvedTheme, setTheme]);
  const toggleSidebar = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }, [logout, router]);

  const ctx = useMemo<ShellContextValue>(
    () => ({ counts, refreshCounts, openPalette: () => setPaletteOpen(true) }),
    [counts, refreshCounts]
  );

  return (
    <ShellContext.Provider value={ctx}>
      <a
        href="#admin-main"
        className="sr-only z-[400] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 border-r border-slate-200 transition-[width] duration-200 ease-out motion-reduce:transition-none lg:block dark:border-slate-800",
            collapsed ? "w-[72px]" : "w-64"
          )}
        >
          <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleSidebar} counts={counts} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && <MobileNav counts={counts} onClose={() => setMobileOpen(false)} />}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            pathname={pathname}
            onMenu={() => setMobileOpen(true)}
            onPalette={() => setPaletteOpen(true)}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
          {/* The root layout already provides <main>; this is the admin's scroll area. */}
          <div id="admin-main" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
            {children}
          </div>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />
    </ShellContext.Provider>
  );
}

function MobileNav({ counts, onClose }: { counts: NavCounts | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(true, onClose, panelRef);
  return (
    <div className="fixed inset-0 z-[190] lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 starting:opacity-0 dark:bg-slate-950/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        tabIndex={-1}
        className="relative h-full w-[min(18rem,85vw)] border-r border-slate-200 shadow-lg transition-transform duration-200 ease-out starting:-translate-x-full focus:outline-none motion-reduce:transition-none dark:border-slate-800"
      >
        <AdminSidebar counts={counts} onNavigate={onClose} />
      </div>
    </div>
  );
}

function Topbar({
  pathname,
  onMenu,
  onPalette,
  onToggleTheme,
  onLogout,
}: {
  pathname: string;
  onMenu: () => void;
  onPalette: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isMac = useIsMac();
  const crumbs = getBreadcrumbs(pathname);
  const current = crumbs[crumbs.length - 1];
  const initial = (user?.name || user?.email || "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-6 dark:border-slate-800 dark:bg-slate-950/90">
      <button type="button" onClick={onMenu} className={cn(iconButton, "lg:hidden")} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}>
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className={cn("truncate rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white", focusRing)}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    className={cn("truncate", last ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}
                    aria-current={last ? "page" : undefined}
                  >
                    {c.label}
                  </span>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <span className="sr-only">Current page: {current.label}</span>
      </nav>

      {/* Search / command palette */}
      <button
        type="button"
        onClick={onPalette}
        className={cn(
          "hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white md:flex xl:w-72 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600",
          focusRing
        )}
        aria-label="Search pages and actions"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <span className="flex items-center gap-0.5">
          <span className={kbd}>{isMac ? "⌘" : "Ctrl"}</span>
          <span className={kbd}>K</span>
        </span>
      </button>
      <button type="button" onClick={onPalette} className={cn(iconButton, "md:hidden")} aria-label="Search pages and actions">
        <Search className="h-5 w-5" />
      </button>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:inline-flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
          focusRing
        )}
      >
        <ExternalLink className="h-4 w-4" />
        View site
      </a>

      <button
        type="button"
        onClick={onToggleTheme}
        className={iconButton}
        aria-label={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {mounted && resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>

      <DropdownMenu
        label="Account menu"
        className={cn("flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-slate-200 dark:hover:ring-slate-700", focusRing)}
        trigger={
          <>
            <span className="sr-only">Account menu for {user?.name || "admin"}</span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {initial}
            </span>
          </>
        }
        items={[
          { label: user?.name ? `Signed in as ${user.name}` : "Signed in", disabled: true, hint: user?.email },
          { label: "View live site", icon: ExternalLink, href: "/", external: true, separator: true },
          { label: "Settings", icon: Settings, href: "/admin/settings" },
          { label: "Log out", icon: LogOut, onSelect: onLogout, danger: true, separator: true },
        ]}
      />
    </header>
  );
}
