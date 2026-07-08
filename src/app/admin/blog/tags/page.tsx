"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function BlogTagsPage() {
  const { user } = useAuth();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: ""
  });

  useEffect(() => {
    if (user?.role === "admin") fetchTags();
  }, [user]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/blog/tags");
      const data = await res.json();
      if (res.ok) setTags(data.tags || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (tag?: any) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        slug: tag.slug
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: "",
        slug: ""
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTag 
        ? `/api/admin/blog/tags/${editingTag.id}` 
        : `/api/admin/blog/tags`;
      const method = editingTag ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        fetchTags();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save tag");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving tag");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      const res = await fetch(`/api/admin/blog/tags/${id}`, { method: "DELETE" });
      if (res.ok) fetchTags();
    } catch (err) {
      alert("Error deleting tag");
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tags</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage blog tags.</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden max-w-4xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center">Loading...</td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No tags found.</td></tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{tag.slug}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(tag)} className="inline-flex p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tag.id)} className="inline-flex p-2 text-slate-400 hover:text-red-600 transition-colors">
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                {editingTag ? "Edit Tag" : "New Tag"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Slug</label>
                  <input required type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
