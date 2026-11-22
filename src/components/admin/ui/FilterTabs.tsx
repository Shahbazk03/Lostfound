"use client";

import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export type FilterOption<V extends string> = { value: V; label: string; count?: number };

/** Segmented filter control (status tabs above a table). Scrolls horizontally on small screens. */
export function FilterTabs<V extends string>({
  options,
  value,
  onChange,
  label = "Filter",
  className,
}: {
  options: FilterOption<V>[];
  value: V;
  onChange: (value: V) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <div
        role="group"
        aria-label={label}
        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition sm:h-8",
                focusRing,
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
