"use client";
/* eslint-disable @next/next/no-img-element -- item photos and avatars can be data: URLs or /api/media URLs */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Inbox,
  MessagesSquare,
  Package,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import { cn, formatDayLabel, formatShortTimestamp, getInitials } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { SignInRequired } from "@/components/ui/SignInRequired";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";
import {
  groupConversations,
  isUnread,
  markSeen,
  readSeen,
  type Conversation,
  type InboxMessage,
} from "./inbox";

const MAX_LENGTH = 2000;
/** Messages from the same person within this window are drawn as one group. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** Re-check for new messages when the tab regains focus, at most this often. */
const REFRESH_ON_FOCUS_MS = 15 * 1000;

function Avatar({ name, src, className }: { name: string | null; src: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        className
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : getInitials(name)}
    </span>
  );
}

function ItemThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-900/5 dark:bg-slate-800 dark:text-slate-500 dark:ring-white/5",
        className
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}
    </span>
  );
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sendError, setSendError] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [seen, setSeen] = useState<Record<string, number>>({});
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastFetchAt = useRef(0);
  const lastScrolled = useRef<{ key: string | null; count: number }>({ key: null, count: 0 });
  const userId = user?.id;

  const fetchMessages = useCallback(async () => {
    lastFetchAt.current = Date.now();
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Data fetch + reading per-browser "seen" state; state is set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(readSeen(userId));
    fetchMessages();
  }, [userId, fetchMessages]);

  // No background polling: pick up new messages when the user comes back to
  // the tab (and only if the last fetch is a little stale).
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchAt.current < REFRESH_ON_FOCUS_MS) return;
      fetchMessages();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId, fetchMessages]);

  const conversations = useMemo<Conversation[]>(
    () => (userId ? groupConversations(messages, userId) : []),
    [messages, userId]
  );

  const query = searchQuery.trim().toLowerCase();
  const filteredConversations = query
    ? conversations.filter((c) =>
        `${c.itemTitle ?? ""} ${c.otherUserName ?? ""} ${c.latest.content}`.toLowerCase().includes(query)
      )
    : conversations;

  const selectedConversation = selectedKey
    ? conversations.find((c) => c.key === selectedKey) ?? null
    : null;

  const unreadCount = userId ? conversations.filter((c) => isUnread(c, userId, seen)).length : 0;

  // Opening a thread (or a new message arriving in it) marks it as seen.
  useEffect(() => {
    if (!userId || !selectedConversation) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(markSeen(userId, selectedConversation));
  }, [userId, selectedConversation]);

  // Jump to the newest message when a thread opens; glide when one arrives.
  useEffect(() => {
    const el = threadRef.current;
    if (!el || !selectedConversation) return;
    const { key, messages: list } = selectedConversation;
    const sameThread = lastScrolled.current.key === key;
    if (sameThread && lastScrolled.current.count === list.length) return;
    el.scrollTo({ top: el.scrollHeight, behavior: sameThread ? "smooth" : "auto" });
    lastScrolled.current = { key, count: list.length };
  }, [selectedConversation]);

  const openConversation = (key: string) => {
    setSelectedKey(key);
    setSendError("");
    setReplyContent("");
    if (composerRef.current) composerRef.current.style.height = "";
  };

  const resizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedConversation.otherUserId,
          itemId: selectedConversation.itemId,
          content: replyContent.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setReplyContent("");
        if (composerRef.current) composerRef.current.style.height = "";
        if (data.message?.id) {
          // Show it straight away; the thread fills in item/user details.
          const created = data.message as InboxMessage;
          setMessages((prev) => [
            ...prev,
            { ...created, createdAt: String(created.createdAt), otherUserId: selectedConversation.otherUserId },
          ]);
        } else {
          fetchMessages();
        }
        composerRef.current?.focus();
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || "Message could not be sent.");
      }
    } catch {
      setSendError("Message could not be sent. Check your connection.");
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950" role="status" aria-label="Loading messages">
        <div className="mx-auto flex h-full max-w-[1600px] md:px-6 md:py-6 lg:px-8">
          <Skeleton className="h-full w-full md:rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInRequired
        icon={MessagesSquare}
        title="Sign in to see your messages"
        description="Conversations about your listings, and items you've reached out about, live here."
        next="/messages"
      />
    );
  }

  const listPane = (
    <aside
      aria-label="Conversations"
      className={cn(
        "min-h-0 w-full flex-col border-slate-200/80 dark:border-slate-800 md:flex md:w-[340px] md:border-r lg:w-[380px]",
        selectedConversation ? "hidden" : "flex"
      )}
    >
      <div className="shrink-0 px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Messages</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{unreadCount} unread</span>
          )}
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search people, items or messages"
            aria-label="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(ui.input, "h-10 bg-slate-50 pl-10 pr-9 shadow-none dark:bg-slate-800/60 [&::-webkit-search-cancel-button]:hidden")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        {loading ? (
          <ul aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </li>
            ))}
          </ul>
        ) : loadError && conversations.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Couldn&apos;t load your messages</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchMessages();
              }}
              className={cn(ui.btnSecondary, "mt-4")}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
              <Inbox className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 font-semibold text-slate-900 dark:text-white">No messages yet</p>
            <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              When you contact someone about a listing, or they contact you, the conversation shows up here.
            </p>
            <Link href="/browse" className={cn(ui.btnPrimary, "mt-6")}>
              Browse listings
            </Link>
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No conversations match &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filteredConversations.map((conversation) => {
              const lastMsg = conversation.latest;
              const isSelected = selectedKey === conversation.key;
              const isMeLast = lastMsg.senderId === user.id;
              const unread = isUnread(conversation, user.id, seen);
              return (
                <li key={conversation.key}>
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.key)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <span className="relative">
                      <ItemThumb src={conversation.itemPhoto} className="h-12 w-12" />
                      <Avatar
                        name={conversation.otherUserName}
                        src={conversation.otherUserAvatar}
                        className="absolute -bottom-1 -right-1 h-6 w-6 text-[10px] ring-2 ring-white dark:ring-slate-900"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            unread ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-800 dark:text-slate-200"
                          )}
                        >
                          {conversation.otherUserName || "Unknown user"}
                        </span>
                        <time
                          dateTime={lastMsg.createdAt}
                          className={cn(
                            "shrink-0 text-xs tabular-nums",
                            unread ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {formatShortTimestamp(lastMsg.createdAt)}
                        </time>
                      </span>
                      <span className="block truncate text-xs text-slate-500 first-letter:uppercase dark:text-slate-400">
                        {conversation.itemTitle || "Listing"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            unread ? "font-medium text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                          )}
                        >
                          {isMeLast && <span className="text-slate-400 dark:text-slate-500">You: </span>}
                          {lastMsg.content}
                        </span>
                        {unread && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );

  let threadBody: React.ReactNode = null;
  if (selectedConversation) {
    const list = selectedConversation.messages;
    threadBody = list.map((msg, i) => {
      const prev = list[i - 1];
      const next = list[i + 1];
      const isMe = msg.senderId === user.id;
      const day = new Date(msg.createdAt).toDateString();
      const newDay = !prev || new Date(prev.createdAt).toDateString() !== day;
      const t = new Date(msg.createdAt).getTime();
      const joinsPrev =
        !newDay && !!prev && prev.senderId === msg.senderId && t - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
      const joinsNext =
        !!next &&
        next.senderId === msg.senderId &&
        new Date(next.createdAt).toDateString() === day &&
        new Date(next.createdAt).getTime() - t < GROUP_GAP_MS;
      return (
        <Fragment key={msg.id}>
          {newDay && (
            <div className="sticky top-0 z-10 flex justify-center py-3" role="separator" aria-label={formatDayLabel(msg.createdAt)}>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/80 backdrop-blur dark:bg-slate-900/90 dark:text-slate-400 dark:ring-slate-800">
                {formatDayLabel(msg.createdAt)}
              </span>
            </div>
          )}
          <div className={cn("flex", isMe ? "justify-end" : "justify-start", joinsPrev ? "mt-1" : "mt-3")}>
            <div className={cn("flex max-w-[85%] flex-col sm:max-w-[70%]", isMe ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-6",
                  isMe
                    ? "rounded-2xl bg-emerald-600 text-white"
                    : "rounded-2xl bg-white text-slate-900 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/60",
                  isMe && joinsNext && "rounded-br-md",
                  isMe && joinsPrev && "rounded-tr-md",
                  !isMe && joinsNext && "rounded-bl-md",
                  !isMe && joinsPrev && "rounded-tl-md"
                )}
              >
                {msg.content}
              </div>
              {!joinsNext && (
                <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  {isMe && i === list.length - 1 && (
                    <>
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Sent
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </Fragment>
      );
    });
  }

  const threadPane = (
    <section
      aria-label={selectedConversation ? `Conversation with ${selectedConversation.otherUserName || "unknown user"}` : "Conversation"}
      className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", selectedConversation ? "flex" : "hidden")}
    >
      {selectedConversation ? (
        <>
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 px-3 py-3 dark:border-slate-800 sm:px-5">
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              aria-label="Back to conversations"
              className={cn(ui.iconBtn, "-ml-1 h-11 w-11 md:hidden")}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <Avatar
              name={selectedConversation.otherUserName}
              src={selectedConversation.otherUserAvatar}
              className="h-10 w-10 text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight text-slate-900 dark:text-white">
                {selectedConversation.otherUserName || "Unknown user"}
              </p>
              <p className="truncate text-xs text-slate-500 first-letter:uppercase dark:text-slate-400">
                {selectedConversation.itemTitle || "Listing"}
              </p>
            </div>
            <Link
              href={`/items/${selectedConversation.itemId}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ItemThumb src={selectedConversation.itemPhoto} className="h-7 w-7 rounded-lg" />
              <span className="hidden sm:inline">View listing</span>
              <ArrowUpRight className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="sr-only sm:hidden">View listing</span>
            </Link>
          </header>

          <div
            ref={threadRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 px-3 pb-4 dark:bg-slate-950/40 sm:px-6"
          >
            {threadBody}
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
            {sendError && (
              <Alert tone="error" className="mb-3" onDismiss={() => setSendError("")}>
                {sendError}
              </Alert>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="reply" className="sr-only">
                Message {selectedConversation.otherUserName || ""}
              </label>
              <textarea
                id="reply"
                ref={composerRef}
                value={replyContent}
                onChange={(e) => {
                  setReplyContent(e.target.value);
                  resizeComposer();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Write a message…"
                rows={1}
                maxLength={MAX_LENGTH}
                className="max-h-40 min-h-11 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] leading-6 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-900"
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || sending}
                aria-label="Send message"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-offset-slate-900"
              >
                {sending ? <Spinner /> : <Send className="h-[18px] w-[18px]" aria-hidden="true" />}
              </button>
            </form>
            <p className="mt-1.5 hidden text-[11px] text-slate-400 dark:text-slate-500 sm:block">
              Enter to send · Shift + Enter for a new line · Your email and phone stay private
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-slate-50/70 px-6 text-center dark:bg-slate-950/40">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-800">
            <MessagesSquare className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">
            {conversations.length > 0 ? "Select a conversation" : "Your conversations will appear here"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Messages stay inside LostFound, so nobody sees your email or phone number.
          </p>
        </div>
      )}
    </section>
  );

  return (
    <div className="h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex h-full max-w-[1600px] md:px-6 md:py-6 lg:px-8">
        <div className="flex min-h-0 w-full overflow-hidden bg-white dark:bg-slate-900 md:rounded-2xl md:border md:border-slate-200/80 md:shadow-sm md:dark:border-slate-800">
          {listPane}
          {threadPane}
        </div>
      </div>
    </div>
  );
}
