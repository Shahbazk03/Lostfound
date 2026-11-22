"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock, Copy, CreditCard, ExternalLink, Wallet, XCircle } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { adminFetch } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useToast } from "@/components/admin/AdminFeedback";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatCard } from "@/components/admin/ui/StatCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

interface AdminPayment {
  id: number;
  amount: number;
  currency?: string | null;
  amountFormatted?: string;
  status: string;
  stripeSessionId: string | null;
  itemId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  itemTitle?: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "completed" | "pending" | "failed";

function safeCurrency(amount: number, currency?: string | null) {
  try {
    return formatCurrency(amount, (currency || "USD").toUpperCase());
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency ?? ""}`.trim();
  }
}

const amountText = (p: AdminPayment) => p.amountFormatted || safeCurrency(p.amount, p.currency);

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadPayments = useCallback(async () => {
    const data = await adminFetch<{ payments?: AdminPayment[] }>("/api/admin/payments", {}, "Failed to load payments");
    setPayments(data?.payments ?? []);
  }, []);
  const { loading, error: loadError, reload } = useAdminLoader(loadPayments, "Failed to load payments");

  const counts = useMemo(
    () => ({
      all: payments.length,
      completed: payments.filter((p) => p.status === "completed").length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
    }),
    [payments]
  );

  // Revenue per currency; amounts in different currencies are never added together.
  const revenue = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const p of payments) {
      if (p.status !== "completed") continue;
      const cur = (p.currency || "USD").toUpperCase();
      const e = map.get(cur) ?? { amount: 0, count: 0 };
      e.amount += p.amount;
      e.count += 1;
      map.set(cur, e);
    }
    return Array.from(map.entries())
      .map(([currency, v]) => ({ currency, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  const rows = useMemo(
    () => (statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter)),
    [payments, statusFilter]
  );

  const copySession = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Session ID copied");
    } catch {
      toast.error("Couldn't copy the session ID");
    }
  };

  const columns: Column<AdminPayment>[] = [
    {
      id: "id",
      header: "Payment",
      sortValue: (p) => p.id,
      cell: (p) => (
        <div className="min-w-0 max-w-xs">
          <p className="font-semibold text-slate-900 dark:text-white">Payment #{p.id}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.itemTitle || (p.itemId ? `Item #${p.itemId}` : "—")}</p>
        </div>
      ),
    },
    {
      id: "user",
      header: "User",
      sortValue: (p) => (p.userName || "").toLowerCase(),
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{p.userName || "Unknown"}</p>
          {p.userEmail && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.userEmail}</p>}
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortValue: (p) => p.amount,
      cell: (p) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{amountText(p)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (p) => p.status,
      cell: (p) => <StatusBadge kind="payment" status={p.status} />,
    },
    {
      id: "session",
      header: "Stripe session",
      hideOnMobile: true,
      cell: (p) =>
        p.stripeSessionId ? (
          <span className="block max-w-[11rem] truncate font-mono text-xs text-slate-500 dark:text-slate-400" title={p.stripeSessionId}>
            {p.stripeSessionId}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      id: "createdAt",
      header: "Date",
      sortValue: (p) => new Date(p.createdAt).getTime(),
      cell: (p) => (
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400" title={formatDateTime(p.createdAt)}>
          {formatDate(p.createdAt)}
        </span>
      ),
    },
  ];

  const rowActions = (p: AdminPayment): MenuItem[] => [
    ...(p.itemId ? [{ label: "View item", icon: ExternalLink, href: `/items/${p.itemId}`, external: true }] : []),
    {
      label: "Copy session ID",
      icon: Copy,
      onSelect: () => p.stripeSessionId && copySession(p.stripeSessionId),
      disabled: !p.stripeSessionId,
      hint: p.stripeSessionId ? undefined : "No Stripe session recorded.",
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Payments" description="Every chat-unlock and subscription payment processed through Stripe." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (completed)"
          icon={Wallet}
          tone="emerald"
          value={
            loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ) : revenue.length === 0 ? (
              safeCurrency(0, "USD")
            ) : (
              safeCurrency(revenue[0].amount, revenue[0].currency)
            )
          }
          sub={
            !loading && revenue.length > 1
              ? revenue
                  .slice(1)
                  .map((r) => safeCurrency(r.amount, r.currency))
                  .join(" · ")
              : !loading
                ? `${counts.completed} completed payment${counts.completed === 1 ? "" : "s"}`
                : undefined
          }
        />
        <StatCard label="Completed" icon={CreditCard} tone="sky" value={loading ? "—" : counts.completed.toLocaleString()} />
        <StatCard label="Pending" icon={Clock} tone="amber" value={loading ? "—" : counts.pending.toLocaleString()} sub="Awaiting Stripe confirmation" />
        <StatCard label="Failed" icon={XCircle} tone="rose" value={loading ? "—" : counts.failed.toLocaleString()} />
      </div>

      <DataTable
        caption="Payments"
        rows={rows}
        columns={columns}
        getRowId={(p) => p.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: "Search user, item or session ID…",
          match: (p, q) =>
            [p.userName, p.userEmail, p.itemTitle, p.stripeSessionId, `#${p.id}`]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
        }}
        toolbar={
          <FilterTabs<StatusFilter>
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "pending", label: "Pending", count: counts.pending },
              { value: "failed", label: "Failed", count: counts.failed },
            ]}
          />
        }
        resetKey={statusFilter}
        initialSort={{ id: "createdAt", dir: "desc" }}
        rowActions={rowActions}
        empty={{
          icon: CreditCard,
          title: statusFilter === "all" ? "No payments yet" : `No ${statusFilter} payments`,
          description: statusFilter === "all" ? "Payments appear here once users unlock chats or subscribe." : undefined,
        }}
      />
    </PageContainer>
  );
}
