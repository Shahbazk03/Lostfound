"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Type, Link as LinkIcon, Image as ImageIcon, Sparkles, CheckCircle, LayoutTemplate } from "lucide-react";
import { useCMS } from "../CMSProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function HeroPage() {
  const { data, updateHero } = useCMS();
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState(data.hero || {});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setLocalData(data.hero || {});
  }, [data.hero]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateHero(updated); // Update live preview immediately
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });

      if (res.ok) {
        setSuccessMsg("Hero section saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Failed to save hero section.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving hero section.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrustBadgeChange = (index: number, value: string) => {
    const newBadges = [...(localData.trustBadges || [])];
    newBadges[index] = value;
    handleChange("trustBadges", newBadges);
  };

  const addTrustBadge = () => {
    handleChange("trustBadges", [...(localData.trustBadges || []), "New Badge"]);
  };

  const removeTrustBadge = (index: number) => {
    const newBadges = [...(localData.trustBadges || [])];
    newBadges.splice(index, 1);
    handleChange("trustBadges", newBadges);
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-500" />
            Hero Section Editor
          </h1>
          <p className="text-sm text-slate-500 mt-1">Changes reflect instantly in the live preview</p>
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

        {/* Text Content */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Type className="w-5 h-5 text-emerald-500" />
            Text Content
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Headline</label>
              <textarea
                value={localData.headline || ""}
                onChange={(e) => handleChange("headline", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px]"
                placeholder="Find What Matters.\nReconnect With Confidence."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Highlighted Words (comma separated)</label>
              <input
                type="text"
                value={localData.highlightedWords || ""}
                onChange={(e) => handleChange("highlightedWords", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Reconnect, Confidence"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subheading</label>
              <textarea
                value={localData.subheading || ""}
                onChange={(e) => handleChange("subheading", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px]"
                placeholder="LostFound helps people recover lost belongings..."
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
            Media Assets
          </h2>
          <div className="space-y-6">
            <div>
              <ImageUpload
                label="3D Illustration Image"
                value={localData.illustrationImage || ""}
                onChange={(url) => handleChange("illustrationImage", url)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Illustration Animation</label>
              <select
                value={localData.illustrationAnimation || "float"}
                onChange={(e) => handleChange("illustrationAnimation", e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="float">Float</option>
                <option value="pulse">Pulse</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>
            <div>
              <ImageUpload
                label="Background Pattern (Optional)"
                value={localData.backgroundImage || ""}
                onChange={(url) => handleChange("backgroundImage", url)}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-emerald-500" />
            Call to Action Buttons
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Button Text</label>
                <input
                  type="text"
                  value={localData.primaryButtonText || ""}
                  onChange={(e) => handleChange("primaryButtonText", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Button Link</label>
                <input
                  type="text"
                  value={localData.primaryButtonLink || ""}
                  onChange={(e) => handleChange("primaryButtonLink", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Secondary Button Text</label>
                <input
                  type="text"
                  value={localData.secondaryButtonText || ""}
                  onChange={(e) => handleChange("secondaryButtonText", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Secondary Button Link</label>
                <input
                  type="text"
                  value={localData.secondaryButtonLink || ""}
                  onChange={(e) => handleChange("secondaryButtonLink", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Trust Badges
            </h2>
            <button
              onClick={addTrustBadge}
              className="text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Add Badge
            </button>
          </div>
          <div className="space-y-3">
            {(localData.trustBadges || []).map((badge: string, i: number) => (
              <div key={i} className="flex gap-3">
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => handleTrustBadgeChange(i, e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeTrustBadge(i)}
                  className="bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-4 rounded-xl transition-colors font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
