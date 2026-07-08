"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Trash2, CheckCircle, XCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function BlogCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") fetchComments();
  }, [user]);

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/admin/blog/comments");
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchComments();
    } catch (err) {
      alert("Error updating comment");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, { method: "DELETE" });
      if (res.ok) fetchComments();
    } catch (err) {
      alert("Error deleting comment");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Comments</h1>
            <p className="text-slate-500 dark:text-slate-400">Moderate blog comments.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden max-w-6xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comment</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Post</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : comments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No comments found.</td></tr>
              ) : (
                comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{comment.authorName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comment.authorEmail}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(comment.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {comment.message}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {comment.post?.title || "Unknown Post"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        comment.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        comment.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {comment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {comment.status !== 'approved' && (
                        <button onClick={() => handleUpdateStatus(comment.id, 'approved')} className="inline-flex p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {comment.status !== 'rejected' && (
                        <button onClick={() => handleUpdateStatus(comment.id, 'rejected')} className="inline-flex p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {comment.status !== 'spam' && (
                        <button onClick={() => handleUpdateStatus(comment.id, 'spam')} className="inline-flex p-2 text-slate-400 hover:text-red-600 transition-colors" title="Mark as Spam">
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(comment.id)} className="inline-flex p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
