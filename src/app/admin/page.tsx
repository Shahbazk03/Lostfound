"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Banknote,
  MapPin,
  BarChart3,
  MessageSquare,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Building,
  Mail,
  Phone,
  LayoutDashboard,
  ChevronRight,
  FileText,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import FooterLinksEditor from "@/components/FooterLinksEditor";
import { FooterGroup } from "@/lib/footer-constants";
import { HelpEditor, SafetyEditor, FAQEditor, BlogEditor } from "@/components/ContentEditors";
import { AboutEditor, CareersEditor, PressEditor, ContactEditor, PartnersEditor, FounderEditor } from "@/components/CorporateEditors";
import Background3D from "@/components/Background3D";

interface Stats {
  totalUsers: number;
  totalItems: number;
  totalRevenue: number;
  totalTransactions: number;
  itemsByType: { type: string; count: number }[];
  itemsByStatus: { status: string; count: number }[];
  recentItems: {
    id: number;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }[];
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  verified: boolean;
  createdAt: string;
  totalEarned?: Record<string, number>;
}

interface AdminItem {
  id: number;
  type: string;
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  preciseLocation: string | null;
  city: string | null;
  country: string | null;
  dateLostFound: string;
  status: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface AdminMessage {
  id: number;
  content: string;
  senderName: string;
  receiverName: string;
  itemTitle: string;
  createdAt: string;
}

interface OrganizationSettings {
  id?: number;
  organizationName: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  supportEmail?: string;
  supportPhone?: string;
  timezone?: string;
  currency?: string;
  metadata?: {
    footerDescription?: string;
    copyrightText?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    footerGroups?: FooterGroup[];
    helpContent?: any;
    faqContent?: any;
    safetyPrinciples?: any;
    safetyFlags?: any;
    blogContent?: any;
    [key: string]: any;
  };
}

type TabType = "overview" | "users" | "items" | "messages" | "payments" | "withdrawals" | "founder" | "settings" | "content";

interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const trVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { settings: globalSettings, refreshSettings } = useSettings();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [editingSettings, setEditingSettings] = useState<OrganizationSettings | null>(null);
  const [contentSettings, setContentSettings] = useState<OrganizationSettings | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const controllers = Array(5).fill(null).map(() => new AbortController());
      const timeouts = controllers.map((ctrl) => setTimeout(() => ctrl.abort(), 10000));

      const responses = await Promise.allSettled([
        fetch("/api/admin/stats", { signal: controllers[0].signal }),
        fetch("/api/admin/users", { signal: controllers[1].signal }),
        fetch("/api/admin/items", { signal: controllers[2].signal }),
        fetch("/api/admin/messages", { signal: controllers[3].signal }),
        fetch("/api/admin/settings", { signal: controllers[4].signal }),
      ]);

      timeouts.forEach((t) => clearTimeout(t));

      if (responses[0].status === "fulfilled" && responses[0].value?.ok) {
        const data = await responses[0].value.json();
        setStats(data.stats || data);
      }
      if (responses[1].status === "fulfilled" && responses[1].value?.ok) {
        const data = await responses[1].value.json();
        setUsers(data.users || data || []);
      }
      if (responses[2].status === "fulfilled" && responses[2].value?.ok) {
        const data = await responses[2].value.json();
        setItems(data.items || data || []);
      }
      if (responses[3].status === "fulfilled" && responses[3].value?.ok) {
        const data = await responses[3].value.json();
        setMessages(data.messages || data || []);
      }
      if (responses[4].status === "fulfilled" && responses[4].value?.ok) {
        const data = await responses[4].value.json();
        setSettings(data.settings || data);
        setContentSettings(data.settings || data);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load some admin data. Please ensure the database is connected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [user, router]);

  const handleSaveUser = async () => {
    if (editingUser) {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingUser),
        });
        if (res.ok) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
          setEditingUser(null);
        }
      } catch (error) {
        console.error("Error saving user:", error);
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => [...prev, data.user]);
        setNewUser({ name: "", email: "", password: "" });
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleSaveItem = async () => {
    if (editingItem) {
      try {
        const res = await fetch(`/api/admin/items/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingItem),
        });
        if (res.ok) {
          setItems((prev) => prev.map((i) => (i.id === editingItem.id ? editingItem : i)));
          setEditingItem(null);
        }
      } catch (error) {
        console.error("Error saving item:", error);
      }
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await fetch(`/api/admin/items/${itemId}`, { method: "DELETE" });
        if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!editingSettings) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setEditingSettings(null);
        setContentSettings(data.settings);
        refreshSettings();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleSaveContent = async () => {
    if (!contentSettings) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setContentSettings(data.settings);
        alert("Content saved successfully!");
      }
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  const handleWithdrawalAction = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: status as any } : w));
      }
    } catch (err) {
      console.error("Error updating withdrawal:", err);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative">
        <Background3D />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center relative z-10 bg-white dark:bg-slate-800/90 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You don&apos;t have permission to access this portal.</p>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "items", label: "Items", icon: Package },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "withdrawals", label: "Withdrawals", icon: Banknote },
    { id: "founder", label: "Founder", icon: Shield },
    { id: "content", label: "Content", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row relative overflow-hidden">
      <Background3D />
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-2xl text-slate-900 dark:text-white flex-shrink-0 md:h-[calc(100vh-64px)] relative z-10 border-r border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.2)] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 text-emerald-400">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">Admin<span className="text-slate-900 dark:text-white dark:text-white">Portal</span></h1>
          </div>
          <nav className="space-y-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === id
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </div>
                {activeTab === id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <LoadingLogo className="w-10 h-10 text-emerald-600 animate-spin" />
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
            <p className="text-red-600">{error}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-6xl mx-auto h-full"
            >
              <div className="mb-8 relative z-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-white tracking-tight capitalize">
                  {activeTab === "overview" ? "Dashboard Overview" : `${activeTab} Management`}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and monitor your platform&apos;s {activeTab}.</p>
              </div>

              {activeTab === "overview" && stats && (
                <div className="space-y-8">
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-emerald-500 to-teal-400" },
                      { label: "Total Items", value: stats.totalItems, icon: Package, color: "from-blue-500 to-indigo-400" },
                      { label: "Revenue", value: formatCurrency(stats.totalRevenue, globalSettings?.currency || "USD"), icon: DollarSign, color: "from-amber-500 to-orange-400" },
                      { label: "Transactions", value: stats.totalTransactions, icon: CheckCircle, color: "from-purple-500 to-pink-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <motion.div key={label} variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 p-6 shadow-lg shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-slate-100 dark:bg-slate-800/80 transition-all duration-300 group transform hover:-translate-y-1">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 group-hover:scale-110 group-hover:bg-slate-100 dark:bg-slate-800 transition-all">
                              <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300 dark:text-slate-300" />
                            </div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</div>
                          </div>
                          <div className="text-4xl font-extrabold text-slate-900 dark:text-white dark:text-white tracking-tight drop-shadow-sm">{value}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {activeTab === "users" && (
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="flex justify-end">
                    <button onClick={() => setShowUserModal(true)} className="bg-emerald-600 text-slate-900 dark:text-white dark:text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center gap-2 font-medium">
                      <Plus className="w-5 h-5" /> Add User
                    </button>
                  </div>
                  <div className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative z-10">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50">
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">User</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Earned</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-800/50">
                          {users.map((u) => (
                            <motion.tr variants={trVariants} key={u.id} className="hover:bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 dark:text-white dark:text-white">{u.name}</span>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{u.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === "admin" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50"}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {u.verified ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-emerald-600">
                                  {u.totalEarned && Object.keys(u.totalEarned).length > 0
                                    ? Object.entries(u.totalEarned).map(([cur, amt]) => formatCurrency(amt, cur)).join(' + ')
                                    : formatCurrency(0, globalSettings?.currency || "USD")}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button onClick={() => setEditingUser(u)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "items" && (
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative z-10">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50">
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Item Details</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Type</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Location</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-800/50">
                          {items.map((item) => (
                            <motion.tr variants={trVariants} key={item.id} className="hover:bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 dark:text-white dark:text-white max-w-[250px] truncate">{item.title}</span>
                                  <span className="text-xs text-slate-600 dark:text-slate-400">By {item.userName || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.type === "lost" ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${item.status === "active" ? "bg-emerald-100 text-emerald-700" : item.status === "resolved" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[200px] truncate">
                                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                                  <span className="truncate">{item.approximateLocation}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button onClick={() => setEditingItem(item)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "messages" && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative z-10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Conversation</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Item</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Message</th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-800/50">
                        {messages.map((msg) => (
                          <motion.tr variants={trVariants} key={msg.id} className="hover:bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white dark:text-white text-sm">From: {msg.senderName}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">To: {msg.receiverName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-emerald-400 max-w-[150px] truncate">{msg.itemTitle}</td>
                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 dark:text-slate-300 max-w-[300px] truncate">{msg.content}</td>
                            <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">{formatDate(msg.createdAt)}</td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "founder" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white">Founder & CEO</h3>
                      <p className="text-slate-500 text-sm">Manage the founder profile displayed on the home page.</p>
                    </div>
                  </div>

                  {contentSettings ? (
                    <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 max-w-3xl">
                      <FounderEditor 
                        data={contentSettings.metadata?.founderContent} 
                        onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, founderContent: d } })} 
                        onSave={handleSaveContent}
                      />
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 max-w-3xl">
                      <p className="text-slate-500">Loading settings...</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "content" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white">CMS (Content Management)</h3>
                      <p className="text-slate-500 text-sm">Manage the content of your public resource pages here.</p>
                    </div>
                  </div>

                  {contentSettings && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                        <HelpEditor 
                          data={contentSettings.metadata?.helpContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, helpContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>
                      
                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                        <FAQEditor 
                          data={contentSettings.metadata?.faqContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, faqContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                        <SafetyEditor 
                          principles={contentSettings.metadata?.safetyPrinciples} 
                          flags={contentSettings.metadata?.safetyFlags} 
                          onChange={(p, f) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, safetyPrinciples: p, safetyFlags: f } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 xl:col-span-2">
                        <BlogEditor 
                          data={contentSettings.metadata?.blogContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, blogContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>



                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 xl:col-span-2">
                        <AboutEditor 
                          data={contentSettings.metadata?.aboutContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, aboutContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 xl:col-span-2">
                        <CareersEditor 
                          data={contentSettings.metadata?.careersContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, careersContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800 xl:col-span-2">
                        <PressEditor 
                          data={contentSettings.metadata?.pressContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, pressContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                        <ContactEditor 
                          data={contentSettings.metadata?.contactContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, contactContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>

                      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-800">
                        <PartnersEditor 
                          data={contentSettings.metadata?.partnersContent} 
                          onChange={(d) => setContentSettings({ ...contentSettings, metadata: { ...contentSettings.metadata, partnersContent: d } })} 
                          onSave={handleSaveContent}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "withdrawals" && (
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative z-10">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50">
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">User</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" className="divide-y divide-slate-800/50">
                          {withdrawals.map((w) => (
                            <motion.tr key={w.id} variants={trVariants} className="hover:bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 dark:text-white dark:text-white">{w.user.name}</span>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{w.user.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-medium text-emerald-600">{formatCurrency(w.amount, w.currency || globalSettings?.currency || "USD")}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  w.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  w.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {w.status === "completed" ? <CheckCircle className="w-3 h-3" /> : w.status === "rejected" ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {formatDate(w.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {w.status === "pending" && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleWithdrawalAction(w.id, "completed")} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleWithdrawalAction(w.id, "rejected")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                          {withdrawals.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                No withdrawal requests found.
                              </td>
                            </tr>
                          )}
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div variants={itemVariants} className="max-w-3xl">
                  <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Building className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white">Organization Info</h3>
                          <p className="text-sm text-slate-500">Manage your platform identity and contact details</p>
                        </div>
                      </div>
                      <button onClick={() => settings && setEditingSettings(settings)} disabled={!settings} className="bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl hover:bg-emerald-100 hover:shadow transition-all flex items-center gap-2 font-semibold">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                    </div>

                    {settings ? (
                      <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Organization Name</div>
                          <div className="text-lg font-medium text-slate-900 dark:text-white dark:text-white">{settings.organizationName}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Contact Email</div>
                          <div className="text-lg font-medium text-slate-900 dark:text-white dark:text-white flex items-center gap-2"><Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" /> {settings.contactEmail}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Support Phone</div>
                          <div className="text-lg font-medium text-slate-900 dark:text-white dark:text-white flex items-center gap-2"><Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" /> {settings.supportPhone || "-"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Currency</div>
                          <div className="text-lg font-medium text-slate-900 dark:text-white dark:text-white">{settings.currency || "USD"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Country</div>
                          <div className="text-lg font-medium text-slate-900 dark:text-white dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" /> {settings.country || "-"}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Settings className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500">Settings not configured yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {(showUserModal || editingUser || editingItem || editingSettings) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white dark:bg-slate-800/60 dark:bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setShowUserModal(false); setEditingUser(null); setEditingItem(null); setEditingSettings(null); }} className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-white dark:text-white rounded-full transition-colors z-10"><X className="w-5 h-5" /></button>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white mb-6">
                {showUserModal ? "Add New User" : editingUser ? "Edit User" : editingItem ? "Edit Item" : "Edit Settings"}
              </h3>

              <div className="space-y-5">
                {showUserModal && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Name</label>
                      <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Email</label>
                      <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Password</label>
                      <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                  </>
                )}

                {/* Edit User Details */}
                {editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Name</label>
                      <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Email</label>
                      <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Role</label>
                        <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editingUser.verified} onChange={(e) => setEditingUser({ ...editingUser, verified: e.target.checked })} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Verified</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Edit Settings Details */}
                {editingSettings && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Organization Name</label>
                      <input type="text" value={editingSettings.organizationName} onChange={(e) => setEditingSettings({ ...editingSettings, organizationName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Contact Email</label>
                        <input type="email" value={editingSettings.contactEmail} onChange={(e) => setEditingSettings({ ...editingSettings, contactEmail: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Support Phone</label>
                        <input type="text" value={editingSettings.supportPhone || ""} onChange={(e) => setEditingSettings({ ...editingSettings, supportPhone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Address</label>
                      <input type="text" value={editingSettings.address || ""} onChange={(e) => setEditingSettings({ ...editingSettings, address: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Currency (3-letter ISO Code)</label>
                      <select 
                        value={editingSettings.currency || "USD"} 
                        onChange={(e) => setEditingSettings({ ...editingSettings, currency: e.target.value })} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">City</label>
                        <input type="text" value={editingSettings.city || ""} onChange={(e) => setEditingSettings({ ...editingSettings, city: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Country</label>
                        <input type="text" value={editingSettings.country || ""} onChange={(e) => setEditingSettings({ ...editingSettings, country: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 mt-4">
                      <h4 className="text-md font-bold text-slate-900 dark:text-white dark:text-white mb-4">Footer Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Footer Description</label>
                          <textarea value={editingSettings.metadata?.footerDescription || ""} onChange={(e) => setEditingSettings({ ...editingSettings, metadata: { ...editingSettings.metadata, footerDescription: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" rows={2} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Copyright Text</label>
                          <input type="text" value={editingSettings.metadata?.copyrightText || ""} onChange={(e) => setEditingSettings({ ...editingSettings, metadata: { ...editingSettings.metadata, copyrightText: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Facebook URL</label>
                            <input type="url" value={editingSettings.metadata?.facebookUrl || ""} onChange={(e) => setEditingSettings({ ...editingSettings, metadata: { ...editingSettings.metadata, facebookUrl: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Twitter URL</label>
                            <input type="url" value={editingSettings.metadata?.twitterUrl || ""} onChange={(e) => setEditingSettings({ ...editingSettings, metadata: { ...editingSettings.metadata, twitterUrl: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                          </div>
                        </div>
                        <FooterLinksEditor 
                          groups={editingSettings.metadata?.footerGroups || []} 
                          onChange={(newGroups) => setEditingSettings({ ...editingSettings, metadata: { ...editingSettings.metadata, footerGroups: newGroups } })} 
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Editing Item Details */}
                {editingItem && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Title</label>
                      <input type="text" value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Status</label>
                      <select value={editingItem.status} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 dark:bg-slate-800 outline-none transition-all">
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="pt-4 flex gap-3">
                  <button onClick={() => { if (showUserModal) handleCreateUser(); else if (editingUser) handleSaveUser(); else if (editingItem) handleSaveItem(); else if (editingSettings) handleSaveSettings(); }} className="flex-1 bg-emerald-600 text-slate-900 dark:text-white dark:text-white py-3.5 rounded-xl hover:bg-emerald-700 font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
