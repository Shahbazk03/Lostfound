"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Search, SearchX } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminMessage {
  id: number;
  senderName: string;
  receiverName: string;
  itemTitle: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (res.ok) setMessages(data.messages || data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchMessages();
  }, [user]);

  const handleDeleteMessage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      fetchMessages();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.receiverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Messages Management</h1>
          <p className="text-slate-500">Monitor messages exchanged between users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Total Messages: {messages.length}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading messages...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Conversation</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Message Preview</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">From: {msg.senderName}</div>
                      <div className="text-sm text-slate-500">To: {msg.receiverName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 max-w-[150px] truncate">
                      {msg.itemTitle}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        {msg.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(msg.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteMessage(msg.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors inline-flex">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMessages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center flex flex-col items-center justify-center">
                      <SearchX className="w-12 h-12 text-slate-300 mb-4 mx-auto" />
                      <div className="text-slate-500 text-lg">No messages found.</div>
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
