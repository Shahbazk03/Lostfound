"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Package, 
  MessageSquare, 
  CreditCard,
  Image as ImageIcon,
  FileText,
  Shield,
  Activity,
  Globe,
  Star,
  List,
  Menu,
  X,
  ChevronDown,
  PieChart,
  LogOut,
  Bell,
  Ticket,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Website CMS",
    icon: Globe,
    sublinks: [
      { title: "Homepage", href: "/admin/cms/homepage" },
      { title: "Hero Section", href: "/admin/cms/hero" },
      { title: "Statistics", href: "/admin/cms/statistics" },
      { title: "Categories", href: "/admin/cms/categories" },
      { title: "Features", href: "/admin/cms/features" },
      { title: "Testimonials", href: "/admin/cms/testimonials" },
      { title: "Premium Plans", href: "/admin/cms/pricing" },
      { title: "Recent Items", href: "/admin/cms/recent-items" },
      { title: "Global Network", href: "/admin/cms/global-network" },
      { title: "FAQ", href: "/admin/cms/faq" },
      { title: "Footer", href: "/admin/cms/footer" },
    ]
  },
  {
    title: "Management",
    icon: Users,
    sublinks: [
      { title: "Legacy Dashboard (Users, Items, Reports)", href: "/admin/legacy" },
      { title: "Users", href: "/admin/legacy" },
      { title: "Items", href: "/admin/legacy" },
      { title: "Messages", href: "/admin/legacy" },
    ]
  },
  {
    title: "Finance",
    icon: CreditCard,
    sublinks: [
      { title: "Payments", href: "/admin/legacy" },
      { title: "Withdrawals", href: "/admin/legacy" },
    ]
  },
  {
    title: "Content & Media",
    icon: FileText,
    sublinks: [
      { title: "Legacy Content Editor", href: "/admin/legacy" },
      { title: "Media Library", href: "/admin/legacy" },
    ]
  },
  {
    title: "Support",
    icon: Ticket,
    sublinks: [
      { title: "Support Tickets", href: "/admin/support-tickets" },
      { title: "Careers", href: "/admin/careers" },
    ]
  },
  {
    title: "System",
    icon: Settings,
    sublinks: [
      { title: "Analytics", href: "/admin/analytics" },
      { title: "SEO Manager", href: "/admin/seo" },
      { title: "Site Settings", href: "/admin/settings" },
      { title: "Security", href: "/admin/security" },
      { title: "Activity Logs", href: "/admin/activity-logs" },
      { title: "Admins", href: "/admin/admins" },
      { title: "Roles & Permissions", href: "/admin/roles" },
      { title: "Backup & Restore", href: "/admin/backup" },
      { title: "System Settings", href: "/admin/system" },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Website CMS": true,
    "Management": false,
    "Finance": false,
    "Content & Media": false,
    "Support": false,
    "System": false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen sticky top-0 overflow-y-auto hidden md:block">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm tracking-wider">LF</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Admin CMS</span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {sidebarLinks.map((item) => (
          <div key={item.title}>
            {item.href ? (
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1",
                  pathname === item.href
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            ) : (
              <div className="mb-1">
                <button
                  onClick={() => toggleGroup(item.title)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </div>
                  <ChevronDown
                    className={clsx("w-4 h-4 transition-transform", openGroups[item.title] ? "rotate-180" : "")}
                  />
                </button>
                <AnimatePresence>
                  {openGroups[item.title] && item.sublinks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 pb-2 pl-10 pr-3 space-y-1 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                        {item.sublinks.map((sublink) => (
                          <Link
                            key={sublink.title}
                            href={sublink.href}
                            className={clsx(
                              "block px-3 py-2 rounded-lg text-sm transition-colors",
                              pathname === sublink.href
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            )}
                          >
                            {sublink.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <Globe className="w-4 h-4" />
          View Live Site
        </Link>
      </div>
    </div>
  );
}
