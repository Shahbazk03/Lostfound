import type { ButtonHTMLAttributes, Ref } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  dangerSoft: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-lg sm:h-8",
  md: "h-11 px-4 text-sm rounded-xl sm:h-10",
  lg: "h-11 px-5 text-sm rounded-xl",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-50",
    focusRing,
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
