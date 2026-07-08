"use client";

import { useState, useEffect } from "react";
import { updateHeroContent, getHeroContent } from "./actions";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";

export default function HeroCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    headline: "Find What Matters.\nReconnect With Confidence.",
    highlightedWords: "Reconnect",
    subheading: "LostFound helps people recover lost belongings through AI-powered matching, real-time notifications, and a trusted community network.",
    primaryButtonText: "Browse Lost Items",
    primaryButtonLink: "/browse",
    secondaryButtonText: "Report Lost Item",
    secondaryButtonLink: "/report",
    backgroundImage: "",
    illustrationImage: "/hero-3d-illustration.png",
    illustrationAnimation: "float",
    trustBadges: ["Trusted Community", "AI Matching", "Secure Platform"],
  });

  useEffect(() => {
    getHeroContent().then((data) => {
      if (data) {
        setFormData({
          headline: data.headline,
          highlightedWords: data.highlightedWords || "",
          subheading: data.subheading,
          primaryButtonText: data.primaryButtonText || "",
          primaryButtonLink: data.primaryButtonLink || "",
          secondaryButtonText: data.secondaryButtonText || "",
          secondaryButtonLink: data.secondaryButtonLink || "",
          backgroundImage: data.backgroundImage || "",
          illustrationImage: data.illustrationImage || "",
          illustrationAnimation: data.illustrationAnimation || "float",
          trustBadges: data.trustBadges || [],
        });
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrustBadgeChange = (e: any) => {
    const badges = e.target.value.split(",").map((s: string) => s.trim());
    setFormData((prev) => ({ ...prev, trustBadges: badges }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateHeroContent(formData);
    setSaving(false);
    alert("Hero content updated successfully!");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hero Section CMS</h1>
          <p className="text-slate-500 mt-1">Manage the main hero banner of your homepage.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Typography & Text</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headline</label>
            <textarea 
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Highlighted Words (Comma separated)</label>
            <input 
              name="highlightedWords"
              value={formData.highlightedWords}
              onChange={handleChange}
              placeholder="e.g. Reconnect, Community"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subheading</label>
            <textarea 
              name="subheading"
              value={formData.subheading}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Call to Action Buttons</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
            <h3 className="font-medium text-slate-700 dark:text-slate-300">Primary Button</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <input 
                name="primaryButtonText"
                value={formData.primaryButtonText}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link URL</label>
              <input 
                name="primaryButtonLink"
                value={formData.primaryButtonLink}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
            <h3 className="font-medium text-slate-700 dark:text-slate-300">Secondary Button</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <input 
                name="secondaryButtonText"
                value={formData.secondaryButtonText}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link URL</label>
              <input 
                name="secondaryButtonLink"
                value={formData.secondaryButtonLink}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Media & Visuals</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Main Illustration</label>
            <div className="flex items-center gap-4">
              {formData.illustrationImage && (
                <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden">
                  <img src={formData.illustrationImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input 
                  name="illustrationImage"
                  value={formData.illustrationImage}
                  onChange={handleChange}
                  placeholder="URL to image e.g. /hero-3d-illustration.png"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
                <button className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
                  <ImageIcon className="w-4 h-4" /> Open Media Library
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trust Badges (Comma separated)</label>
            <input 
              name="trustBadges"
              value={formData.trustBadges.join(", ")}
              onChange={handleTrustBadgeChange}
              placeholder="e.g. Trusted Community, AI Matching, Secure Platform"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">These appear as small checkmarks below the hero buttons.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
