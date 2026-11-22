"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { EmptyState, ErrorState } from "@/components/admin/AdminStates";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Form";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { focusRing, iconButton, inputBase } from "@/components/admin/ui/styles";

interface MediaFile {
  id: number;
  fileName: string;
  url: string;
  fileType: string;
  sizeBytes: number;
  createdAt: string;
}

type Upload = { key: string; name: string; size: number; state: "uploading" | "done" | "error"; error?: string };
type SortKey = "newest" | "oldest" | "name" | "size";

// Must match the media API: raster images only (SVG is rejected), max 5 MB.
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibrary() {
  const toast = useToast();
  const confirm = useConfirm();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keySeq = useRef(0);

  const loadMedia = useCallback(async () => {
    const data = await adminFetch<{ files?: MediaFile[] }>("/api/admin/media", {}, "Failed to load media");
    setFiles(data?.files ?? []);
  }, []);
  // fetchMedia() re-runs the load quietly (after a change); reload() shows the skeleton.
  const { loading, error: loadError, reload, refresh: fetchMedia } = useAdminLoader(loadMedia, "Failed to load media");

  const uploadFiles = async (list: FileList | File[]) => {
    const picked = Array.from(list);
    if (picked.length === 0) return;
    const entries = picked.map((file) => {
      const key = `u${++keySeq.current}`;
      let error: string | undefined;
      if (!ALLOWED.includes(file.type)) error = "Only JPG, PNG, WebP, GIF or AVIF images";
      else if (file.size > MAX_BYTES) error = "Larger than 5 MB";
      return { file, upload: { key, name: file.name, size: file.size, state: error ? "error" : "uploading", error } as Upload };
    });
    setUploads((prev) => [...entries.map((e) => e.upload), ...prev].slice(0, 12));

    let ok = 0;
    let failed = entries.filter((e) => e.upload.state === "error").length;
    await Promise.all(
      entries
        .filter((e) => e.upload.state === "uploading")
        .map(async ({ file, upload }) => {
          const form = new FormData();
          form.append("file", file);
          try {
            await adminFetch("/api/admin/media", { method: "POST", body: form }, "Upload failed");
            ok++;
            setUploads((prev) => prev.map((u) => (u.key === upload.key ? { ...u, state: "done" } : u)));
          } catch (err) {
            failed++;
            setUploads((prev) =>
              prev.map((u) => (u.key === upload.key ? { ...u, state: "error", error: errorMessage(err, "Upload failed") } : u))
            );
          }
        })
    );
    if (ok > 0) {
      toast.success(ok === 1 ? "Image uploaded" : `${ok} images uploaded`);
      fetchMedia();
    }
    if (failed > 0) toast.error(failed === 1 ? "1 file couldn't be uploaded" : `${failed} files couldn't be uploaded`);
  };

  const handleDelete = async (file: MediaFile) => {
    const ok = await confirm({
      title: `Delete ${file.fileName}?`,
      message: "Pages or posts that still use this image will show a broken image.",
    });
    if (!ok) return;
    setDeletingId(file.id);
    try {
      await adminFetch(`/api/admin/media?id=${file.id}`, { method: "DELETE" }, "Failed to delete file");
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete file"));
    } finally {
      setDeletingId(null);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? files.filter((f) => f.fileName.toLowerCase().includes(q)) : [...files];
    const time = (f: MediaFile) => new Date(f.createdAt).getTime();
    switch (sort) {
      case "oldest":
        return list.sort((a, b) => time(a) - time(b));
      case "name":
        return list.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
      case "size":
        return list.sort((a, b) => b.sizeBytes - a.sizeBytes);
      default:
        return list.sort((a, b) => time(b) - time(a));
    }
  }, [files, search, sort]);

  const totalSize = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
  const uploading = uploads.some((u) => u.state === "uploading");

  return (
    <PageContainer>
      <PageHeader
        title="Media library"
        description="Images uploaded for pages and the homepage. Copy a link to use it anywhere on the site."
        meta={
          !loading && !loadError ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
            </span>
          ) : undefined
        }
        actions={
          <Button variant="primary" onClick={() => inputRef.current?.click()} loading={uploading}>
            {!uploading && <UploadCloud className="h-4 w-4" />}
            Upload images
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Dropzone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mb-6 rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-8",
          dragActive
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
          Drop images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn("rounded text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400", focusRing)}
          >
            browse files
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPG, PNG, WebP, GIF or AVIF · up to 5 MB each · several at once</p>

        {uploads.length > 0 && (
          <ul className="mx-auto mt-5 max-w-xl space-y-2 text-left" aria-live="polite">
            {uploads.map((u) => (
              <li
                key={u.key}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                {u.state === "uploading" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600" aria-label="Uploading" />
                ) : u.state === "done" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Uploaded" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-label="Failed" />
                )}
                <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{u.name}</span>
                <span className={cn("shrink-0 text-xs", u.state === "error" ? "text-red-600 dark:text-red-400" : "text-slate-400")}>
                  {u.state === "error" ? u.error : u.state === "uploading" ? "Uploading…" : formatBytes(u.size)}
                </span>
              </li>
            ))}
            {!uploading && (
              <li className="text-right">
                <button
                  type="button"
                  onClick={() => setUploads([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Clear list
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Library */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-slate-800">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              aria-label="Search files"
              className={cn(inputBase, "h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-44">
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort files" className="h-10">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A–Z)</option>
              <option value="size">Largest first</option>
            </Select>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="status" aria-label="Loading media">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={reload} />
          ) : visible.length === 0 ? (
            search ? (
              <EmptyState
                icon={ImageIcon}
                title="No files match your search"
                action={
                  <Button size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="No images yet"
                description="Upload images to use them in pages and homepage sections."
                action={
                  <Button variant="primary" onClick={() => inputRef.current?.click()}>
                    <UploadCloud className="h-4 w-4" /> Upload images
                  </Button>
                }
              />
            )
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((file) => (
                <li
                  key={file.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("relative block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800", focusRing)}
                    aria-label={`Open ${file.fileName} in a new tab`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.fileName}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                  </a>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => copyUrl(file.url)}
                        className={cn(iconButton, "h-9 w-9 sm:h-8 sm:w-8")}
                        aria-label={`Copy link to ${file.fileName}`}
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(iconButton, "h-9 w-9 sm:h-8 sm:w-8")}
                        aria-label={`Open ${file.fileName} in a new tab`}
                        title="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        disabled={deletingId === file.id}
                        className={cn(
                          iconButton,
                          "ml-auto h-9 w-9 hover:bg-red-50 hover:text-red-600 sm:h-8 sm:w-8 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        )}
                        aria-label={`Delete ${file.fileName}`}
                        title="Delete"
                      >
                        {deletingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
