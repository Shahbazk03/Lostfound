"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, PlusCircle, Trash2, Layout, CheckCircle, Image as ImageIcon } from "lucide-react";
import { useCMS } from "../CMSProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function FooterPage() {
  const { data, updateFooter } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState<any>(data.footer || {
    logo: "", description: "", copyrightText: "", contactEmail: "", contactPhone: "", socialLinks: [], footerLinks: [], newsletterEnabled: true, isActive: true
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [cmsPages, setCmsPages] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/cms/pages").then(r => r.json()).then(setCmsPages).catch(console.error);
  }, []);

  useEffect(() => {
    setLocalData(data.footer || {
      logo: "", description: "", copyrightText: "", contactEmail: "", contactPhone: "", socialLinks: [], footerLinks: [], newsletterEnabled: true, isActive: true
    });
  }, [data.footer]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    if (updateFooter) updateFooter(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });

      if (res.ok) {
        setSuccessMsg("Footer saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save footer.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving footer.");
    } finally {
      setIsSaving(false);
    }
  };

  // Social Links
  const handleAddSocial = () => {
    const newSocial = [...(localData.socialLinks || []), { platform: "Twitter", url: "https://twitter.com", icon: "Twitter" }];
    handleChange("socialLinks", newSocial);
  };

  const handleUpdateSocial = (index: number, key: string, value: any) => {
    const newSocial = [...(localData.socialLinks || [])];
    newSocial[index] = { ...newSocial[index], [key]: value };
    handleChange("socialLinks", newSocial);
  };

  const handleRemoveSocial = (index: number) => {
    const newSocial = [...(localData.socialLinks || [])];
    newSocial.splice(index, 1);
    handleChange("socialLinks", newSocial);
  };

  // Footer Link Columns
  const handleAddColumn = () => {
    const newCols = [...(localData.footerLinks || []), { title: "New Column", links: [] }];
    handleChange("footerLinks", newCols);
  };

  const handleRemoveColumn = (index: number) => {
    const newCols = [...(localData.footerLinks || [])];
    newCols.splice(index, 1);
    handleChange("footerLinks", newCols);
  };

  const handleUpdateColumnTitle = (index: number, title: string) => {
    const newCols = [...(localData.footerLinks || [])];
    newCols[index].title = title;
    handleChange("footerLinks", newCols);
  };

  const handleAddLink = (colIndex: number) => {
    const newCols = [...(localData.footerLinks || [])];
    newCols[colIndex].links.push({ label: "New Link", url: "#" });
    handleChange("footerLinks", newCols);
  };

  const handleUpdateLink = (colIndex: number, linkIndex: number, key: string, value: string) => {
    const newCols = [...(localData.footerLinks || [])];
    newCols[colIndex].links[linkIndex][key] = value;
    handleChange("footerLinks", newCols);
  };

  const handleRemoveLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...(localData.footerLinks || [])];
    newCols[colIndex].links.splice(linkIndex, 1);
    handleChange("footerLinks", newCols);
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-500" />
            Footer Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global footer content and links</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Publish Changes"}
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-8">
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">General Info</h2>
          <div className="grid grid-cols-[200px_1fr] gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Logo</label>
              <ImageUpload
                label=""
                value={localData.logo || ""}
                onChange={(url) => handleChange("logo", url)}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={localData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={localData.contactEmail || ""}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Phone</label>
                  <input
                    type="text"
                    value={localData.contactPhone || ""}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={localData.copyrightText || ""}
                  onChange={(e) => handleChange("copyrightText", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localData.newsletterEnabled !== false}
                onChange={(e) => handleChange("newsletterEnabled", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Newsletter Form</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localData.isActive !== false}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Footer Active (Visible)</span>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Social Links</h2>
            <button
              onClick={handleAddSocial}
              className="text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Social
            </button>
          </div>
          <div className="space-y-4">
            {(localData.socialLinks || []).map((social: any, i: number) => (
              <div key={i} className="flex gap-4 items-center">
                <input
                  type="text"
                  value={social.platform || ""}
                  onChange={(e) => handleUpdateSocial(i, "platform", e.target.value)}
                  className="w-1/4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Platform"
                />
                <input
                  type="text"
                  value={social.url || ""}
                  onChange={(e) => handleUpdateSocial(i, "url", e.target.value)}
                  className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="URL"
                />
                <input
                  type="text"
                  value={social.icon || ""}
                  onChange={(e) => handleUpdateSocial(i, "icon", e.target.value)}
                  className="w-1/4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Lucide Icon"
                />
                <button
                  onClick={() => handleRemoveSocial(i)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Footer Link Columns</h2>
            <button
              onClick={handleAddColumn}
              className="text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Column
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(localData.footerLinks || []).map((col: any, i: number) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={col.title || ""}
                    onChange={(e) => handleUpdateColumnTitle(i, e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    placeholder="Column Title"
                  />
                  <button
                    onClick={() => handleRemoveColumn(i)}
                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {(col.links || []).map((link: any, j: number) => (
                    <div key={j} className="flex gap-2">
                      <input
                        type="text"
                        value={link.label || ""}
                        onChange={(e) => handleUpdateLink(i, j, "label", e.target.value)}
                        className="w-[30%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Label"
                      />
                      <select
                        value={link.pageId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newCols = [...(localData.footerLinks || [])];
                          if (val) {
                            newCols[i].links[j].pageId = parseInt(val);
                            newCols[i].links[j].url = undefined; // Clear URL if page ID is set
                          } else {
                            newCols[i].links[j].pageId = undefined;
                          }
                          handleChange("footerLinks", newCols);
                        }}
                        className="w-[35%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Custom URL</option>
                        {cmsPages.map(p => (
                          <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                        ))}
                      </select>
                      {!link.pageId && (
                        <input
                          type="text"
                          value={link.url || ""}
                          onChange={(e) => handleUpdateLink(i, j, "url", e.target.value)}
                          className="w-[35%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="URL"
                        />
                      )}
                      <button onClick={() => handleRemoveLink(i, j)} className="text-red-500 hover:text-red-600 px-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddLink(i)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    + Add Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
