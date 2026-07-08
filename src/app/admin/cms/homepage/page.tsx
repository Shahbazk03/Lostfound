"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function HomepageCMSIndex() {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm"
      >
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
          <ArrowLeft className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a Section</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Choose a section from the sidebar to start editing your homepage content. Changes will reflect instantly in the live preview.
        </p>
      </motion.div>
    </div>
  );
}
