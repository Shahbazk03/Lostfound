"use client";

import { useCallback, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Eye,
  LifeBuoy,
  Mail,
  Pencil,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  getSupportTickets,
  getTicketStats,
  updateTicketStatus,
  updateTicketDetails,
  deleteTicket,
  deleteMultipleTickets,
} from "./actions";
import type { SupportTicket } from "@/db/schema";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { useAdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { Field, Input, Textarea } from "@/components/admin/ui/Form";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { Drawer } from "@/components/admin/ui/Overlay";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type StatusFilter = "all" | TicketStatus;

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

const STEPS: { status: TicketStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "resolved", label: "Resolved" },
  { status: "closed", label: "Closed" },
];

/** Next-step buttons for each status; the first one is the primary action. */
const TRANSITIONS: Record<TicketStatus, { to: TicketStatus; label: string; icon: typeof Circle }[]> = {
  open: [
    { to: "in_progress", label: "Start progress", icon: PlayCircle },
    { to: "resolved", label: "Mark resolved", icon: CheckCircle2 },
    { to: "closed", label: "Close", icon: XCircle },
  ],
  in_progress: [
    { to: "resolved", label: "Mark resolved", icon: CheckCircle2 },
    { to: "closed", label: "Close", icon: XCircle },
    { to: "open", label: "Back to open", icon: RotateCcw },
  ],
  resolved: [
    { to: "closed", label: "Close", icon: XCircle },
    { to: "open", label: "Reopen", icon: RotateCcw },
  ],
  closed: [{ to: "open", label: "Reopen", icon: RotateCcw }],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function avatarColor(name: string) {
  const colors = ["bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-orange-500", "bg-rose-500", "bg-amber-500", "bg-indigo-500"];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}

const ago = (d: Date | string) => formatDistanceToNow(new Date(d), { addSuffix: true });

export default function SupportTicketsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshCounts } = useAdminShell();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<string | number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    const [data, statsData] = await Promise.all([getSupportTickets(), getTicketStats()]);
    setTickets(data as SupportTicket[]);
    setStats(statsData);
  }, []);
  // reload() shows the loading state while it re-fetches (Refresh / Try again).
  const { loading, error: loadError, reload: fetchData } = useAdminLoader(loadData, "Failed to load contact submissions");

  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId]);
  const rows = useMemo(
    () => (filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus)),
    [tickets, filterStatus]
  );

  const refreshStats = () => {
    getTicketStats().then(setStats).catch(() => {});
    refreshCounts();
  };

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    setStatusBusy(true);
    try {
      await updateTicketStatus(id, status);
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date() } : t)));
      toast.success(`Ticket #${id} marked ${STEPS.find((s) => s.status === status)?.label.toLowerCase()}`);
      // Stats are derived server-side; refresh them quietly.
      refreshStats();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update status"));
    } finally {
      setStatusBusy(false);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedId(ticket.id);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!selectedTicket) return;
    setEditName(selectedTicket.name);
    setEditEmail(selectedTicket.email);
    setEditMessage(selectedTicket.message);
    setIsEditing(true);
  };

  const editErrors: Record<string, string> = {};
  if (isEditing) {
    if (!editName.trim()) editErrors.name = "Name is required";
    if (!EMAIL_PATTERN.test(editEmail.trim())) editErrors.email = "Enter a valid email address";
    if (!editMessage.trim()) editErrors.message = "Message can't be empty";
  }
  const editInvalid = Object.keys(editErrors).length > 0;

  const handleSave = async () => {
    if (!selectedTicket || editInvalid) return;
    setSaving(true);
    try {
      const data = { name: editName.trim(), email: editEmail.trim(), message: editMessage };
      await updateTicketDetails(selectedTicket.id, data);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...data } : t)));
      setIsEditing(false);
      toast.success("Ticket updated");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save ticket"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: `Delete ticket #${id}?`,
      message: "The submission will be permanently deleted. This cannot be undone.",
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(null);
      setChecked((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      toast.success("Ticket deleted");
      refreshStats();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete ticket"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async (ids: (string | number)[]) => {
    const numeric = ids.map(Number).filter((n) => Number.isInteger(n));
    if (numeric.length === 0) return;
    const ok = await confirm({
      title: `Delete ${numeric.length} selected ticket${numeric.length === 1 ? "" : "s"}?`,
      message: "This cannot be undone.",
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      await deleteMultipleTickets(numeric);
      const gone = new Set(numeric);
      setTickets((prev) => prev.filter((t) => !gone.has(t.id)));
      if (selectedId !== null && gone.has(selectedId)) setSelectedId(null);
      toast.success(`${numeric.length} ticket${numeric.length === 1 ? "" : "s"} deleted`);
      setChecked(new Set());
      refreshStats();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete tickets"));
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: Column<SupportTicket>[] = [
    {
      id: "name",
      header: "From",
      sortValue: (t) => t.name.toLowerCase(),
      cell: (t) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", avatarColor(t.name))}
            aria-hidden="true"
          >
            {t.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{t.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "message",
      header: "Message",
      cell: (t) => <p className="line-clamp-2 max-w-md text-slate-600 dark:text-slate-400">{t.message}</p>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (t) => STEPS.findIndex((s) => s.status === t.status),
      cell: (t) => <StatusBadge kind="ticket" status={t.status} />,
    },
    {
      id: "createdAt",
      header: "Received",
      sortValue: (t) => new Date(t.createdAt).getTime(),
      cell: (t) => (
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400" title={format(new Date(t.createdAt), "MMM d, yyyy 'at' h:mm a")}>
          {ago(t.createdAt)}
        </span>
      ),
    },
  ];

  const rowActions = (t: SupportTicket): MenuItem[] => {
    const transitions = TRANSITIONS[t.status as TicketStatus] ?? [];
    return [
      { label: "Open", icon: Eye, onSelect: () => openTicket(t) },
      { label: "Reply by email", icon: Mail, href: `mailto:${t.email}?subject=${encodeURIComponent(`Re: your message to LostFound (#${t.id})`)}`, external: true },
      ...transitions.map((tr, i) => ({
        label: tr.label,
        icon: tr.icon,
        separator: i === 0,
        onSelect: () => handleStatusChange(t.id, tr.to),
      })),
      { label: "Delete", icon: Trash2, danger: true, separator: true, onSelect: () => handleDelete(t.id), disabled: deletingId === t.id },
    ];
  };

  const s = stats;
  const currentStatus = (selectedTicket?.status ?? "open") as TicketStatus;
  const stepIndex = STEPS.findIndex((st) => st.status === currentStatus);
  const transitions = TRANSITIONS[currentStatus] ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Support tickets"
        description="Messages sent through the contact form. Reply by email, then move each ticket through the workflow."
        actions={
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin motion-reduce:animate-none")} />
            Refresh
          </Button>
        }
      />

      <DataTable
        caption="Support tickets"
        rows={rows}
        columns={columns}
        getRowId={(t) => t.id}
        loading={loading}
        error={loadError}
        onRetry={fetchData}
        search={{
          placeholder: "Search name, email or message…",
          match: (t, q) =>
            t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q),
        }}
        toolbar={
          <FilterTabs<StatusFilter>
            label="Filter by status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "All", count: s?.total },
              { value: "open", label: "Open", count: s?.open },
              { value: "in_progress", label: "In progress", count: s?.inProgress },
              { value: "resolved", label: "Resolved", count: s?.resolved },
              { value: "closed", label: "Closed", count: s?.closed },
            ]}
          />
        }
        resetKey={filterStatus}
        initialSort={{ id: "createdAt", dir: "desc" }}
        rowActions={rowActions}
        onRowClick={openTicket}
        rowLabel={(t) => `Open ticket from ${t.name}`}
        isRowActive={(t) => t.id === selectedId}
        selection={{
          selected: checked,
          onChange: setChecked,
          actions: (ids) => (
            <Button size="sm" variant="danger" loading={bulkDeleting} onClick={() => handleBulkDelete(ids)}>
              {!bulkDeleting && <Trash2 className="h-3.5 w-3.5" />}
              Delete selected
            </Button>
          ),
        }}
        empty={{
          icon: LifeBuoy,
          title: filterStatus === "all" ? "No tickets yet" : `No ${STEPS.find((st) => st.status === filterStatus)?.label.toLowerCase()} tickets`,
          description:
            filterStatus === "all"
              ? "Messages sent through the contact form will appear here."
              : filterStatus === "open"
                ? "Inbox zero. Nothing is waiting for a reply."
                : undefined,
          action:
            filterStatus !== "all" ? (
              <Button size="sm" onClick={() => setFilterStatus("all")}>
                Show all tickets
              </Button>
            ) : undefined,
        }}
      />

      <Drawer
        open={!!selectedTicket}
        onClose={() => {
          setSelectedId(null);
          setIsEditing(false);
        }}
        width="lg"
        title={selectedTicket ? `Ticket #${selectedTicket.id}` : "Ticket"}
        description={
          selectedTicket ? `Received ${format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")} · ${ago(selectedTicket.createdAt)}` : undefined
        }
        headerExtra={selectedTicket && <StatusBadge kind="ticket" status={selectedTicket.status} />}
        footer={
          selectedTicket &&
          (isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={editInvalid}>
                Save details
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="dangerSoft"
                className="mr-auto"
                loading={deletingId === selectedTicket.id}
                onClick={() => handleDelete(selectedTicket.id)}
              >
                {deletingId !== selectedTicket.id && <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
              <Button onClick={handleEdit}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <a
                href={`mailto:${selectedTicket.email}?subject=${encodeURIComponent(`Re: your message to LostFound (#${selectedTicket.id})`)}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:h-10 dark:focus-visible:ring-offset-slate-900"
              >
                <Mail className="h-4 w-4" /> Reply by email
              </a>
            </>
          ))
        }
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Sender */}
            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" required error={editErrors.name}>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={255} />
                </Field>
                <Field label="Email" required error={editErrors.email}>
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} maxLength={255} />
                </Field>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white",
                    avatarColor(selectedTicket.name)
                  )}
                  aria-hidden="true"
                >
                  {selectedTicket.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{selectedTicket.name}</p>
                  <a
                    href={`mailto:${selectedTicket.email}`}
                    className="inline-flex items-center gap-1 truncate text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <Mail className="h-3.5 w-3.5" /> {selectedTicket.email}
                  </a>
                </div>
              </div>
            )}

            {/* Workflow */}
            {!isEditing && (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                <ol className="flex items-center" aria-label="Ticket workflow">
                  {STEPS.map((st, i) => {
                    const done = i < stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={st.status} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                        <div className="flex flex-col items-center gap-1.5" aria-current={current ? "step" : undefined}>
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-2",
                              current
                                ? "bg-emerald-600 text-white ring-emerald-600"
                                : done
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
                                  : "bg-white text-slate-400 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                            )}
                          >
                            {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </span>
                          <span
                            className={cn(
                              "whitespace-nowrap text-[11px] font-medium",
                              current ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {st.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <span
                            className={cn(
                              "mx-1.5 mb-5 h-0.5 flex-1 rounded-full",
                              i < stepIndex ? "bg-emerald-300 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-slate-800"
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  {transitions.map((tr, i) => {
                    const Icon = tr.icon;
                    return (
                      <Button
                        key={tr.to}
                        size="sm"
                        variant={i === 0 ? "primary" : "secondary"}
                        disabled={statusBusy}
                        onClick={() => handleStatusChange(selectedTicket.id, tr.to)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tr.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              {isEditing ? (
                <Field label="Message" required error={editErrors.message}>
                  <Textarea rows={12} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} maxLength={10000} />
                </Field>
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Message</p>
                  <div className="whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                    {selectedTicket.message}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
