"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, PlusCircle, Trash2, PieChart, GripVertical, CheckCircle } from "lucide-react";
import { useCMS } from "../CMSProvider";

export default function StatisticsPage() {
  const { data, updateStatistics } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localList, setLocalList] = useState<any[]>(data.statisticsList || []);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalList(data.statisticsList || []);
  }, [data.statisticsList]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/statistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statistics: localList }),
      });

      if (res.ok) {
        setSuccessMsg("Statistics saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save statistics.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving statistics.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = (index: number, key: string, value: any) => {
    const newList = [...localList];
    newList[index] = { ...newList[index], [key]: value };
    setLocalList(newList);
    updateStatistics(newList);
  };

  const handleAdd = () => {
    const newList = [
      ...localList,
      { label: "New Stat", numberValue: "0", color: "emerald", isActive: true }
    ];
    setLocalList(newList);
    updateStatistics(newList);
  };

  const handleRemove = (index: number) => {
    const newList = [...localList];
    newList.splice(index, 1);
    setLocalList(newList);
    updateStatistics(newList);
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            Statistics Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage stats displayed below the hero section</p>
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

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {localList.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="mt-2 text-slate-400 cursor-grab">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Value</label>
                <input
                  type="text"
                  value={stat.numberValue || ""}
                  onChange={(e) => handleUpdate(i, "numberValue", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 15,000+"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Label</label>
                <input
                  type="text"
                  value={stat.label || ""}
                  onChange={(e) => handleUpdate(i, "label", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Recovered Items"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Color</label>
                <select
                  value={stat.color || "emerald"}
                  onChange={(e) => handleUpdate(i, "color", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="emerald">Emerald</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="slate">Slate</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stat.isActive !== false}
                    onChange={(e) => handleUpdate(i, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-100 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active (Visible)</span>
                </label>
              </div>
            </div>
            <button
              onClick={() => handleRemove(i)}
              className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        <button
          onClick={handleAdd}
          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors font-semibold"
        >
          <PlusCircle className="w-5 h-5" />
          Add Statistic
        </button>
      </div>
    </div>
  );
}
