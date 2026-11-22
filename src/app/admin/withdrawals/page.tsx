"use client";

import { useCallback, useMemo, useState } from "react";
import { Banknote, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { useAdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatCard } from "@/components/admin/ui/StatCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

interface AdminWithdrawal {
  id: number;
  amount: number;
  currency?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  // The list endpoint has returned the user both flattened and nested;
  // accept either shape.
  userEmail?: string | null;
  userName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
}

// withdrawal_status enum: pending | completed | rejected (there is no "approved").
type StatusFilter = "pending" | "completed" | "rejected" | "all";

const userName = (w: AdminWithdrawal) => w.userName ?? w.user?.name ?? "";
const userEmail = (w: AdminWithdrawal) => w.userEmail ?? w.user?.email ?? "";
const reqId = (w: AdminWithdrawal) => `REQ-${w.id.toString().padStart(4, "0")}`;

function safeCurrency(amount: number, currency?: string | null) {
  try {
    return formatCurrency(amount, (currency || "USD").toUpperCase());
  } catch {
    return formatCurrency(amount, "USD");
  }
}

export default function WithdrawalsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshCounts } = useAdminShell();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const loadWithdrawals = useCallback(async () => {
    const data = await adminFetch<AdminWithdrawal[] | { withdrawals?: AdminWithdrawal[] }>(
      "/api/admin/withdrawals",
      {},
      "Failed to load withdrawals"
    );
    setWithdrawals(Array.isArray(data) ? data : data?.withdrawals ?? []);
  }, []);
  // fetchWithdrawals() re-runs the load quietly (after a change); reload() shows the skeleton.
  const { loading, error: loadError, reload, refresh: fetchWithdrawals } = useAdminLoader(loadWithdrawals, "Failed to load withdrawals");

  const handleUpdateWithdrawalStatus = async (w: AdminWithdrawal, status: "completed" | "rejected") => {
    const approving = status === "completed";
    const ok = await confirm({
      title: approving ? "Approve this withdrawal?" : "Reject this withdrawal?",
      message: `${safeCurrency(w.amount, w.currency)} requested by ${userName(w) || userEmail(w) || "this user"}.${
        approving ? " Only confirm once the money has been sent to the user." : ""
      }`,
      confirmLabel: approving ? "Mark as paid" : "Reject",
      destructive: !approving,
    });
    if (!ok) return;
    setUpdatingId(w.id);
    try {
      await adminFetch(
        `/api/admin/withdrawals/${w.id}`,
        { method: "PATCH", json: { status } },
        "Failed to update withdrawal"
      );
      setWithdrawals((prev) =>
        prev.map((x) => (x.id === w.id ? { ...x, status, updatedAt: new Date().toISOString() } : x))
      );
      toast.success(approving ? "Withdrawal marked as paid" : "Withdrawal rejected");
      fetchWithdrawals();
      refreshCounts();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update withdrawal"));
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === "pending").length,
      completed: withdrawals.filter((w) => w.status === "completed").length,
      rejected: withdrawals.filter((w) => w.status === "rejected").length,
    }),
    [withdrawals]
  );

  // Totals per currency; never summed across currencies.
  const totals = useMemo(() => {
    const by = (status: string) => {
      const map = new Map<string, number>();
      for (const w of withdrawals) {
        if (w.status !== status) continue;
        const cur = (w.currency || "USD").toUpperCase();
        map.set(cur, (map.get(cur) ?? 0) + w.amount);
      }
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };
    return { pending: by("pending"), completed: by("completed") };
  }, [withdrawals]);

  const rows = useMemo(
    () => (statusFilter === "all" ? withdrawals : withdrawals.filter((w) => w.status === statusFilter)),
    [withdrawals, statusFilter]
  );

  const moneyList = (list: [string, number][]) =>
    list.length === 0 ? safeCurrency(0, "USD") : list.map(([cur, amt]) => safeCurrency(amt, cur)).join(" · ");

  const columns: Column<AdminWithdrawal>[] = [
    {
      id: "id",
      header: "Request",
      sortValue: (w) => w.id,
      cell: (w) => (
        <div>
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{reqId(w)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400" title={formatDateTime(w.createdAt)}>
            Requested {formatDate(w.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: "user",
      header: "User",
      sortValue: (w) => (userName(w) || userEmail(w)).toLowerCase(),
      cell: (w) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{userName(w) || "Unknown"}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userEmail(w)}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortValue: (w) => w.amount,
      cell: (w) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{safeCurrency(w.amount, w.currency)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (w) => w.status,
      cell: (w) => <StatusBadge kind="withdrawal" status={w.status} />,
    },
    {
      id: "createdAt",
      header: "Updated",
      sortValue: (w) => new Date(w.updatedAt || w.createdAt).getTime(),
      cell: (w) => (
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(w.updatedAt || w.createdAt)}</span>
      ),
    },
  ];

  const rowActions = (w: AdminWithdrawal): MenuItem[] =>
    w.status === "pending"
      ? [
          {
            label: "Mark as paid",
            icon: CheckCircle2,
            onSelect: () => handleUpdateWithdrawalStatus(w, "completed"),
            disabled: updatingId === w.id,
          },
          {
            label: "Reject",
            icon: XCircle,
            danger: true,
            onSelect: () => handleUpdateWithdrawalStatus(w, "rejected"),
            disabled: updatingId === w.id,
          },
        ]
      : [];

  const inlineActions = (w: AdminWithdrawal) =>
    w.status === "pending" ? (
      <div className="hidden items-center gap-1.5 lg:flex">
        <Button
          size="sm"
          variant="primary"
          loading={updatingId === w.id}
          onClick={() => handleUpdateWithdrawalStatus(w, "completed")}
        >
          {updatingId !== w.id && <CheckCircle2 className="h-3.5 w-3.5" />}
          Mark paid
        </Button>
        <Button
          size="sm"
          variant="dangerSoft"
          disabled={updatingId === w.id}
          onClick={() => handleUpdateWithdrawalStatus(w, "rejected")}
        >
          Reject
        </Button>
      </div>
    ) : (
      <span className="hidden pr-2 text-xs text-slate-400 lg:inline dark:text-slate-500">Processed</span>
    );

  return (
    <PageContainer>
      <PageHeader
        title="Withdrawals"
        description="Pay out users' earnings. Mark a request as paid once the transfer has been sent, or reject it."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting payout"
          icon={Clock}
          tone="amber"
          value={loading ? "—" : counts.pending.toLocaleString()}
          sub={loading ? undefined : moneyList(totals.pending)}
        />
        <StatCard
          label="Paid out"
          icon={Banknote}
          tone="emerald"
          value={loading ? "—" : counts.completed.toLocaleString()}
          sub={loading ? undefined : moneyList(totals.completed)}
        />
        <StatCard label="Rejected" icon={XCircle} tone="rose" value={loading ? "—" : counts.rejected.toLocaleString()} />
      </div>

      <DataTable
        caption="Withdrawal requests"
        rows={rows}
        columns={columns}
        getRowId={(w) => w.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: "Search by user or request ID…",
          match: (w, q) => [userName(w), userEmail(w), reqId(w)].some((v) => v.toLowerCase().includes(q)),
        }}
        toolbar={
          <FilterTabs<StatusFilter>
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "pending", label: "Pending", count: counts.pending },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "rejected", label: "Rejected", count: counts.rejected },
              { value: "all", label: "All", count: counts.all },
            ]}
          />
        }
        resetKey={statusFilter}
        initialSort={{ id: "createdAt", dir: statusFilter === "pending" ? "asc" : "desc" }}
        rowActions={rowActions}
        inlineActions={inlineActions}
        empty={{
          icon: Banknote,
          title:
            statusFilter === "pending"
              ? "No pending requests"
              : statusFilter === "all"
                ? "No withdrawal requests yet"
                : `No ${statusFilter} requests`,
          description: statusFilter === "pending" ? "You're all caught up. New payout requests will show here." : undefined,
          action:
            statusFilter !== "all" && counts.all > 0 ? (
              <Button size="sm" onClick={() => setStatusFilter("all")}>
                Show all requests
              </Button>
            ) : undefined,
        }}
      />
    </PageContainer>
  );
}
