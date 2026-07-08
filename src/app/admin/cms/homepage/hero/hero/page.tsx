"use client";

import { useState, useEffect } from "react";
import { updateHeroContent, getHeroContent } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

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
    alert("Hero content saved successfully!");
  };

  const renderHeadline = () => {
    const words = formData.headline.split(new RegExp(`(${formData.highlightedWords})`, "gi"));
    return (
      <>
        {words.map((word, i) =>
          word.toLowerCase() === formData.highlightedWords.toLowerCase() ? (
            <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              {word}
            </span>
          ) : (
            <span key={i} className="whitespace-pre-line">{word}</span>
          )
        )}
      </>
    );
  };

  const formContent = (
    <div className="space-y-8 pb-12">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Typography & Text</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headline</label>
            <textarea 
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Highlighted Words (Comma separated)</label>
            <input 
              name="highlightedWords"
              value={formData.highlightedWords}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subheading</label>
            <textarea 
              name="subheading"
              value={formData.subheading}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Call to Action Buttons</h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-medium text-slate-900 dark:text-white">Primary Button</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <input 
                name="primaryButtonText"
                value={formData.primaryButtonText}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link URL</label>
              <input 
                name="primaryButtonLink"
                value={formData.primaryButtonLink}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-medium text-slate-900 dark:text-white">Secondary Button</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <input 
                name="secondaryButtonText"
                value={formData.secondaryButtonText}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link URL</label>
              <input 
                name="secondaryButtonLink"
                value={formData.secondaryButtonLink}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Media & Visuals</h2>
        
        <div className="space-y-6">
          <ImageUpload 
            label="Main Illustration" 
            value={formData.illustrationImage} 
            onChange={(url) => setFormData(prev => ({ ...prev, illustrationImage: url }))} 
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Animation Style</label>
            <select 
              name="illustrationAnimation"
              value={formData.illustrationAnimation}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="float">Float</option>
              <option value="pulse">Pulse</option>
              <option value="none">None</option>
            </select>
          </div>

          <ImageUpload 
            label="Background Image (Optional)" 
            value={formData.backgroundImage} 
            onChange={(url) => setFormData(prev => ({ ...prev, backgroundImage: url }))} 
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trust Badges (Comma separated)</label>
            <input 
              name="trustBadges"
              value={formData.trustBadges.join(", ")}
              onChange={handleTrustBadgeChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const previewContent = (
    <section className="relative w-full h-full flex items-center bg-white dark:bg-[#0B1120] p-8 md:p-12 overflow-hidden rounded-3xl pointer-events-none">
      {formData.backgroundImage ? (
         <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${formData.backgroundImage})` }} />
      ) : (
        <>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </>
      )}
      
      <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            {renderHeadline()}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {formData.subheading}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {formData.primaryButtonText && (
              <div className="inline-flex items-center justify-center bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 px-6 py-3 rounded-xl font-bold shadow-lg">
                {formData.primaryButtonText}
              </div>
            )}
            {formData.secondaryButtonText && (
              <div className="inline-flex items-center justify-center bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold shadow-sm">
                {formData.secondaryButtonText}
              </div>
            )}
          </div>

          {formData.trustBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formData.trustBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {badge}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative h-[400px] w-full hidden lg:flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={formData.illustrationImage || "/hero-3d-illustration.png"} 
            alt="Hero Preview" 
            className={`w-full h-full object-contain drop-shadow-2xl z-10 relative ${formData.illustrationAnimation !== "none" ? `animate-${formData.illustrationAnimation}` : ""}`} 
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/10 rounded-full" />
        </div>
      </div>
    </section>
  );

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <CMSLayout 
      title="Hero Section CMS"
      description="Manage the main hero banner text, calls to action, and illustrations."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
