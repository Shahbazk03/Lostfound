"use client";

import { motion } from "framer-motion";
import { Database, Package, Sparkles } from "lucide-react";

export default function RecentItemsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 max-w-2xl text-center shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-700 relative">
          <Database className="w-10 h-10 text-emerald-600 dark:text-emerald-400 absolute opacity-50" />
          <Package className="w-6 h-6 text-slate-800 dark:text-slate-200 z-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Dynamic Content Module</h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          The <strong>Recent Items</strong> section is automatically populated with the latest active Lost & Found listings from your database. No manual configuration is required.
        </p>

        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 py-3 px-6 rounded-full inline-flex font-medium">
          <Sparkles className="w-5 h-5" />
          <span>Real-time Sync Active</span>
        </div>
      </motion.div>
    </div>
  );
}
