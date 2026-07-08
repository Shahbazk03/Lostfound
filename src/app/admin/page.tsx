"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Package, 
  DollarSign, 
  CheckCircle,
  Activity,
  TrendingUp,
  CreditCard,
  Ticket
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats } from "./actions";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  lostItems: number;
  foundItems: number;
  recoveredItems: number;
  todaysReports: number;
  revenue: number;
  transactions: number;
  supportTickets: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
    { title: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { title: "Premium Users", value: stats.premiumUsers.toLocaleString(), icon: StarIcon, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-500/10" },
    { title: "Recovered Items", value: stats.recoveredItems.toLocaleString(), icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-500/10" },
    { title: "Active Reports", value: (stats.lostItems + stats.foundItems).toLocaleString(), icon: Package, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-500/10" },
    { title: "Today's Reports", value: stats.todaysReports.toLocaleString(), icon: Activity, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-500/10" },
    { title: "Transactions", value: stats.transactions.toLocaleString(), icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-500/10" },
    { title: "Support Tickets", value: stats.supportTickets.toLocaleString(), icon: Ticket, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name || "Admin"}. Here is your platform's live performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+12.5%</span>
              <span className="text-slate-400 ml-2">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Growth</h2>
          <div className="h-[300px] flex items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            [Chart Area - Revenue]
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
             {/* Mock activity feed */}
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                 <div>
                   <p className="text-sm text-slate-900 dark:text-white font-medium">New user registered</p>
                   <p className="text-xs text-slate-500">2 minutes ago</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Star Icon for quick use
function StarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
