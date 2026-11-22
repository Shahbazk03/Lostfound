"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { chartVars, compactNumber as compact, FOUND_COLOR, LOST_COLOR, longDay, shortDay, Swatch } from "./theme";

/** recharts-based charts for the dashboard and analytics. Import only via next/dynamic. */

const axisTick = { fill: "var(--chart-axis)", fontSize: 11 };

type TooltipRow = { label: string; value: string; color: string; dashed?: boolean };

function TooltipCard({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 font-semibold text-slate-900 dark:text-white">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Swatch color={r.color} dashed={r.dashed} />
            {r.label}
          </span>
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{r.value}</span>
        </div>
      ))}
      {footer && <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{footer}</p>}
    </div>
  );
}

export type ListingsPoint = { day: string; lost: number; found: number };

export function ListingsChart({ data }: { data: ListingsPoint[] }) {
  return (
    <div className={`h-72 w-full ${chartVars}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={44} tickFormatter={compact} />
          <Tooltip
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1, strokeOpacity: 0.4 }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as ListingsPoint;
              return (
                <TooltipCard
                  title={longDay(p.day)}
                  rows={[
                    { label: "Lost", value: p.lost.toLocaleString(), color: LOST_COLOR, dashed: true },
                    { label: "Found", value: p.found.toLocaleString(), color: FOUND_COLOR },
                  ]}
                  footer={`${(p.lost + p.found).toLocaleString()} reports`}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="found"
            name="Found"
            stroke={FOUND_COLOR}
            strokeWidth={2}
            fill={FOUND_COLOR}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lost"
            name="Lost"
            stroke={LOST_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            fill={LOST_COLOR}
            fillOpacity={0.08}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type SinglePoint = { day: string; value: number };

/** One series over time (visits, revenue). */
export function SingleSeriesChart({
  data,
  label,
  format = (v: number) => v.toLocaleString(),
  axisFormat = compact,
  height = "h-72",
}: {
  data: SinglePoint[];
  label: string;
  format?: (v: number) => string;
  axisFormat?: (v: number) => string;
  height?: string;
}) {
  return (
    <div className={`${height} w-full ${chartVars}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={52} tickFormatter={axisFormat} />
          <Tooltip
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1, strokeOpacity: 0.4 }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as SinglePoint;
              return <TooltipCard title={longDay(p.day)} rows={[{ label, value: format(p.value), color: FOUND_COLOR }]} />;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={FOUND_COLOR}
            strokeWidth={2}
            fill={FOUND_COLOR}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
