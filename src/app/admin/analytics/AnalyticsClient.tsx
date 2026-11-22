"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ExternalLink, Eye, FileText, Info, Radio, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsData, AnalyticsRange } from "./actions";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { StatCard } from "@/components/admin/ui/StatCard";
import { card } from "@/components/admin/ui/styles";
import { EmptyState } from "@/components/admin/AdminStates";
import { shortDay } from "@/components/admin/charts/theme";

// recharts loads only here, after the page shell.
const SingleSeriesChart = dynamic(() => import("@/components/admin/charts/Charts").then((m) => m.SingleSeriesChart), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-xl" />,
});

const fmt = (n: number) => n.toLocaleString("en-US");

function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"sessions" | "duration">("sessions");

  const setRange = (r: AnalyticsRange) =>
    startTransition(() => router.push(`${pathname}?range=${r}`, { scroll: false }));

  const rangeLabel = `last ${data.range} days`;
  const shortShare = data.sessions > 0 ? Math.round((data.shortSessions / data.sessions) * 100) : 0;
  const points = data.daily.map((d) => ({ day: d.day, value: view === "sessions" ? d.sessions : d.avgDuration }));
  const maxPage = Math.max(1, ...data.topPages.map((p) => p.sessions));
  const maxBucket = Math.max(1, ...data.durationBuckets.map((b) => b.sessions));
  const maxHour = Math.max(1, ...data.hourly.map((h) => h.sessions));
  const busiest = data.hourly.reduce((best, h) => (h.sessions > best.sessions ? h : best), data.hourly[0]);

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Visitor sessions recorded on the public site. Admin pages aren't tracked."
        actions={
          <FilterTabs
            label="Date range"
            value={String(data.range) as "7" | "30" | "90"}
            onChange={(v) => setRange(Number(v) as AnalyticsRange)}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        }
      />

      <div className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
        {/* KPIs */}
        <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Online now"
            value={
              <span className="inline-flex items-center gap-2.5">
                {fmt(data.activeUsersCount)}
                {data.activeUsersCount > 0 && (
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                )}
              </span>
            }
            icon={Radio}
            tone="emerald"
            sub="Active in the last 2 minutes"
          />
          <StatCard
            label="Sessions"
            value={fmt(data.sessions)}
            icon={Eye}
            tone="sky"
            delta={{ value: pctChange(data.sessions, data.prevSessions), label: `vs previous ${data.range} days` }}
          />
          <StatCard
            label="Avg. session length"
            value={duration(data.avgDurationSeconds)}
            icon={Timer}
            tone="violet"
            delta={{ value: pctChange(data.avgDurationSeconds, data.prevAvgDurationSeconds), label: `vs previous ${data.range} days` }}
          />
          <StatCard
            label="Visitors today"
            value={fmt(data.totalVisitorsToday)}
            icon={Activity}
            tone="amber"
            sub={`Avg. ${duration(data.avgTodaySeconds)} per session`}
          />
        </section>

        {/* Visits over time */}
        <section className={cn(card, "mt-6 p-5 sm:p-6")} aria-labelledby="visits-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="visits-title" className="text-base font-semibold text-slate-900 dark:text-white">
                {view === "sessions" ? "Visits over time" : "Average session length"}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {view === "sessions" ? "Sessions started per day" : "Average time on site per day"}, {rangeLabel}
              </p>
            </div>
            <FilterTabs
              label="Metric"
              value={view}
              onChange={setView}
              options={[
                { value: "sessions", label: "Sessions" },
                { value: "duration", label: "Duration" },
              ]}
            />
          </div>
          <div className="mt-5">
            {data.sessions === 0 ? (
              <EmptyState
                icon={Activity}
                title="No visits in this period"
                description="Sessions appear here as soon as someone browses the public site."
                compact
              />
            ) : (
              <SingleSeriesChart
                data={points}
                height="h-80"
                label={view === "sessions" ? "Sessions" : "Avg. length"}
                format={view === "sessions" ? undefined : duration}
                axisFormat={view === "sessions" ? undefined : (v: number) => duration(v)}
              />
            )}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Top pages */}
          <section className={cn(card, "p-5 sm:p-6 xl:col-span-3")} aria-labelledby="pages-title">
            <h2 id="pages-title" className="text-base font-semibold text-slate-900 dark:text-white">
              Top pages
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Where sessions ended up, {rangeLabel}</p>
            {data.topPages.length === 0 ? (
              <EmptyState icon={FileText} title="No page data yet" compact />
            ) : (
              <table className="mt-4 w-full text-sm">
                <caption className="sr-only">Top pages by sessions</caption>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th scope="col" className="pb-2 font-semibold">Page</th>
                    <th scope="col" className="pb-2 text-right font-semibold">Sessions</th>
                    <th scope="col" className="hidden pb-2 text-right font-semibold sm:table-cell">Avg. length</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p) => (
                    <tr key={p.path} className="group">
                      <td className="py-1.5 pr-3">
                        <div className="relative overflow-hidden rounded-lg">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-emerald-50 dark:bg-emerald-500/10"
                            style={{ width: `${Math.max(2, (p.sessions / maxPage) * 100)}%` }}
                            aria-hidden="true"
                          />
                          <div className="relative flex items-center gap-2 px-2.5 py-1.5">
                            <span className="truncate font-mono text-[13px] text-slate-800 dark:text-slate-200">{p.path}</span>
                            {p.path.startsWith("/") && (
                              <a
                                href={p.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 rounded text-slate-400 opacity-0 transition hover:text-emerald-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 group-hover:opacity-100"
                                aria-label={`Open ${p.path} in a new tab`}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{fmt(p.sessions)}</td>
                      <td className="hidden py-1.5 text-right tabular-nums text-slate-500 sm:table-cell dark:text-slate-400">
                        {duration(p.avgDuration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <div className="space-y-6 xl:col-span-2">
            {/* Session length */}
            <section className={cn(card, "p-5 sm:p-6")} aria-labelledby="length-title">
              <h2 id="length-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Session length
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {data.sessions > 0 ? `${shortShare}% of sessions lasted under a minute` : `No sessions, ${rangeLabel}`}
              </p>
              <ul className="mt-4 space-y-2.5">
                {data.durationBuckets.map((b) => (
                  <li key={b.label} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{b.label}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-[#0ea371]"
                        style={{ width: `${b.sessions === 0 ? 0 : Math.max(3, (b.sessions / maxBucket) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">{fmt(b.sessions)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Live now */}
            <section className={cn(card, "p-5 sm:p-6")} aria-labelledby="live-title">
              <div className="flex items-center justify-between">
                <h2 id="live-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  Being viewed now
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">{fmt(data.activeUsersCount)} online</span>
              </div>
              {data.livePages.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Nobody is on the site right now.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {data.livePages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="truncate font-mono text-[13px] text-slate-700 dark:text-slate-300">{p.path}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">{fmt(p.sessions)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* Time of day */}
        <section className={cn(card, "mt-6 p-5 sm:p-6")} aria-labelledby="hours-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="hours-title" className="text-base font-semibold text-slate-900 dark:text-white">
                When visitors arrive
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Sessions by hour of day (UTC), {rangeLabel}</p>
            </div>
            {data.sessions > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Busiest: <span className="font-semibold text-slate-900 dark:text-white">{String(busiest.hour).padStart(2, "0")}:00</span>
              </p>
            )}
          </div>
          <div className="mt-5 flex h-40 items-end gap-[3px] sm:gap-1" role="img" aria-label="Sessions by hour of day">
            {data.hourly.map((h) => (
              <div key={h.hour} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-[4px] bg-[#0ea371] transition-opacity group-hover:opacity-80"
                  style={{ height: `${h.sessions === 0 ? 0 : Math.max(3, (h.sessions / maxHour) * 100)}%` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-slate-500 dark:text-slate-400">{String(h.hour).padStart(2, "0")}:00 · </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fmt(h.sessions)}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400" aria-hidden="true">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
          <table className="sr-only">
            <caption>Sessions by hour of day (UTC)</caption>
            <tbody>
              {data.hourly.map((h) => (
                <tr key={h.hour}>
                  <th scope="row">{String(h.hour).padStart(2, "0")}:00</th>
                  <td>{h.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-6 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A session is one browser tab on the public site; its page is the last one it visited. Device and browser details
          aren&apos;t collected by the tracker, so they aren&apos;t shown here.
          {data.daily.length > 1 &&
            ` Daily data covers ${shortDay(data.daily[0].day)} – ${shortDay(data.daily[data.daily.length - 1].day)}.`}
        </p>
      </div>
    </PageContainer>
  );
}

