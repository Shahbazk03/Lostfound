"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { input, label as labelClass, select, textarea, focusRing } from "./styles";

/**
 * A labelled form control with hint / inline error.
 *
 *   <Field label="Title" error={errors.title} hint="Shown in the browser tab" required>
 *     <Input value={title} onChange={...} />
 *   </Field>
 *
 * The single child gets `id`, `aria-invalid` and `aria-describedby` injected.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  aside,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** Right-aligned content on the label row, e.g. a character counter. */
  aside?: ReactNode;
}) {
  const autoId = useId();
  const only = Children.only(children);
  const child = isValidElement(only) ? (only as ReactElement<Record<string, unknown>>) : null;
  const id = (child?.props.id as string | undefined) ?? autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {label ? (
            <label htmlFor={id} className={labelClass}>
              {label}
              {required && (
                <span className="ml-0.5 text-red-500" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          ) : (
            <span />
          )}
          {aside && <span className="mb-1.5 text-xs text-slate-400">{aside}</span>}
        </div>
      )}
      {child
        ? cloneElement(child, {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
            "aria-required": required || undefined,
          })
        : only}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(input, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(textarea, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(select, "appearance-none", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  );
}

/** Accessible on/off switch. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          focusRing,
          checked ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/** Native checkbox with a label, styled for the admin. */
export function Checkbox({
  checked,
  onChange,
  label,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
        {...rest}
      />
      {label}
    </label>
  );
}

/** Small "x / max" counter for the Field `aside` slot. */
export function CharCount({ value, max, soft }: { value: string | null | undefined; max: number; soft?: boolean }) {
  const n = value?.length ?? 0;
  return (
    <span className={cn(n > max ? (soft ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400") : undefined)}>
      {n}/{max}
    </span>
  );
}
