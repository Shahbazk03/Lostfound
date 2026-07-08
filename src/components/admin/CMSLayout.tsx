"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";

interface CMSLayoutProps {
  title: string;
  description: string;
  formContent: ReactNode;
  previewContent: ReactNode;
  onSave: () => void;
  onReset?: () => void;
  isSaving?: boolean;
}

export function CMSLayout({ 
  title, 
  description, 
  formContent, 
  previewContent, 
  onSave,
  onReset,
  isSaving = false 
}: CMSLayoutProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* CMS Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {onReset && (
            <button 
              onClick={onReset}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          )}
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {/* Split Pane Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor Form */}
        <div className="w-1/3 min-w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-8">
            {formContent}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto relative">
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700">
              Live Preview
            </span>
          </div>
          {/* We wrap the preview content in a container that scales it slightly down or just centers it beautifully */}
          <div className="min-h-full p-8 md:p-12 lg:p-16 flex items-center justify-center">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
              {previewContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
