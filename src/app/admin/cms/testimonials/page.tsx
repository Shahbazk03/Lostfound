"use client";

import { useState, useEffect } from "react";
import { getTestimonials, saveTestimonials } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Trash2, GripVertical, Star, MessageSquare } from "lucide-react";

export default function TestimonialsCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    getTestimonials().then((data) => {
      setTestimonials(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = () => {
    setTestimonials([...testimonials, { 
      id: Date.now(), 
      customerName: "John Doe", 
      customerRole: "Verified User", 
      customerPhoto: "", 
      reviewText: "This platform is amazing!", 
      rating: 5,
      isActive: true 
    }]);
  };

  const handleRemove = (index: number) => {
    const newList = [...testimonials];
    newList.splice(index, 1);
    setTestimonials(newList);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newList = [...testimonials];
    newList[index][field] = value;
    setTestimonials(newList);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveTestimonials(testimonials);
    setSaving(false);
    alert("Testimonials saved successfully!");
  };

  const formContent = (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Customer Testimonials</h2>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No testimonials added yet.</p>
        </div>
      )}

      <div className="space-y-6">
        {testimonials.map((t, index) => (
          <div key={t.id || index} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex gap-4 ${!t.isActive && 'opacity-60'}`}>
            <div className="mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={t.isActive}
                    onChange={(e) => handleChange(index, "isActive", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Visible on Homepage</span>
                </label>
                <button onClick={() => handleRemove(index)} className="text-red-500 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name</label>
                  <input 
                    value={t.customerName}
                    onChange={(e) => handleChange(index, "customerName", e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role / Subtitle</label>
                  <input 
                    value={t.customerRole}
                    onChange={(e) => handleChange(index, "customerRole", e.target.value)}
                    placeholder="e.g. Verified User"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Review Text</label>
                <textarea 
                  value={t.reviewText}
                  onChange={(e) => handleChange(index, "reviewText", e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Rating (Out of 5)</label>
                <input 
                  type="number"
                  min="1"
                  max="5"
                  value={t.rating}
                  onChange={(e) => handleChange(index, "rating", parseInt(e.target.value))}
                  className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="pt-2">
                <ImageUpload 
                  label="Customer Photo (Optional)"
                  value={t.customerPhoto}
                  onChange={(url) => handleChange(index, "customerPhoto", url)}
                />
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Trusted by Thousands</h2>
          <p className="text-slate-600 dark:text-slate-400">See what our community has to say about their recovery success stories.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.filter(t => t.isActive).map((t, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative">
              <div className="flex text-yellow-400 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < t.rating ? "fill-current" : "text-slate-200 dark:text-slate-700"}`} />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-lg mb-8 relative z-10 italic">"{t.reviewText}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {t.customerPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.customerPhoto} alt={t.customerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 font-bold">{t.customerName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{t.customerName}</h4>
                  <p className="text-sm text-slate-500">{t.customerRole}</p>
                </div>
              </div>
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
      title="Testimonials Section"
      description="Manage customer reviews and success stories."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
