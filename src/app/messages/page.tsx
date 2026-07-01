"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  AlertCircle,
  Send,
  ArrowLeft,
  User,
  Lock,
  Search,
  MoreVertical,
  Check,
  CheckCheck
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Background3D from "@/components/Background3D";

interface Message {
  id: number;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: number;
  receiverId: number;
  itemId: number;
  itemTitle: string | null;
  itemPhoto?: string | null;
  otherUserId?: number;
  otherUserName?: string | null;
  otherUserAvatar?: string | null;
  isLocked?: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [unlockingMessageId, setUnlockingMessageId] = useState<number | null>(null);
  const [unlockedMessages, setUnlockedMessages] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedItemId]);

  const groupedMessages = messages.reduce((acc, msg) => {
    const key = `${msg.itemId}-${
      msg.senderId === user?.id ? msg.receiverId : msg.senderId
    }`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  const filteredGroups = Object.entries(groupedMessages).filter(([_, msgs]) => {
    const lastMsg = msgs[msgs.length - 1];
    const searchStr = `${lastMsg.itemTitle} ${lastMsg.otherUserName}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedItemId || !user) return;
    const conversation = groupedMessages[Object.keys(groupedMessages).find((k) =>
      k.startsWith(`${selectedItemId}-`)
    ) || ""];
    if (!conversation) return;

    const otherUserId = conversation[0].senderId === user.id
      ? conversation[0].receiverId
      : conversation[0].senderId;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUserId,
          itemId: selectedItemId,
          content: replyContent.trim(),
        }),
      });
      if (res.ok) {
        setReplyContent("");
        fetchMessages();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleUnlockMessage = async (messageId: number) => {
    if (!user) return;
    
    setUnlockingMessageId(messageId);
    try {
      const res = await fetch("/api/messages/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: messageId,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.sessionUrl) {
          window.location.assign(data.sessionUrl);
        }
      }
    } catch (error) {
      console.error("Error unlocking message:", error);
    } finally {
      setUnlockingMessageId(null);
    }
  };

  if (!user) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center relative">
        <Background3D />
        <div className="text-center bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Sign in required
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">You must be logged in to view your messages.</p>
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

  const selectedConversationKey = Object.keys(groupedMessages).find((k) =>
    k.startsWith(`${selectedItemId}-`)
  ) || "";
  const selectedConversation = selectedItemId ? groupedMessages[selectedConversationKey] : null;

  return (
    <div className="h-[calc(100vh-64px)] relative flex overflow-hidden">
      <Background3D />
      
      {/* Sidebar - Conversation List */}
      <div className={`${selectedItemId ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/50 shrink-0 relative z-10`}>
        {/* Sidebar Header */}
        <div className="h-[60px] bg-white/60 dark:bg-slate-900/40 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-slate-900 dark:text-white font-bold shadow-lg shadow-emerald-500/20 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
            </div>
            <h1 className="font-bold text-slate-900 dark:text-white text-lg">Chats</h1>
          </div>
          <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white p-2"><MoreVertical className="w-5 h-5" /></button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-white/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
          <div className="relative flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-700/50">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingLogo className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500 text-sm">
              No conversations found.
            </div>
          ) : (
            filteredGroups.map(([key, msgs]) => {
              const lastMsg = msgs[msgs.length - 1];
              const isSelected = selectedItemId === lastMsg.itemId;
              const isMeLast = lastMsg.senderId === user.id;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedItemId(lastMsg.itemId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100/50 dark:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800/30 ${
                    isSelected ? "bg-slate-100 dark:bg-slate-800/80" : ""
                  }`}
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20 overflow-hidden relative">
                    {lastMsg.otherUserAvatar ? (
                      <img src={lastMsg.otherUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        {lastMsg.otherUserName ? lastMsg.otherUserName.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                    {lastMsg.itemPhoto && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-200">
                        <img src={lastMsg.itemPhoto} alt="Item" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                    <div className="flex justify-between items-baseline mb-1">
                      <h2 className="font-semibold text-slate-900 dark:text-white truncate pr-2">
                        {lastMsg.otherUserName || "Unknown User"}
                      </h2>
                      <span className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
                        {new Date(lastMsg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate mb-0.5">
                      {lastMsg.itemTitle || "Unknown Item"}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 truncate">
                      {isMeLast && <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                      <span className="truncate">{lastMsg.content}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!selectedItemId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative z-10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-[60px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50 shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="md:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white p-1 -ml-2"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 overflow-hidden">
                  {selectedConversation[0].otherUserAvatar ? (
                    <img src={selectedConversation[0].otherUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {selectedConversation[0].otherUserName ? selectedConversation[0].otherUserName.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white leading-tight">
                    {selectedConversation[0].otherUserName || "Unknown User"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">
                      {selectedConversation[0].itemTitle || "Unknown Item"}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-700">•</span>
                    <Link
                      href={`/items/${selectedConversation[0].itemId}`}
                      className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline leading-tight"
                    >
                      View Item Details
                    </Link>
                  </div>
                </div>
              </div>
              <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white p-2"><MoreVertical className="w-5 h-5" /></button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-3 z-10">
              {/* Note: groupedMessages are sorted newest first, so we reverse to show chronological order top-to-bottom */}
              {[...selectedConversation].reverse().map((msg) => {
                const isMe = msg.senderId === user.id;
                const isUnlocked = !msg.isLocked || unlockedMessages.has(msg.id);
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {msg.isLocked && !isUnlocked ? (
                      <div className={`max-w-[85%] md:max-w-[65%] px-3 py-2 rounded-lg shadow-md text-[15px] leading-relaxed relative ${isMe ? "bg-emerald-600 text-slate-900 dark:text-white rounded-tr-none shadow-emerald-600/20" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-tl-none shadow-black/20"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className={`w-4 h-4 ${isMe ? "text-emerald-200" : "text-emerald-400"}`} />
                          <span className={`font-semibold text-sm ${isMe ? "text-emerald-100" : "text-emerald-400"}`}>Message locked</span>
                        </div>
                        <p className={`text-xs mb-2 ${isMe ? "text-emerald-100" : "text-slate-600 dark:text-slate-400"}`}>
                          Unlock for $1 to view this message securely.
                        </p>
                        {!isMe && (
                          <button
                            onClick={() => handleUnlockMessage(msg.id)}
                            disabled={unlockingMessageId === msg.id}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 disabled:opacity-50 px-3 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2 justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          >
                            {unlockingMessageId === msg.id ? (
                              <><LoadingLogo className="w-4 h-4 animate-spin text-slate-900" /> Processing...</>
                            ) : (
                              <><Lock className="w-4 h-4" /> Unlock for $1</>
                            )}
                          </button>
                        )}
                        <div className={`text-[11px] text-right mt-1.5 flex justify-end items-center gap-1 ${isMe ? "text-emerald-200" : "text-slate-500"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[85%] md:max-w-[65%] px-3 py-2 rounded-lg shadow-md text-[15px] leading-relaxed relative ${isMe ? "bg-emerald-600 text-slate-900 dark:text-white rounded-tr-none shadow-emerald-600/20" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-tl-none shadow-black/20"}`}>
                        <div className="break-words">{msg.content}</div>
                        <div className={`text-[11px] text-right mt-1 flex justify-end items-center gap-1 min-w-[60px] ${isMe ? "text-emerald-200" : "text-slate-500"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-slate-900 dark:text-white' : 'text-emerald-300'}`} />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3 flex items-end gap-3 z-10 shrink-0 border-t border-slate-200 dark:border-slate-800/50">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700/50 flex items-end min-h-[44px]">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type a message"
                  className="w-full max-h-[120px] px-4 py-3 outline-none text-slate-900 dark:text-white placeholder-slate-400 resize-none bg-transparent block"
                  rows={1}
                  style={{ minHeight: '44px' }}
                />
              </div>
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || sending}
                className="w-[44px] h-[44px] rounded-full bg-emerald-600 text-slate-900 dark:text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {sending ? (
                  <LoadingLogo className="w-5 h-5 animate-spin text-slate-900 dark:text-white" />
                ) : (
                  <Send className="w-5 h-5 ml-1" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center z-10 bg-white/60 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800/50">
            <div className="w-80 text-center">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-200 dark:border-slate-700/50">
                <Search className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-light text-slate-900 dark:text-white mb-4">LOSTFOUND Web</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Send and receive messages securely.<br/>Select a conversation from the left to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
