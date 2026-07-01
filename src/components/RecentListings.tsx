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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Recent Listings</h2>
            <p className="text-slate-600 max-w-2xl">
              Check out the latest lost and found items. Help reunite someone with their belongings today!
            </p>
          </div>
          <Link href="/browse" className="hidden sm:inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700">
            View All <PlusCircle className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                <Link href={`/items/${item.id}`} className="block">
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {item.photos && item.photos.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <ImageIcon className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                        item.type === "lost" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">{item.category}</div>
                      <div className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                        Unlock: ${(item.unlockAmount ? item.unlockAmount / 100 : 1).toFixed(2)}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {item.approximateLocation}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(item.dateLostFound)}</span>
                    </div>
                  </div>
                </Link>

                {/* Admin Actions Overlay */}
                {user?.role === "admin" && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    {/* Note: In a real app, editing from here might open a modal or navigate to an edit page. For now, we will navigate to the admin dashboard since editing logic lives there. */}
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-10 sm:hidden flex justify-center">
          <Link href="/browse" className="inline-flex items-center justify-center w-full px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            View All Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
