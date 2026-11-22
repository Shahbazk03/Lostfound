import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ui } from "./styles";

/**
 * Label + control + hint/error. Give the control `id={id}` and
 * `aria-describedby={describedBy(id, error, hint)}`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  required,
  labelAside,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  required?: boolean;
  /** Rendered at the right of the label row (e.g. "Forgot password?"). */
  labelAside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={ui.label}>
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
          {optional && <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">Optional</span>}
        </label>
        {labelAside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={cn("mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** aria-describedby value matching what <Field> renders. */
export function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
