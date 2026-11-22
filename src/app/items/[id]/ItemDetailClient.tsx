"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  Pencil,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { categoryBrowseHref, cn, formatCurrency, formatRelativeTime, getInitials } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { ShareMenu } from "@/components/items/ShareMenu";
import { PossibleMatches } from "@/components/items/PossibleMatches";
import { ItemGallery } from "@/components/items/ItemGallery";
import { ItemDetailSkeleton } from "@/components/items/ItemDetailSkeleton";
import { shortDate } from "@/components/items/match-ui";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog, Modal, ModalHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { badgeTone, statusLabel, statusTone, ui } from "@/components/ui/styles";

interface ItemDetail {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  preciseLocation: string | null;
  city: string | null;
  country: string | null;
  dateLostFound: string;
  timeframe: string | null;
  photos: string[] | null;
  status: string;
  createdAt: string;
  userId: number;
  userName: string | null;
  unlockAmount?: number;
  currency?: string;
}

interface ItemResponse {
  item: ItemDetail;
  hasUnlocked: boolean;
  hasUnlockedChat: boolean;
}

type UnlockKind = "location" | "chat" | "premium" | "cancelled";

interface Toast {
  tone: "success" | "info" | "error";
  message: string;
  /** Sticky toasts stay until replaced (used while we wait on the webhook). */
  sticky?: boolean;
}

const PENDING_TOAST: Record<Exclude<UnlockKind, "cancelled">, string> = {
  location: "Payment received. Unlocking the precise location…",
  chat: "Payment received. Unlocking messaging…",
  premium: "Payment received. Activating Premium…",
};

const DONE_TOAST: Record<Exclude<UnlockKind, "cancelled">, string> = {
  location: "Precise location unlocked.",
  chat: "Messaging unlocked. You can now contact the poster.",
  premium: "Premium is active. You can message any poster.",
};

function parseUnlockKind(value: string | null): UnlockKind | null {
  return value === "location" || value === "chat" || value === "premium" || value === "cancelled"
    ? value
    : null;
}

function initialToast(kind: UnlockKind | null): Toast | null {
  if (!kind) return null;
  if (kind === "cancelled") {
    return { tone: "info", message: "Checkout cancelled. You have not been charged." };
  }
  return { tone: "info", message: PENDING_TOAST[kind], sticky: true };
}

// After confirming the session we re-check a few times in case the payment
// is still settling (or the webhook is what eventually records it).
const POLL_DELAYS_MS = [1500, 2500, 4000, 6000, 9000];

const PAYMENTS_UNAVAILABLE =
  "Payments are temporarily unavailable. Please try again later.";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD"];

const SAFETY_TIPS = [
  "Meet in a busy public place",
  "Bring a friend if possible",
  "Verify the item before exchanging",
  "Trust your instincts",
];

type CheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "already" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string };

/**
 * Starts a Stripe Checkout via one of the payment endpoints. They respond with
 * { url, sessionUrl }, or { alreadyUnlocked | alreadySubscribed: true }, or
 * an { error } (503 while payments are not configured).
 */
async function startCheckout(endpoint: string, itemId: number): Promise<CheckoutResult> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 503) return { kind: "error", message: PAYMENTS_UNAVAILABLE };
    if (!res.ok) {
      return { kind: "error", message: data.error || "Could not start checkout. Please try again." };
    }
    if (data.alreadyUnlocked || data.alreadySubscribed) return { kind: "already" };
    const url = data.url || data.sessionUrl;
    if (typeof url === "string" && url) return { kind: "redirect", url };
    return { kind: "error", message: "Could not start checkout. Please try again." };
  } catch {
    return { kind: "error", message: "Network error. Check your connection and try again." };
  }
}

export default function ItemDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [hasUnlockedChat, setHasUnlockedChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [chatPaymentLoading, setChatPaymentLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");

  // Price Editing state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editCurrencyValue, setEditCurrencyValue] = useState("USD");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");

  // Owner controls
  const [statusSaving, setStatusSaving] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const itemId = params.id as string;
  const itemPath = `/items/${itemId}`;
  const loginHref = `/login?next=${encodeURIComponent(itemPath)}`;

  // Read once on mount: the params are removed from the URL straight away.
  const [unlockKind] = useState(() => parseUnlockKind(searchParams.get("unlocked")));
  const [checkoutSessionId] = useState(() => searchParams.get("session_id"));
  const [toast, setToast] = useState<Toast | null>(() => initialToast(unlockKind));

  const loadItem = useCallback(async (): Promise<ItemResponse | null> => {
    try {
      const res = await fetch(`/api/items/${itemId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return null;
      setItem(data.item);
      setHasUnlocked(!!data.hasUnlocked);
      setHasUnlockedChat(!!data.hasUnlockedChat);
      return data as ItemResponse;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    // Data fetch on mount; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItem();
  }, [loadItem]);

  // Handle ?unlocked=location|chat|premium|cancelled after a Stripe redirect.
  useEffect(() => {
    if (!unlockKind) return;
    router.replace(itemPath, { scroll: false });
    if (unlockKind === "cancelled") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const check = async () => {
      if (cancelled) return;
      let done = false;
      const data = await loadItem();
      if (unlockKind === "premium") {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          const me = await res.json();
          done = !!me.user?.hasSubscription;
        } catch {
          // retry below
        }
        if (done) await refreshUser();
      } else {
        done = unlockKind === "location" ? !!data?.hasUnlocked : !!data?.hasUnlockedChat;
      }
      if (cancelled) return;
      if (done) {
        setToast({ tone: "success", message: DONE_TOAST[unlockKind] });
      } else if (attempt < POLL_DELAYS_MS.length) {
        timer = setTimeout(check, POLL_DELAYS_MS[attempt++]);
      } else {
        setToast({
          tone: "info",
          message:
            "Your payment is still being confirmed. Refresh this page in a minute if the unlock doesn't appear.",
        });
      }
    };

    // Record the payment straight away from the Checkout session (does not
    // depend on the webhook), then check the result.
    const confirmThenCheck = async () => {
      if (checkoutSessionId) {
        try {
          await fetch("/api/payments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
          });
        } catch {
          // fall back to polling below
        }
      }
      await check();
    };
    confirmThenCheck();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [unlockKind, checkoutSessionId, itemPath, router, loadItem, refreshUser]);

  // The page renders after a client fetch, so the browser can't jump to
  // /items/{id}#matches on its own. Scroll once the section exists.
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (!item || scrolledToHash.current || window.location.hash !== "#matches") return;
    scrolledToHash.current = true;
    const frame = requestAnimationFrame(() =>
      document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    return () => cancelAnimationFrame(frame);
  }, [item]);

  // Auto-dismiss non-sticky toasts.
  useEffect(() => {
    if (!toast || toast.sticky) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUnlock = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setPaymentLoading(true);
    setUnlockError("");
    const result = await startCheckout("/api/payments/create", Number(itemId));
    if (result.kind === "redirect") {
      // Keep the button busy while the browser navigates to checkout.
      window.location.assign(result.url);
      return;
    }
    setPaymentLoading(false);
    if (result.kind === "unauthorized") {
      router.push(loginHref);
    } else if (result.kind === "already") {
      await loadItem();
      setToast({ tone: "success", message: "You have already unlocked this location." });
    } else {
      setUnlockError(result.message);
    }
  };

  /** Chat is already unlocked (or premium is active): go straight to messaging. */
  const openMessagingAfterUnlock = (message: string) => {
    setShowUnlockModal(false);
    setMessageError("");
    setShowMessageModal(true);
    setToast({ tone: "success", message });
  };

  const handleUnlockChat = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setChatPaymentLoading(true);
    setCheckoutError("");
    const result = await startCheckout("/api/payments/unlock-chat", Number(itemId));
    if (result.kind === "redirect") {
      window.location.assign(result.url);
      return;
    }
    setChatPaymentLoading(false);
    if (result.kind === "unauthorized") {
      router.push(loginHref);
    } else if (result.kind === "already") {
      await loadItem();
      openMessagingAfterUnlock("Messaging is already unlocked for this item.");
    } else {
      setCheckoutError(result.message);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setSubscriptionLoading(true);
    setCheckoutError("");
    const result = await startCheckout("/api/payments/subscribe", Number(itemId));
    if (result.kind === "redirect") {
      window.location.assign(result.url);
      return;
    }
    setSubscriptionLoading(false);
    if (result.kind === "unauthorized") {
      router.push(loginHref);
    } else if (result.kind === "already") {
      await refreshUser();
      openMessagingAfterUnlock("Your Premium subscription is already active.");
    } else {
      setCheckoutError(result.message);
    }
  };

  const startEditingPrice = () => {
    if (!item) return;
    setEditPriceValue(((item.unlockAmount ?? 100) / 100).toFixed(2));
    setEditCurrencyValue(item.currency || settings?.currency || "USD");
    setPriceError("");
    setIsEditingPrice(true);
  };

  const handleSavePrice = async () => {
    if (!item) return;
    // The API takes the amount in major units (e.g. 5.00) and converts to
    // cents itself, same as the create endpoint. Sending cents here made a
    // $5 price save as $500.
    const amount = parseFloat(editPriceValue || "0");
    if (!Number.isFinite(amount) || amount < 0.5 || amount > 10000) {
      setPriceError("Enter a price between 0.50 and 10,000.");
      return;
    }
    setSavingPrice(true);
    setPriceError("");
    try {
      const newAmountInCents = Math.round(amount * 100);
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlockAmount: amount, currency: editCurrencyValue }),
      });
      if (res.ok) {
        setItem({ ...item, unlockAmount: newAmountInCents, currency: editCurrencyValue });
        setIsEditingPrice(false);
        setToast({ tone: "success", message: "Unlock price updated." });
      } else {
        const data = await res.json().catch(() => ({}));
        setPriceError(data.error || "Could not save the price.");
      }
    } catch {
      setPriceError("Network error. Check your connection and try again.");
    } finally {
      setSavingPrice(false);
    }
  };

  const handleStatusChange = async (status: "active" | "resolved") => {
    setStatusSaving(true);
    setOwnerError("");
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItem((prev) => (prev ? { ...prev, status } : prev));
        setToast({
          tone: "success",
          message:
            status === "resolved"
              ? "Marked as resolved. It no longer appears in Browse."
              : "Listing reopened. It's visible in Browse again.",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setOwnerError(data.error || "Could not update the listing.");
      }
    } catch {
      setOwnerError("Network error. Check your connection and try again.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setOwnerError("");
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.archived) {
        // Listings someone has paid for are archived rather than deleted.
        setItem((prev) => (prev ? { ...prev, status: "archived" } : prev));
        setConfirmDelete(false);
        setToast({
          tone: "info",
          message:
            "This listing has payments linked to it, so it was archived instead of deleted. It's no longer shown publicly.",
        });
      } else if (res.ok) {
        router.push("/dashboard");
        return;
      } else {
        setConfirmDelete(false);
        setOwnerError(data.error || "Could not delete the listing.");
      }
    } catch {
      setConfirmDelete(false);
      setOwnerError("Network error. Check your connection and try again.");
    }
    setDeleting(false);
  };

  const handleSendMessage = async () => {
    if (!user || !item || !messageContent.trim()) return;
    setSendingMessage(true);
    setMessageError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: item.userId,
          itemId: item.id,
          content: messageContent.trim(),
        }),
      });
      if (res.ok) {
        setMessageContent("");
        setShowMessageModal(false);
        setToast({ tone: "success", message: "Message sent. Replies will appear in Messages." });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessageError(data.error || "Message could not be sent.");
      }
    } catch {
      setMessageError("Network error. Check your connection and try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const toastView = toast && (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "fixed left-1/2 top-20 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-slate-900/10 transition duration-200 starting:-translate-y-2 starting:opacity-0 motion-reduce:transition-none",
        toast.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-100"
          : toast.tone === "error"
          ? "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950 dark:text-red-100"
          : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      )}
    >
      {toast.tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : toast.tone === "error" ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      ) : toast.sticky ? (
        <Spinner className="mt-0.5 text-emerald-600" />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      )}
      <span className="flex-1 leading-5">{toast.message}</span>
      <button
        type="button"
        onClick={() => setToast(null)}
        aria-label="Dismiss notification"
        className="-m-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-60 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <>
        <ItemDetailSkeleton />
        {toastView}
      </>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">We couldn&apos;t load this listing</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            It may have been removed, or the connection dropped. Try again in a moment.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadItem();
              }}
              className={ui.btnSecondary}
            >
              Try again
            </button>
            <Link href="/browse" className={ui.btnPrimary}>
              Browse listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.userId;
  const canSeePrecise = isOwner || hasUnlocked || user?.role === "admin";
  const canMessage = hasUnlockedChat || !!user?.hasSubscription;
  const currency = settings?.currency || "USD";
  const priceLabel = formatCurrency(item.unlockAmount || 100, item.currency || currency);
  const oneTimeFee = formatCurrency(settings?.metadata?.oneTimeUnlockFee || 100, currency);
  const premiumFee = formatCurrency(settings?.metadata?.premiumSubscriptionFee || 499, currency);
  const place = [item.approximateLocation, item.city].filter(Boolean).join(", ");
  const posterHref = `${itemPath}/poster`;
  const isLost = item.type === "lost";
  const posterRole = isLost ? "owner" : "finder";
  const posterName = item.userName || "Anonymous";
  const firstName = item.userName?.trim().split(/\s+/)[0];
  const photos = item.photos ?? [];

  const facts = [
    { label: "Area", value: item.approximateLocation, Icon: MapPin },
    { label: "City", value: [item.city, item.country].filter(Boolean).join(", "), Icon: Building2 },
    { label: isLost ? "Lost on" : "Found on", value: shortDate(item.dateLostFound), Icon: CalendarDays },
    { label: "Time", value: item.timeframe, Icon: Clock },
  ];

  const openContact = () => {
    if (!user) {
      router.push(loginHref);
      return;
    }
    setMessageError("");
    setCheckoutError("");
    if (canMessage) {
      setShowMessageModal(true);
    } else {
      setShowUnlockModal(true);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/browse"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Browse
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <Link
            href={categoryBrowseHref(item.category)}
            className="shrink-0 rounded-md transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white"
          >
            {item.category}
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600 sm:block" aria-hidden="true" />
          <span aria-current="page" className="hidden truncate font-medium text-slate-700 dark:text-slate-300 sm:block">
            {item.title}
          </span>
        </nav>

        {item.status === "resolved" && (
          <Alert tone="info" className="mt-5">
            This item has been marked as resolved{isOwner ? ". You can reopen it from Manage listing if it's still missing." : "."}
          </Alert>
        )}
        {item.status === "archived" && (
          <Alert tone="warning" className="mt-5">
            This listing is archived and no longer shown publicly.
          </Alert>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Main column: photos, header, facts, description */}
          <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
            <ItemGallery photos={photos} title={item.title} />

            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(ui.badge, "uppercase tracking-wide", isLost ? badgeTone.lost : badgeTone.found)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", isLost ? "bg-rose-500" : "bg-emerald-500")} aria-hidden="true" />
                  {isLost ? "Lost" : "Found"}
                </span>
                <Link
                  href={categoryBrowseHref(item.category)}
                  className={cn(ui.badge, badgeTone.neutral, "transition hover:bg-slate-200 dark:hover:bg-slate-700")}
                >
                  {item.category}
                </Link>
                {item.status !== "active" && (
                  <span className={cn(ui.badge, statusTone(item.status))}>{statusLabel(item.status)}</span>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-slate-900 first-letter:uppercase dark:text-white md:text-3xl">
                  {item.title}
                </h1>
                <ShareMenu
                  path={itemPath}
                  title={item.title}
                  type={item.type}
                  place={place}
                  posterHref={posterHref}
                  className="shrink-0"
                />
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span title={new Date(item.createdAt).toLocaleString()}>Posted {formatRelativeTime(item.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <span>Ref #{item.id}</span>
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/80 shadow-sm dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-4">
              {facts.map(({ label, value, Icon }) => (
                <div key={label} className="min-w-0 bg-white p-4 dark:bg-slate-900">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd
                    className={cn(
                      "mt-1 break-words text-sm font-semibold first-letter:uppercase",
                      value ? "text-slate-900 dark:text-white" : "font-normal text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {value || "Not specified"}
                  </dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-base font-semibold text-slate-900 dark:text-white">
                About this item
              </h2>
              <p className="mt-3 max-w-prose whitespace-pre-line break-words text-[15px] leading-7 text-slate-700 first-letter:uppercase dark:text-slate-300">
                {item.description}
              </p>
            </section>
          </div>

          {/* Sidebar: contact, location, owner controls, safety */}
          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Contact and location">
            <div className="space-y-4 lg:sticky lg:top-24">
              <section className={cn(ui.card, "p-5 sm:p-6")}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20"
                    aria-hidden="true"
                  >
                    {getInitials(item.userName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {isOwner ? "Your listing" : `Posted by the ${posterRole}`}
                    </p>
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{posterName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Listed {formatRelativeTime(item.createdAt)}</p>
                  </div>
                </div>

                {isOwner ? (
                  <p className="mt-5 rounded-xl bg-slate-50 p-3.5 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    People who unlock chat can message you here. Replies are in{" "}
                    <Link href="/messages" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
                      Messages
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="mt-5">
                    <button type="button" onClick={openContact} className={cn(ui.btnPrimary, "w-full")}>
                      {canMessage ? (
                        <>
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          {firstName ? `Message ${firstName}` : "Send a message"}
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" aria-hidden="true" />
                          Unlock chat
                        </>
                      )}
                    </button>
                    <p className="mt-2.5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {canMessage
                        ? "Your email and phone number stay private."
                        : `${oneTimeFee} for this chat, or Premium at ${premiumFee}/month.`}
                    </p>
                  </div>
                )}
              </section>

              <section className={cn(ui.card, "p-5 sm:p-6")} aria-labelledby="precise-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="precise-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    Precise location
                  </h2>
                  {canSeePrecise ? (
                    item.preciseLocation && (
                      <span className={cn(ui.badge, badgeTone.found)}>
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {isOwner ? "Private" : "Unlocked"}
                      </span>
                    )
                  ) : (
                    <span className={cn(ui.badge, badgeTone.warning)}>
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Locked
                    </span>
                  )}
                </div>

                {canSeePrecise && item.preciseLocation ? (
                  <>
                    <p className="mt-4 whitespace-pre-line break-words rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4 text-sm font-medium leading-6 text-slate-900 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-white">
                      {item.preciseLocation}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.preciseLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 rounded-md text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Open in Google Maps
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    {isOwner && (
                      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Only people who unlock it for {priceLabel} can see this.
                      </p>
                    )}
                  </>
                ) : canSeePrecise ? (
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {isOwner
                      ? "You haven't added a precise location to this listing."
                      : "The poster hasn't added a precise location to this listing."}
                  </p>
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="mt-4 select-none space-y-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      <div className="h-3 w-4/5 rounded-full bg-slate-200 blur-[1.5px] dark:bg-slate-700" />
                      <div className="h-3 w-1/2 rounded-full bg-slate-200 blur-[1.5px] dark:bg-slate-700" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Get the exact spot the {posterRole} shared. The public listing only shows the general area.
                    </p>
                    <button
                      type="button"
                      onClick={handleUnlock}
                      disabled={paymentLoading}
                      className={cn(ui.btnSecondary, "mt-4 w-full")}
                    >
                      {paymentLoading ? <Spinner /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                      Unlock for {priceLabel}
                    </button>
                    {unlockError && (
                      <Alert tone="error" className="mt-3">
                        {unlockError}
                      </Alert>
                    )}
                  </>
                )}
              </section>

              {isOwner && (
                <section className={cn(ui.card, "p-5 sm:p-6")} aria-labelledby="manage-heading">
                  <h2 id="manage-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
                    Manage listing
                  </h2>

                  <div className="mt-4 rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800">
                    {isEditingPrice ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSavePrice();
                        }}
                        noValidate
                      >
                        <label htmlFor="edit-price" className={ui.label}>
                          Unlock price
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={editCurrencyValue}
                            onChange={(e) => setEditCurrencyValue(e.target.value)}
                            aria-label="Currency"
                            className={cn(ui.input, "w-24 shrink-0 px-2.5 font-medium")}
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <input
                            id="edit-price"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.5"
                            max="10000"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            aria-invalid={priceError ? true : undefined}
                            aria-describedby={priceError ? "edit-price-error" : undefined}
                            className={cn(ui.input, "tabular-nums", priceError && ui.inputInvalid)}
                            autoFocus
                          />
                        </div>
                        {priceError && (
                          <p id="edit-price-error" role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                            {priceError}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button type="submit" disabled={savingPrice} className={cn(ui.btnPrimary, "flex-1")}>
                            {savingPrice && <Spinner />}
                            Save price
                          </button>
                          <button type="button" onClick={() => setIsEditingPrice(false)} className={ui.btnSecondary}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Location unlock price</p>
                          <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{priceLabel}</p>
                        </div>
                        <button type="button" onClick={startEditingPrice} className={ui.btnGhost}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2">
                    {item.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("resolved")}
                        disabled={statusSaving}
                        className={cn(ui.btnSecondary, "w-full")}
                      >
                        {statusSaving ? <Spinner /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                        Mark as resolved
                      </button>
                    )}
                    {item.status === "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("active")}
                        disabled={statusSaving}
                        className={cn(ui.btnSecondary, "w-full")}
                      >
                        {statusSaving ? <Spinner /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
                        Reopen listing
                      </button>
                    )}
                    <Link href={posterHref} className={cn(ui.btnSecondary, "w-full")}>
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      Print a poster
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className={cn(
                        ui.btnGhost,
                        "min-h-11 w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      )}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete listing
                    </button>
                  </div>
                  {ownerError && (
                    <Alert tone="error" className="mt-3" onDismiss={() => setOwnerError("")}>
                      {ownerError}
                    </Alert>
                  )}
                </section>
              )}

              <section
                className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:p-6"
                aria-labelledby="safety-heading"
              >
                <h2 id="safety-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Safety tips
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {SAFETY_TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden="true" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>

          {item.status === "active" && (
            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              <PossibleMatches
                itemId={item.id}
                itemType={item.type}
                title={item.title}
                place={place}
                isOwner={isOwner}
              />
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <Modal open={showMessageModal} onClose={() => setShowMessageModal(false)} labelledBy="message-modal-title">
        <ModalHeader
          id="message-modal-title"
          title={firstName ? `Message ${firstName}` : "Send a message"}
          description={<>About &ldquo;{item.title}&rdquo;</>}
          onClose={() => setShowMessageModal(false)}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <label htmlFor="message-body" className="sr-only">
            Message
          </label>
          <textarea
            id="message-body"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={
              isLost
                ? "Hi! I think I may have found your item. It…"
                : "Hi! I think this might be mine. It has…"
            }
            rows={5}
            maxLength={2000}
            autoFocus
            className={cn(ui.textarea, "resize-none")}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Your email and phone number stay private.</span>
            <span className="tabular-nums">{messageContent.length}/2000</span>
          </div>
          {messageError && (
            <Alert tone="error" className="mt-3">
              {messageError}
            </Alert>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowMessageModal(false)} className={ui.btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={!messageContent.trim() || sendingMessage} className={ui.btnPrimary}>
              {sendingMessage ? <Spinner /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Send message
            </button>
          </div>
        </form>
      </Modal>

      {/* Unlock chat */}
      <Modal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        labelledBy="unlock-modal-title"
        className="sm:max-w-xl"
      >
        <ModalHeader
          id="unlock-modal-title"
          title="Unlock messaging"
          description="To keep our community safe and prevent spam, messaging requires a small fee or an active subscription."
          onClose={() => setShowUnlockModal(false)}
        />
        {checkoutError && (
          <Alert tone="error" className="mb-4">
            {checkoutError}
          </Alert>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">This chat only</h3>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{oneTimeFee}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">One-time unlock for this listing.</p>
            <button
              type="button"
              onClick={handleUnlockChat}
              disabled={chatPaymentLoading}
              className={cn(ui.btnSecondary, "mt-5 w-full")}
            >
              {chatPaymentLoading && <Spinner />}
              Unlock this chat
            </button>
          </div>
          <div className="relative flex flex-col rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 ring-1 ring-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-500/5">
            <span className={cn(ui.badge, "absolute -top-2.5 right-4 bg-emerald-600 text-white")}>Best value</span>
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">LostFound Premium</h3>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {premiumFee}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400"> / month</span>
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Unlimited messaging across all items.</p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscriptionLoading}
              className={cn(ui.btnPrimary, "mt-5 w-full")}
            >
              {subscriptionLoading && <Spinner />}
              Get Premium
            </button>
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Secure checkout. You&apos;ll come straight back here.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this listing?"
        description="This can't be undone. If anyone has paid to unlock it, it will be archived instead so their purchase stays on record."
        confirmLabel="Delete listing"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {toastView}
    </div>
  );
}
