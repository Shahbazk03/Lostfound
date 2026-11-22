"use client";
/* eslint-disable @next/next/no-img-element -- previews are local data: URLs */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  Clock,
  Dumbbell,
  FileText,
  Gem,
  ImagePlus,
  KeyRound,
  Lock,
  MapPin,
  Package,
  PackageCheck,
  PackageSearch,
  PawPrint,
  PlusCircle,
  Shirt,
  Smartphone,
  ToyBrick,
  Upload,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { categories, cn, countries, formatCurrency } from "@/lib/utils";
import { ReportSuccess, type CreatedItem } from "@/components/items/ReportSuccess";
import { Alert } from "@/components/ui/Alert";
import { downscaleDataUrl, readFileAsDataUrl } from "@/components/ui/image";
import { Field, describedBy } from "@/components/ui/Field";
import { SignInRequired } from "@/components/ui/SignInRequired";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { badgeTone, ui } from "@/components/ui/styles";

// Mirrors the API's limits for POST /api/items.
const MAX_PHOTOS = 6;
const MIN_UNLOCK_AMOUNT = 0.5;
const MAX_UNLOCK_AMOUNT = 10000;
/** The API rejects photos longer than this (as data: URL characters). */
const MAX_PHOTO_CHARS = 1.5 * 1024 * 1024;

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD"];

const STEPS = [
  { id: 1, title: "What happened" },
  { id: 2, title: "Details" },
  { id: 3, title: "Photos & review" },
] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electronics: Smartphone,
  Jewelry: Gem,
  "Wallet / Purse": Wallet,
  Keys: KeyRound,
  Documents: FileText,
  Clothing: Shirt,
  Pets: PawPrint,
  "Bags / Luggage": Briefcase,
  "Sports Equipment": Dumbbell,
  Toys: ToyBrick,
  Other: Package,
};

type FieldName =
  | "category"
  | "title"
  | "description"
  | "dateLostFound"
  | "approximateLocation"
  | "unlockAmount"
  | "photos";
type Errors = Partial<Record<FieldName, string>>;

/** DOM id of each validated control, for focusing the first error. */
const FIELD_IDS: Record<FieldName, string> = {
  category: "report-category-0",
  title: "report-title",
  description: "report-description",
  dateLostFound: "report-date",
  approximateLocation: "report-approx-location",
  unlockAmount: "report-unlock-amount",
  photos: "report-photos",
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
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
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [created, setCreated] = useState<CreatedItem | null>(null);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [maxDate] = useState(todayIso);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  /** Guards against a double-click on "Continue" also hitting "Publish". */
  const stepJustChanged = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const resetForm = () => {
    setType("lost");
    setTitle("");
    setDescription("");
    setCategory("");
    setApproximateLocation("");
    setPreciseLocation("");
    setCity("");
    setCountry("");
    setDateLostFound("");
    setTimeframe("");
    setUnlockAmount("1.00");
    setCurrency("USD");
    setPhotos([]);
    setError("");
    setErrors({});
    setStep(1);
    setCreated(null);
    window.scrollTo({ top: 0 });
  };

  const clearError = (name: FieldName) => {
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateStep = (n: number): Errors => {
    const next: Errors = {};
    if (n === 1) {
      if (!category) next.category = "Choose the category that fits best.";
    } else if (n === 2) {
      if (!title.trim()) next.title = "Add a short title.";
      if (!description.trim()) next.description = "Describe the item so it can be recognised.";
      if (!dateLostFound) next.dateLostFound = `Pick the date you ${type === "lost" ? "lost" : "found"} it.`;
      if (!approximateLocation.trim()) next.approximateLocation = "Add the general area.";
    } else if (n === 3) {
      const value = parseFloat(unlockAmount);
      if (!Number.isFinite(value) || value < MIN_UNLOCK_AMOUNT || value > MAX_UNLOCK_AMOUNT) {
        next.unlockAmount = `Enter an amount between ${MIN_UNLOCK_AMOUNT.toFixed(2)} and ${MAX_UNLOCK_AMOUNT.toLocaleString()}.`;
      }
      if (photos.length > MAX_PHOTOS) next.photos = `You can add up to ${MAX_PHOTOS} photos.`;
    }
    return next;
  };

  const focusFirstError = (errs: Errors) => {
    const first = (Object.keys(FIELD_IDS) as FieldName[]).find((k) => errs[k]);
    if (first) requestAnimationFrame(() => document.getElementById(FIELD_IDS[first])?.focus());
  };

  const changeStep = (n: number) => {
    setStep(n);
    setError("");
    moveFocus.current = true;
    stepJustChanged.current = true;
    window.setTimeout(() => {
      stepJustChanged.current = false;
    }, 600);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      focusFirstError(errs);
      return;
    }
    changeStep(Math.min(step + 1, STEPS.length));
  };

  /** Steps before the current one can always be revisited. */
  const goToStep = (n: number) => {
    if (n >= step) return;
    setErrors({});
    changeStep(n);
  };

  const processFiles = async (files: FileList) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const remaining = MAX_PHOTOS - photos.length;
    if (images.length > remaining) {
      setErrors((prev) => ({ ...prev, photos: `You can add up to ${MAX_PHOTOS} photos.` }));
    } else {
      clearError("photos");
    }
    const accepted = images.slice(0, Math.max(0, remaining));
    if (accepted.length === 0) return;
    setProcessingPhotos(true);
    const urls = await Promise.all(
      accepted.map(async (file) => {
        // Photos over the API's size limit would be rejected, so scale those down.
        const url = await readFileAsDataUrl(file);
        return url ? downscaleDataUrl(url, { maxChars: MAX_PHOTO_CHARS }) : null;
      })
    );
    setProcessingPhotos(false);
    const added = urls.filter((u): u is string => !!u);
    setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    e.target.value = ""; // allow picking the same file again after removing it
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    clearError("photos");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length) {
      goNext();
      return;
    }
    if (stepJustChanged.current) return;
    setError("");

    if (!title || !description || !category || !approximateLocation || !dateLostFound) {
      setError("Please fill in all required fields");
      return;
    }

    const unlockValue = parseFloat(unlockAmount);
    if (
      !Number.isFinite(unlockValue) ||
      unlockValue < MIN_UNLOCK_AMOUNT ||
      unlockValue > MAX_UNLOCK_AMOUNT
    ) {
      const message = `Unlock amount must be between ${MIN_UNLOCK_AMOUNT.toFixed(2)} and ${MAX_UNLOCK_AMOUNT.toLocaleString()}.`;
      setError(message);
      setErrors((prev) => ({ ...prev, unlockAmount: message }));
      focusFirstError({ unlockAmount: message });
      return;
    }

    if (photos.length > MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
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
          unlockAmount: unlockValue,
          currency,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Stay here and show the success screen with instant matches.
        setCreated({
          id: data.item.id,
          type: data.item.type,
          title: data.item.title,
          approximateLocation: data.item.approximateLocation,
          city: data.item.city ?? null,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.error || "Failed to create listing");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950" role="status" aria-label="Loading">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          <Skeleton className="mt-8 h-10 w-full rounded-xl" />
          <Skeleton className="mt-6 h-[28rem] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInRequired
        icon={PlusCircle}
        title="Sign in to report an item"
        description="Listings are tied to an account so people can reach you safely, without seeing your email or phone number."
        next="/report"
      />
    );
  }

  if (created) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-slate-50 py-8 dark:bg-slate-950 md:py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ReportSuccess item={created} onReportAnother={resetForm} />
        </div>
      </div>
    );
  }

  const verb = type === "lost" ? "lost" : "found";
  const current = STEPS[step - 1];
  const priceValue = parseFloat(unlockAmount);
  const pricePreview =
    Number.isFinite(priceValue) && priceValue > 0 ? formatCurrency(Math.round(priceValue * 100), currency) : null;
  const inputCls = (name: FieldName) => cn(ui.input, errors[name] && ui.inputInvalid);

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10">
        <h1 className={ui.pageTitle}>Report an item</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Three quick steps. Most people finish in under two minutes.
        </p>

        {/* Progress */}
        <nav aria-label="Progress" className="mt-8">
          <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
            Step {step} of {STEPS.length} · <span className="text-slate-900 dark:text-white">{current.title}</span>
          </p>
          <ol className="flex items-center gap-2 sm:gap-3">
            {STEPS.map((s, i) => {
              const state = s.id < step ? "done" : s.id === step ? "current" : "upcoming";
              return (
                <li key={s.id} className={cn("flex min-w-0 items-center gap-2 sm:gap-3", i < STEPS.length - 1 && "flex-1")}>
                  <button
                    type="button"
                    onClick={() => goToStep(s.id)}
                    disabled={state !== "done"}
                    aria-current={state === "current" ? "step" : undefined}
                    aria-label={`Step ${s.id}: ${s.title}${state === "done" ? " (completed)" : ""}`}
                    className="group flex min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-default dark:focus-visible:ring-offset-slate-950"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                        state === "done" && "bg-emerald-600 text-white group-hover:bg-emerald-700",
                        state === "current" &&
                          "bg-white text-emerald-700 ring-2 ring-emerald-600 dark:bg-slate-900 dark:text-emerald-400 dark:ring-emerald-500",
                        state === "upcoming" &&
                          "bg-white text-slate-400 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-700"
                      )}
                    >
                      {state === "done" ? <Check className="h-4 w-4" aria-hidden="true" /> : s.id}
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-sm font-medium sm:block",
                        state === "upcoming" ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                      <span
                        className={cn(
                          "block h-full origin-left bg-emerald-600 transition-transform duration-300 motion-reduce:transition-none",
                          s.id < step ? "scale-x-100" : "scale-x-0"
                        )}
                      />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <form onSubmit={handleSubmit} noValidate className={cn(ui.card, "mt-6 overflow-hidden")}>
          <div className="p-5 sm:p-8">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-semibold tracking-tight text-slate-900 focus:outline-none dark:text-white"
            >
              {step === 1 && "What happened?"}
              {step === 2 && `Tell us about the item you ${verb}`}
              {step === 3 && "Add photos and review"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {step === 1 && "Choose whether you lost or found something, and what kind of item it is."}
              {step === 2 && "Clear details help Smart Matching connect your report with the right person."}
              {step === 3 && "Photos make a listing far easier to recognise. Check everything before publishing."}
            </p>

            {/* Step 1 */}
            {step === 1 && (
              <div className="mt-6 space-y-8">
                <fieldset>
                  <legend className={ui.label}>I have&hellip;</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          value: "lost",
                          label: "Lost something",
                          text: "Post it so anyone who finds it can reach you.",
                          Icon: PackageSearch,
                          tone: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
                          checked:
                            "has-[:checked]:border-rose-400 has-[:checked]:bg-rose-50/50 has-[:checked]:ring-rose-500/20 dark:has-[:checked]:border-rose-500/60 dark:has-[:checked]:bg-rose-500/5",
                        },
                        {
                          value: "found",
                          label: "Found something",
                          text: "Help the owner find their way back to it.",
                          Icon: PackageCheck,
                          tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
                          checked:
                            "has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50 has-[:checked]:ring-emerald-500/20 dark:has-[:checked]:border-emerald-500/60 dark:has-[:checked]:bg-emerald-500/5",
                        },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          "relative flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 ring-4 ring-transparent transition hover:border-slate-300 has-[:focus-visible]:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 sm:p-5",
                          opt.checked
                        )}
                      >
                        <input
                          type="radio"
                          name="report-type"
                          value={opt.value}
                          checked={type === opt.value}
                          onChange={() => setType(opt.value)}
                          className="peer sr-only"
                        />
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", opt.tone)}>
                          <opt.Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 pr-6">
                          <span className="block font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                          <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{opt.text}</span>
                        </span>
                        <span
                          className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-white transition peer-checked:border-transparent peer-checked:bg-slate-900 dark:border-slate-600 dark:peer-checked:bg-white dark:peer-checked:text-slate-900"
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset aria-describedby={errors.category ? "report-category-error" : undefined}>
                  <legend className={ui.label}>
                    Category<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {categories.map((cat, i) => {
                      const Icon = CATEGORY_ICONS[cat] ?? Package;
                      return (
                        <label
                          key={cat}
                          className={cn(
                            "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emerald-500/20 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:has-[:checked]:border-emerald-500/60 dark:has-[:checked]:bg-emerald-500/10 dark:has-[:checked]:text-emerald-300",
                            errors.category ? "border-red-300 dark:border-red-500/50" : "border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <input
                            type="radio"
                            name="report-category"
                            id={`report-category-${i}`}
                            value={cat}
                            checked={category === cat}
                            onChange={() => {
                              setCategory(cat);
                              clearError("category");
                            }}
                            className="sr-only"
                          />
                          <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                          <span className="min-w-0 leading-5">{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p id="report-category-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.category}
                    </p>
                  )}
                </fieldset>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="mt-6 space-y-5">
                <Field
                  id="report-title"
                  label="Title"
                  required
                  error={errors.title}
                  hint="Short and specific, e.g. “Black leather wallet” or “Golden retriever, blue collar”."
                >
                  <input
                    type="text"
                    id="report-title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearError("title");
                    }}
                    maxLength={200}
                    placeholder="e.g. Black leather wallet"
                    aria-invalid={errors.title ? true : undefined}
                    aria-describedby={describedBy("report-title", errors.title, true)}
                    className={inputCls("title")}
                  />
                </Field>

                <Field
                  id="report-description"
                  label="Description"
                  required
                  error={errors.description}
                  hint="Colour, brand, marks, contents. Tip: keep back one detail only the real owner would know."
                >
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearError("description");
                    }}
                    rows={5}
                    maxLength={5000}
                    placeholder="Describe the item in detail: colour, brand, distinguishing marks, contents…"
                    aria-invalid={errors.description ? true : undefined}
                    aria-describedby={describedBy("report-description", errors.description, true)}
                    className={cn(ui.textarea, "resize-y", errors.description && ui.inputInvalid)}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="report-date" label={`Date ${verb}`} required error={errors.dateLostFound}>
                    <div className="relative">
                      <CalendarDays
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        type="date"
                        id="report-date"
                        value={dateLostFound}
                        max={maxDate}
                        onChange={(e) => {
                          setDateLostFound(e.target.value);
                          clearError("dateLostFound");
                        }}
                        aria-invalid={errors.dateLostFound ? true : undefined}
                        aria-describedby={describedBy("report-date", errors.dateLostFound)}
                        className={cn(inputCls("dateLostFound"), "pl-10 dark:[color-scheme:dark]")}
                      />
                    </div>
                  </Field>
                  <Field id="report-timeframe" label="Time" optional>
                    <div className="relative">
                      <Clock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        id="report-timeframe"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        maxLength={100}
                        placeholder="e.g. Around 3 PM"
                        className={cn(ui.input, "pl-10")}
                      />
                    </div>
                  </Field>
                </div>

                <Field
                  id="report-approx-location"
                  label="General area"
                  required
                  error={errors.approximateLocation}
                  hint="Shown publicly. Keep it general, e.g. “Central Park, near the fountain”."
                >
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      id="report-approx-location"
                      value={approximateLocation}
                      onChange={(e) => {
                        setApproximateLocation(e.target.value);
                        clearError("approximateLocation");
                      }}
                      maxLength={255}
                      placeholder="e.g. Central Park, near the fountain"
                      aria-invalid={errors.approximateLocation ? true : undefined}
                      aria-describedby={describedBy("report-approx-location", errors.approximateLocation, true)}
                      className={cn(inputCls("approximateLocation"), "pl-10")}
                    />
                  </div>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="report-city" label="City" optional>
                    <input
                      type="text"
                      id="report-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      maxLength={100}
                      placeholder="City name"
                      autoComplete="address-level2"
                      className={ui.input}
                    />
                  </Field>
                  <Field id="report-country" label="Country" optional>
                    <select
                      id="report-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={ui.input}
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Precise location stays private</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Only people who pay your unlock price can see it. You receive the payment in your wallet.
                      </p>
                    </div>
                  </div>
                  <Field id="report-precise-location" label="Exact address or spot" optional>
                    <input
                      type="text"
                      id="report-precise-location"
                      value={preciseLocation}
                      onChange={(e) => setPreciseLocation(e.target.value)}
                      maxLength={1000}
                      placeholder="e.g. 123 Main Street, front desk"
                      className={ui.input}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="mt-6 space-y-8">
                <section aria-labelledby="photos-heading">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 id="photos-heading" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Photos <span className="font-normal text-slate-400 dark:text-slate-500">Optional</span>
                    </h3>
                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {photos.length}/{MAX_PHOTOS}
                    </span>
                  </div>

                  {photos.length < MAX_PHOTOS && (
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emerald-500/20",
                        photos.length === 0 ? "py-10" : "py-6",
                        isDragging
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl transition",
                          isDragging
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                        )}
                      >
                        {processingPhotos ? <Spinner /> : <Upload className="h-5 w-5" aria-hidden="true" />}
                      </span>
                      <span className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                        {isDragging ? "Drop to add" : (
                          <>
                            Drag photos here or <span className="text-emerald-700 underline-offset-2 dark:text-emerald-400">browse</span>
                          </>
                        )}
                      </span>
                      <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG or WebP · up to {MAX_PHOTOS} photos · large photos are resized
                      </span>
                      <input
                        id="report-photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="sr-only"
                        aria-label="Add photos"
                        aria-describedby={errors.photos ? "report-photos-error" : undefined}
                      />
                    </label>
                  )}

                  {photos.length > 0 && (
                    <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {photos.map((photo, idx) => (
                        <li
                          key={idx}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-900/5 dark:bg-slate-800"
                        >
                          <img src={photo} alt={`Photo ${idx + 1}`} decoding="async" className="h-full w-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                            className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.photos && (
                    <p id="report-photos-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.photos}
                    </p>
                  )}
                </section>

                <Field
                  id="report-unlock-amount"
                  label="Unlock price for the precise location"
                  error={errors.unlockAmount}
                  hint={
                    preciseLocation
                      ? "Credited to your wallet each time someone unlocks the precise location."
                      : "You haven't added a precise location, so you can keep the default."
                  }
                >
                  <div
                    className={cn(
                      "flex h-11 max-w-xs items-center overflow-hidden rounded-xl border bg-white shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:bg-slate-900",
                      errors.unlockAmount
                        ? "border-red-400 dark:border-red-500/60"
                        : "border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={MIN_UNLOCK_AMOUNT}
                      max={MAX_UNLOCK_AMOUNT}
                      id="report-unlock-amount"
                      value={unlockAmount}
                      onChange={(e) => {
                        setUnlockAmount(e.target.value);
                        clearError("unlockAmount");
                      }}
                      placeholder="1.00"
                      aria-invalid={errors.unlockAmount ? true : undefined}
                      aria-describedby={describedBy("report-unlock-amount", errors.unlockAmount, true)}
                      className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm font-medium tabular-nums text-slate-900 outline-none dark:text-white"
                    />
                    <span className="h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      aria-label="Currency"
                      className="h-full bg-transparent pl-3 pr-2 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                <section aria-labelledby="review-heading" className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <h3
                    id="review-heading"
                    className="border-b border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white sm:px-5"
                  >
                    Review your listing
                  </h3>
                  <dl className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800">
                    <ReviewRow label="Type" onEdit={() => goToStep(1)}>
                      <span className={cn(ui.badge, type === "lost" ? badgeTone.lost : badgeTone.found)}>
                        {type === "lost" ? "Lost" : "Found"}
                      </span>
                      <span className="ml-2">{category}</span>
                    </ReviewRow>
                    <ReviewRow label="Title" onEdit={() => goToStep(2)}>
                      <span className="font-medium">{title}</span>
                      <span className="mt-1 line-clamp-2 block text-slate-500 dark:text-slate-400">{description}</span>
                    </ReviewRow>
                    <ReviewRow label="When" onEdit={() => goToStep(2)}>
                      {dateLostFound
                        ? new Date(`${dateLostFound}T00:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                      {timeframe && <span className="text-slate-500 dark:text-slate-400"> · {timeframe}</span>}
                    </ReviewRow>
                    <ReviewRow label="Where" onEdit={() => goToStep(2)}>
                      {[approximateLocation, city, country].filter(Boolean).join(", ")}
                      <span className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        {preciseLocation
                          ? `Precise location added, unlocks for ${pricePreview ?? "the price above"}`
                          : "No precise location"}
                      </span>
                    </ReviewRow>
                    <ReviewRow label="Photos">
                      {photos.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <ImagePlus className="h-4 w-4" aria-hidden="true" />
                          No photos yet
                        </span>
                      ) : (
                        `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`
                      )}
                    </ReviewRow>
                  </dl>
                </section>

                {error && <Alert tone="error">{error}</Alert>}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 sm:px-8">
            {step > 1 ? (
              <button type="button" onClick={() => goToStep(step - 1)} className={ui.btnSecondary}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length ? (
              <button type="submit" className={ui.btnPrimary}>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" disabled={loading || processingPhotos} className={ui.btnPrimary}>
                {loading ? (
                  <>
                    <Spinner />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Publish listing
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-4 py-3 sm:px-5">
      <dt className="w-16 shrink-0 pt-0.5 text-slate-500 dark:text-slate-400 sm:w-20">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-slate-900 dark:text-white">{children}</dd>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="-my-1 shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
        >
          Edit<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      )}
    </div>
  );
}
