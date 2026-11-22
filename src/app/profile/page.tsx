"use client";
/* eslint-disable @next/next/no-img-element -- avatars can be data: URLs */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Crown,
  LayoutDashboard,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { downscaleDataUrl, readFileAsDataUrl } from "@/components/ui/image";
import { SignInRequired } from "@/components/ui/SignInRequired";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";
import { ChangePasswordForm } from "./ChangePasswordForm";

interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

// All amounts are in cents (minor units).
interface EarningsBalance {
  currency: string;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  availableBalance: number;
  /** Withdrawable now (newer API field; same value as availableBalance). */
  available?: number;
}

interface EarningsData {
  balances: EarningsBalance[];
}

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD"];
/** The profile API rejects avatars longer than this (data: URL characters). */
const MAX_AVATAR_CHARS = 1.5 * 1024 * 1024;

const withdrawableCents = (b: EarningsBalance | undefined) =>
  b ? b.available ?? b.availableBalance : 0;

/** Minimum withdrawal in major units: 1.00, or 100 for INR. */
const minWithdrawal = (currency: string) => (currency === "INR" ? 100 : 1);

function currencySymbol(currency: string) {
  try {
    return (
      new Intl.NumberFormat(undefined, { style: "currency", currency })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

const SECTIONS = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "wallet", label: "Wallet", Icon: Wallet },
  { id: "account", label: "Account", Icon: ShieldCheck },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function ProfileSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950" role="status" aria-label="Loading settings">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <div className="hidden space-y-2 lg:block">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { settings: globalSettings } = useSettings();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        // Both requests are independent, so run them side by side.
        const [res, earningsRes] = await Promise.all([fetch("/api/profile"), fetch("/api/user/earnings")]);
        const data = await res.json();

        if (res.ok) {
          setProfile(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setAvatar(data.user.avatar || null);
        }

        if (earningsRes.ok) {
          const earningsData: EarningsData = await earningsRes.json();
          setEarnings(earningsData);
          // Default the withdrawal currency to one the user actually holds.
          const firstWithBalance = earningsData.balances?.find((b) => withdrawableCents(b) > 0);
          if (firstWithBalance) setWithdrawCurrency(firstWithBalance.currency);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Highlight the section currently in view in the side navigation.
  useEffect(() => {
    if (loading || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id as SectionId);
      },
      { rootMargin: "-96px 0px -55% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

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
        setSuccess("Profile saved.");
        setProfile(data.user);
        // Update auth context user
        if (refreshUser) {
          refreshUser();
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const processAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setError("");
    const url = await readFileAsDataUrl(file);
    if (!url) {
      setError("That image couldn't be read. Try another one.");
      return;
    }
    // Avatars are shown small, so keep them light.
    setAvatar(await downscaleDataUrl(url, { maxChars: MAX_AVATAR_CHARS, maxSide: 512 }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAvatarFile(file);
    e.target.value = "";
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

    // The API takes decimal amounts in major units (e.g. 12.50); balances
    // from the earnings API are in cents.
    const amountMajor = Math.round(parseFloat(withdrawAmount) * 100) / 100;
    const amountCents = Math.round(amountMajor * 100);
    const currentBalance = withdrawableCents(earnings.balances?.find(b => b.currency === withdrawCurrency));
    const minimum = minWithdrawal(withdrawCurrency);
    if (!Number.isFinite(amountMajor) || amountCents <= 0) {
      setWithdrawMsg({ type: "error", text: "Enter a valid amount" });
      return;
    }
    if (amountMajor < minimum) {
      setWithdrawMsg({ type: "error", text: `The minimum withdrawal is ${formatCurrency(minimum * 100, withdrawCurrency)}` });
      return;
    }
    if (amountCents > currentBalance) {
      setWithdrawMsg({ type: "error", text: `You can withdraw up to ${formatCurrency(currentBalance, withdrawCurrency)}` });
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountMajor, currency: withdrawCurrency }),
      });

      if (res.ok) {
        setWithdrawMsg({ type: "success", text: "Withdrawal request submitted. We'll review it and pay it out." });
        setWithdrawAmount("");
        // Refresh earnings
        const earningsRes = await fetch("/api/user/earnings");
        if (earningsRes.ok) setEarnings(await earningsRes.json());
      } else {
        // e.g. 400 { error, available, currency } for insufficient balance
        const data = await res.json().catch(() => ({}));
        setWithdrawMsg({ type: "error", text: data.error || "Failed to submit request" });
      }
    } catch {
      setWithdrawMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setLoggingOut(false);
    }
  };

  if (authLoading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <SignInRequired
        icon={User}
        title="Sign in to manage your profile"
        description="Update your details, check your wallet and request withdrawals."
        next="/profile"
      />
    );
  }

  if (loading) return <ProfileSkeleton />;

  const balances = earnings?.balances ?? [];
  const selectedBalance = withdrawableCents(balances.find((b) => b.currency === withdrawCurrency));
  const canWithdraw = selectedBalance > 0;
  const dirty =
    !!profile &&
    (name !== (profile.name || "") || phone !== (profile.phone || "") || (avatar || null) !== (profile.avatar || null));

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <h1 className={ui.pageTitle}>Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Manage your profile, wallet and account.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
              {SECTIONS.map(({ id, label, Icon }) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    onClick={() => setActiveSection(id)}
                    aria-current={activeSection === id ? "true" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                      activeSection === id
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-white dark:ring-slate-800"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
              <li className="shrink-0 lg:mt-3 lg:border-t lg:border-slate-200 lg:pt-3 dark:lg:border-slate-800">
                <Link
                  href="/dashboard"
                  className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Your listings
                </Link>
              </li>
            </ul>
          </nav>

          <div className="min-w-0 space-y-6">
            {/* Profile */}
            <section id="profile" className={cn(ui.card, "scroll-mt-24")} aria-labelledby="profile-title">
              <form onSubmit={handleSaveProfile}>
                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                  <h2 id="profile-title" className="text-base font-semibold text-slate-900 dark:text-white">
                    Profile
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Your name is shown on your listings. Your phone number is never shown publicly.
                  </p>
                </div>

                <div className="space-y-6 px-5 py-6 sm:px-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-emerald-50 ring-4 transition dark:bg-emerald-500/10",
                        isDragging ? "ring-emerald-500" : "ring-white dark:ring-slate-900"
                      )}
                    >
                      {avatar ? (
                        <img src={avatar} alt="Your avatar" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                          {getInitials(name || profile?.name)}
                        </span>
                      )}
                      {isDragging && (
                        <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/70 text-white">
                          <Camera className="h-6 w-6" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className={ui.btnSecondary}>
                          <Camera className="h-4 w-4" aria-hidden="true" />
                          {avatar ? "Change photo" : "Upload photo"}
                        </button>
                        {avatar && (
                          <button type="button" onClick={() => setAvatar(null)} className={cn(ui.btnGhost, "min-h-11")}>
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG or WebP. You can also drag a photo onto the circle.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                        tabIndex={-1}
                        aria-label="Upload a new avatar"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="profile-name" label="Full name">
                      <input
                        type="text"
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        maxLength={100}
                        className={ui.input}
                        required
                      />
                    </Field>
                    <Field id="profile-phone" label="Phone number" optional>
                      <input
                        type="tel"
                        id="profile-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        maxLength={50}
                        placeholder="+1 (555) 000-0000"
                        className={ui.input}
                      />
                    </Field>
                  </div>

                  {error && (
                    <Alert tone="error" onDismiss={() => setError("")}>
                      {error}
                    </Alert>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
                  {success && (
                    <p role="status" className="mr-auto text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {success}
                    </p>
                  )}
                  <button type="submit" disabled={saving || !dirty} className={ui.btnPrimary}>
                    {saving ? <Spinner /> : <Save className="h-4 w-4" aria-hidden="true" />}
                    Save changes
                  </button>
                </div>
              </form>
            </section>

            {/* Wallet */}
            <section id="wallet" className={cn(ui.card, "scroll-mt-24")} aria-labelledby="wallet-title">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <h2 id="wallet-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  Wallet
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Earnings from people unlocking the precise location on your listings.
                </p>
              </div>

              <div className="px-5 py-6 sm:px-6">
                {!earnings ? (
                  <Alert tone="warning">We couldn&apos;t load your wallet right now. Refresh the page to try again.</Alert>
                ) : balances.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                    <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(0, globalSettings?.currency)}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      No earnings yet. When someone unlocks a precise location you added, the payment shows up here.
                    </p>
                  </div>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {balances.map((balance) => (
                      <li
                        key={balance.currency}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Available to withdraw</p>
                          <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                            {balance.currency}
                          </span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                          {formatCurrency(withdrawableCents(balance), balance.currency)}
                        </p>
                        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-3 text-xs dark:border-slate-700/60">
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Earned</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-slate-900 dark:text-white">
                              {formatCurrency(balance.totalEarned, balance.currency)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Pending</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-slate-900 dark:text-white">
                              {formatCurrency(balance.pendingWithdrawal, balance.currency)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">Paid out</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-slate-900 dark:text-white">
                              {formatCurrency(balance.totalWithdrawn, balance.currency)}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                )}

                {earnings && (
                  <form onSubmit={handleWithdrawal} className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Request a withdrawal</h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Requests are reviewed before payout. Minimum{" "}
                      {formatCurrency(minWithdrawal(withdrawCurrency) * 100, withdrawCurrency)}.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <div className="flex flex-1 gap-2">
                        <select
                          value={withdrawCurrency}
                          onChange={(e) => setWithdrawCurrency(e.target.value)}
                          aria-label="Withdrawal currency"
                          className={cn(ui.input, "w-24 shrink-0 px-2.5 font-medium")}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <span
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400"
                            aria-hidden="true"
                          >
                            {currencySymbol(withdrawCurrency)}
                          </span>
                          <label htmlFor="withdraw-amount" className="sr-only">
                            Amount
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={minWithdrawal(withdrawCurrency)}
                            max={selectedBalance / 100}
                            id="withdraw-amount"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={!canWithdraw}
                            className={cn(ui.input, "pl-10 pr-16 tabular-nums")}
                          />
                          {canWithdraw && (
                            <button
                              type="button"
                              onClick={() => setWithdrawAmount((selectedBalance / 100).toFixed(2))}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                            >
                              Max
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={withdrawLoading || !withdrawAmount || !canWithdraw}
                        className={ui.btnPrimary}
                      >
                        {withdrawLoading ? <Spinner /> : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                        Withdraw
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {canWithdraw
                        ? `Up to ${formatCurrency(selectedBalance, withdrawCurrency)} available in ${withdrawCurrency}.`
                        : `No ${withdrawCurrency} balance to withdraw.`}
                    </p>
                    {withdrawMsg.text && (
                      <Alert
                        tone={withdrawMsg.type === "error" ? "error" : "success"}
                        className="mt-4"
                        onDismiss={() => setWithdrawMsg({ type: "", text: "" })}
                      >
                        {withdrawMsg.text}
                      </Alert>
                    )}
                  </form>
                )}
              </div>
            </section>

            {/* Account */}
            <section id="account" className={cn(ui.card, "scroll-mt-24")} aria-labelledby="account-title">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <h2 id="account-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  Account
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Sign-in details and membership.</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-5 py-5 sm:px-6">
                  <Field id="profile-email" label="Email address" hint="Your email can't be changed.">
                    <div className="relative">
                      <input
                        type="email"
                        id="profile-email"
                        value={profile?.email || user.email || ""}
                        readOnly
                        aria-describedby="profile-email-hint"
                        className={cn(ui.input, "cursor-default bg-slate-50 pr-10 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300")}
                      />
                      <Lock
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                    </div>
                  </Field>
                </div>

                <ChangePasswordForm />

                <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        user.hasSubscription
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      <Crown className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.hasSubscription ? "Premium" : "Free plan"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.hasSubscription
                          ? "Unlimited messaging across all listings."
                          : "Unlock chats one at a time, or go Premium from any listing."}
                      </p>
                    </div>
                  </div>
                  {!user.hasSubscription && (
                    <Link href="/browse" className={cn(ui.btnGhost, "self-start sm:self-auto")}>
                      Browse listings
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>

                <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Sign out</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sign out of LostFound on this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                      ui.btnSecondary,
                      "self-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 sm:self-auto"
                    )}
                  >
                    {loggingOut ? <Spinner /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                    Log out
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
