"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  X,
  ImageIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { categories, countries } from "@/lib/utils";
import Background3D from "@/components/Background3D";

interface Item {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  city: string | null;
  country: string | null;
  dateLostFound: string;
  timeframe: string | null;
  photos: string[] | null;
  status: string;
  createdAt: string;
  userId: number;
  userName: string | null;
}

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    category: searchParams.get("category") || "",
    query: searchParams.get("query") || "",
    city: searchParams.get("city") || "",
    country: searchParams.get("country") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      query: "",
      city: "",
      country: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleDeleteItem = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await fetch(`/api/admin/items/${itemId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== itemId));
        }
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] relative">
      <Background3D />
      <div className="relative z-10 border-b border-slate-200 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Browse Listings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Search through lost and found items from around the world
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Search Bar */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-800/50 p-4 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                placeholder="Search by title, description, or location..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                showFilters
                  ? "bg-emerald-600 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-emerald-500 text-slate-900 dark:text-white text-xs rounded-full flex items-center justify-center">
                  {Object.values(filters).filter((v) => v !== "").length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => updateFilter("type", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => updateFilter("country", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  placeholder="Enter city name"
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white [color-scheme:dark] border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white [color-scheme:dark] border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingLogo className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800/50">
            <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No items found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden shadow-lg shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all group relative flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {item.photos && item.photos.length > 0 ? (
                    <img
                      src={item.photos[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                  <div
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      item.type === "lost"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.type === "lost" ? "Lost" : "Found"}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-medium text-emerald-400 mb-1.5">
                    {item.category}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="truncate max-w-[100px]">{item.approximateLocation}</span>
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      {formatDate(item.dateLostFound)}
                    </span>
                  </div>
                </div>

                {/* Admin Actions Overlay */}
                {user?.role === "admin" && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/admin?editItem=${item.id}`;
                      }}
                      className="p-2.5 bg-white/90 backdrop-blur-sm text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-full shadow-lg transition-colors"
                      title="Edit Item (Admin)"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="p-2.5 bg-white/90 backdrop-blur-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full shadow-lg transition-colors"
                      title="Delete Item (Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative">
          <Background3D />
          <LoadingLogo className="w-10 h-10 text-emerald-500 animate-spin relative z-10" />
        </div>
      }
    >
      <BrowsePageContent />
    </Suspense>
  );
}
