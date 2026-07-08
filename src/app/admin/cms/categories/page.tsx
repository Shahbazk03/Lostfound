"use client";

import { useState, useEffect } from "react";
import { getCategories, saveCategories } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { Plus, Trash2, GripVertical, Image as ImageIcon, Laptop, Key, Briefcase, Glasses, Search } from "lucide-react";
import * as Icons from "lucide-react";

export default function CategoriesCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = () => {
    setCategories([...categories, { id: Date.now(), name: "New Category", description: "Category description", icon: "Package", image: "", isActive: true }]);
  };

  const handleRemove = (index: number) => {
    const newCats = [...categories];
    newCats.splice(index, 1);
    setCategories(newCats);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newCats = [...categories];
    newCats[index][field] = value;
    setCategories(newCats);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveCategories(categories);
    setSaving(false);
    alert("Categories saved successfully!");
  };

  const formContent = (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Item Categories</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No categories added yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat, index) => (
          <div key={cat.id || index} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex gap-4 ${!cat.isActive && 'opacity-60'}`}>
            <div className="mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cat.isActive}
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
                <label className="block text-xs font-medium text-slate-500 mb-1">Category Name</label>
                <input 
                  value={cat.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input 
                  value={cat.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Icon (Lucide)</label>
                  <select
                    value={cat.icon}
                    onChange={(e) => handleChange(index, "icon", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="Laptop">Laptop / Electronics</option>
                    <option value="Key">Key / Keys</option>
                    <option value="Briefcase">Briefcase / Bags</option>
                    <option value="Glasses">Glasses / Accessories</option>
                    <option value="CreditCard">CreditCard / Wallets</option>
                    <option value="Smartphone">Smartphone / Phones</option>
                    <option value="Package">Package / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Image URL (Optional)</label>
                  <input 
                    value={cat.image}
                    onChange={(e) => handleChange(index, "image", e.target.value)}
                    placeholder="/uploads/..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const previewContent = (
    <section className="py-16 bg-slate-50 dark:bg-[#0B1120]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Browse by Category</h2>
          <p className="text-slate-600 dark:text-slate-400">Select a category to quickly find what you're looking for.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {categories.filter(c => c.isActive).map((cat, idx) => {
            // @ts-ignore
            const IconComponent = Icons[cat.icon] || Icons.Package;
            return (
              <div key={idx} className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-emerald-500/50 transition-all text-center">
                <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                  <IconComponent className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{cat.description}</p>
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
      title="Categories Section"
      description="Manage the item categories displayed on the homepage."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
