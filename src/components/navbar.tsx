"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  PlusCircle,
  Route,
  LayoutDashboard,
  MessageSquare,
  UserRound,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./home/BrandMark";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefix that marks the link as the current page. */
  match?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/browse", label: "Browse", icon: Search, match: "/browse" },
  { href: "/report", label: "Report an item", icon: PlusCircle, match: "/report" },
  { href: "/#how-it-works", label: "How it works", icon: Route },
];

const ACCOUNT_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "/dashboard" },
  { href: "/messages", label: "Messages", icon: MessageSquare, match: "/messages" },
  { href: "/profile", label: "Profile", icon: UserRound, match: "/profile" },
];

const ADMIN_LINK: NavLink = { href: "/admin", label: "Admin", icon: Shield, match: "/admin" };

// Full-screen flows that bring their own chrome.
const HIDDEN_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

function isActive(link: NavLink, pathname: string) {
  return !!link.match && (pathname === link.match || pathname.startsWith(`${link.match}/`));
}

function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" decoding="async" />
      ) : (
        (name?.trim().charAt(0) || "U").toUpperCase()
      )}
    </span>
  );
}

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // Each menu remembers the path it was opened on, so it closes by itself
  // when the route changes (no effect needed).
  const [mobileOpenOn, setMobileOpenOn] = useState<string | null>(null);
  const [accountOpenOn, setAccountOpenOn] = useState<string | null>(null);
  const mobileOpen = mobileOpenOn === pathname;
  const accountOpen = accountOpenOn === pathname;

  // Thin top progress bar while a link click is navigating to another page.
  // It clears itself when the pathname changes (or after 10 s, as a fallback).
  const [navigatingFrom, setNavigatingFrom] = useState<string | null>(null);
  const navigating = navigatingFrom === pathname;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Capture phase: runs before next/link calls preventDefault().
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setNavigatingFrom(window.location.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  useEffect(() => {
    if (!navigating) return;
    const id = setTimeout(() => setNavigatingFrom(null), 10_000);
    return () => clearTimeout(id);
  }, [navigating]);

  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes whichever menu is open and returns focus to its button.
  useEffect(() => {
    if (!mobileOpen && !accountOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileOpen) mobileButtonRef.current?.focus();
      if (accountOpen) accountButtonRef.current?.focus();
      setMobileOpenOn(null);
      setAccountOpenOn(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, accountOpen]);

  // Clicking anywhere outside the account menu closes it.
  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpenOn(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [accountOpen]);

  // The mobile sheet locks page scroll, and closes if the window grows past
  // the mobile breakpoint (e.g. rotating a tablet).
  useEffect(() => {
    if (!mobileOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && setMobileOpenOn(null);
    wide.addEventListener("change", onWide);
    return () => {
      root.style.overflow = previous;
      wide.removeEventListener("change", onWide);
    };
  }, [mobileOpen]);

  if (HIDDEN_PATHS.includes(pathname) || pathname.startsWith("/admin")) {
    return null;
  }

  const accountLinks = user?.role === "admin" ? [...ACCOUNT_LINKS, ADMIN_LINK] : ACCOUNT_LINKS;
  const closeMenus = () => {
    setMobileOpenOn(null);
    setAccountOpenOn(null);
  };
  const handleLogout = () => {
    closeMenus();
    void logout();
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150 dark:border-slate-800/70 dark:bg-slate-950/75">
        {/* Route-change progress (appears only if navigation takes >150 ms) */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden transition-opacity duration-200",
            navigating ? "opacity-100 delay-150" : "opacity-0"
          )}
        >
          {navigating && <div className="h-full w-full origin-left animate-progress bg-emerald-500 motion-reduce:animate-pulse" />}
        </div>
        <a
          href="#main"
          className="sr-only rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60]"
        >
          Skip to content
        </a>

        <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LostFound home" className={cn("-m-1 rounded-xl p-1", FOCUS_RING)}>
            <BrandLogo />
          </Link>

          <ul className="ml-6 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      FOCUS_RING,
                      active
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-emerald-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            {/* Desktop: account */}
            <div className="hidden items-center gap-2 md:flex">
              {loading ? (
                <>
                  <div className="h-10 w-[168px] [@media(scripting:none)]:hidden" aria-hidden />
                  {/* Without JavaScript the auth check never runs; still offer the way in. */}
                  <noscript>
                    <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Log in
                    </Link>
                  </noscript>
                </>
              ) : user ? (
                <div ref={accountRef} className="relative">
                  <button
                    ref={accountButtonRef}
                    type="button"
                    onClick={() => setAccountOpenOn(accountOpen ? null : pathname)}
                    aria-expanded={accountOpen}
                    aria-controls="account-menu"
                    aria-label={`Account menu for ${user.name || "your account"}`}
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-1.5 pr-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                      FOCUS_RING
                    )}
                  >
                    <Avatar name={user.name} src={user.avatar} className="h-7 w-7" />
                    <span className="hidden max-w-[9rem] truncate lg:inline">{user.name?.split(" ")[0]}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 text-slate-400 transition-transform", accountOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>

                  <div
                    id="account-menu"
                    className={cn(
                      "absolute right-0 top-full mt-2 w-60 origin-top-right rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-900/5 transition-[opacity,transform,visibility] duration-150 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40",
                      accountOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
                    )}
                  >
                    <div className="flex items-center gap-3 px-2.5 py-2.5">
                      <Avatar name={user.name} src={user.avatar} className="h-9 w-9 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user.role === "admin" ? "Administrator" : user.hasSubscription ? "Premium member" : "Member"}
                        </p>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <ul>
                      {accountLinks.map((link) => {
                        const active = isActive(link, pathname);
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={closeMenus}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                active
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                              )}
                            >
                              <link.icon className="h-4 w-4 opacity-70" aria-hidden />
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4 opacity-70" aria-hidden />
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                      FOCUS_RING
                    )}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      "inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700",
                      FOCUS_RING
                    )}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: menu button */}
            <button
              ref={mobileButtonRef}
              type="button"
              onClick={() => setMobileOpenOn(mobileOpen ? null : pathname)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden",
                FOCUS_RING
              )}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </nav>

        {/* Mobile sheet: slides down under the bar. `invisible` when closed
            takes it out of the tab order and the accessibility tree. */}
        <div
          id="mobile-nav"
          className={cn(
            "absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition-[opacity,transform,visibility] duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 md:hidden",
            mobileOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          )}
        >
          <div className="mx-auto max-w-[1600px] px-4 pb-5 pt-2 sm:px-6">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link, pathname);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenus}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
                      )}
                    >
                      <link.icon className="h-5 w-5 opacity-70" aria-hidden />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              {loading ? (
                <div className="h-12" aria-hidden />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar name={user.name} src={user.avatar} className="h-9 w-9 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.role === "admin" ? "Administrator" : user.hasSubscription ? "Premium member" : "Member"}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {accountLinks.map((link) => {
                      const active = isActive(link, pathname);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={closeMenus}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                              active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
                            )}
                          >
                            <link.icon className="h-5 w-5 opacity-70" aria-hidden />
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-base font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-5 w-5 opacity-80" aria-hidden />
                        Log out
                      </button>
                    </li>
                  </ul>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenus}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenus}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dims the page behind the open mobile sheet; tapping it closes the sheet. */}
      <div
        aria-hidden
        onClick={closeMenus}
        className={cn(
          "fixed inset-0 top-16 z-40 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
    </>
  );
}
