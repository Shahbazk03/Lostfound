"use client";

import { use, useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Building2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  History,
  Images,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  Megaphone,
  Minus,
  PieChart,
  Quote,
  Settings2,
  Trash2,
  Type,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { ErrorState } from "@/components/admin/AdminStates";
import { CharCount, Field, Input, Select, Textarea } from "@/components/admin/ui/Form";
import { SaveBar, useUnsavedChanges } from "@/components/admin/ui/SaveBar";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { focusRing, iconButton } from "@/components/admin/ui/styles";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { TiptapEditor } from "@/components/cms/TiptapEditor";

const SLUG_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

type Tab = "content" | "settings" | "preview";

const BLOCK_TYPES: { type: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { type: "hero", label: "Hero", icon: LayoutTemplate },
  { type: "rich-text", label: "Rich text", icon: Type },
  { type: "feature-grid", label: "Feature grid", icon: LayoutGrid },
  { type: "faq", label: "FAQ list", icon: HelpCircle },
  { type: "statistics", label: "Statistics", icon: PieChart },
  { type: "testimonials", label: "Testimonials", icon: Quote },
  { type: "team", label: "Team", icon: Users },
  { type: "logo-cloud", label: "Logo cloud", icon: Building2 },
  { type: "timeline", label: "Timeline", icon: History },
  { type: "gallery", label: "Gallery", icon: Images },
  { type: "cta", label: "Call to action", icon: Megaphone },
  { type: "contact-form", label: "Contact form", icon: Mail },
  { type: "divider", label: "Divider", icon: Minus },
];

const blockMeta = (type: string) =>
  BLOCK_TYPES.find((b) => b.type === type) ?? { type, label: type.replace(/-/g, " "), icon: FileText };

const snapshot = (page: unknown, blocks: unknown) => JSON.stringify({ page, blocks });

// Unsaved blocks get a temporary id; the server replaces it on save.
let tempCounter = 0;
function nextTempId() {
  tempCounter += 1;
  return `temp-${Date.now()}-${tempCounter}`;
}

export default function CMSPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const pageId = p.id;
  const toast = useToast();
  const confirm = useConfirm();

  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const loadPage = useCallback(async () => {
    const data = await adminFetch<{ page: any; blocks?: any[] }>(
      `/api/admin/cms/pages/${pageId}`,
      {},
      "Failed to load page"
    );
    setPage(data.page);
    setBlocks(data.blocks || []);
    setBaseline(snapshot(data.page, data.blocks || []));
  }, [pageId]);
  const { loading, error: loadError, reload } = useAdminLoader(loadPage, "Failed to load page");

  const dirty = baseline !== null && page !== null && snapshot(page, blocks) !== baseline;
  const savedPage = useMemo(() => (baseline ? (JSON.parse(baseline).page as any) : null), [baseline]);

  // Inline validation (mirrors the API).
  const errors: Record<string, string> = {};
  if (page) {
    const title = typeof page.title === "string" ? page.title.trim() : "";
    if (!title) errors.title = "Title is required";
    else if (title.length > 255) errors.title = "Keep the title under 255 characters";
    const slug = typeof page.slug === "string" ? page.slug.trim() : "";
    if (!slug) errors.slug = "URL slug is required";
    else if (slug.length > 255 || !SLUG_PATTERN.test(slug)) errors.slug = "Use letters, numbers, - and _ only";
  }
  const errorCount = Object.keys(errors).length;

  const savePage = useCallback(async () => {
    if (!page || saving || errorCount > 0) return;
    setSaving(true);
    try {
      const data = await adminFetch<{ page?: any; blocks?: any[] }>(
        `/api/admin/cms/pages/${pageId}`,
        { method: "PUT", json: { page, blocks } },
        "Failed to save page"
      );
      // Adopt the server's copy so temp ids are replaced with real ones.
      const nextPage = data?.page ?? page;
      const nextBlocks = Array.isArray(data?.blocks) ? data.blocks : blocks;
      setPage(nextPage);
      setBlocks(nextBlocks);
      setBaseline(snapshot(nextPage, nextBlocks));
      toast.success(nextPage.status === "published" ? "Page saved and live" : "Page saved");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save page"));
    } finally {
      setSaving(false);
    }
  }, [page, blocks, pageId, saving, errorCount, toast]);

  useUnsavedChanges(dirty, { onSave: savePage, guardLinks: true });

  const discard = async () => {
    if (!baseline) return;
    const ok = await confirm({
      title: "Discard unsaved changes?",
      message: "The page goes back to how it was when you last saved.",
      confirmLabel: "Discard",
    });
    if (!ok) return;
    const snap = JSON.parse(baseline);
    setPage(snap.page);
    setBlocks(snap.blocks);
  };

  const updatePage = (key: string, value: unknown) => setPage((prev: any) => ({ ...prev, [key]: value }));

  const addBlock = (type: string) => {
    const newBlock = { id: nextTempId(), type, content: getDefaultContentForBlock(type) };
    setBlocks((prev) => [...prev, newBlock]);
    setTab("content");
    window.requestAnimationFrame(() => {
      document.getElementById(`block-${newBlock.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const updateBlockContent = (index: number, key: string, value: any) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, content: { ...(b.content || {}), [key]: value } } : b))
    );
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const to = direction === "up" ? index - 1 : index + 1;
    setBlocks((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeBlock = async (index: number) => {
    const label = blockMeta(String(blocks[index]?.type ?? "block")).label.toLowerCase();
    const ok = await confirm({
      title: `Remove this ${label} block?`,
      message: "It disappears from the page the next time you save.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const blockKey = (block: any, index: number) => String(block.id ?? `i-${index}`);
  const toggleCollapsed = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (loading) return <EditorSkeleton />;
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState message={loadError} onRetry={reload} />
      </div>
    );
  }
  if (!page) return <ErrorState message="Page not found" />;

  const isLive = savedPage?.status === "published";
  const seoTitleLen = (page.seoTitle || "").length;
  const seoDescLen = (page.seoDescription || "").length;

  const tabs: { id: Tab; label: string; icon: ComponentType<{ className?: string }>; mobileOnly?: boolean }[] = [
    { id: "content", label: `Content (${blocks.length})`, icon: FileText },
    { id: "settings", label: "Settings", icon: Settings2 },
    { id: "preview", label: "Preview", icon: Eye, mobileOnly: true },
  ];

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
          <Link href="/admin/cms/pages" className={iconButton} aria-label="Back to pages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
                {page.title?.trim() || "Untitled page"}
              </h1>
              <StatusBadge kind="page" status={page.status} className="hidden sm:inline-flex" />
            </div>
            <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">/{page.slug}</p>
          </div>
          {isLive ? (
            <a
              href={`/${savedPage.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                focusRing
              )}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View live</span>
            </a>
          ) : (
            <span className="hidden shrink-0 items-center gap-1.5 text-xs text-slate-500 sm:inline-flex dark:text-slate-400">
              <EyeOff className="h-4 w-4" />
              Publish to view it live
            </span>
          )}
        </div>
        <div role="tablist" aria-label="Editor" className="flex gap-1 px-3 sm:px-5">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition",
                  focusRing,
                  t.mobileOnly && "lg:hidden",
                  active
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.id === "settings" && errorCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-red-500" aria-label="has errors" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Editor panel */}
        <div
          className={cn(
            "min-h-0 w-full flex-col overflow-y-auto border-slate-200 lg:flex lg:w-[460px] lg:shrink-0 lg:border-r xl:w-[520px] dark:border-slate-800",
            tab === "preview" ? "hidden" : "flex"
          )}
        >
          <div className="space-y-5 px-4 py-5 sm:px-5">
            {tab === "settings" ? (
              <>
                <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Page</h2>
                  <Field label="Title" required error={errors.title} aside={<CharCount value={page.title} max={255} />}>
                    <Input value={page.title ?? ""} onChange={(e) => updatePage("title", e.target.value)} />
                  </Field>
                  <Field
                    label="URL slug"
                    required
                    error={errors.slug}
                    hint={`Public address: /${(page.slug ?? "").trim() || "…"}`}
                  >
                    <Input
                      value={page.slug ?? ""}
                      onChange={(e) => updatePage("slug", e.target.value)}
                      className="font-mono"
                      spellCheck={false}
                      autoCapitalize="none"
                    />
                  </Field>
                  <Field
                    label="Status"
                    hint={page.status === "published" ? "Visible to everyone after you save." : "Only published pages are visible on the site."}
                  >
                    <Select value={page.status} onChange={(e) => updatePage("status", e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </Field>
                </section>

                <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Search engines</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">How the page appears in Google and link previews.</p>
                  </div>
                  <Field
                    label="SEO title"
                    aside={<CharCount value={page.seoTitle} max={60} soft />}
                    hint={seoTitleLen > 60 ? "Over 60 characters may be cut off in search results." : "Leave empty to use the page title."}
                  >
                    <Input
                      value={page.seoTitle || ""}
                      onChange={(e) => updatePage("seoTitle", e.target.value)}
                      placeholder={page.title}
                      className={cn(seoTitleLen > 60 && "border-amber-400 dark:border-amber-500/60")}
                    />
                  </Field>
                  <Field
                    label="Meta description"
                    aside={<CharCount value={page.seoDescription} max={160} soft />}
                    hint={seoDescLen > 160 ? "Over 160 characters may be cut off in search results." : "One or two sentences that sum up the page."}
                  >
                    <Textarea
                      rows={3}
                      value={page.seoDescription || ""}
                      onChange={(e) => updatePage("seoDescription", e.target.value)}
                      className={cn(seoDescLen > 160 && "border-amber-400 dark:border-amber-500/60")}
                    />
                  </Field>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Search preview</p>
                    <p className="mt-2 truncate text-base text-sky-700 dark:text-sky-400">{page.seoTitle || page.title || "Untitled page"}</p>
                    <p className="truncate text-xs text-emerald-700 dark:text-emerald-500">/{page.slug}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {page.seoDescription || "Add a meta description to control this text."}
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                {blocks.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white">No content blocks yet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick a block below to start building the page.</p>
                  </div>
                ) : (
                  <ol className="space-y-4">
                    {blocks.map((block, index) => {
                      const key = blockKey(block, index);
                      const meta = blockMeta(block.type);
                      const isCollapsed = collapsed.has(key);
                      return (
                        <li
                          key={key}
                          id={`block-${block.id ?? index}`}
                          className="scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-1 border-b border-slate-100 py-1.5 pl-2 pr-1.5 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(key)}
                              aria-expanded={!isCollapsed}
                              className={cn(
                                "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800",
                                focusRing
                              )}
                            >
                              <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isCollapsed && "-rotate-90")} />
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <meta.icon className="h-4 w-4" />
                              </span>
                              <span className="truncate capitalize">{meta.label}</span>
                              <span className="text-xs font-normal text-slate-400">#{index + 1}</span>
                            </button>
                            <button type="button" onClick={() => moveBlock(index, "up")} disabled={index === 0} className={iconButton} aria-label={`Move ${meta.label} block up`}>
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlock(index, "down")}
                              disabled={index === blocks.length - 1}
                              className={iconButton}
                              aria-label={`Move ${meta.label} block down`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(index)}
                              className={cn(iconButton, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
                              aria-label={`Remove ${meta.label} block`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {!isCollapsed && <div className="space-y-4 p-4">{renderBlockEditor(block, index, updateBlockContent)}</div>}
                        </li>
                      );
                    })}
                  </ol>
                )}

                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Add a block</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    {BLOCK_TYPES.map((b) => (
                      <button
                        key={b.type}
                        type="button"
                        onClick={() => addBlock(b.type)}
                        className={cn(
                          "flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300",
                          focusRing
                        )}
                      >
                        <b.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className={cn("min-h-0 min-w-0 flex-1 flex-col lg:flex", tab === "preview" ? "flex" : "hidden")}>
          <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Live preview
              <span className="hidden sm:inline">· reflects unsaved edits</span>
            </span>
            {isLive && (
              <a
                href={`/${savedPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline dark:text-emerald-400", focusRing)}
              >
                Open /{savedPage.slug} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-5 dark:bg-slate-900">
            <div className="mx-auto min-h-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              {blocks.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Blocks you add will appear here.
                </div>
              ) : (
                blocks.map((block, i) => <BlockRenderer key={block.id || i} block={block} />)
              )}
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        errorCount={errorCount}
        onSave={savePage}
        onDiscard={discard}
        saveLabel={page.status === "published" ? "Save & publish" : "Save"}
        savedLabel={isLive ? "Saved · live" : "Saved as " + (savedPage?.status ?? "draft")}
      />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col" role="status" aria-label="Loading editor">
      <div className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <div className="flex flex-1">
        <div className="w-full space-y-4 p-5 lg:w-[460px] lg:border-r lg:border-slate-200 dark:lg:border-slate-800">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
        <div className="hidden flex-1 p-5 lg:block">
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function getDefaultContentForBlock(type: string) {
  switch (type) {
    case "hero": return { headline: "Amazing New Feature", subheading: "Discover the best way to manage your items online. Fast, secure, and beautiful.", primaryButtonText: "Get Started", primaryButtonLink: "/" };
    case "rich-text": return { html: "<h2>Your Heading Here</h2><p>Start typing your paragraph here...</p>" };
    case "feature-grid": return { title: "Why Choose Us", features: [{ title: "Fast", description: "Lightning fast performance" }, { title: "Secure", description: "Bank-level security" }] };
    case "faq": return { title: "Frequently Asked Questions", items: [{ question: "How does this work?", answer: "It is very simple..." }] };
    case "contact-form": return { title: "Contact Us", subtitle: "We'd love to hear from you." };
    case "statistics": return { title: "Our Impact", stats: [{ value: "10", prefix: "", suffix: "k+", label: "Users" }] };
    case "testimonials": return { title: "What people say", items: [{ name: "Jane Doe", role: "Customer", story: "Great experience!", avatar: "" }] };
    case "team": return { title: "Our Team", members: [{ name: "John Doe", role: "CEO", bio: "Leading the vision." }] };
    case "logo-cloud": return { title: "Trusted By", logos: [{ url: "https://via.placeholder.com/150", alt: "Logo" }] };
    case "timeline": return { title: "Our History", events: [{ year: "2023", title: "Founded", description: "The beginning." }] };
    case "gallery": return { title: "Gallery", images: [{ url: "https://via.placeholder.com/400", caption: "Photo 1" }] };
    case "cta": return { headline: "Ready to start?", subheading: "Join us today.", buttonText: "Sign Up", buttonLink: "/" };
    default: return {};
  }
}

// ---------------------------------------------------------------------------
// Block editors
// ---------------------------------------------------------------------------

type FieldSpec = { key: string; label: string; placeholder?: string; multiline?: boolean; wide?: boolean };

/** Editable list of objects (FAQ items, stats, team members…). All updates are immutable. */
function ListEditor({
  label,
  items,
  fields,
  newItem,
  itemName,
  onChange,
}: {
  label: string;
  items: any[] | undefined;
  fields: FieldSpec[];
  newItem: Record<string, string>;
  itemName: string;
  onChange: (next: any[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];
  const set = (i: number, key: string, value: string) => onChange(list.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} <span className="font-normal text-slate-400">({list.length})</span>
      </p>
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {itemName} {i + 1}
              </span>
              <div className="flex items-center">
                <button type="button" onClick={() => moveItem(i, i - 1)} disabled={i === 0} className={iconButton} aria-label={`Move ${itemName} ${i + 1} up`}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, i + 1)}
                  disabled={i === list.length - 1}
                  className={iconButton}
                  aria-label={`Move ${itemName} ${i + 1} down`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(list.filter((_, j) => j !== i))}
                  className={cn(iconButton, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
                  aria-label={`Remove ${itemName} ${i + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <Field key={f.key} label={f.label} className={cn((f.multiline || f.wide) && "sm:col-span-2")}>
                  {f.multiline ? (
                    <Textarea rows={2} value={item?.[f.key] ?? ""} onChange={(e) => set(i, f.key, e.target.value)} placeholder={f.placeholder} />
                  ) : (
                    <Input value={item?.[f.key] ?? ""} onChange={(e) => set(i, f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...list, { ...newItem }])}
        className={cn(
          "mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
          focusRing
        )}
      >
        + Add {itemName.toLowerCase()}
      </button>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline }: { label: string; value: unknown; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <Field label={label}>
      {multiline ? (
        <Textarea rows={2} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </Field>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function renderBlockEditor(block: any, index: number, updateFn: (idx: number, key: string, val: any) => void) {
  const content = block.content || {};
  const set = (key: string) => (v: any) => updateFn(index, key, v);

  switch (block.type) {
    case "hero":
      return (
        <>
          <TextField label="Headline" value={content.headline} onChange={set("headline")} />
          <TextField label="Subheading" value={content.subheading} onChange={set("subheading")} multiline />
          <Pair>
            <TextField label="Primary button text" value={content.primaryButtonText} onChange={set("primaryButtonText")} placeholder="Get started" />
            <TextField label="Primary button link" value={content.primaryButtonLink} onChange={set("primaryButtonLink")} placeholder="/" />
            <TextField label="Secondary button text" value={content.secondaryButtonText} onChange={set("secondaryButtonText")} />
            <TextField label="Secondary button link" value={content.secondaryButtonLink} onChange={set("secondaryButtonLink")} />
          </Pair>
          <TextField label="Background image URL (optional)" value={content.backgroundImage} onChange={set("backgroundImage")} placeholder="/uploads/…" />
        </>
      );

    case "rich-text":
      return (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Content</p>
          <TiptapEditor value={content.html || ""} onChange={set("html")} />
        </div>
      );

    case "feature-grid":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Features"
            itemName="Feature"
            items={content.features}
            onChange={set("features")}
            newItem={{ title: "New feature", description: "" }}
            fields={[
              { key: "title", label: "Title", wide: true },
              { key: "description", label: "Description", multiline: true },
            ]}
          />
        </>
      );

    case "faq":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Questions"
            itemName="Question"
            items={content.items}
            onChange={set("items")}
            newItem={{ question: "New question", answer: "Answer here" }}
            fields={[
              { key: "question", label: "Question", wide: true },
              { key: "answer", label: "Answer", multiline: true },
            ]}
          />
        </>
      );

    case "contact-form":
      return (
        <>
          <TextField label="Title" value={content.title} onChange={set("title")} />
          <TextField label="Subtitle" value={content.subtitle} onChange={set("subtitle")} />
          <TextField label="Button text" value={content.buttonText} onChange={set("buttonText")} placeholder="Submit message" />
        </>
      );

    case "statistics":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Stats"
            itemName="Stat"
            items={content.stats}
            onChange={set("stats")}
            newItem={{ value: "100", label: "New stat" }}
            fields={[
              { key: "value", label: "Value", placeholder: "10" },
              { key: "label", label: "Label", placeholder: "Users" },
              { key: "prefix", label: "Prefix", placeholder: "$" },
              { key: "suffix", label: "Suffix", placeholder: "k+" },
            ]}
          />
        </>
      );

    case "testimonials":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Testimonials"
            itemName="Testimonial"
            items={content.items}
            onChange={set("items")}
            newItem={{ name: "New person", story: "Great!" }}
            fields={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
              { key: "story", label: "Story", multiline: true },
              { key: "avatar", label: "Avatar URL", wide: true },
            ]}
          />
        </>
      );

    case "team":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Team members"
            itemName="Member"
            items={content.members}
            onChange={set("members")}
            newItem={{ name: "Name" }}
            fields={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
              { key: "photo", label: "Photo URL", wide: true },
              { key: "bio", label: "Bio", multiline: true },
            ]}
          />
        </>
      );

    case "logo-cloud":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Logos"
            itemName="Logo"
            items={content.logos}
            onChange={set("logos")}
            newItem={{ url: "" }}
            fields={[
              { key: "url", label: "Image URL" },
              { key: "alt", label: "Company name" },
            ]}
          />
        </>
      );

    case "timeline":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Events"
            itemName="Event"
            items={content.events}
            onChange={set("events")}
            newItem={{ year: String(new Date().getFullYear()), title: "New event" }}
            fields={[
              { key: "year", label: "Year / date" },
              { key: "title", label: "Title" },
              { key: "description", label: "Description", multiline: true },
            ]}
          />
        </>
      );

    case "gallery":
      return (
        <>
          <TextField label="Section title" value={content.title} onChange={set("title")} />
          <ListEditor
            label="Images"
            itemName="Image"
            items={content.images}
            onChange={set("images")}
            newItem={{ url: "" }}
            fields={[
              { key: "url", label: "Image URL" },
              { key: "caption", label: "Caption (optional)" },
            ]}
          />
        </>
      );

    case "cta":
      return (
        <>
          <TextField label="Headline" value={content.headline} onChange={set("headline")} />
          <TextField label="Subheading" value={content.subheading} onChange={set("subheading")} />
          <Pair>
            <TextField label="Button text" value={content.buttonText} onChange={set("buttonText")} />
            <TextField label="Button link" value={content.buttonLink} onChange={set("buttonLink")} placeholder="/" />
          </Pair>
        </>
      );

    case "divider":
      return <p className="text-sm text-slate-500 dark:text-slate-400">A thin line that separates the blocks above and below. Nothing to set.</p>;

    default:
      return <p className="text-sm text-slate-500 dark:text-slate-400">This block type has no editable options yet.</p>;
  }
}
