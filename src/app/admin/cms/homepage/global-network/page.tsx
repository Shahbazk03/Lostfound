"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, PlusCircle, Trash2, Globe2, GripVertical, CheckCircle } from "lucide-react";
import { useCMS } from "../CMSProvider";

export default function GlobalNetworkPage() {
  const { data, updateGlobalNetwork } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState(data.globalNetwork || { title: "", description: "", statistics: [] });
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalData(data.globalNetwork || { title: "", description: "", statistics: [] });
  }, [data.globalNetwork]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    if (updateGlobalNetwork) updateGlobalNetwork(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/global-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });

      if (res.ok) {
        setSuccessMsg("Global Network saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save global network.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving global network.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStat = (index: number, key: string, value: any) => {
    const newStats = [...(localData.statistics || [])];
    newStats[index] = { ...newStats[index], [key]: value };
    handleChange("statistics", newStats);
  };

  const handleAddStat = () => {
    const newStats = [...(localData.statistics || []), { label: "New Stat", value: "0" }];
    handleChange("statistics", newStats);
  };

  const handleRemoveStat = (index: number) => {
    const newStats = [...(localData.statistics || [])];
    newStats.splice(index, 1);
    handleChange("statistics", newStats);
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-emerald-500" />
            Global Network Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage the interactive map section</p>
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Section Title</label>
            <input
              type="text"
              value={localData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Global Recovery Network"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              value={localData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px]"
              placeholder="Our platform operates across borders..."
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localData.isActive !== false}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Section Active (Visible)</span>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Map Statistics</h2>
            <button
              onClick={handleAddStat}
              className="text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Stat
            </button>
          </div>
          <div className="space-y-4">
            {(localData.statistics || []).map((stat: any, i: number) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="text-slate-400 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={stat.label || ""}
                    onChange={(e) => handleUpdateStat(i, "label", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Label (e.g. Active Users)"
                  />
                  <input
                    type="text"
                    value={stat.value || ""}
                    onChange={(e) => handleUpdateStat(i, "value", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Value (e.g. 1M+)"
                  />
                </div>
                <button
                  onClick={() => handleRemoveStat(i)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
