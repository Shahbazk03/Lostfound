"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Settings,
  FolderOpen,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  Archive
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BlogDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, postsRes] = await Promise.all([
        fetch("/api/admin/blog/analytics"),
        fetch("/api/admin/blog/posts")
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setRecentPosts(postsData.posts?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Posts", value: stats?.totalPosts || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Published", value: stats?.publishedPosts || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Drafts", value: stats?.draftPosts || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Total Views", value: stats?.totalViews || 0, icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Categories", value: stats?.totalCategories || 0, icon: FolderOpen, color: "text-pink-500", bg: "bg-pink-500/10" },
    { title: "Comments", value: stats?.totalComments || 0, icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Blog Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and publish SEO-optimized blog articles.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/blog/categories"
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
          >
            <FolderOpen className="w-4 h-4" />
            Categories
          </Link>
          <Link
            href="/admin/blog/create"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Post
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Posts</h2>
          <Link href="/admin/blog/posts" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No posts found. Start writing!
                  </td>
                </tr>
              ) : (
                recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.featuredImage ? (
                          <img src={post.featuredImage} alt={post.title} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{post.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{post.category?.name || "Uncategorized"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        post.status === 'draft' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400'
                      }`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {post.author?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
