import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 shrink-0">
          <div className="font-semibold text-lg text-slate-800 dark:text-slate-200">
            Content Management System
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">Admin User</div>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </header>
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
