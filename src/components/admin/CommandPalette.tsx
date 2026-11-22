"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  ExternalLink,
  FilePlus2,
  LayoutTemplate,
  LogOut,
  Moon,
  PanelLeft,
  Search,
  Upload,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CMS_SECTIONS, NAV_GROUPS } from "./nav";
import { useOverlay } from "./ui/Overlay";
import { kbd } from "./ui/styles";

type Command = {
  id: string;
  title: string;
  group: "Pages" | "Homepage sections" | "Actions";
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
};

function score(cmd: Command, tokens: string[]) {
  if (tokens.length === 0) return 1;
  const title = cmd.title.toLowerCase();
  const hay = `${title} ${cmd.hint ?? ""} ${cmd.keywords ?? ""} ${cmd.group}`.toLowerCase();
  if (!tokens.every((t) => hay.includes(t))) return 0;
  const q = tokens.join(" ");
  if (title.startsWith(q)) return 3;
  if (title.includes(q)) return 2;
  return 1;
}

/**
 * Ctrl/⌘+K palette: jump to any admin page or homepage section and run quick
 * actions. Arrow keys move, Enter runs, Escape closes.
 */
export function CommandPalette({
  open,
  onClose,
  onToggleTheme,
  onToggleSidebar,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;
  return createPortal(
    <PaletteBody onClose={onClose} onToggleTheme={onToggleTheme} onToggleSidebar={onToggleSidebar} onLogout={onLogout} />,
    document.body
  );
}

function PaletteBody({
  onClose,
  onToggleTheme,
  onToggleSidebar,
  onLogout,
}: {
  onClose: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useOverlay(true, onClose, panelRef, inputRef);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const pages: Command[] = NAV_GROUPS.flatMap((g) =>
      g.items.map((item) => ({
        id: `page:${item.href}`,
        title: item.title,
        group: "Pages" as const,
        hint: g.title,
        icon: item.icon,
        keywords: item.keywords,
        run: go(item.href),
      }))
    );
    const sections: Command[] = CMS_SECTIONS.map((s) => ({
      id: `cms:${s.slug}`,
      title: `Homepage › ${s.title}`,
      group: "Homepage sections" as const,
      hint: "Content",
      icon: LayoutTemplate,
      keywords: "cms builder section",
      run: go(`/admin/cms/homepage/${s.slug}`),
    }));
    const actions: Command[] = [
      {
        id: "act:view-site",
        title: "View live site",
        group: "Actions",
        hint: "Opens in a new tab",
        icon: ExternalLink,
        keywords: "open website public",
        run: () => window.open("/", "_blank", "noopener,noreferrer"),
      },
      {
        id: "act:new-page",
        title: "New CMS page",
        group: "Actions",
        icon: FilePlus2,
        keywords: "create add page content",
        run: go("/admin/cms/pages?new=1"),
      },
      {
        id: "act:add-user",
        title: "Add user",
        group: "Actions",
        icon: UserPlus,
        keywords: "create account admin",
        run: go("/admin/users?new=1"),
      },
      {
        id: "act:upload",
        title: "Upload media",
        group: "Actions",
        icon: Upload,
        keywords: "image file library",
        run: go("/admin/media"),
      },
      { id: "act:theme", title: "Toggle dark mode", group: "Actions", icon: Moon, keywords: "theme light", run: onToggleTheme },
      {
        id: "act:sidebar",
        title: "Collapse / expand sidebar",
        group: "Actions",
        icon: PanelLeft,
        keywords: "navigation menu",
        run: onToggleSidebar,
      },
      { id: "act:logout", title: "Log out", group: "Actions", icon: LogOut, keywords: "sign out exit", run: onLogout },
    ];
    return [...pages, ...sections, ...actions];
  }, [router, onToggleTheme, onToggleSidebar, onLogout]);

  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = commands
      .map((cmd, i) => ({ cmd, s: score(cmd, tokens), i }))
      .filter((r) => r.s > 0);
    if (tokens.length > 0) scored.sort((a, b) => b.s - a.s || a.i - b.i);
    return scored.map((r) => r.cmd);
  }, [commands, query]);

  const active = Math.min(activeIndex, Math.max(0, results.length - 1));

  const run = (cmd: Command | undefined) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const moveTo = (i: number) => {
    setActiveIndex(i);
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    el?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length) moveTo((active + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) moveTo((active - 1 + results.length) % results.length);
    } else if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault();
      moveTo(0);
    } else if (e.key === "End" && e.ctrlKey) {
      e.preventDefault();
      moveTo(results.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    }
  };

  // Group headings are shown only when results keep their natural order.
  const showGroups = query.trim() === "";
  const optionId = (i: number) => `admin-cmd-${i}`;

  return (
    <div className="fixed inset-0 z-[280] flex items-start justify-center p-3 pt-[12vh] sm:p-4 sm:pt-[14vh]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-150 starting:opacity-0 dark:bg-slate-950/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 transition duration-150 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages and actions…"
            role="combobox"
            aria-expanded="true"
            aria-controls="admin-cmd-list"
            aria-activedescendant={results.length ? optionId(active) : undefined}
            aria-autocomplete="list"
            className="h-14 flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <span className={kbd}>Esc</span>
        </div>

        <div ref={listRef} id="admin-cmd-list" role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No results for “{query}”.
            </p>
          ) : (
            results.map((cmd, i) => {
              const Icon = cmd.icon;
              const heading = showGroups && (i === 0 || results[i - 1].group !== cmd.group) ? cmd.group : null;
              return (
                <div key={cmd.id}>
                  {heading && (
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:pt-1 dark:text-slate-500">
                      {heading}
                    </p>
                  )}
                  <div
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => i !== active && setActiveIndex(i)}
                    onClick={() => run(cmd)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      i === active
                        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        i === active
                          ? "border-emerald-200 bg-white text-emerald-600 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 truncate font-medium">{cmd.title}</span>
                    {cmd.hint && <span className="hidden text-xs text-slate-400 sm:inline">{cmd.hint}</span>}
                    {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:flex dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={kbd}>↑</span>
            <span className={kbd}>↓</span> to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <span className={kbd}>↵</span> to select
          </span>
          <span className="flex items-center gap-1.5">
            <span className={kbd}>Esc</span> to close
          </span>
        </div>
      </div>
    </div>
  );
}
