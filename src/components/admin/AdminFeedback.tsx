"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import clsx from "clsx";
import { useOverlay } from "./ui/Overlay";

/**
 * Toasts and a confirm dialog shared by every admin page.
 *
 *   const toast = useToast();      toast.error(message) / toast.success(message)
 *   const confirm = useConfirm();  if (!(await confirm({ title: "Delete user?" }))) return;
 *
 * AdminFeedbackProvider is mounted once in src/app/admin/layout.tsx.
 */

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Red confirm button. Defaults to true, since most confirms guard deletes. */
  destructive?: boolean;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

type FeedbackContextValue = {
  toast: ToastApi;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// Used if a component is ever rendered outside the provider.
const fallback: FeedbackContextValue = {
  toast: {
    success: () => {},
    error: (message) => window.alert(message),
    info: () => {},
  },
  confirm: async ({ title, message }) => window.confirm(message ? `${title}\n\n${message}` : title),
};

const TOAST_STYLES: Record<ToastKind, { icon: typeof Info; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300",
  },
  error: {
    icon: XCircle,
    className: "border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300",
  },
  info: {
    icon: Info,
    className: "border-sky-200 dark:border-sky-500/30 text-slate-800 dark:text-slate-200",
  },
};

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === "success" ? 3500 : 7000);
    },
    [dismiss]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    // Opening a second dialog cancels the first.
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPending(options);
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPending(null);
  }, []);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      toast: {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
      },
      confirm,
    }),
    [push, confirm]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, className } = TOAST_STYLES[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={clsx(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg shadow-slate-900/10 transition duration-200 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none dark:bg-slate-900",
                className
              )}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="flex-1 break-words">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} className="-m-1 rounded p-1 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {pending && <ConfirmDialog options={pending} onSettle={settle} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions; onSettle: (ok: boolean) => void }) {
  const destructive = options.destructive !== false;
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancel = useCallback(() => onSettle(false), [onSettle]);
  // Escape closes, focus is trapped and restored; only the top-most overlay
  // reacts, so a confirm opened from a drawer doesn't close the drawer too.
  useOverlay(true, cancel, panelRef, confirmRef);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 starting:opacity-0 dark:bg-slate-950/70"
        onClick={cancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby={options.message ? "admin-confirm-message" : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/10 transition duration-200 starting:scale-95 starting:opacity-0 focus:outline-none motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              destructive
                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            )}
          >
            {destructive ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 id="admin-confirm-title" className="font-semibold text-slate-900 dark:text-white">
              {options.title}
            </h2>
            {options.message && (
              <p id="admin-confirm-message" className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {options.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={cancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:h-10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onSettle(true)}
            className={clsx(
              "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 dark:focus-visible:ring-offset-slate-900",
              destructive
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                : "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            )}
          >
            {options.confirmLabel || (destructive ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useToast(): ToastApi {
  return (useContext(FeedbackContext) ?? fallback).toast;
}

export function useConfirm(): FeedbackContextValue["confirm"] {
  return (useContext(FeedbackContext) ?? fallback).confirm;
}
