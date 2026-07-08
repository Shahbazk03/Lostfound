"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Calendar, Edit, Trash2, ImageIcon, PlusCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  dateLostFound: string;
  photos: string[] | null;
  status: string;
  unlockAmount?: number;
}

export default function RecentListings() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentItems = async () => {
      try {
        const res = await fetch("/api/items?limit=6"); // Assuming the API handles limit, or it just returns some items
        if (res.ok) {
          const data = await res.json();
          setItems((data.items || []).slice(0, 6)); // Ensure max 6
        }
      } catch (error) {
        console.error("Failed to fetch recent items", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentItems();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingLogo className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Recent Activity
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Explore the latest reported items across our global network. Every recovery starts here.
            </p>
          </div>
          <Link href="/browse" className="inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
            View All Database <PlusCircle className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col relative"
              >
                <Link href={`/items/${item.id}`} className="block relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {item.photos && item.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                    </div>
                  )}
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                      item.type === "lost" 
                        ? "bg-rose-500/90 text-white border border-rose-400/50" 
                        : "bg-emerald-500/90 text-white border border-emerald-400/50"
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  
                  {item.unlockAmount && item.unlockAmount > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/90 text-white border border-amber-400/50 shadow-sm backdrop-blur-md">
                        Reward: ₹{item.unlockAmount}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      item.status === "resolved" 
                        ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-grow">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 mr-2 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{item.approximateLocation}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4 mr-2 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span>{formatDate(item.dateLostFound)}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <Link 
                      href={`/items/${item.id}`}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center transition-colors group/link"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {user?.role === "admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions Overlay (floating) */}
                {user?.role === "admin" && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hidden">
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
