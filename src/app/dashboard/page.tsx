"use client";
/* eslint-disable @next/next/no-img-element -- photos may be data: URLs or /api/media URLs */

import { useState, useEffect, useCallback, useRef, Suspense, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchSummary } from "@/lib/matching";
import { shortDate } from "@/components/items/match-ui";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/Modal";
import { SignInRequired } from "@/components/ui/SignInRequired";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { badgeTone, statusLabel, statusTone, ui } from "@/components/ui/styles";
import { groupConversations, isUnread, readSeen, type InboxMessage } from "@/app/messages/inbox";

interface Item {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  dateLostFound: string;
  photos: string[] | null;
  status: string;
  createdAt: string;
  userId: number;
}

type Tab = "active" | "resolved" | "all";
const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950" role="status" aria-label="Loading dashboard">
      <div className={cn(ui.container, "py-8 md:py-10")}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-10 h-10 w-64 rounded-xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [greetingText] = useState(greeting);
  const [actionNotice, setActionNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [premiumNotice, setPremiumNotice] = useState(
    () => searchParams.get("unlocked") === "premium"
  );
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ active: null, resolved: null, all: null });

  const fetchItems = useCallback(async () => {
    try {
      // mine=1 returns all of the caller's items (active, resolved, archived).
      const res = await fetch("/api/items?mine=1&limit=100");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load listings");
      setItems(data.items || []);
      setLoadError("");
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [user, fetchItems]);

  // Smart Matching: { [itemId]: { count, topScore } } for the user's active items.
  const [matchSummary, setMatchSummary] = useState<Record<number, MatchSummary> | null>(null);
  const [matchesFailed, setMatchesFailed] = useState(false);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetch("/api/user/matches", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.matches) setMatchSummary(data.matches);
        else setMatchesFailed(true);
      })
      .catch(() => {
        // Matches are a bonus here; the dashboard works without them.
        if (!controller.signal.aborted) setMatchesFailed(true);
      });
    return () => controller.abort();
  }, [userId]);

  // Unread threads, worked out the same way as the inbox (see messages/inbox.ts).
  const [unreadCount, setUnreadCount] = useState<number | "–" | null>(null);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetch("/api/messages", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.messages) {
          setUnreadCount("–");
          return;
        }
        const seen = readSeen(userId);
        const threads = groupConversations(data.messages as InboxMessage[], userId);
        setUnreadCount(threads.filter((c) => isUnread(c, userId, seen)).length);
      })
      .catch(() => {
        // Optional stat; show a dash rather than a wrong number.
        if (!controller.signal.aborted) setUnreadCount("–");
      });
    return () => controller.abort();
  }, [userId]);

  // Returning from a premium checkout (?unlocked=premium&session_id=cs_...):
  // confirm the session so it is recorded without waiting for the webhook,
  // refresh the user, then retry a couple of times in case it is still
  // settling. The params are read once and removed from the URL.
  const [premiumSessionId] = useState(() =>
    searchParams.get("unlocked") === "premium" ? searchParams.get("session_id") ?? "" : null
  );
  useEffect(() => {
    if (premiumSessionId === null) return;
    router.replace("/dashboard", { scroll: false });
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    (async () => {
      if (premiumSessionId) {
        try {
          await fetch("/api/payments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: premiumSessionId }),
          });
        } catch {
          // the retries below still pick it up once the webhook lands
        }
      }
      if (cancelled) return;
      await refreshUser();
      if (cancelled) return;
      timers.push(...[3000, 8000].map((ms) => setTimeout(() => refreshUser(), ms)));
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [premiumSessionId, router, refreshUser]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.archived) {
        // Listings someone has paid for are archived rather than deleted.
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "archived" } : item))
        );
        setActionNotice({
          tone: "info",
          text: "This listing has payments linked to it, so it was archived instead of deleted. It's no longer shown publicly.",
        });
      } else if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setActionNotice({ tone: "error", text: data.error || "Could not delete the listing." });
      }
    } catch {
      setActionNotice({ tone: "error", text: "Network error. Check your connection and try again." });
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setActionNotice(null);
    setStatusBusyId(id);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setActionNotice({ tone: "error", text: data.error || "Could not update the listing." });
      }
    } catch {
      setActionNotice({ tone: "error", text: "Network error. Check your connection and try again." });
    } finally {
      setStatusBusyId(null);
    }
  };

  if (authLoading) return <DashboardSkeleton />;

  if (!user) {
    return (
      <SignInRequired
        icon={LayoutDashboard}
        title="Sign in to see your dashboard"
        description="Track your listings, possible matches and messages in one place."
        next="/dashboard"
      />
    );
  }

  // Only active listings are matched; resolving one hides its badge right away.
  const activeItems = items.filter((i) => i.status === "active");
  const resolvedItems = items.filter((i) => i.status === "resolved");
  const matchCount = (item: Item) =>
    item.status === "active" ? matchSummary?.[item.id]?.count ?? 0 : 0;
  const itemsWithMatches = activeItems
    .filter((i) => matchCount(i) > 0)
    .sort((a, b) => (matchSummary?.[b.id]?.topScore ?? 0) - (matchSummary?.[a.id]?.topScore ?? 0));
  const best = itemsWithMatches[0];
  const totalMatches = activeItems.reduce((sum, i) => sum + matchCount(i), 0);

  const counts: Record<Tab, number> = {
    active: activeItems.length,
    resolved: resolvedItems.length,
    all: items.length,
  };
  const visible = tab === "all" ? items : tab === "active" ? activeItems : resolvedItems;
  const firstName = user.name?.trim().split(/\s+/)[0];

  const kpis: { label: string; value: number | string | null; Icon: LucideIcon; tile: string; href?: string }[] = [
    {
      label: "Active listings",
      value: loading ? null : activeItems.length,
      Icon: Package,
      tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Resolved",
      value: loading ? null : resolvedItems.length,
      Icon: CheckCircle2,
      tile: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    },
    {
      label: "Possible matches",
      value: loading || (!matchSummary && !matchesFailed) ? null : matchSummary ? totalMatches : 0,
      Icon: Sparkles,
      tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      href: best ? `/items/${best.id}#matches` : undefined,
    },
    {
      label: "Unread messages",
      value: unreadCount,
      Icon: MessageSquare,
      tile: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      href: "/messages",
    },
  ];

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className={cn(ui.container, "py-8 md:py-10")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className={ui.pageTitle}>
              {greetingText}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Here&apos;s what&apos;s happening with your listings.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/browse" className={cn(ui.btnSecondary, "flex-1 sm:flex-none")}>
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse
            </Link>
            <Link href="/report" className={cn(ui.btnPrimary, "flex-1 sm:flex-none")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Report an item
            </Link>
          </div>
        </div>

        {(premiumNotice || actionNotice) && (
          <div className="mt-6 space-y-3">
            {premiumNotice && (
              <Alert tone="success" onDismiss={() => setPremiumNotice(false)}>
                {user.hasSubscription
                  ? "Thanks for upgrading! Your Premium subscription is active."
                  : "Thanks for upgrading to Premium! Your subscription is being activated; this can take a few seconds."}
              </Alert>
            )}
            {actionNotice && (
              <Alert tone={actionNotice.tone} onDismiss={() => setActionNotice(null)}>
                {actionNotice.text}
              </Alert>
            )}
          </div>
        )}

        {/* KPIs */}
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map(({ label, value, Icon, tile, href }) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tile)}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {href && (
                    <ArrowRight
                      className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="mt-4 h-8 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white sm:h-9 sm:text-3xl">
                  {value === null ? <Skeleton className="h-8 w-10" /> : value}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
              </>
            );
            return (
              <li key={label} className="min-w-0">
                {href ? (
                  <Link
                    href={href}
                    className={cn(
                      ui.card,
                      "group block h-full p-4 transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:border-slate-700 sm:p-5"
                    )}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cn(ui.card, "h-full p-4 sm:p-5")}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Smart Matching highlight */}
        {best && matchSummary && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:flex-row sm:items-center sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {itemsWithMatches.length} {itemsWithMatches.length === 1 ? "listing has" : "listings have"} possible matches
              </p>
              <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">
                Best match {matchSummary[best.id].topScore}% for &ldquo;{best.title}&rdquo;. Smart Matching checks every new report.
              </p>
            </div>
            <Link href={`/items/${best.id}#matches`} className={cn(ui.btnPrimary, "shrink-0")}>
              Review matches
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* Listings */}
        <section className="mt-10" aria-labelledby="listings-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="listings-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Your listings
            </h2>
            {items.length > 0 && (
              <div
                role="tablist"
                aria-label="Filter listings"
                className="inline-flex self-start rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/70"
              >
                {TABS.map((t) => {
                  const selected = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      ref={(el) => {
                        tabRefs.current[t.id] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`tab-${t.id}`}
                      aria-selected={selected}
                      aria-controls="listings-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setTab(t.id)}
                      onKeyDown={onTabKeyDown}
                      className={cn(
                        "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        selected
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      )}
                    >
                      {t.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-xs tabular-nums",
                          selected ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "text-slate-500"
                        )}
                      >
                        {counts[t.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div id="listings-panel" role={items.length > 0 ? "tabpanel" : undefined} aria-labelledby={items.length > 0 ? `tab-${tab}` : undefined} className="mt-5">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading listings">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className={cn(ui.card, "overflow-hidden")}>
                    <Skeleton className="aspect-[16/10] rounded-none" />
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className={cn(ui.card, "px-6 py-14 text-center")} role="alert">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Couldn&apos;t load your listings</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    fetchItems();
                  }}
                  className={cn(ui.btnSecondary, "mt-5")}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className={cn(ui.card, "px-6 py-16 text-center")}>
                <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
                  <PackageSearch className="h-8 w-8" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">No listings yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Report something you lost or found. We&apos;ll compare it with every new report and let you know about
                  likely matches.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link href="/report" className={ui.btnPrimary}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Report an item
                  </Link>
                  <Link href="/browse" className={ui.btnSecondary}>
                    Browse listings
                  </Link>
                </div>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
                <p className="font-medium text-slate-900 dark:text-white">
                  {tab === "active" ? "No active listings" : "Nothing resolved yet"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {tab === "active"
                    ? "Everything you posted is resolved or archived. Nice work."
                    : "When you get something back, mark the listing as resolved."}
                </p>
                {tab === "active" && (
                  <Link href="/report" className={cn(ui.btnSecondary, "mt-5")}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Report an item
                  </Link>
                )}
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((item) => {
                  const matches = matchCount(item);
                  const photo = item.photos?.[0];
                  const busy = statusBusyId === item.id;
                  return (
                    <li key={item.id} className={cn(ui.card, "group flex flex-col overflow-hidden")}>
                      <Link
                        href={`/items/${item.id}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                            <ImageIcon className="h-10 w-10" />
                          </span>
                        )}
                        <span
                          className={cn(
                            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm",
                            item.type === "lost" ? "bg-rose-600/90" : "bg-emerald-600/90"
                          )}
                        >
                          {item.type}
                        </span>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn(ui.badge, statusTone(item.status))}>{statusLabel(item.status)}</span>
                          {matches > 0 && (
                            <Link
                              href={`/items/${item.id}#matches`}
                              className={cn(
                                ui.badge,
                                "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20 dark:hover:bg-amber-500/20"
                              )}
                            >
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              {matches} possible {matches === 1 ? "match" : "matches"}
                            </Link>
                          )}
                        </div>
                        <h3 className="mt-2.5 truncate font-semibold text-slate-900 first-letter:uppercase dark:text-white">
                          <Link
                            href={`/items/${item.id}`}
                            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate capitalize">{item.approximateLocation}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {shortDate(item.dateLostFound)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-2 dark:border-slate-800">
                        <Link href={`/items/${item.id}`} className={ui.btnGhost}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                        {item.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, "resolved")}
                            disabled={busy}
                            className={ui.btnGhost}
                            aria-label={`Mark ${item.title} as resolved`}
                          >
                            {busy ? <Spinner /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                            Resolve
                          </button>
                        )}
                        {item.status === "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, "active")}
                            disabled={busy}
                            className={ui.btnGhost}
                            aria-label={`Reopen ${item.title}`}
                          >
                            {busy ? <Spinner /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
                            Reopen
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          disabled={deletingId === item.id}
                          aria-label={`Delete ${item.title}`}
                          title="Delete"
                          className={cn(
                            ui.iconBtn,
                            "ml-auto hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          )}
                        >
                          {deletingId === item.id ? <Spinner /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this listing?"
        description={
          pendingDelete ? (
            <>
              &ldquo;{pendingDelete.title}&rdquo; will be removed. This can&apos;t be undone. If anyone has paid to
              unlock it, it will be archived instead so their purchase stays on record.
            </>
          ) : undefined
        }
        confirmLabel="Delete listing"
        loading={deletingId !== null}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
