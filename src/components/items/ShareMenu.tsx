"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Link2, Mail, MessageCircle, Printer, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareMenuProps {
  /** Path of the listing, e.g. "/items/3". */
  path: string;
  title: string;
  type: "lost" | "found";
  /** Public place text, e.g. "Integral University, Lucknow". */
  place?: string | null;
  /** Adds a "Print poster" entry. */
  posterHref?: string;
  label?: string;
  variant?: "primary" | "secondary";
  /** Which edge of the button the popover lines up with. */
  align?: "start" | "center" | "end";
  fullWidth?: boolean;
  className?: string;
}

const TRIGGER_STYLES = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400",
};

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure origins: fall back to a temporary textarea.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Native share sheet on touch devices; elsewhere a popover with share targets. */
export function ShareMenu({
  path,
  title,
  type,
  place,
  posterHref,
  label = "Share",
  variant = "secondary",
  align = "end",
  fullWidth = false,
  className,
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [url, setUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  const message =
    type === "lost"
      ? `Lost: ${title}${place ? ` near ${place}` : ""}. Have you seen it?`
      : `Found: ${title}${place ? ` near ${place}` : ""}. Is it yours?`;

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const handleTrigger = async () => {
    if (open) {
      close(false);
      return;
    }
    const absolute = new URL(path, window.location.origin).toString();
    setUrl(absolute);
    setCopied("idle");

    const touch = window.matchMedia?.("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${type === "lost" ? "Lost" : "Found"}: ${title}`, text: message, url: absolute });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Share sheet unavailable: fall through to the popover.
      }
    }
    setOpen(true);
  };

  // Escape and clicks outside close the popover; focus moves into it on open.
  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (copied === "idle") return;
    const timer = setTimeout(() => setCopied("idle"), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    setCopied((await copyText(url)) ? "copied" : "failed");
  };

  const encodedUrl = encodeURIComponent(url);
  const targets: { name: string; href: string; icon: ReactNode; tile: string }[] = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`,
      icon: <MessageCircle className="w-4 h-4" aria-hidden="true" />,
      tile: "bg-[#25D366] text-white",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodedUrl}`,
      icon: <XLogo className="w-3.5 h-3.5" />,
      tile: "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <span className="text-[17px] font-black leading-none -mb-0.5" aria-hidden="true">f</span>,
      tile: "bg-[#1877F2] text-white",
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
      icon: <Mail className="w-4 h-4" aria-hidden="true" />,
      tile: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
  ];

  const rowClass =
    "w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/70 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors";
  const tileClass = "w-8 h-8 rounded-lg flex items-center justify-center shrink-0";
  const shortUrl = url.replace(/^https?:\/\//, "");

  return (
    <div ref={containerRef} className={cn("relative", fullWidth ? "block" : "inline-block", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTrigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
          TRIGGER_STYLES[variant],
          fullWidth && "w-full"
        )}
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        {label}
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Share this listing"
          className={cn(
            "absolute z-40 top-full mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl shadow-slate-900/15 dark:shadow-black/40 text-left",
            fullWidth ? "inset-x-0" : "w-72 max-w-[calc(100vw-2rem)]",
            !fullWidth && (align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0")
          )}
        >
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Share this listing
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Every share puts it in front of more people nearby.
            </p>
          </div>

          <button ref={firstItemRef} type="button" onClick={handleCopy} className={rowClass}>
            <span
              className={cn(
                tileClass,
                copied === "copied"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              )}
            >
              {copied === "copied" ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block">{copied === "copied" ? "Copied!" : copied === "failed" ? "Couldn't copy" : "Copy link"}</span>
              <span className="block truncate text-xs font-normal text-slate-400 dark:text-slate-500">{shortUrl}</span>
            </span>
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {copied === "copied" ? "Link copied to clipboard" : copied === "failed" ? "Couldn't copy the link" : ""}
          </span>

          {targets.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target={t.name === "Email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => close(false)}
              className={rowClass}
              aria-label={t.name === "Email" ? "Share by email" : `Share on ${t.name} (opens in a new tab)`}
            >
              <span className={cn(tileClass, t.tile)}>{t.icon}</span>
              {t.name}
            </a>
          ))}

          {posterHref && (
            <>
              <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
              <Link href={posterHref} onClick={() => close(false)} className={rowClass}>
                <span className={cn(tileClass, "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400")}>
                  <Printer className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  Print poster
                  <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">A4 with a QR code</span>
                </span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
