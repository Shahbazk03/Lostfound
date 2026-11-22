"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Copy, ExternalLink, FilePlus2, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { Field, Input } from "@/components/admin/ui/Form";
import { Dialog } from "@/components/admin/ui/Overlay";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import type { MenuItem } from "@/components/admin/ui/Menu";

interface Page {
  id: number;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  authorName?: string | null;
}

type StatusFilter = "all" | "published" | "draft" | "other";

export const SLUG_PATTERN = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;

export function slugify(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "MMM d, yyyy");
}

export default function CMSPagesClient() {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<Page[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // The command palette's "New CMS page" lands here with ?new=1.
  const wantsNew = searchParams.get("new") === "1";
  const showDialog = dialogOpen || wantsNew;
  const closeDialog = () => {
    setDialogOpen(false);
    if (wantsNew) router.replace("/admin/cms/pages");
  };

  const loadPages = useCallback(async () => {
    const data = await adminFetch<Page[]>("/api/admin/cms/pages", {}, "Failed to load pages");
    setPages(Array.isArray(data) ? data : []);
  }, []);
  const { loading, error: loadError, reload } = useAdminLoader(loadPages, "Failed to load pages");

  const deletePage = async (page: Page) => {
    const ok = await confirm({
      title: `Delete "${page.title}"?`,
      message: `/${page.slug} will stop working${page.status === "published" ? " immediately" : ""}. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/cms/pages/${page.id}`, { method: "DELETE" }, "Failed to delete page");
      toast.success("Page deleted");
      setPages((prev) => prev.filter((p) => p.id !== page.id));
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete page"));
    }
  };

  const copyUrl = async (page: Page) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${page.slug}`);
      toast.success("Page URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  const counts = useMemo(() => {
    const c = { all: pages.length, published: 0, draft: 0, other: 0 };
    for (const p of pages) {
      if (p.status === "published") c.published++;
      else if (p.status === "draft") c.draft++;
      else c.other++;
    }
    return c;
  }, [pages]);

  const rows = useMemo(
    () =>
      filter === "all"
        ? pages
        : pages.filter((p) =>
            filter === "other" ? p.status !== "published" && p.status !== "draft" : p.status === filter
          ),
    [pages, filter]
  );

  const columns: Column<Page>[] = [
    {
      id: "title",
      header: "Page",
      sortValue: (p) => p.title.toLowerCase(),
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900 dark:text-white">{p.title}</div>
            <div className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">/{p.slug}</div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (p) => p.status,
      cell: (p) => <StatusBadge kind="page" status={p.status} />,
    },
    {
      id: "updatedAt",
      header: "Last updated",
      sortValue: (p) => new Date(p.updatedAt).getTime() || 0,
      cell: (p) => (
        <div>
          <div className="text-slate-900 dark:text-white">{safeDate(p.updatedAt)}</div>
          {p.authorName && <div className="text-xs text-slate-500 dark:text-slate-400">by {p.authorName}</div>}
        </div>
      ),
    },
  ];

  const rowActions = (p: Page): MenuItem[] => [
    { label: "Edit page", icon: Pencil, href: `/admin/cms/pages/${p.id}` },
    ...(p.status === "published"
      ? [{ label: "View live", icon: ExternalLink, href: `/${p.slug}`, external: true } satisfies MenuItem]
      : []),
    { label: "Copy URL", icon: Copy, onSelect: () => copyUrl(p) },
    { label: "Delete", icon: Trash2, danger: true, separator: true, onSelect: () => deletePage(p) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Pages"
        description="Standalone pages built from content blocks, such as About, Contact or Press."
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New page
          </Button>
        }
      />

      <DataTable
        caption="CMS pages"
        rows={rows}
        columns={columns}
        getRowId={(p) => p.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: "Search title or slug…",
          match: (p, q) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
        }}
        toolbar={
          <FilterTabs<StatusFilter>
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "published", label: "Published", count: counts.published },
              { value: "draft", label: "Drafts", count: counts.draft },
              { value: "other", label: "Other", count: counts.other },
            ]}
          />
        }
        resetKey={filter}
        initialSort={{ id: "updatedAt", dir: "desc" }}
        rowActions={rowActions}
        onRowClick={(p) => router.push(`/admin/cms/pages/${p.id}`)}
        rowLabel={(p) => `Edit ${p.title}`}
        empty={
          filter === "all"
            ? {
                icon: FileText,
                title: "No pages yet",
                description: "Create your first page, then add blocks like text, FAQs or a contact form.",
                action: (
                  <Button variant="primary" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    New page
                  </Button>
                ),
              }
            : { icon: FileText, title: "No pages with this status" }
        }
      />

      <NewPageDialog open={showDialog} onClose={closeDialog} existingSlugs={pages.map((p) => p.slug.toLowerCase())} />
    </PageContainer>
  );
}

function NewPageDialog({ open, onClose, existingSlugs }: { open: boolean; onClose: () => void; existingSlugs: string[] }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New page"
      description="It starts as a draft. You can change the title and URL later."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="new-cms-page-form">
            <FilePlus2 className="h-4 w-4" />
            Create page
          </Button>
        </>
      }
    >
      <NewPageForm existingSlugs={existingSlugs} />
    </Dialog>
  );
}

function NewPageForm({ existingSlugs }: { existingSlugs: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [creating, setCreating] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const titleError = !title.trim() ? "Give the page a title" : title.trim().length > 255 ? "Keep it under 255 characters" : null;
  const slugError = !effectiveSlug
    ? "Add a URL slug"
    : !SLUG_PATTERN.test(effectiveSlug)
      ? "Use letters, numbers, - and _ only (slashes separate parts)"
      : existingSlugs.includes(effectiveSlug.toLowerCase())
        ? "Another page already uses this URL"
        : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (titleError || slugError || creating) return;
    setCreating(true);
    try {
      const newPage = await adminFetch<Page>(
        "/api/admin/cms/pages",
        { method: "POST", json: { title: title.trim(), slug: effectiveSlug, status: "draft" } },
        "Failed to create page"
      );
      toast.success("Draft created");
      router.push(`/admin/cms/pages/${newPage.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create page"));
      setCreating(false);
    }
  };

  return (
    <form id="new-cms-page-form" onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Title" required error={submitted || title ? titleError : null}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="About us" data-autofocus maxLength={255} />
      </Field>
      <Field
        label="URL"
        required
        error={submitted || slugTouched ? slugError : null}
        hint={effectiveSlug ? `The page will live at /${effectiveSlug} once published.` : undefined}
      >
        <Input
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.trim().replace(/^\/+/, ""));
          }}
          placeholder="about-us"
          className="font-mono"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      {creating && <p className="text-sm text-slate-500 dark:text-slate-400">Creating draft…</p>}
    </form>
  );
}
