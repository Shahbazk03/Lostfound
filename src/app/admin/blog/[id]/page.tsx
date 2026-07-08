"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Layout, Eye, Settings, Image as ImageIcon, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft",
    categoryId: "",
    featuredImage: "",
    allowComments: true,
    featured: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    tags: [] as number[],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editor"); 

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/blog/categories").then(res => res.json()),
      fetch("/api/admin/blog/tags").then(res => res.json()),
      fetch(`/api/admin/blog/posts/${postId}`).then(res => res.json())
    ]).then(([cats, tgs, postData]) => {
      setCategories(cats.categories || []);
      setTags(tgs.tags || []);
      if (postData.post) {
        const p = postData.post;
        setFormData({
          title: p.title || "",
          slug: p.slug || "",
          excerpt: p.excerpt || "",
          content: p.content || "",
          status: p.status || "draft",
          categoryId: p.categoryId ? p.categoryId.toString() : "",
          featuredImage: p.featuredImage || "",
          allowComments: p.allowComments !== false,
          featured: !!p.featured,
          seoTitle: p.seoTitle || "",
          seoDescription: p.seoDescription || "",
          seoKeywords: p.seoKeywords || "",
          canonicalUrl: p.canonicalUrl || "",
          tags: p.tags || [],
        });
      }
      setLoading(false);
    });
  }, [postId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateSlug = () => {
    if (!formData.title) return;
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSave = async (status?: string) => {
    setSaving(true);
    try {
      const dataToSave = { ...formData };
      if (status) {
        dataToSave.status = status;
        setFormData(prev => ({ ...prev, status }));
      }
      
      const res = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSave, categoryId: dataToSave.categoryId ? parseInt(dataToSave.categoryId) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to save post");
      } else {
        // Optional: show a toast notification
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/admin/blog/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/blog");
      }
    } catch (err) {
      alert("Error deleting post");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              formData.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
              'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
            }`}>
              {formData.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {formData.status !== 'published' && (
            <button 
              onClick={() => handleSave("published")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Settings */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-2 gap-2">
            <button 
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button 
              onClick={() => setActiveTab("seo")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'seo' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Eye className="w-4 h-4" /> SEO
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "settings" ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                  <select 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Featured Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="featuredImage" 
                      value={formData.featuredImage} 
                      onChange={handleChange}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  {formData.featuredImage && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video relative">
                      <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      name="featured" 
                      checked={formData.featured} 
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Feature this post</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      name="allowComments" 
                      checked={formData.allowComments} 
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Allow comments</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SEO Title</label>
                  <input 
                    type="text" 
                    name="seoTitle" 
                    value={formData.seoTitle} 
                    onChange={handleChange}
                    placeholder="SEO Title (60 chars)"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SEO Description</label>
                  <textarea 
                    name="seoDescription" 
                    value={formData.seoDescription} 
                    onChange={handleChange}
                    placeholder="SEO Description (160 chars)"
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Keywords</label>
                  <input 
                    type="text" 
                    name="seoKeywords" 
                    value={formData.seoKeywords} 
                    onChange={handleChange}
                    placeholder="keyword1, keyword2"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Canonical URL</label>
                  <input 
                    type="text" 
                    name="canonicalUrl" 
                    value={formData.canonicalUrl} 
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Editor */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8 flex justify-center">
          <div className="max-w-3xl w-full">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={generateSlug}
              placeholder="Post Title"
              className="w-full text-5xl font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 mb-4 focus:ring-0 px-0"
            />
            
            <div className="flex items-center gap-2 mb-8 text-sm text-slate-500">
              <span>lostfound.com/blog/</span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="post-slug"
                className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 outline-none focus:border-emerald-500 focus:ring-0 px-0 w-64 text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Write a brief excerpt (optional)..."
              rows={2}
              className="w-full text-lg bg-transparent border-none outline-none text-slate-600 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-700 mb-8 focus:ring-0 px-0 resize-none"
            />

            {/* Simulated Rich Text Editor for now */}
            <div className="min-h-[500px] border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Start writing your masterpiece... (HTML supported)"
                className="w-full h-[500px] text-base bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0 px-0 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Preview Panel (Split Screen Mode) */}
        <div className="w-[400px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden xl:flex flex-col h-full">
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transform scale-90 origin-top">
              {formData.featuredImage && (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-800">
                  <img src={formData.featuredImage} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    {categories.find(c => c.id.toString() === formData.categoryId)?.name || "Category"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                  {formData.title || "Untitled Post"}
                </h1>
                {formData.excerpt && (
                  <p className="text-slate-500 dark:text-slate-400 mb-6 italic">{formData.excerpt}</p>
                )}
                <div 
                  className="prose dark:prose-invert prose-emerald max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: formData.content || "<p class='text-slate-400'>Content preview...</p>" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
