"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Link2, Type, GripVertical, CheckCircle, Megaphone } from "lucide-react";
import { useCMS } from "../CMSProvider";

export default function HomepageCtaPage() {
  const { data, updateCta } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState(data.cta || { 
    headline: "Ready to Find What You've Lost?", 
    subheading: "",
    primaryButtonText: "Browse Items",
    primaryButtonLink: "/browse",
    secondaryButtonText: "Report Item",
    secondaryButtonLink: "/report",
    isActive: true
  });
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalData(data.cta || { 
      headline: "Ready to Find What You've Lost?", 
      subheading: "",
      primaryButtonText: "Browse Items",
      primaryButtonLink: "/browse",
      secondaryButtonText: "Report Item",
      secondaryButtonLink: "/report",
      isActive: true
    });
  }, [data.cta]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    if (updateCta) updateCta(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });

      if (res.ok) {
        setSuccessMsg("CTA saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save CTA.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving CTA.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-500" />
            Homepage CTA Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage the final call-to-action section</p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Section Details</h2>
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Show Section</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={localData.isActive !== false}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
              </div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Headline</label>
            <input
              type="text"
              value={localData.headline || ""}
              onChange={(e) => handleChange("headline", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ready to Find What You've Lost?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subheading (Optional)</label>
            <textarea
              value={localData.subheading || ""}
              onChange={(e) => handleChange("subheading", e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Join thousands of users..."
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-emerald-500" />
              Primary Button
            </h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Button Text</label>
              <input
                type="text"
                value={localData.primaryButtonText || ""}
                onChange={(e) => handleChange("primaryButtonText", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Browse Items"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Button Link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={localData.primaryButtonLink || ""}
                  onChange={(e) => handleChange("primaryButtonLink", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="/browse"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-slate-500" />
              Secondary Button
            </h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Button Text</label>
              <input
                type="text"
                value={localData.secondaryButtonText || ""}
                onChange={(e) => handleChange("secondaryButtonText", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Report Item"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Button Link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={localData.secondaryButtonLink || ""}
                  onChange={(e) => handleChange("secondaryButtonLink", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="/report"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
