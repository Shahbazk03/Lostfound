"use client";

import { motion } from "framer-motion";

export default function EmailPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[60vh] text-center shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Email</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          This module is currently under construction. It will be fully implemented as part of the Enterprise Dashboard rollout.
        </p>
      </motion.div>
    </div>
  );
}
