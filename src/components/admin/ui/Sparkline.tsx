"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

export type SparkPoint = { label: string; value: number };

/** Tiny single-series area chart for KPI cards. Loaded lazily (see SparklineLazy). */
export default function Sparkline({
  data,
  color = "#0ea371",
  format = (v: number) => v.toLocaleString(),
}: {
  data: SparkPoint[];
  color?: string;
  format?: (v: number) => string;
}) {
  const id = `spark-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, "dataMax"]} />
        <Tooltip
          cursor={{ stroke: "var(--chart-grid, #cbd5e1)", strokeWidth: 1 }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as SparkPoint;
            return (
              <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{p.label}: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{format(p.value)}</span>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface, #fff)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
