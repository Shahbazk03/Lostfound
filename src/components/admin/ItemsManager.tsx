"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  PackageSearch,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/Form";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { Drawer } from "@/components/admin/ui/Overlay";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

/** Shared by /admin/items, /admin/reports/lost and /admin/reports/found. */

interface Item {
  id: number;
  title: string;
  type: string;
  status: string;
  category?: string | null;
  description?: string | null;
  approximateLocation: string;
  city?: string | null;
  country?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  createdAt: string;
}

type ItemType = "lost" | "found";
type StatusFilter = "all" | "active" | "resolved" | "archived";
type TypeFilter = "all" | ItemType;

type EditForm = {
  id: number;
  title: string;
  category: string;
  approximateLocation: string;
  description: string;
  type: string;
  status: string;
};

const LIMITS = { title: 200, category: 100, approximateLocation: 255, description: 5000 };

function validate(form: EditForm) {
  const errors: Partial<Record<keyof EditForm, string>> = {};
  if (!form.title.trim()) errors.title = "Title is required";
  else if (form.title.trim().length > LIMITS.title) errors.title = `At most ${LIMITS.title} characters`;
  if (!form.category.trim()) errors.category = "Category is required";
  else if (form.category.trim().length > LIMITS.category) errors.category = `At most ${LIMITS.category} characters`;
  if (!form.approximateLocation.trim()) errors.approximateLocation = "Location is required";
  else if (form.approximateLocation.trim().length > LIMITS.approximateLocation)
    errors.approximateLocation = `At most ${LIMITS.approximateLocation} characters`;
  if (!form.description.trim()) errors.description = "Description is required";
  else if (form.description.trim().length > LIMITS.description) errors.description = `At most ${LIMITS.description} characters`;
  return errors;
}

export function ItemsManager({
  type,
  title,
  description,
}: {
  /** Only show items of this type; omit for all items. */
  type?: ItemType;
  title: string;
  description: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [form, setForm] = useState<EditForm | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const noun = type ? `${type} reports` : "items";

  const loadItems = useCallback(async () => {
    const data = await adminFetch<{ items?: Item[] }>("/api/admin/items", {}, "Failed to load items");
    setItems(data?.items ?? []);
  }, []);
  // fetchItems() re-runs the load quietly (after a change); reload() shows the skeleton.
  const { loading, error: loadError, reload, refresh: fetchItems } = useAdminLoader(loadItems, "Failed to load items");

  const scoped = useMemo(() => (type ? items.filter((i) => i.type === type) : items), [items, type]);
  const typed = useMemo(
    () => (!type && typeFilter !== "all" ? scoped.filter((i) => i.type === typeFilter) : scoped),
    [scoped, type, typeFilter]
  );
  const counts = useMemo(
    () => ({
      all: typed.length,
      active: typed.filter((i) => i.status === "active").length,
      resolved: typed.filter((i) => i.status === "resolved").length,
      archived: typed.filter((i) => i.status === "archived").length,
    }),
    [typed]
  );
  const rows = useMemo(
    () => (statusFilter === "all" ? typed : typed.filter((i) => i.status === statusFilter)),
    [typed, statusFilter]
  );

  const totals = {
    total: scoped.length,
    lost: scoped.filter((i) => i.type === "lost").length,
    found: scoped.filter((i) => i.type === "found").length,
    active: scoped.filter((i) => i.status === "active").length,
    resolved: scoped.filter((i) => i.status === "resolved").length,
    archived: scoped.filter((i) => i.status === "archived").length,
  };

  const openEdit = (item: Item) => {
    setTouched(false);
    setForm({
      id: item.id,
      title: item.title ?? "",
      category: item.category ?? "",
      approximateLocation: item.approximateLocation ?? "",
      description: item.description ?? "",
      type: item.type,
      status: item.status,
    });
  };

  const errors = form ? validate(form) : {};
  const hasErrors = Object.keys(errors).length > 0;

  const handleSaveItem = async () => {
    if (!form) return;
    setTouched(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        approximateLocation: form.approximateLocation.trim(),
        description: form.description.trim(),
        type: form.type,
        status: form.status,
      };
      await adminFetch(`/api/admin/items/${form.id}`, { method: "PATCH", json: payload }, "Failed to update item");
      setItems((prev) => prev.map((i) => (i.id === form.id ? { ...i, ...payload } : i)));
      toast.success("Item updated");
      setForm(null);
      fetchItems();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update item"));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (item: Item, status: "active" | "resolved" | "archived") => {
    if (status === "archived") {
      const ok = await confirm({
        title: `Archive "${item.title}"?`,
        message: "Archived reports are hidden from the public site. You can make it active again later.",
        confirmLabel: "Archive",
      });
      if (!ok) return;
    }
    setBusyId(item.id);
    try {
      await adminFetch(`/api/admin/items/${item.id}`, { method: "PATCH", json: { status } }, "Failed to update item");
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
      toast.success(
        status === "resolved" ? "Marked as resolved" : status === "archived" ? "Item archived" : "Marked as active"
      );
      fetchItems();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update item"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    const ok = await confirm({
      title: `Delete "${item.title}"?`,
      message:
        "The report will be permanently removed. Items with payments or unlocked chats are archived instead, to keep their records.",
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      const result = await adminFetch<{ success?: boolean; archived?: boolean }>(
        `/api/admin/items/${item.id}`,
        { method: "DELETE" },
        "Failed to delete item"
      );
      if (result?.archived) {
        toast.info("This item has payments or unlocked chats, so it was archived instead of deleted.");
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "archived" } : i)));
      } else {
        toast.success("Item deleted");
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
      if (form?.id === item.id) setForm(null);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete item"));
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Item>[] = [
    {
      id: "title",
      header: "Item",
      sortValue: (i) => i.title?.toLowerCase(),
      cell: (i) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{i.title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {[i.category, i.userName ? `by ${i.userName}` : "by unknown user"].filter(Boolean).join(" · ")}
          </p>
        </div>
      ),
    },
    ...(type
      ? []
      : [
          {
            id: "type",
            header: "Type",
            sortValue: (i: Item) => i.type,
            cell: (i: Item) => <StatusBadge kind="itemType" status={i.type} />,
          } satisfies Column<Item>,
        ]),
    {
      id: "status",
      header: "Status",
      sortValue: (i) => i.status,
      cell: (i) => <StatusBadge kind="item" status={i.status} />,
    },
    {
      id: "location",
      header: "Location",
      sortValue: (i) => i.approximateLocation?.toLowerCase(),
      cell: (i) => (
        <span className="flex max-w-[14rem] items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{i.approximateLocation || "—"}</span>
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Reported",
      sortValue: (i) => new Date(i.createdAt).getTime(),
      cell: (i) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(i.createdAt)}</span>,
    },
  ];

  const rowActions = (i: Item): MenuItem[] => [
    { label: "View public page", icon: ExternalLink, href: `/items/${i.id}`, external: true },
    { label: "Edit", icon: Pencil, onSelect: () => openEdit(i) },
    ...(i.status !== "resolved"
      ? [{ label: "Mark resolved", icon: CheckCircle2, onSelect: () => setStatus(i, "resolved"), separator: true, disabled: busyId === i.id }]
      : []),
    ...(i.status !== "active"
      ? [{ label: "Mark active", icon: RotateCcw, onSelect: () => setStatus(i, "active"), separator: i.status === "resolved", disabled: busyId === i.id }]
      : []),
    ...(i.status !== "archived"
      ? [{ label: "Archive", icon: Archive, onSelect: () => setStatus(i, "archived"), disabled: busyId === i.id }]
      : []),
    { label: "Delete", icon: Trash2, danger: true, separator: true, onSelect: () => handleDeleteItem(i), disabled: busyId === i.id },
  ];

  const summary = [
    { label: type ? `${type === "lost" ? "Lost" : "Found"} reports` : "All listings", value: totals.total },
    { label: "Active", value: totals.active },
    { label: "Resolved", value: totals.resolved },
    { label: "Archived", value: totals.archived },
  ];

  return (
    <PageContainer>
      <PageHeader title={title} description={description} />

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
              {loading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : s.value.toLocaleString()}
            </dd>
            {!type && s.label === "All listings" && !loading && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-rose-600 dark:text-rose-400">{totals.lost} lost</span> ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400">{totals.found} found</span>
              </p>
            )}
          </div>
        ))}
      </dl>

      <DataTable
        caption={title}
        rows={rows}
        columns={columns}
        getRowId={(i) => i.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: `Search ${noun}…`,
          match: (i, q) =>
            [i.title, i.approximateLocation, i.userName, i.userEmail, i.category, i.city, i.country]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <FilterTabs<StatusFilter>
              label="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "active", label: "Active", count: counts.active },
                { value: "resolved", label: "Resolved", count: counts.resolved },
                { value: "archived", label: "Archived", count: counts.archived },
              ]}
            />
            {!type && (
              <FilterTabs<TypeFilter>
                label="Filter by type"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: "all", label: "Any type" },
                  { value: "lost", label: "Lost" },
                  { value: "found", label: "Found" },
                ]}
              />
            )}
          </div>
        }
        resetKey={`${statusFilter}-${typeFilter}`}
        initialSort={{ id: "createdAt", dir: "desc" }}
        rowActions={rowActions}
        onRowClick={openEdit}
        rowLabel={(i) => `Edit ${i.title}`}
        empty={{
          icon: type === "found" ? PackageCheck : type === "lost" ? PackageSearch : Package,
          title: statusFilter === "all" && typeFilter === "all" ? `No ${noun} yet` : `No ${noun} with this filter`,
          description:
            statusFilter === "all" && typeFilter === "all"
              ? "Reports appear here as soon as people submit them."
              : "Try another status or type.",
          action:
            statusFilter !== "all" || typeFilter !== "all" ? (
              <Button
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Show all
              </Button>
            ) : undefined,
        }}
      />

      <Drawer
        open={!!form}
        onClose={() => setForm(null)}
        title={form ? `Edit item #${form.id}` : "Edit item"}
        description="Changes are visible on the public site immediately."
        headerExtra={
          form && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="itemType" status={form.type} />
              <StatusBadge kind="item" status={form.status} />
              <a
                href={`/items/${form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                View public page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveItem} loading={saving} disabled={touched && hasErrors}>
              Save changes
            </Button>
          </>
        }
      >
        {form && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveItem();
            }}
          >
            <Field label="Title" required error={touched ? errors.title : undefined}>
              <Input value={form.title} maxLength={LIMITS.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </Select>
              </Field>
              <Field label="Status">
                {/* Values must match item_status in the schema: active | resolved | archived. */}
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
            </div>
            <Field label="Category" required error={touched ? errors.category : undefined}>
              <Input value={form.category} maxLength={LIMITS.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Approximate location" required error={touched ? errors.approximateLocation : undefined}>
              <Input
                value={form.approximateLocation}
                maxLength={LIMITS.approximateLocation}
                onChange={(e) => setForm({ ...form, approximateLocation: e.target.value })}
              />
            </Field>
            <Field label="Description" required error={touched ? errors.description : undefined}>
              <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <button type="submit" hidden />
          </form>
        )}
      </Drawer>
    </PageContainer>
  );
}
