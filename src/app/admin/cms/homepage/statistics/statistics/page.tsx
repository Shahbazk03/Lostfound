"use client";

import { useState, useEffect } from "react";
import { getStatistics, saveStatistics } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { Plus, Trash2, GripVertical, TrendingUp, Users, Activity, CheckCircle, Search, Shield, Award } from "lucide-react";
import * as Icons from "lucide-react";

export default function StatisticsCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    getStatistics().then((data) => {
      setStats(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = () => {
    setStats([...stats, { id: Date.now(), label: "New Stat", numberValue: "0", icon: "TrendingUp", color: "emerald" }]);
  };

  const handleRemove = (index: number) => {
    const newStats = [...stats];
    newStats.splice(index, 1);
    setStats(newStats);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newStats = [...stats];
    newStats[index][field] = value;
    setStats(newStats);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveStatistics(stats);
    setSaving(false);
    alert("Statistics saved successfully!");
  };

  const formContent = (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Statistics Blocks</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Stat
        </button>
      </div>

      {stats.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No statistics added yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={stat.id || index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex gap-4">
            <div className="mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Number / Value</label>
                  <input 
                    value={stat.numberValue}
                    onChange={(e) => handleChange(index, "numberValue", e.target.value)}
                    placeholder="e.g. 50K+"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                  <input 
                    value={stat.label}
                    onChange={(e) => handleChange(index, "label", e.target.value)}
                    placeholder="e.g. Active Users"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Icon Name (Lucide)</label>
                  <select
                    value={stat.icon}
                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="Users">Users</option>
                    <option value="Activity">Activity</option>
                    <option value="CheckCircle">CheckCircle</option>
                    <option value="Search">Search</option>
                    <option value="TrendingUp">TrendingUp</option>
                    <option value="Shield">Shield</option>
                    <option value="Award">Award</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Color Theme</label>
                  <select
                    value={stat.color}
                    onChange={(e) => handleChange(index, "color", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="emerald">Emerald</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <button onClick={() => handleRemove(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const previewContent = (
    <section className="py-12 bg-white dark:bg-slate-900/30 backdrop-blur-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            // @ts-ignore - Dynamic icon rendering
            const IconComponent = Icons[stat.icon] || Icons.Activity;
            
            // Generate color classes based on selection
            const colorClasses: Record<string, string> = {
              emerald: "text-emerald-500 bg-emerald-500/10",
              blue: "text-blue-500 bg-blue-500/10",
              purple: "text-purple-500 bg-purple-500/10",
              orange: "text-orange-500 bg-orange-500/10",
            };
            
            const themeClass = colorClasses[stat.color || "emerald"] || colorClasses.emerald;

            return (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${themeClass}`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  {stat.numberValue}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <CMSLayout 
      title="Statistics Section"
      description="Manage the key metrics displayed below the hero section."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
