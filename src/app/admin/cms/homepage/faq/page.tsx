"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, PlusCircle, Trash2, HelpCircle, GripVertical, CheckCircle } from "lucide-react";
import { useCMS } from "../CMSProvider";

export default function HomepageFaqPage() {
  const { data, updateFaq } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState(data.faq || { title: "", description: "", items: [] });
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalData(data.faq || { title: "", description: "", items: [] });
  }, [data.faq]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    if (updateFaq) updateFaq(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });

      if (res.ok) {
        setSuccessMsg("FAQ saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save FAQ.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newItems = [...(localData.items || [])];
    newItems[index] = { ...newItems[index], [key]: value };
    handleChange("items", newItems);
  };

  const handleAddItem = () => {
    const newItems = [...(localData.items || []), { question: "New Question", answer: "New Answer" }];
    handleChange("items", newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(localData.items || [])];
    newItems.splice(index, 1);
    handleChange("items", newItems);
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-500" />
            Homepage FAQ Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage the frequently asked questions section</p>
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Section Title</label>
            <input
              type="text"
              value={localData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Frequently Asked Questions"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              value={localData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Find answers to common questions..."
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">FAQ Items</h2>
              <p className="text-sm text-slate-500">Add or remove questions</p>
            </div>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {(localData.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group">
                <div className="mt-2 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 dark:hover:text-slate-200">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Question</label>
                    <input
                      type="text"
                      value={item.question || ""}
                      onChange={(e) => handleUpdateItem(i, "question", e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Answer</label>
                    <textarea
                      value={item.answer || ""}
                      onChange={(e) => handleUpdateItem(i, "answer", e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-24"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(i)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-8"
                  title="Remove Item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            {(!localData.items || localData.items.length === 0) && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
                No FAQ items found. Click the button above to add one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
