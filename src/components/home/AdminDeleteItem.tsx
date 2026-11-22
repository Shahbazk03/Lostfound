"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Admin-only delete button for a server-rendered listing card. Renders
 * nothing for everyone else. The delete purges the homepage cache, so a
 * router refresh shows the updated list.
 */
export function AdminDeleteItem({ id, title }: { id: number; title: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (user?.role !== "admin") return null;

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      title="Delete listing (admin)"
      aria-label={`Delete ${title} (admin)`}
      className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:bg-slate-900/95 dark:text-slate-400 dark:hover:bg-red-500/10"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
