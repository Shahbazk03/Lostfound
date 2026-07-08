"use client";

import { useState, useEffect } from "react";
import { getFeatures, saveFeatures } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { Plus, Trash2, GripVertical, Search, Shield, Zap, Bell, CheckCircle, Smartphone, Lock } from "lucide-react";
import * as Icons from "lucide-react";

export default function FeaturesCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    getFeatures().then((data) => {
      setFeatures(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = () => {
    setFeatures([...features, { id: Date.now(), title: "New Feature", description: "Describe the benefit of this feature.", icon: "Shield", isActive: true }]);
  };

  const handleRemove = (index: number) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    setFeatures(newFeatures);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveFeatures(features);
    setSaving(false);
    alert("Features saved successfully!");
  };

  const formContent = (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Features List</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Feature
        </button>
      </div>

      {features.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No features added yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={feature.id || index} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex gap-4 ${!feature.isActive && 'opacity-60'}`}>
            <div className="mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={feature.isActive}
                    onChange={(e) => handleChange(index, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Visible on Homepage</span>
                </label>
                <button onClick={() => handleRemove(index)} className="text-red-500 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Feature Title</label>
                <input 
                  value={feature.title}
                  onChange={(e) => handleChange(index, "title", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea 
                  value={feature.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Icon (Lucide)</label>
                <select
                  value={feature.icon}
                  onChange={(e) => handleChange(index, "icon", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="Shield">Shield (Security/Trust)</option>
                  <option value="Zap">Zap (Speed/AI)</option>
                  <option value="Bell">Bell (Notifications)</option>
                  <option value="CheckCircle">CheckCircle (Success/Verified)</option>
                  <option value="Search">Search (Discovery)</option>
                  <option value="Smartphone">Smartphone (Mobile Ready)</option>
                  <option value="Lock">Lock (Privacy)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const previewContent = (
    <section className="py-20 bg-white dark:bg-[#0B1120]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose LostFound?</h2>
          <p className="text-slate-600 dark:text-slate-400">Discover the powerful features designed to make recovering lost items fast and secure.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.filter(f => f.isActive).map((feature, idx) => {
            // @ts-ignore
            const IconComponent = Icons[feature.icon] || Icons.Shield;
            return (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <IconComponent className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
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
      title="Features Section"
      description="Manage the key value propositions displayed on the homepage."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
