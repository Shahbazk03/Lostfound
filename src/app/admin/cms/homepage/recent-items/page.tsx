import Link from "next/link";
import { Clock, ExternalLink, Package, RefreshCw } from "lucide-react";

export default function RecentItemsPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex items-start gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Recent items</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Filled automatically, nothing to publish here.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">This section updates itself</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            The homepage shows the newest <strong className="font-semibold text-slate-900 dark:text-white">active</strong> lost
            and found listings straight from the database. To change what appears, manage the listings themselves:
            resolved and archived items drop out automatically.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              The public homepage refreshes its cache within about a minute of a change.
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin/items"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Package className="h-4 w-4" />
              Manage listings
            </Link>
            <a
              href="/browse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" />
              View on site
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
