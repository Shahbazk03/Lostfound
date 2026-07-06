"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  User,
  Lock,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  ImageIcon,
  CheckCircle,
  X,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

interface ItemDetail {
  id: number;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  preciseLocation: string | null;
  city: string | null;
  country: string | null;
  dateLostFound: string;
  timeframe: string | null;
  photos: string[] | null;
  status: string;
  createdAt: string;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  unlockAmount?: number;
  currency?: string;
}

function ItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [hasUnlockedChat, setHasUnlockedChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [chatPaymentLoading, setChatPaymentLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Price Editing state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editCurrencyValue, setEditCurrencyValue] = useState("USD");
  const [savingPrice, setSavingPrice] = useState(false);

  const itemId = params.id as string;
  const unlockedParam = searchParams.get("unlocked");



  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        const data = await res.json();
        if (res.ok) {
          setItem(data.item);
          setHasUnlocked(data.hasUnlocked);
          setHasUnlockedChat(data.hasUnlockedChat);
          if (data.item.unlockAmount) {
            setEditPriceValue((data.item.unlockAmount / 100).toFixed(2));
          }
          if (data.item.currency) {
            setEditCurrencyValue(data.item.currency);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  const handleUnlock = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: parseInt(itemId) }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
      }
    } catch {
      // ignore
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUnlockChat = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setChatPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/unlock-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (res.ok && data.sessionUrl) {
        window.location.assign(data.sessionUrl);
      }
    } catch {
      // ignore
    } finally {
      setChatPaymentLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSubscriptionLoading(true);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (res.ok && data.sessionUrl) {
        window.location.assign(data.sessionUrl);
      }
    } catch {
      // ignore
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!item) return;
    setSavingPrice(true);
    try {
      const newAmountInCents = Math.round(parseFloat(editPriceValue || "0") * 100);
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlockAmount: newAmountInCents, currency: editCurrencyValue }),
      });
      if (res.ok) {
        setItem({ ...item, unlockAmount: newAmountInCents, currency: editCurrencyValue } as any);
        setIsEditingPrice(false);
      }
    } catch {
      // ignore
    } finally {
      setSavingPrice(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/browse");
      }
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async () => {
    if (!user || !item || !messageContent.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: item.userId,
          itemId: item.id,
          content: messageContent.trim(),
        }),
      });
      if (res.ok) {
        setMessageContent("");
        setShowMessageModal(false);
      }
    } catch {
      // ignore
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingLogo className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Item not found
          </h2>
          <Link
            href="/browse"
            className="text-emerald-600 hover:text-emerald-700"
          >
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.userId;
  const canSeePrecise = isOwner || hasUnlocked || unlockedParam === "true" || user?.role === "admin";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {item.photos && item.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-2">
                  {item.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(photo)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden ${
                        idx === 0 ? "col-span-2" : ""
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${item.title} ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="aspect-[16/9] flex items-center justify-center bg-slate-100">
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.type === "lost"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.type === "lost" ? "Lost" : "Found"}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {item.title}
                  </h1>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-6">
                {item.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs text-slate-500">Approximate Location</div>
                    <div className="text-sm font-medium text-slate-900">
                      {item.approximateLocation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(item.dateLostFound)}
                    </div>
                  </div>
                </div>

                {item.timeframe && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs text-slate-500">Timeframe</div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.timeframe}
                      </div>
                    </div>
                  </div>
                )}

                {item.city && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs text-slate-500">City</div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.city}
                        {item.country && `, ${item.country}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Precise Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Precise Location
              </h2>
              {canSeePrecise && item.preciseLocation ? (
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50/50 shadow-[0_8px_30px_rgb(5,150,105,0.06)] p-6 group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                  
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      >
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </motion.div>
                    </div>
                    
                    <div className="w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                            Location Unlocked
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          {isEditingPrice ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-emerald-100"
                              style={{ perspective: "1000px" }}
                            >
                              <div className="flex items-center rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all shadow-inner">
                                <select
                                  value={editCurrencyValue}
                                  onChange={(e) => setEditCurrencyValue(e.target.value)}
                                  className="pl-3 pr-1 py-2.5 text-sm font-bold bg-transparent border-none outline-none text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                  <option value="INR">INR</option>
                                  <option value="AUD">AUD</option>
                                  <option value="CAD">CAD</option>
                                </select>
                                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  value={editPriceValue}
                                  onChange={(e) => setEditPriceValue(e.target.value)}
                                  className="w-24 pl-2 pr-3 py-2.5 text-sm font-black bg-transparent border-none outline-none text-emerald-700"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <motion.button 
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95, y: 0 }}
                                  onClick={handleSavePrice}
                                  disabled={savingPrice}
                                  className="flex items-center justify-center text-sm font-extrabold bg-emerald-500 text-white px-5 py-2.5 rounded-lg shadow-[0_4px_0_rgb(5,150,105)] hover:bg-emerald-400 hover:shadow-[0_6px_0_rgb(5,150,105)] active:shadow-[0_0px_0_rgb(5,150,105)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {savingPrice ? <LoadingLogo className="w-4 h-4 animate-spin" /> : "Save"}
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95, y: 0 }}
                                  onClick={() => {
                                    setIsEditingPrice(false);
                                    setEditPriceValue((item.unlockAmount ? item.unlockAmount / 100 : 1).toFixed(2));
                                    setEditCurrencyValue(item.currency || settings?.currency || "USD");
                                  }}
                                  className="flex items-center justify-center text-sm font-bold bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg shadow-[0_4px_0_rgb(203,213,225)] hover:bg-slate-300 hover:shadow-[0_6px_0_rgb(203,213,225)] active:shadow-[0_0px_0_rgb(203,213,225)] active:translate-y-1 transition-all"
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            </motion.div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-sm font-black text-emerald-800">
                                  Price: {formatCurrency(item.unlockAmount || 100, item.currency || settings?.currency || "USD")}
                                </span>
                              </div>
                              {user?.id === item.userId && (
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setIsEditingPrice(true)}
                                  className="flex items-center justify-center text-xs font-bold bg-white text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                                >
                                  Edit Price
                                </motion.button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-emerald-100/50 mt-3 text-emerald-900 font-medium">
                        {item.preciseLocation}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Unlock precise location
                      </div>
                      <div className="text-xs text-slate-500">
                        Get the exact address and GPS coordinates
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={paymentLoading}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <LoadingLogo className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Unlock for {formatCurrency(item.unlockAmount || 100, item.currency || settings?.currency || "USD")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Poster Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Posted By
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {item.userName || "Anonymous"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Posted {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    if (hasUnlockedChat || user.hasSubscription) {
                      setShowMessageModal(true);
                    } else {
                      setShowUnlockModal(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  {hasUnlockedChat || user?.hasSubscription ? (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Unlock to Message
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3">
                Safety Tips
              </h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Meet in a public place
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Bring a friend if possible
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Verify the item before exchanging
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Trust your instincts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Send Message
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Send a message to {item.userName} about &quot;{item.title}&quot;
            </p>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || sendingMessage}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sendingMessage ? (
                  <LoadingLogo className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Unlock Chat Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Unlock Messaging
              </h3>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              To keep our community safe and prevent spam, messaging requires a small fee or an active subscription.
            </p>

            <div className="space-y-4">
              {/* Option 1: One-time Unlock */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-emerald-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">One-Time Unlock</h4>
                    <p className="text-sm text-slate-500">Unlock messaging for this item only</p>
                  </div>
                  <div className="font-bold text-lg text-emerald-600">$1.00</div>
                </div>
                <button
                  onClick={handleUnlockChat}
                  disabled={chatPaymentLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {chatPaymentLoading ? (
                    <LoadingLogo className="w-4 h-4 animate-spin" />
                  ) : (
                    "Unlock this Chat"
                  )}
                </button>
              </div>

              {/* Option 2: Subscription */}
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-emerald-900">LostFound Premium</h4>
                    <p className="text-sm text-emerald-700">Unlimited messaging across all items</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-600">$4.99</div>
                    <div className="text-xs text-emerald-700 uppercase tracking-wide">/ month</div>
                  </div>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscriptionLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {subscriptionLoading ? (
                    <LoadingLogo className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subscribe Now"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <LoadingLogo className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <ItemDetailContent />
    </Suspense>
  );
}
