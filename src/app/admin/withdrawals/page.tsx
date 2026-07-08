"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, SearchX, CheckCircle, XCircle } from "lucide-react";

interface AdminWithdrawal {
  id: number;
  amount: number;
  currency: string;
  status: string;
  bankAccount: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
}

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      const data = await res.json();
      if (res.ok) setWithdrawals(data.withdrawals || data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchWithdrawals();
  }, [user]);

  const handleUpdateWithdrawalStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchWithdrawals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.bankAccount?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Withdrawals Management</h1>
          <p className="text-slate-500">Approve or reject withdrawal requests from users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by user or bank details..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Total Requests: {withdrawals.length}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading withdrawals...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Bank Account</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">REQ-{w.id.toString().padStart(4, '0')}</div>
                      <div className="text-xs text-slate-500">{formatDate(w.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{w.userName || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{w.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 inline-block">
                        {w.bankAccount || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-amber-600 dark:text-amber-500 text-lg">
                        {formatCurrency(w.amount, w.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${w.status === "completed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30" : w.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30" : "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30"}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateWithdrawalStatus(w.id, "completed")} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleUpdateWithdrawalStatus(w.id, "failed")} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center flex flex-col items-center justify-center">
                      <SearchX className="w-12 h-12 text-slate-300 mb-4 mx-auto" />
                      <div className="text-slate-500 text-lg">No withdrawal requests found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
