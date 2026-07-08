"use client";

import { useState, useEffect } from "react";
import { getPricingPlans, savePricingPlans } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { Plus, Trash2, GripVertical, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PricingCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    getPricingPlans().then((data) => {
      setPlans(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = () => {
    setPlans([...plans, { 
      id: Date.now(), 
      name: "New Plan", 
      price: "0", 
      period: "forever", 
      description: "Basic features for everyone.", 
      features: ["Feature 1", "Feature 2"],
      buttonText: "Get Started",
      buttonLink: "/register",
      isPopular: false,
      isActive: true 
    }]);
  };

  const handleRemove = (index: number) => {
    const newList = [...plans];
    newList.splice(index, 1);
    setPlans(newList);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newList = [...plans];
    newList[index][field] = value;
    setPlans(newList);
  };

  const handleFeaturesChange = (index: number, value: string) => {
    const features = value.split("\n").filter(f => f.trim() !== "");
    handleChange(index, "features", features);
  };

  const handleSave = async () => {
    setSaving(true);
    await savePricingPlans(plans);
    setSaving(false);
    alert("Pricing plans saved successfully!");
  };

  const formContent = (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pricing Plans</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500">No pricing plans added yet.</p>
        </div>
      )}

      <div className="space-y-6">
        {plans.map((plan, index) => (
          <div key={plan.id || index} className={`bg-white dark:bg-slate-900 border ${plan.isPopular ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-4 shadow-sm flex gap-4 ${!plan.isActive && 'opacity-60'}`}>
            <div className="mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={plan.isActive}
                      onChange={(e) => handleChange(index, "isActive", e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={plan.isPopular}
                      onChange={(e) => handleChange(index, "isPopular", e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-emerald-600">Mark as Popular</span>
                  </label>
                </div>
                <button onClick={() => handleRemove(index)} className="text-red-500 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Plan Name</label>
                  <input 
                    value={plan.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                    <input 
                      value={plan.price}
                      onChange={(e) => handleChange(index, "price", e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Period</label>
                    <input 
                      value={plan.period}
                      onChange={(e) => handleChange(index, "period", e.target.value)}
                      placeholder="/ month"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input 
                  value={plan.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Features (One per line)</label>
                <textarea 
                  value={plan.features.join("\n")}
                  onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Button Text</label>
                  <input 
                    value={plan.buttonText}
                    onChange={(e) => handleChange(index, "buttonText", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Button Link</label>
                  <input 
                    value={plan.buttonLink}
                    onChange={(e) => handleChange(index, "buttonLink", e.target.value)}
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
    <section className="py-20 bg-slate-50 dark:bg-[#0B1120]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-600 dark:text-slate-400">Choose the plan that's right for you.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.filter(p => p.isActive).map((plan, idx) => (
            <div key={idx} className={`relative bg-white dark:bg-slate-900 rounded-3xl p-8 border transition-all ${plan.isPopular ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">{plan.period}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feat: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={plan.buttonLink || "#"} className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${plan.isPopular ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'}`}>
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <CMSLayout 
      title="Pricing Section"
      description="Manage the pricing tiers displayed on the homepage."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
