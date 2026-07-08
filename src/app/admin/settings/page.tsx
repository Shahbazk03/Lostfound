"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { motion, AnimatePresence } from "framer-motion";
import { Building, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const [editingSettings, setEditingSettings] = useState<any | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      refreshSettings();
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!editingSettings) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      alert("Settings updated successfully");
      setEditingSettings(null);
      refreshSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Organization Settings</h1>
        <p className="text-slate-500">Manage your platform identity, contact details, and core configuration.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Organization Info</h3>
              <p className="text-sm text-slate-500">Global settings used across the platform</p>
            </div>
          </div>
          <button 
            onClick={() => settings && setEditingSettings(settings)} 
            disabled={!settings} 
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-5 py-2.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all flex items-center gap-2 font-semibold disabled:opacity-50"
          >
            <Edit className="w-4 h-4" /> Edit Settings
          </button>
        </div>

        {settings ? (
          <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization Name</div>
              <div className="text-lg font-medium text-slate-900 dark:text-white">{settings.organizationName}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact Email</div>
              <div className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> {settings.contactEmail}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Support Phone</div>
              <div className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> {settings.supportPhone || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Currency</div>
              <div className="text-lg font-medium text-slate-900 dark:text-white">{settings.currency || "USD"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Country</div>
              <div className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> {settings.country || "-"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">Settings not configured yet or loading...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Organization Settings</h3>
                <button onClick={() => setEditingSettings(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Organization Name</label>
                  <input type="text" value={editingSettings.organizationName} onChange={(e) => setEditingSettings({ ...editingSettings, organizationName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contact Email</label>
                  <input type="email" value={editingSettings.contactEmail} onChange={(e) => setEditingSettings({ ...editingSettings, contactEmail: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Support Phone</label>
                  <input type="text" value={editingSettings.supportPhone || ""} onChange={(e) => setEditingSettings({ ...editingSettings, supportPhone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
                  <input type="text" value={editingSettings.currency || ""} onChange={(e) => setEditingSettings({ ...editingSettings, currency: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="USD" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                  <input type="text" value={editingSettings.country || ""} onChange={(e) => setEditingSettings({ ...editingSettings, country: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <button onClick={handleSaveSettings} className="w-full bg-emerald-600 text-white py-4 rounded-xl hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-lg">
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
