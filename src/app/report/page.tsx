"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Upload,
  MapPin,
  Calendar,
  Clock,
  Tag,
  X,
  ImageIcon,
  AlertCircle,
  Lock,
} from "lucide-react";
import { categories, countries } from "@/lib/utils";
import Background3D from "@/components/Background3D";

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [approximateLocation, setApproximateLocation] = useState("");
  const [preciseLocation, setPreciseLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [dateLostFound, setDateLostFound] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [unlockAmount, setUnlockAmount] = useState("1.00");
  const [currency, setCurrency] = useState("USD");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !category || !approximateLocation || !dateLostFound) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          category,
          approximateLocation,
          preciseLocation: preciseLocation || null,
          city: city || null,
          country: country || null,
          dateLostFound,
          timeframe: timeframe || null,
          photos,
          unlockAmount: unlockAmount,
          currency,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/items/${data.item.id}`);
      } else {
        setError(data.error || "Failed to create listing");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative">
        <Background3D />
        <div className="text-center relative z-10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Sign in required
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Please sign in to report a lost or found item
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-emerald-600 text-slate-900 dark:text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] relative py-8">
      <Background3D />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Report an Item
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Help reunite lost items with their owners
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/50 p-6 lg:p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Item Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("lost")}
                  className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                    type === "lost"
                      ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                      : "border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-slate-600 bg-slate-100 dark:bg-slate-800/30"
                  }`}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setType("found")}
                  className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                    type === "found"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-slate-600 bg-slate-100 dark:bg-slate-800/30"
                  }`}
                >
                  I Found Something
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Black Leather Wallet"
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item in detail - color, brand, distinguishing marks, contents, etc."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Photos
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
                    <img
                      src={photo}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-slate-900 dark:text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging 
                      ? "border-emerald-500 bg-emerald-500/10" 
                      : "border-slate-200 dark:border-slate-700/50 hover:border-emerald-500 hover:bg-emerald-500/5 bg-slate-100 dark:bg-slate-800/30"
                  }`}
                >
                  <Upload className={`w-6 h-6 mb-1 ${isDragging ? "text-emerald-500" : "text-slate-600 dark:text-slate-400"}`} />
                  <span className={`text-xs ${isDragging ? "text-emerald-400 font-medium" : "text-slate-500"}`}>
                    {isDragging ? "Drop here!" : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Approximate Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    type="text"
                    value={approximateLocation}
                    onChange={(e) => setApproximateLocation(e.target.value)}
                    placeholder="e.g., Central Park, near the fountain"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  This will be shown publicly. Precise location can be added below.
                </p>
              </div>

              <div className="sm:col-span-2 space-y-4">
                <div className="p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                  <div className="flex items-start gap-3 mb-5 relative z-10">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Premium Precise Location</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Provide exact coordinates or address. Users must pay to unlock this information.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Hidden Exact Address / Coordinates
                      </label>
                      <input
                        type="text"
                        value={preciseLocation}
                        onChange={(e) => setPreciseLocation(e.target.value)}
                        placeholder="e.g., 123 Main Street, Apartment 4B"
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Unlock Amount
                        </label>
                        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden bg-slate-100 dark:bg-slate-800/80 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all shadow-inner">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={unlockAmount}
                            onChange={(e) => setUnlockAmount(e.target.value)}
                            placeholder="1.00"
                            className="w-full px-4 py-3 border-none outline-none bg-transparent text-slate-900 dark:text-white font-medium"
                          />
                          <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="pl-3 pr-2 py-3 border-none outline-none bg-transparent font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-700/50"
                          >
                            <option className="bg-slate-100 dark:bg-slate-800" value="USD">USD</option>
                            <option className="bg-slate-100 dark:bg-slate-800" value="EUR">EUR</option>
                            <option className="bg-slate-100 dark:bg-slate-800" value="GBP">GBP</option>
                            <option className="bg-slate-100 dark:bg-slate-800" value="INR">INR</option>
                            <option className="bg-slate-100 dark:bg-slate-800" value="AUD">AUD</option>
                            <option className="bg-slate-100 dark:bg-slate-800" value="CAD">CAD</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-full flex items-center pt-6 px-2">
                           <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            This amount will be credited to your wallet when another user unlocks your precise location.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City name"
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Date {type === "lost" ? "Lost" : "Found"} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    type="date"
                    value={dateLostFound}
                    onChange={(e) => setDateLostFound(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white [color-scheme:dark] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Timeframe
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g., Around 3 PM"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-slate-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transform hover:-translate-y-1"
            >
              {loading ? (
                <>
                  <LoadingLogo className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5" />
                  Submit Listing
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
