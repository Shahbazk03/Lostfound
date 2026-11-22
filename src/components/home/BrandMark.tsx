import { cn } from "@/lib/utils";

/** The "LF" square. Matches app/icon.svg. Decorative: pair it with a text label. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-emerald-500 to-emerald-600 text-[13px] font-extrabold tracking-tight text-white shadow-sm shadow-emerald-600/25 ring-1 ring-inset ring-white/15",
        className
      )}
    >
      LF
    </span>
  );
}

/** Mark + "LostFound" wordmark. */
export function BrandLogo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span
        className={cn(
          "text-[17px] font-bold tracking-tight",
          inverted ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        Lost<span className={inverted ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}>Found</span>
      </span>
    </span>
  );
}
