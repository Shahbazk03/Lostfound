import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "emerald" | "rose" | "amber" | "red" | "sky" | "slate" | "violet";

const TONES: Record<BadgeTone, { badge: string; dot: string }> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20",
    dot: "bg-rose-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  red: {
    badge: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20",
    dot: "bg-red-500",
  },
  sky: {
    badge: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
    dot: "bg-sky-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
  },
  violet: {
    badge: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
    dot: "bg-violet-500",
  },
};

export function Badge({
  tone = "slate",
  dot = true,
  children,
  className,
  icon,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        t.badge,
        className
      )}
    >
      {icon ?? (dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden="true" />)}
      {children}
    </span>
  );
}

export type StatusKind = "item" | "itemType" | "withdrawal" | "ticket" | "payment" | "page" | "role";

const STATUS: Record<StatusKind, Record<string, { label: string; tone: BadgeTone }>> = {
  item: {
    active: { label: "Active", tone: "sky" },
    resolved: { label: "Resolved", tone: "emerald" },
    archived: { label: "Archived", tone: "slate" },
  },
  itemType: {
    lost: { label: "Lost", tone: "rose" },
    found: { label: "Found", tone: "emerald" },
  },
  withdrawal: {
    pending: { label: "Pending", tone: "amber" },
    completed: { label: "Completed", tone: "emerald" },
    rejected: { label: "Rejected", tone: "red" },
  },
  ticket: {
    open: { label: "Open", tone: "sky" },
    in_progress: { label: "In progress", tone: "amber" },
    resolved: { label: "Resolved", tone: "emerald" },
    closed: { label: "Closed", tone: "slate" },
  },
  payment: {
    completed: { label: "Completed", tone: "emerald" },
    pending: { label: "Pending", tone: "amber" },
    failed: { label: "Failed", tone: "red" },
  },
  page: {
    published: { label: "Published", tone: "emerald" },
    draft: { label: "Draft", tone: "slate" },
    scheduled: { label: "Scheduled", tone: "sky" },
    archived: { label: "Archived", tone: "slate" },
  },
  role: {
    admin: { label: "Admin", tone: "violet" },
    user: { label: "User", tone: "slate" },
  },
};

export function statusLabel(kind: StatusKind, status: string) {
  return STATUS[kind][status]?.label ?? status.replace(/_/g, " ");
}

/** Consistent badge for every status value the admin shows. */
export function StatusBadge({ kind, status, className }: { kind: StatusKind; status: string; className?: string }) {
  const cfg = STATUS[kind][status];
  return (
    <Badge tone={cfg?.tone ?? "slate"} className={cn(!cfg && "capitalize", className)}>
      {cfg?.label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
