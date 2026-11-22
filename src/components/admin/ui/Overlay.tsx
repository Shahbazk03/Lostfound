"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconButton } from "./styles";

/**
 * Overlay plumbing shared by Dialog, Drawer, the confirm dialog and the
 * command palette: Escape to close, focus trap, focus restore. Only the
 * top-most open overlay reacts to keys, so a confirm opened from a drawer
 * closes on Escape without also closing the drawer.
 */
const stack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useOverlay(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const token = Symbol("overlay");
    stack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        initialFocusRef?.current ?? panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel).focus({ preventScroll: true });
    };
    const raf = window.requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey, true);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, panelRef, initialFocusRef]);
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

const backdrop =
  "fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none dark:bg-slate-950/70";

/** Centered modal dialog. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useOverlay(open, onClose, panelRef, initialFocusRef);
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className={backdrop} onClick={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition duration-200 starting:translate-y-2 starting:opacity-0 focus:outline-none motion-reduce:transition-none sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900",
            size === "sm" && "sm:max-w-sm",
            size === "md" && "sm:max-w-lg",
            size === "lg" && "sm:max-w-2xl"
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className={cn(iconButton, "-mr-2 -mt-1")} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-950/40">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/** Side sheet from the right; full screen on mobile. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  headerExtra,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Rendered under the title row (e.g. badges). */
  headerExtra?: ReactNode;
  width?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay(open, onClose, panelRef);
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex justify-end">
        <div className={backdrop} onClick={onClose} aria-hidden="true" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "relative flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition duration-200 ease-out starting:translate-x-8 starting:opacity-0 focus:outline-none motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900",
            width === "md" ? "sm:max-w-md" : "sm:max-w-xl"
          )}
        >
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
              </div>
              <button type="button" onClick={onClose} className={cn(iconButton, "-mr-2 -mt-1")} aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </div>
            {headerExtra && <div className="mt-3">{headerExtra}</div>}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-950/40">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
