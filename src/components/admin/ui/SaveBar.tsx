"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Save, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { kbd } from "./styles";

/**
 * Warns before leaving with unsaved changes: the browser prompt on reload /
 * tab close, and (with guardLinks) a confirm on in-app link clicks.
 * Ctrl/⌘+S calls onSave while dirty.
 */
export function useUnsavedChanges(
  dirty: boolean,
  { onSave, guardLinks = false }: { onSave?: () => void; guardLinks?: boolean } = {}
) {
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && saveRef.current) {
        e.preventDefault();
        saveRef.current();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!guardLinks || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm("You have unsaved changes. Leave this page and discard them?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, guardLinks]);
}

/**
 * Sticky bar at the bottom of an editor: shows unsaved / saved / invalid
 * state with Discard and Save.
 */
export function SaveBar({
  dirty,
  saving,
  errorCount = 0,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  savedLabel = "All changes saved",
  className,
  extra,
}: {
  dirty: boolean;
  saving: boolean;
  errorCount?: number;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  savedLabel?: string;
  className?: string;
  /** Extra content on the left, after the status (e.g. a preview link). */
  extra?: React.ReactNode;
}) {
  const invalid = dirty && errorCount > 0;
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 border-t px-4 py-3 backdrop-blur transition-colors sm:px-6",
        dirty
          ? "border-amber-200 bg-amber-50/95 dark:border-amber-500/20 dark:bg-slate-900/95"
          : "border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-sm" aria-live="polite">
          {invalid ? (
            <span className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorCount === 1 ? "1 field needs attention" : `${errorCount} fields need attention`}
            </span>
          ) : dirty ? (
            <span className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {savedLabel}
            </span>
          )}
          {extra}
        </div>
        <div className="flex items-center gap-2">
          {onDiscard && (
            <Button variant="ghost" size="md" onClick={onDiscard} disabled={!dirty || saving}>
              <Undo2 className="h-4 w-4" />
              Discard
            </Button>
          )}
          <Button
            variant="primary"
            onClick={onSave}
            disabled={!dirty || invalid}
            loading={saving}
            title="Save (Ctrl/⌘ + S)"
          >
            {!saving && <Save className="h-4 w-4" />}
            {saving ? "Saving…" : saveLabel}
            <span className={cn(kbd, "ml-1 hidden border-white/30 bg-white/15 text-white lg:inline-flex dark:border-white/20 dark:bg-white/10 dark:text-white")}>
              ⌘S
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
