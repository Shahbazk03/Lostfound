"use client";

import { useEffect, useState, useTransition, type ComponentType } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleCheck,
  CreditCard,
  ExternalLink,
  LifeBuoy,
  Package,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { ActivityEntry, AttentionEntry, DashboardOverview } from "./actions";
import { Button, buttonClass } from "@/components/admin/ui/Button";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { StatCard, type StatDelta } from "@/components/admin/ui/StatCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { card } from "@/components/admin/ui/styles";
import { FOUND_COLOR, LOST_COLOR, Swatch } from "@/components/admin/charts/theme";

// recharts only loads on this page, after the shell.
const chartFallback = () => <Skeleton className="h-72 w-full rounded-xl" />;
const ListingsChart = dynamic(() => import("@/components/admin/charts/Charts").then((m) => m.ListingsChart), {
  ssr: false,
  loading: chartFallback,
});
const SingleSeriesChart = dynamic(() => import("@/components/admin/charts/Charts").then((m) => m.SingleSeriesChart), {
  ssr: false,
  loading: chartFallback,
});

// Fixed locale so the server render and the browser agree (no hydration mismatch).
function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function timeAgo(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function DashboardView({ data }: { data: DashboardOverview }) {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, startRefresh] = useTransition();
  const { counts, series, generatedAt } = data;

  // Quietly re-fetch every 60 s while the tab is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") startRefresh(() => router.refresh());
    }, 60_000);
    return () => window.clearInterval(id);
  }, [router]);

  const totalListings = counts.lost + counts.found;
  const resolutionRate = totalListings > 0 ? Math.round((counts.resolved / totalListings) * 100) : 0;
  const primaryRevenue = data.revenueByCurrency[0];
  const otherRevenue = data.revenueByCurrency.slice(1);

  const listingsTrend = series.map((d) => ({ label: d.day, value: d.lost + d.found }));
  const signupTrend = series.map((d) => ({ label: d.day, value: d.signups }));
  const visitTrend = series.map((d) => ({ label: d.day, value: d.visits }));
  const revenueTrend = primaryRevenue
    ? series.map((d) => ({
        label: d.day,
        value:
          data.revenueSeries.find((r) => r.day === d.day && r.currency === primaryRevenue.currency)?.amount ?? 0,
      }))
    : [];

  const usersDelta: StatDelta = { value: pctChange(counts.usersWeek, counts.usersPrevWeek), label: "vs last week" };
  const listingsDelta: StatDelta = { value: pctChange(counts.items30d, counts.itemsPrev30d), label: "vs prior 30 days" };
  const visitsDelta: StatDelta = { value: pctChange(counts.visitsWeek, counts.visitsPrevWeek), label: "vs last week" };

  const updated = new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`${user?.name ? `Welcome back, ${user.name.split(" ")[0]}. ` : ""}Here's what's happening across LostFound right now.`}
        meta={
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Updated {updated} · refreshes every minute
          </span>
        }
        actions={
          <>
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
              <ExternalLink className="h-4 w-4" />
              View site
            </a>
            <Button variant="primary" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin motion-reduce:animate-none")} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total listings"
          value={totalListings.toLocaleString("en-US")}
          icon={Package}
          tone="slate"
          sub={
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                {counts.lost.toLocaleString("en-US")} lost
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {counts.found.toLocaleString("en-US")} found
              </span>
            </span>
          }
          delta={listingsDelta}
          trend={listingsTrend}
          href="/admin/items"
        />
        <StatCard
          label="Active listings"
          value={counts.active.toLocaleString("en-US")}
          icon={PackageSearch}
          tone="sky"
          sub={`${counts.items24h.toLocaleString("en-US")} new in the last 24h`}
          href="/admin/items"
        />
        <StatCard
          label="Resolved"
          value={counts.resolved.toLocaleString("en-US")}
          icon={PackageCheck}
          tone="emerald"
          sub={`${resolutionRate}% of all listings reunited`}
          href="/admin/items"
        />
        <StatCard
          label="Users"
          value={counts.usersTotal.toLocaleString("en-US")}
          icon={Users}
          tone="violet"
          sub={`+${counts.usersWeek.toLocaleString("en-US")} this week`}
          delta={usersDelta}
          trend={signupTrend}
          href="/admin/users"
        />
        <StatCard
          label="Revenue"
          value={primaryRevenue ? money(primaryRevenue.amount, primaryRevenue.currency) : "—"}
          icon={CreditCard}
          tone="emerald"
          sub={
            primaryRevenue
              ? otherRevenue.length > 0
                ? `+ ${otherRevenue.map((r) => money(r.amount, r.currency)).join(" · ")}`
                : `${primaryRevenue.count.toLocaleString("en-US")} completed payments`
              : "No completed payments yet"
          }
          trend={revenueTrend.length ? revenueTrend : undefined}
          trendFormat={primaryRevenue ? (v) => money(v, primaryRevenue.currency) : undefined}
          href="/admin/payments"
        />
        <StatCard
          label="Pending withdrawals"
          value={counts.withdrawalsPending.toLocaleString("en-US")}
          icon={Banknote}
          tone="amber"
          sub={
            data.pendingWithdrawalsByCurrency.length
              ? data.pendingWithdrawalsByCurrency.map((r) => money(r.amount, r.currency)).join(" · ") + " requested"
              : "Nothing waiting"
          }
          href="/admin/withdrawals"
        />
        <StatCard
          label="Open tickets"
          value={counts.ticketsOpen.toLocaleString("en-US")}
          icon={LifeBuoy}
          tone={counts.ticketsOpen > 0 ? "rose" : "slate"}
          sub={`${counts.ticketsInProgress.toLocaleString("en-US")} in progress`}
          href="/admin/support-tickets"
        />
        <StatCard
          label="Visitors (7 days)"
          value={counts.visitsWeek.toLocaleString("en-US")}
          icon={Eye}
          tone="sky"
          sub={`${counts.onlineNow.toLocaleString("en-US")} online now`}
          delta={visitsDelta}
          trend={visitTrend}
          href="/admin/analytics"
        />
      </section>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <ListingsCard series={series} />
        <TrafficCard data={data} />
      </div>

      {/* Attention + activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <AttentionPanel data={data} now={generatedAt} />
        <ActivityFeed entries={data.activity} now={generatedAt} />
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */

function CardHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

function ListingsCard({ series }: { series: DashboardOverview["series"] }) {
  const [showTable, setShowTable] = useState(false);
  const lost = series.reduce((s, d) => s + d.lost, 0);
  const found = series.reduce((s, d) => s + d.found, 0);
  const points = series.map((d) => ({ day: d.day, lost: d.lost, found: d.found }));

  return (
    <section className={cn(card, "p-5 sm:p-6 xl:col-span-3")} aria-labelledby="listings-chart-title">
      <CardHeader
        title="New listings"
        description="Lost vs found reports per day, last 30 days"
        actions={
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        }
      />
      <h3 id="listings-chart-title" className="sr-only">
        New listings, last 30 days
      </h3>
      {/* Legend (always present for two series) */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Swatch color={LOST_COLOR} dashed />
          Lost
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{lost.toLocaleString("en-US")}</span>
        </span>
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Swatch color={FOUND_COLOR} />
          Found
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{found.toLocaleString("en-US")}</span>
        </span>
      </div>
      <div className="mt-4">
        {lost + found === 0 && !showTable ? (
          <ChartEmpty icon={TrendingUp} text="No reports in the last 30 days yet." />
        ) : showTable ? (
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Lost and found reports per day</caption>
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-2">Day</th>
                  <th scope="col" className="px-4 py-2 text-right">Lost</th>
                  <th scope="col" className="px-4 py-2 text-right">Found</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...series].reverse().map((d) => (
                  <tr key={d.day}>
                    <td className="px-4 py-1.5 text-slate-600 dark:text-slate-300">{d.day}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-slate-900 dark:text-white">{d.lost}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums text-slate-900 dark:text-white">{d.found}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ListingsChart data={points} />
        )}
      </div>
    </section>
  );
}

function TrafficCard({ data }: { data: DashboardOverview }) {
  const currencies = data.revenueByCurrency.map((r) => r.currency);
  const [metric, setMetric] = useState<"visits" | "revenue">("visits");
  const [currency, setCurrency] = useState(currencies[0] ?? "USD");
  const activeCurrency = currencies.includes(currency) ? currency : currencies[0] ?? "USD";

  const points = data.series.map((d) => ({
    day: d.day,
    value:
      metric === "visits"
        ? d.visits
        : data.revenueSeries.find((r) => r.day === d.day && r.currency === activeCurrency)?.amount ?? 0,
  }));
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <section className={cn(card, "flex flex-col p-5 sm:p-6 xl:col-span-2")}>
      <CardHeader
        title={metric === "visits" ? "Visits" : "Revenue"}
        description={metric === "visits" ? "Visitor sessions per day, last 30 days" : `Completed payments in ${activeCurrency}, last 30 days`}
        actions={
          <FilterTabs
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "visits", label: "Visits" },
              { value: "revenue", label: "Revenue" },
            ]}
          />
        }
      />
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
          {metric === "visits" ? total.toLocaleString("en-US") : money(total, activeCurrency)}
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">in 30 days</span>
        </p>
        {metric === "revenue" && currencies.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            Currency
            <select
              value={activeCurrency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="mt-4 flex-1">
        {total === 0 ? (
          <ChartEmpty
            icon={metric === "visits" ? Eye : CreditCard}
            text={metric === "visits" ? "No visits recorded in the last 30 days." : "No completed payments in the last 30 days."}
          />
        ) : (
          <SingleSeriesChart
            data={points}
            label={metric === "visits" ? "Visits" : "Revenue"}
            format={metric === "visits" ? undefined : (v: number) => money(v, activeCurrency)}
            axisFormat={metric === "visits" ? undefined : (v: number) => money(v, activeCurrency).replace(/\.00$/, "")}
          />
        )}
      </div>
    </section>
  );
}

function ChartEmpty({ icon: Icon, text }: { icon: ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-700">
      <Icon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AttentionPanel({ data, now }: { data: DashboardOverview; now: number }) {
  const withdrawals = data.attention.filter((a) => a.kind === "withdrawal");
  const tickets = data.attention.filter((a) => a.kind === "ticket");
  const items = data.attention.filter((a) => a.kind === "item").slice(0, 5);
  const { counts } = data;
  const allClear = counts.withdrawalsPending === 0 && counts.ticketsOpen === 0 && counts.items24h === 0;

  return (
    <section className={cn(card, "p-5 sm:p-6 xl:col-span-2")} aria-labelledby="attention-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="attention-title" className="text-base font-semibold text-slate-900 dark:text-white">
          Needs attention
        </h2>
        {!allClear && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            {counts.withdrawalsPending + counts.ticketsOpen} to review
          </span>
        )}
      </div>

      {allClear ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CircleCheck className="h-6 w-6" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-white">All clear</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No pending payouts, open tickets or new reports.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <AttentionGroup
            title="Pending withdrawals"
            count={counts.withdrawalsPending}
            href="/admin/withdrawals"
            cta="Review payouts"
            icon={Banknote}
            tone="amber"
            entries={withdrawals}
            now={now}
            render={(e) => ({
              primary: e.title,
              secondary: e.sub,
              right: e.amount !== null ? money(e.amount, e.currency || "USD") : "",
            })}
          />
          <AttentionGroup
            title="Open tickets"
            count={counts.ticketsOpen}
            href="/admin/support-tickets"
            cta="Open inbox"
            icon={LifeBuoy}
            tone="sky"
            entries={tickets}
            now={now}
            render={(e) => ({ primary: e.title, secondary: e.sub, right: "" })}
          />
          <AttentionGroup
            title="Reported in the last 24h"
            count={counts.items24h}
            href="/admin/items"
            cta="Review listings"
            icon={Package}
            tone="slate"
            entries={items}
            now={now}
            itemHref={(e) => `/items/${e.id}`}
            render={(e) => ({ primary: e.title, secondary: e.sub, right: "" })}
          />
        </div>
      )}
    </section>
  );
}

const GROUP_TONES = {
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

function AttentionGroup({
  title,
  count,
  href,
  cta,
  icon: Icon,
  tone,
  entries,
  now,
  render,
  itemHref,
}: {
  title: string;
  count: number;
  href: string;
  cta: string;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof GROUP_TONES;
  entries: AttentionEntry[];
  now: number;
  render: (e: AttentionEntry) => { primary: string; secondary: string; right: string };
  itemHref?: (e: AttentionEntry) => string;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", GROUP_TONES[tone])}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {title} <span className="font-normal tabular-nums text-slate-500 dark:text-slate-400">({count})</span>
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {entries.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {entries.map((e) => {
            const r = render(e);
            const inner = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{r.primary}</p>
                  {r.secondary && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{r.secondary}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {r.right && <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{r.right}</p>}
                  <p className="text-xs text-slate-400">{timeAgo(e.at, now)}</p>
                </div>
              </>
            );
            return (
              <li key={`${e.kind}-${e.id}`}>
                {itemHref ? (
                  <a
                    href={itemHref(e)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50"
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type FeedFilter = "all" | ActivityEntry["kind"];

const FEED_META: Record<
  ActivityEntry["kind"],
  { icon: ComponentType<{ className?: string }>; tone: string; href: (e: ActivityEntry) => string; external?: boolean }
> = {
  item: {
    icon: Package,
    tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    href: (e) => `/items/${e.id}`,
    external: true,
  },
  user: { icon: UserPlus, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400", href: () => "/admin/users" },
  payment: {
    icon: CreditCard,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    href: () => "/admin/payments",
  },
  ticket: { icon: LifeBuoy, tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400", href: () => "/admin/support-tickets" },
};

function describe(e: ActivityEntry) {
  switch (e.kind) {
    case "item":
      return {
        text: (
          <>
            New {e.extra === "found" ? "found" : "lost"} report <span className="font-semibold text-slate-900 dark:text-white">{e.title}</span>
          </>
        ),
        meta: e.sub ? `by ${e.sub}` : "",
        badge: <StatusBadge kind="itemType" status={e.extra} />,
      };
    case "user":
      return {
        text: (
          <>
            <span className="font-semibold text-slate-900 dark:text-white">{e.title}</span> created an account
          </>
        ),
        meta: e.sub,
        badge: e.extra === "admin" ? <StatusBadge kind="role" status="admin" /> : null,
      };
    case "payment":
      return {
        text: (
          <>
            Payment of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {e.amount !== null ? money(e.amount, e.currency || "USD") : "—"}
            </span>{" "}
            for {e.title}
          </>
        ),
        meta: e.sub ? `by ${e.sub}` : "",
        badge: <StatusBadge kind="payment" status={e.extra} />,
      };
    case "ticket":
      return {
        text: (
          <>
            <span className="font-semibold text-slate-900 dark:text-white">{e.title}</span> sent a support message
          </>
        ),
        meta: e.sub,
        badge: <StatusBadge kind="ticket" status={e.extra} />,
      };
  }
}

function ActivityFeed({ entries, now }: { entries: ActivityEntry[]; now: number }) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const count = (k: ActivityEntry["kind"]) => entries.filter((e) => e.kind === k).length;

  return (
    <section className={cn(card, "p-5 sm:p-6 xl:col-span-3")} aria-labelledby="activity-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-title" className="text-base font-semibold text-slate-900 dark:text-white">
          Recent activity
        </h2>
        <FilterTabs
          label="Activity type"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "item", label: "Listings", count: count("item") },
            { value: "user", label: "Signups", count: count("user") },
            { value: "payment", label: "Payments", count: count("payment") },
            { value: "ticket", label: "Tickets", count: count("ticket") },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Nothing here yet.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-1">
          {shown.map((e) => {
            const meta = FEED_META[e.kind];
            const d = describe(e);
            const Icon = meta.icon;
            const rowClass =
              "group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50";
            const content = (
              <>
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-slate-600 dark:text-slate-300">{d.text}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                    {[d.meta, timeAgo(e.at, now)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {d.badge && <div className="hidden shrink-0 sm:block">{d.badge}</div>}
              </>
            );
            return (
              <li key={`${e.kind}-${e.id}`}>
                {meta.external ? (
                  <a href={meta.href(e)} target="_blank" rel="noopener noreferrer" className={rowClass}>
                    {content}
                  </a>
                ) : (
                  <Link href={meta.href(e)} className={rowClass}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
