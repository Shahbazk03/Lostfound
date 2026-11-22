"use client";

import { useCallback, useState, type ComponentType, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { errorMessage, readApiError } from "@/components/admin/admin-api";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { SaveBar, useUnsavedChanges } from "@/components/admin/ui/SaveBar";
import { focusRing, iconButton } from "@/components/admin/ui/styles";
import { useCMS, type SectionKey } from "../CMSProvider";

/**
 * Publishes one homepage section with the same request the editors have
 * always made: POST <url> with a JSON body; on failure the server's message is
 * shown as an error toast. On success the provider records `value` as live.
 */
export function useSectionPublisher(key: SectionKey, url: string, noun: string) {
  const { markSaved } = useCMS();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const publish = useCallback(
    async (body: unknown, value: unknown) => {
      setSaving(true);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          markSaved(key, value);
          toast.success(`${noun.charAt(0).toUpperCase()}${noun.slice(1)} published`);
        } else {
          toast.error(await readApiError(res, `Failed to save ${noun}`));
        }
      } catch (error) {
        console.error(error);
        toast.error(errorMessage(error, `Error saving ${noun}`));
      } finally {
        setSaving(false);
      }
    },
    [key, url, noun, markSaved, toast]
  );

  return { saving, publish };
}

/** Frame for every homepage section editor: header, scrolling body, sticky save bar. */
export function SectionEditor({
  sectionKey,
  icon: Icon,
  title,
  description,
  errorCount,
  saving,
  onPublish,
  headerAction,
  children,
}: {
  sectionKey: SectionKey;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  errorCount: number;
  saving: boolean;
  onPublish: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const { isDirty, discard } = useCMS();
  const confirm = useConfirm();
  const dirty = isDirty(sectionKey);

  const save = useCallback(() => {
    if (saving || errorCount > 0) return;
    onPublish();
  }, [saving, errorCount, onPublish]);

  useUnsavedChanges(dirty, { onSave: save });

  const handleDiscard = async () => {
    const ok = await confirm({
      title: "Discard unpublished changes?",
      message: `${title} goes back to what is live on the homepage.`,
      confirmLabel: "Discard",
    });
    if (ok) discard(sectionKey);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">{children}</div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        errorCount={errorCount}
        onSave={save}
        onDiscard={handleDiscard}
        saveLabel="Publish"
        savedLabel="Live on the homepage"
      />
    </div>
  );
}

/** White card grouping fields inside an editor. */
export function EditorCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** One entry in a repeatable list, with reorder and remove controls. */
export function RepeaterItem({
  label,
  index,
  count,
  onMove,
  onRemove,
  children,
  invalid,
  muted,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  children: ReactNode;
  invalid?: boolean;
  /** Dim the card (e.g. hidden from the homepage). */
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm dark:bg-slate-900",
        invalid ? "border-red-200 dark:border-red-500/30" : "border-slate-200/80 dark:border-slate-800"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        <span className={cn("truncate text-xs font-semibold uppercase tracking-wide", muted ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>
          {label}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            className={iconButton}
            aria-label={`Move ${label} up`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === count - 1}
            className={iconButton}
            aria-label={`Move ${label} down`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className={cn(iconButton, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={cn("space-y-4 p-4", muted && "opacity-70")}>{children}</div>
    </div>
  );
}

/** Dashed "add another" button under a list. */
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500/60 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400",
        focusRing
      )}
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

/** Small inline "+ Add" text button for nested lists. */
export function InlineAdd({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
        focusRing
      )}
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

export function EmptyList({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      {children}
    </p>
  );
}
