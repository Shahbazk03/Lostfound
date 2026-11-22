"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Eye, ExternalLink, MessageSquare, Trash2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { Drawer } from "@/components/admin/ui/Overlay";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";

interface AdminMessage {
  id: number;
  senderId?: number;
  senderName: string | null;
  receiverId?: number;
  receiverName: string | null;
  itemId?: number | null;
  itemTitle: string | null;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [viewing, setViewing] = useState<AdminMessage | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadMessages = useCallback(async () => {
    const data = await adminFetch<{ messages?: AdminMessage[] }>("/api/admin/messages", {}, "Failed to load messages");
    setMessages(data?.messages ?? []);
  }, []);
  const { loading, error: loadError, reload } = useAdminLoader(loadMessages, "Failed to load messages");

  const handleDeleteMessage = async (msg: AdminMessage) => {
    const ok = await confirm({
      title: "Delete this message?",
      message: `From ${msg.senderName || "Unknown"} to ${msg.receiverName || "Unknown"}. This cannot be undone.`,
    });
    if (!ok) return;
    setDeletingId(msg.id);
    try {
      await adminFetch(`/api/admin/messages/${msg.id}`, { method: "DELETE" }, "Failed to delete message");
      toast.success("Message deleted");
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      setViewing((v) => (v?.id === msg.id ? null : v));
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete message"));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: Column<AdminMessage>[] = [
    {
      id: "conversation",
      header: "Conversation",
      sortValue: (m) => (m.senderName || "").toLowerCase(),
      cell: (m) => (
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate font-semibold text-slate-900 dark:text-white">{m.senderName || "Unknown"}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="to" />
          <span className="truncate text-slate-600 dark:text-slate-300">{m.receiverName || "Unknown"}</span>
        </div>
      ),
    },
    {
      id: "item",
      header: "Item",
      sortValue: (m) => (m.itemTitle || "").toLowerCase(),
      cell: (m) => <span className="block max-w-[12rem] truncate text-slate-600 dark:text-slate-400">{m.itemTitle || "—"}</span>,
    },
    {
      id: "content",
      header: "Message",
      cell: (m) => <p className="line-clamp-2 max-w-md text-slate-600 dark:text-slate-400">{m.content}</p>,
    },
    {
      id: "createdAt",
      header: "Date",
      sortValue: (m) => new Date(m.createdAt).getTime(),
      cell: (m) => (
        <span className="whitespace-nowrap text-slate-500 dark:text-slate-400" title={formatDateTime(m.createdAt)}>
          {formatDate(m.createdAt)}
        </span>
      ),
    },
  ];

  const rowActions = (m: AdminMessage): MenuItem[] => [
    { label: "View message", icon: Eye, onSelect: () => setViewing(m) },
    ...(m.itemId ? [{ label: "View item", icon: ExternalLink, href: `/items/${m.itemId}`, external: true }] : []),
    { label: "Delete", icon: Trash2, danger: true, separator: true, onSelect: () => handleDeleteMessage(m), disabled: deletingId === m.id },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Messages"
        description="Conversations between users about listings (latest 100). Remove anything abusive or spam."
      />

      <DataTable
        caption="User messages"
        rows={messages}
        columns={columns}
        getRowId={(m) => m.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: "Search people, items or text…",
          match: (m, q) =>
            [m.senderName, m.receiverName, m.itemTitle, m.content].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
        }}
        initialSort={{ id: "createdAt", dir: "desc" }}
        rowActions={rowActions}
        onRowClick={setViewing}
        rowLabel={(m) => `Open message from ${m.senderName || "unknown"}`}
        isRowActive={(m) => viewing?.id === m.id}
        empty={{
          icon: MessageSquare,
          title: "No messages yet",
          description: "Messages appear here when users contact each other about a listing.",
        }}
      />

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Message"
        description={viewing ? formatDateTime(viewing.createdAt) : undefined}
        footer={
          viewing && (
            <>
              {viewing.itemId && (
                <a
                  href={`/items/${viewing.itemId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  View item <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <Button variant="danger" loading={deletingId === viewing.id} onClick={() => handleDeleteMessage(viewing)}>
                {deletingId !== viewing.id && <Trash2 className="h-4 w-4" />}
                Delete message
              </Button>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">From</dt>
                <dd className="mt-0.5 truncate font-semibold text-slate-900 dark:text-white">{viewing.senderName || "Unknown"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">To</dt>
                <dd className="mt-0.5 truncate font-semibold text-slate-900 dark:text-white">{viewing.receiverName || "Unknown"}</dd>
              </div>
              <div className="col-span-2 min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">About</dt>
                <dd className="mt-0.5 truncate text-slate-700 dark:text-slate-300">{viewing.itemTitle || "—"}</dd>
              </div>
            </dl>
            <div className="whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
              {viewing.content}
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
