"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ui } from "./styles";
import { Spinner } from "./Spinner";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: Escape and backdrop click close it, focus stays inside
 * while open and returns to the trigger afterwards, the page doesn't scroll
 * behind it. Bottom sheet on phones, centred card from `sm` up.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Children may autoFocus a field; otherwise focus the panel itself.
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel && !panel.contains(document.activeElement)) panel.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5 transition duration-200 ease-out focus:outline-none starting:translate-y-4 starting:opacity-0 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg sm:rounded-2xl sm:p-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Title row with a close button, for use inside <Modal>. */
export function ModalHeader({
  id,
  title,
  description,
  onClose,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className={cn(ui.iconBtn, "-mr-2 -mt-2 shrink-0")}>
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Replacement for window.confirm() with a designed, accessible dialog. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} labelledBy={titleId} className="sm:max-w-md">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-1">
          <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={loading} autoFocus className={ui.btnSecondary}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={loading} className={ui.btnDanger}>
          {loading && <Spinner />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
