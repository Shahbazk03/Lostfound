"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Camera,
  Upload,
  AlertCircle,
  Save,
  CheckCircle,
  PackageSearch,
  PackageOpen,
  Wallet,
  DollarSign,
  Settings,
  ArrowRightCircle
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import Background3D from "@/components/Background3D";

interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface Item {
  id: number;
  type: "lost" | "found";
  title: string;
  status: "active" | "resolved" | "archived";
  createdAt: string;
  photos: string[];
}

interface EarningsData {
  balances: {
    currency: string;
    totalEarned: number;
    totalWithdrawn: number;
    pendingWithdrawal: number;
    availableBalance: number;
  }[];
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { settings: globalSettings } = useSettings();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("USD");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "wallet" | "settings">("items");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        
        if (res.ok) {
          setProfile(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setAvatar(data.user.avatar || null);
          setItems(data.items || []);
        }

        const earningsRes = await fetch("/api/user/earnings");
        if (earningsRes.ok) {
          setEarnings(await earningsRes.json());
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatar }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setProfile(data.user);
        // Update auth context user
        if (refreshUser) {
          refreshUser();
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAvatarFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processAvatarFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earnings || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount) * 100; // Convert to cents
    const currentBalance = earnings.balances?.find(b => b.currency === withdrawCurrency)?.availableBalance || 0;
    if (amount <= 0 || amount > currentBalance) {
      setWithdrawMsg({ type: "error", text: "Invalid amount or insufficient balance" });
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(withdrawAmount) * 100, currency: withdrawCurrency }),
      });

      if (res.ok) {
        setWithdrawMsg({ type: "success", text: "Withdrawal request submitted!" });
        setWithdrawAmount("");
        // Refresh earnings
        const earningsRes = await fetch("/api/user/earnings");
        if (earningsRes.ok) setEarnings(await earningsRes.json());
      } else {
        const data = await res.json();
        setWithdrawMsg({ type: "error", text: data.error || "Failed to submit request" });
      }
    } catch (err) {
      setWithdrawMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative">
        <Background3D />
        <div className="text-center p-8 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Sign in required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">You must be logged in to view your profile.</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-emerald-600 text-slate-900 dark:text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative">
        <Background3D />
        <LoadingLogo className="w-10 h-10 text-emerald-500 animate-spin relative z-10" />
      </div>
    );
  }

  const lostItems = items.filter((item) => item.type === "lost");
  const foundItems = items.filter((item) => item.type === "found");

  const ItemCard = ({ item }: { item: Item }) => (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all flex items-center p-3 gap-4 group-hover:bg-slate-100 dark:bg-slate-800">
        <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-900 overflow-hidden flex-shrink-0 relative">
          {item.photos && item.photos.length > 0 ? (
            <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              {item.type === "lost" ? <PackageSearch className="w-6 h-6" /> : <PackageOpen className="w-6 h-6" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              item.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
              item.status === "resolved" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
            }`}>
              {item.status}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] relative py-12 overflow-hidden">
      <Background3D />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/50 p-8 shadow-xl mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" style={{ perspective: "1000px" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-20 rounded-bl-full pointer-events-none blur-2xl" />
          
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: 10, rotateX: 5 }}
            className="w-32 h-32 rounded-full border-4 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex-shrink-0 bg-white dark:bg-slate-900 flex items-center justify-center relative"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-slate-500" />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{profile?.name || "User Profile"}</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
              <Mail className="w-4 h-4 text-slate-500" /> {profile?.email}
            </p>
          </div>
          
          <div className="flex gap-4">
            <motion.div whileHover={{ y: -5 }} className="bg-emerald-500/10 rounded-2xl p-4 text-center min-w-[120px] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Earned</p>
              <p className="text-2xl font-black text-emerald-300 drop-shadow-sm">
                {earnings?.balances?.length 
                  ? earnings.balances.map(b => formatCurrency(b.totalEarned, b.currency)).join(' + ') 
                  : formatCurrency(0, globalSettings?.currency)}
              </p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-blue-500/10 rounded-2xl p-4 text-center min-w-[120px] border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Total Items</p>
              <p className="text-2xl font-black text-blue-300 drop-shadow-sm">{items.length}</p>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-white/80 dark:bg-slate-900/60 rounded-2xl w-max mx-auto md:mx-0 mb-8 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50">
          {[
            { id: "items", label: "My Items", icon: PackageSearch },
            { id: "wallet", label: "Wallet & Earnings", icon: Wallet },
            { id: "settings", label: "Settings", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/50 dark:bg-slate-800/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabProfile"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative" style={{ perspective: "1200px" }}>
          <AnimatePresence mode="wait">
            
            {/* ITEMS TAB */}
            {activeTab === "items" && (
              <motion.div
                key="items"
                initial={{ opacity: 0, y: 20, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Lost Items */}
                  <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/50 p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                          <PackageSearch className="w-6 h-6 text-red-400" />
                        </div>
                        Lost Items
                      </h2>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">{lostItems.length}</span>
                    </div>
                    {lostItems.length === 0 ? (
                      <div className="text-center py-12 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50">
                        <p className="text-slate-600 dark:text-slate-400 font-medium">You haven't reported any lost items.</p>
                        <Link href="/report" className="text-emerald-400 font-bold text-sm mt-3 inline-block hover:underline">Report an item now &rarr;</Link>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {lostItems.map(item => (
                          <motion.div key={item.id} whileHover={{ scale: 1.02, x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <ItemCard item={item} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Found Items */}
                  <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/50 p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <PackageOpen className="w-6 h-6 text-emerald-400" />
                        </div>
                        Found Items
                      </h2>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">{foundItems.length}</span>
                    </div>
                    {foundItems.length === 0 ? (
                      <div className="text-center py-12 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50">
                        <p className="text-slate-600 dark:text-slate-400 font-medium">You haven't reported finding any items.</p>
                        <Link href="/report" className="text-emerald-400 font-bold text-sm mt-3 inline-block hover:underline">Report a found item &rarr;</Link>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {foundItems.map(item => (
                          <motion.div key={item.id} whileHover={{ scale: 1.02, x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <ItemCard item={item} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* WALLET TAB */}
            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 20, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto"
              >
                {earnings && (
                  <motion.div 
                    whileHover={{ rotateX: 2, rotateY: -2 }}
                    className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800/50 p-10 shadow-2xl shadow-emerald-500/10 text-slate-900 dark:text-white relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500 to-teal-400 opacity-20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                          <Wallet className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold">My Wallet</h2>
                      </div>
                      
                      <div className="mb-10 flex gap-4 overflow-x-auto pb-4">
                        {earnings.balances && earnings.balances.length > 0 ? (
                          earnings.balances.map(balance => (
                            <div key={balance.currency} className="min-w-[200px] p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                              <p className="text-slate-600 dark:text-slate-400 font-medium uppercase tracking-widest text-xs mb-1">Available ({balance.currency})</p>
                              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 drop-shadow-sm mb-4">
                                {formatCurrency(balance.availableBalance, balance.currency)}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <div>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Earned</p>
                                  <p className="text-sm font-bold">{formatCurrency(balance.totalEarned, balance.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mb-0.5">Withdrawn</p>
                                  <p className="text-sm font-bold">{formatCurrency(balance.totalWithdrawn + balance.pendingWithdrawal, balance.currency)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>
                            <p className="text-slate-600 dark:text-slate-400 font-medium uppercase tracking-widest text-sm mb-2">Available Balance</p>
                            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 drop-shadow-sm">
                              {formatCurrency(0, globalSettings?.currency)}
                            </p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleWithdrawal} className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Request Withdrawal</label>
                        <div className="flex gap-4">
                          <div className="relative flex-1 flex">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-xl font-bold text-emerald-400">
                                {withdrawCurrency === 'EUR' ? '€' : withdrawCurrency === 'GBP' ? '£' : withdrawCurrency === 'INR' ? '₹' : '$'}
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              max={(earnings.balances?.find(b => b.currency === withdrawCurrency)?.availableBalance || 0) / 100}
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="0.00"
                              disabled={!((earnings.balances?.find(b => b.currency === withdrawCurrency)?.availableBalance || 0) > 0)}
                              className="w-full pl-12 pr-4 py-4 bg-black/40 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-2xl text-xl font-bold text-slate-900 dark:text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 transition-all"
                            />
                            <select
                                value={withdrawCurrency}
                                onChange={(e) => setWithdrawCurrency(e.target.value)}
                                className="w-24 px-3 py-4 bg-black/40 border border-slate-200 dark:border-slate-700 border-l-0 rounded-r-2xl text-sm font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="INR">INR</option>
                                <option value="AUD">AUD</option>
                                <option value="CAD">CAD</option>
                              </select>
                            </div>
                          
                          <button
                            type="submit"
                            disabled={
                              withdrawLoading || 
                              !withdrawAmount || 
                              !((earnings.balances?.find(b => b.currency === withdrawCurrency)?.availableBalance || 0) > 0)
                            }
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                          >
                            {withdrawLoading ? <LoadingLogo className="w-5 h-5 animate-spin" /> : <ArrowRightCircle className="w-5 h-5" />}
                            Withdraw
                          </button>
                        </div>
                        {withdrawMsg.text && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 text-sm font-semibold rounded-2xl border ${withdrawMsg.type === 'error' ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
                            {withdrawMsg.text}
                          </motion.div>
                        )}
                      </form>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20, rotateX: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/50 p-8 shadow-xl">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50">
                      <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    Profile Settings
                  </h2>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-800/50">
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden cursor-pointer group transition-all ${
                          isDragging ? "border-emerald-500 scale-105" : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
                        }`}
                      >
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-slate-700 dark:text-slate-300" />
                        )}
                        
                        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                          <Camera className="w-6 h-6 text-slate-900 dark:text-white mb-1" />
                          <span className="text-[10px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Change</span>
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 text-center font-medium">Click or drag a photo<br/>to update your avatar</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" /> Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" /> Email Address
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl outline-none cursor-not-allowed font-medium"
                      />
                      <p className="text-[11px] font-medium text-slate-500 mt-2">Email address cannot be changed.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" /> Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>

                    {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 bg-red-500/10 text-red-400 font-medium text-sm rounded-xl border border-red-500/20">{error}</motion.div>}
                    {success && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-4 bg-emerald-500/10 text-emerald-400 font-medium text-sm rounded-xl border border-emerald-500/20 flex items-center gap-2"><CheckCircle className="w-5 h-5"/>{success}</motion.div>}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-emerald-600 text-slate-900 dark:text-white py-4 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        {saving ? <LoadingLogo className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Profile Settings
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
