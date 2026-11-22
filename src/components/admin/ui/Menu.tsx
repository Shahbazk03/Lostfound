"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconButton } from "./styles";

export type MenuItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect?: () => void;
  href?: string;
  /** Open href in a new tab. */
  external?: boolean;
  danger?: boolean;
  disabled?: boolean;
  /** Shown as a tooltip / reason when disabled. */
  hint?: string;
  /** Draw a divider above this item. */
  separator?: boolean;
};

type Position = { top: number; left: number; minWidth: number; placeAbove: boolean };

const MENU_WIDTH = 208;

/**
 * Dropdown menu rendered in a portal with fixed positioning, so table cards
 * and scroll containers never clip it. Keyboard: arrows, Home/End, Enter,
 * Escape, Tab closes.
 */
export function DropdownMenu({
  items,
  label = "More actions",
  trigger,
  align = "end",
  className,
}: {
  items: MenuItem[];
  label?: string;
  /** Custom trigger content (defaults to a "…" icon button). */
  trigger?: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [pos, setPos] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = pos !== null;

  const close = useCallback((focusTrigger = true) => {
    setPos(null);
    if (focusTrigger) buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const openMenu = (focusLast = false) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const estimated = items.length * 40 + 16;
    const placeAbove = r.bottom + estimated + 8 > window.innerHeight && r.top > estimated + 8;
    const width = Math.max(MENU_WIDTH, r.width);
    let left = align === "end" ? r.right - width : r.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setPos({ top: placeAbove ? r.top - 6 : r.bottom + 6, left, minWidth: width, placeAbove });
    window.requestAnimationFrame(() => {
      const nodes = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
      if (!nodes?.length) return;
      (focusLast ? nodes[nodes.length - 1] : nodes[0]).focus();
    });
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      close(false);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close(false);
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const nodes = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []
    );
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      nodes[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const itemClass = (item: MenuItem) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
      item.disabled
        ? "cursor-not-allowed text-slate-400 dark:text-slate-600"
        : item.danger
          ? "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10"
          : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={trigger ? undefined : label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (open) close(false);
          else openMenu();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu(e.key === "ArrowUp");
          }
        }}
        className={trigger ? className : cn(iconButton, className)}
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.minWidth,
              transform: pos.placeAbove ? "translateY(-100%)" : undefined,
            }}
            className="z-[260] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 transition-opacity duration-150 starting:opacity-0 dark:border-slate-700 dark:bg-slate-900"
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <>
                  {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
                  <span className="flex-1">{item.label}</span>
                </>
              );
              return (
                <div key={`${item.label}-${i}`}>
                  {item.separator && i > 0 && <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" role="separator" />}
                  {item.href && !item.disabled ? (
                    item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        tabIndex={-1}
                        className={itemClass(item)}
                        onClick={() => close(false)}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link href={item.href} role="menuitem" tabIndex={-1} className={itemClass(item)} onClick={() => close(false)}>
                        {content}
                      </Link>
                    )
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      aria-disabled={item.disabled || undefined}
                      title={item.disabled ? item.hint : undefined}
                      className={itemClass(item)}
                      onClick={() => {
                        if (item.disabled) return;
                        close();
                        item.onSelect?.();
                      }}
                    >
                      {content}
                    </button>
                  )}
                  {item.disabled && item.hint && (
                    <p className="px-2.5 pb-1.5 text-[11px] leading-snug text-slate-400 dark:text-slate-500">{item.hint}</p>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
