"use client";

import { useCallback, useState, type ComponentType } from "react";
import { Building2, Coins, Mail, Share2 } from "lucide-react";
import { cn, countries } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useToast } from "@/components/admin/AdminFeedback";
import { ErrorState } from "@/components/admin/AdminStates";
import { Field, Input, Select, Textarea, CharCount } from "@/components/admin/ui/Form";
import { PageContainer, PageHeader, SectionCard } from "@/components/admin/ui/PageHeader";
import { SaveBar, useUnsavedChanges } from "@/components/admin/ui/SaveBar";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { focusRing } from "@/components/admin/ui/styles";

/** Raw organization_settings row from GET /api/admin/settings. */
type RawSettings = {
  organizationName?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  timezone?: string | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Form = {
  organizationName: string;
  description: string;
  timezone: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  city: string;
  country: string;
  unlockFee: string;
  subscriptionFee: string;
  facebookUrl: string;
  twitterUrl: string;
};

const DEFAULT_UNLOCK_CENTS = 100;
const DEFAULT_SUBSCRIPTION_CENTS = 499;
const MIN_FEE_CENTS = 50;
const MAX_FEE_CENTS = 99_999_999;
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "AED", "JPY", "CNY", "BRL", "MXN", "ZAR", "NGN", "KES", "PKR", "BDT"];

/**
 * Same rule as feeToCents() in src/lib/stripe.ts: a value with a decimal point
 * is in major units ("4.99"), a whole number is already cents (499).
 */
function storedFeeToCents(value: unknown, fallback: number): number {
  let amount: number;
  let major: boolean;
  if (typeof value === "number") {
    amount = value;
    major = !Number.isInteger(value);
  } else if (typeof value === "string" && value.trim() !== "") {
    amount = Number(value.trim());
    major = value.includes(".");
  } else return fallback;
  if (!Number.isFinite(amount) || amount <= 0) return fallback;
  const cents = Math.round(major ? amount * 100 : amount);
  return cents < MIN_FEE_CENTS || cents > MAX_FEE_CENTS ? fallback : cents;
}

const s = (v: unknown) => (typeof v === "string" ? v : "");

function toForm(raw: RawSettings | null): Form {
  const m = raw?.metadata ?? {};
  return {
    organizationName: s(raw?.organizationName),
    description: s(raw?.description),
    timezone: s(raw?.timezone) || "UTC",
    currency: (s(raw?.currency) || "USD").toUpperCase(),
    contactEmail: s(raw?.contactEmail),
    contactPhone: s(raw?.contactPhone),
    supportEmail: s(raw?.supportEmail),
    supportPhone: s(raw?.supportPhone),
    address: s(raw?.address),
    city: s(raw?.city),
    country: s(raw?.country),
    unlockFee: (storedFeeToCents(m.oneTimeUnlockFee, DEFAULT_UNLOCK_CENTS) / 100).toFixed(2),
    subscriptionFee: (storedFeeToCents(m.premiumSubscriptionFee, DEFAULT_SUBSCRIPTION_CENTS) / 100).toFixed(2),
    facebookUrl: s(m.facebookUrl),
    twitterUrl: s(m.twitterUrl),
  };
}

function feeError(v: string): string | null {
  const t = v.trim();
  if (!t) return "Enter a price";
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "Use a number with up to 2 decimals, e.g. 4.99";
  const cents = Math.round(Number(t) * 100);
  if (cents < MIN_FEE_CENTS) return "Minimum is 0.50 (card processor limit)";
  if (cents > MAX_FEE_CENTS) return "That amount is too large";
  return null;
}

function urlError(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? null : "Use a link that starts with https://";
  } catch {
    return "Enter a full link, e.g. https://facebook.com/yourpage";
  }
}

function validate(f: Form, timezones: string[]) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.organizationName.trim()) e.organizationName = "Organization name is required";
  else if (f.organizationName.length > 255) e.organizationName = "Keep it under 255 characters";
  if (f.description.length > 10_000) e.description = "Keep it under 10,000 characters";
  if (!/^[A-Z]{3}$/.test(f.currency)) e.currency = "Use a 3-letter currency code, e.g. USD";
  if (timezones.length && !timezones.includes(f.timezone)) e.timezone = "Pick a timezone from the list";
  if (!f.contactEmail.trim()) e.contactEmail = "Contact email is required";
  else if (!EMAIL.test(f.contactEmail.trim())) e.contactEmail = "Enter a valid email address";
  if (f.supportEmail.trim() && !EMAIL.test(f.supportEmail.trim())) e.supportEmail = "Enter a valid email address";
  if (f.contactPhone.length > 50) e.contactPhone = "Keep it under 50 characters";
  if (f.supportPhone.length > 50) e.supportPhone = "Keep it under 50 characters";
  if (f.address.length > 2000) e.address = "Keep it under 2,000 characters";
  if (f.city.length > 100) e.city = "Keep it under 100 characters";
  const unlock = feeError(f.unlockFee);
  if (unlock) e.unlockFee = unlock;
  const sub = feeError(f.subscriptionFee);
  if (sub) e.subscriptionFee = sub;
  const fb = urlError(f.facebookUrl);
  if (fb) e.facebookUrl = fb;
  const tw = urlError(f.twitterUrl);
  if (tw) e.twitterUrl = tw;
  return e;
}

function previewMoney(major: string, currency: string) {
  const n = Number(major);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

let timezoneCache: string[] | null = null;
/** IANA timezones known to this browser (UTC first); empty if the API is missing. */
function getTimezones(): string[] {
  if (timezoneCache) return timezoneCache;
  let list: string[] = [];
  try {
    list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  } catch {
    list = [];
  }
  timezoneCache = list.length && !list.includes("UTC") ? ["UTC", ...list] : list;
  return timezoneCache;
}

const SECTIONS: { id: string; title: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "general", title: "General", icon: Building2 },
  { id: "contact", title: "Contact", icon: Mail },
  { id: "fees", title: "Payments & fees", icon: Coins },
  { id: "social", title: "Social", icon: Share2 },
];

export default function SettingsPage() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [raw, setRaw] = useState<RawSettings | null>(null);
  const [baseline, setBaseline] = useState<Form>(() => toForm(null));
  const [form, setForm] = useState<Form>(() => toForm(null));
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await adminFetch<{ settings?: RawSettings | null }>("/api/admin/settings", {}, "Failed to load settings");
    const settings = data?.settings ?? null;
    const f = toForm(settings);
    setRaw(settings);
    setBaseline(f);
    setForm(f);
    setTouched({});
    setSubmitted(false);
  }, []);
  const { loading, error, reload } = useAdminLoader(load, "Failed to load settings");

  const timezones = getTimezones();
  const timezoneOptions = form.timezone && !timezones.includes(form.timezone) ? [form.timezone, ...timezones] : timezones;

  const errors = validate(form, timezoneOptions);
  const errorCount = Object.keys(errors).length;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const show = (k: keyof Form) => (submitted || touched[k] ? errors[k] : undefined);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((prev) => ({ ...prev, [k]: v }));
  const bind = (k: keyof Form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value),
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
  });

  const save = async () => {
    setSubmitted(true);
    if (errorCount > 0) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    try {
      // PUT replaces metadata as a whole, so start from what's stored to keep
      // other keys (footer text, footer groups, ...) intact.
      const metadata: Record<string, unknown> = { ...(raw?.metadata ?? {}) };
      const m = raw?.metadata ?? {};
      const feeChanged = (key: "unlockFee" | "subscriptionFee") => form[key] !== baseline[key];
      if (feeChanged("unlockFee") || m.oneTimeUnlockFee !== undefined) {
        metadata.oneTimeUnlockFee = Math.round(Number(form.unlockFee) * 100);
      }
      if (feeChanged("subscriptionFee") || m.premiumSubscriptionFee !== undefined) {
        metadata.premiumSubscriptionFee = Math.round(Number(form.subscriptionFee) * 100);
      }
      for (const key of ["facebookUrl", "twitterUrl"] as const) {
        const v = form[key].trim();
        if (v) metadata[key] = v;
        else delete metadata[key];
      }

      const body = {
        organizationName: form.organizationName.trim(),
        description: form.description,
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address,
        city: form.city.trim(),
        country: form.country,
        supportEmail: form.supportEmail.trim(),
        supportPhone: form.supportPhone.trim(),
        timezone: form.timezone,
        currency: form.currency.trim().toUpperCase(),
        metadata,
      };
      const data = await adminFetch<{ settings?: RawSettings }>(
        "/api/admin/settings",
        { method: "PUT", json: body },
        "Failed to update settings"
      );
      const saved = data?.settings ?? { ...raw, ...body };
      const f = toForm(saved);
      setRaw(saved);
      setBaseline(f);
      setForm(f);
      setTouched({});
      setSubmitted(false);
      toast.success("Settings saved");
      refreshSettings();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update settings"));
    } finally {
      setSaving(false);
    }
  };

  useUnsavedChanges(dirty, { onSave: save, guardLinks: true });

  const discard = () => {
    setForm(baseline);
    setTouched({});
    setSubmitted(false);
  };

  const currencyOptions = COMMON_CURRENCIES.includes(form.currency) || !form.currency ? COMMON_CURRENCIES : [form.currency, ...COMMON_CURRENCIES];
  const countryOptions = form.country && !countries.includes(form.country) ? [form.country, ...countries] : countries;

  return (
    <div className="flex min-h-full flex-col">
      <PageContainer className="flex-1">
        <PageHeader
          title="Settings"
          description="Your organization's identity, contact details, fees and social links. These appear across the public site."
        />

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
            <div className="hidden space-y-2 lg:block">
              {SECTIONS.map((x) => (
                <Skeleton key={x.id} className="h-9 w-full rounded-xl" />
              ))}
            </div>
            <div className="space-y-6">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-2 h-11 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[13rem_1fr] lg:items-start">
            {/* In-page nav */}
            <nav aria-label="Settings sections" className="lg:sticky lg:top-6">
              <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:px-0">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <li key={sec.id}>
                      <a
                        href={`#settings-${sec.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(`settings-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={cn(
                          "flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                          focusRing
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {sec.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <form
              className="min-w-0 space-y-6"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (dirty) save();
              }}
            >
              <SectionCard
                id="settings-general"
                className="scroll-mt-6"
                icon={<Building2 className="h-[18px] w-[18px]" />}
                title="General"
                description="How your organization is named and where it operates."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Organization name" required error={show("organizationName")} className="sm:col-span-2">
                    <Input {...bind("organizationName")} autoComplete="organization" placeholder="LostFound" />
                  </Field>
                  <Field
                    label="Description"
                    hint="A short summary of your platform."
                    error={show("description")}
                    className="sm:col-span-2"
                    aside={<CharCount value={form.description} max={10_000} />}
                  >
                    <Textarea {...bind("description")} rows={3} />
                  </Field>
                  <Field label="Timezone" error={show("timezone")} hint="Used for dates in emails and reports.">
                    {timezoneOptions.length ? (
                      <Select {...bind("timezone")}>
                        {timezoneOptions.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input {...bind("timezone")} placeholder="UTC" />
                    )}
                  </Field>
                  <Field label="Currency" error={show("currency")} hint="Used for unlock fees and subscriptions.">
                    <Select {...bind("currency")}>
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                id="settings-contact"
                className="scroll-mt-6"
                icon={<Mail className="h-[18px] w-[18px]" />}
                title="Contact"
                description="Shown in the site footer and used for replies to visitors."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Contact email" required error={show("contactEmail")}>
                    <Input type="email" {...bind("contactEmail")} autoComplete="email" placeholder="hello@example.com" />
                  </Field>
                  <Field label="Contact phone" error={show("contactPhone")}>
                    <Input type="tel" {...bind("contactPhone")} autoComplete="tel" />
                  </Field>
                  <Field label="Support email" error={show("supportEmail")} hint="Optional, if different from the contact email.">
                    <Input type="email" {...bind("supportEmail")} placeholder="support@example.com" />
                  </Field>
                  <Field label="Support phone" error={show("supportPhone")} hint="Shown in the footer when the footer has no phone.">
                    <Input type="tel" {...bind("supportPhone")} />
                  </Field>
                  <Field label="Address" error={show("address")} className="sm:col-span-2">
                    <Textarea {...bind("address")} rows={2} autoComplete="street-address" />
                  </Field>
                  <Field label="City" error={show("city")}>
                    <Input {...bind("city")} autoComplete="address-level2" />
                  </Field>
                  <Field label="Country">
                    <Select {...bind("country")}>
                      <option value="">Not set</option>
                      {countryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                id="settings-fees"
                className="scroll-mt-6"
                icon={<Coins className="h-[18px] w-[18px]" />}
                title="Payments & fees"
                description={`What users are charged, in ${form.currency || "USD"}. Changes apply to new checkouts.`}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FeeField
                    label="Chat unlock fee"
                    hint="One-time payment to contact the person who reported an item."
                    currency={form.currency}
                    error={show("unlockFee")}
                    inputProps={bind("unlockFee")}
                  />
                  <FeeField
                    label="Premium subscription"
                    hint="Monthly price of the premium plan."
                    currency={form.currency}
                    error={show("subscriptionFee")}
                    inputProps={bind("subscriptionFee")}
                    suffix="/ month"
                  />
                </div>
              </SectionCard>

              <SectionCard
                id="settings-social"
                className="scroll-mt-6"
                icon={<Share2 className="h-[18px] w-[18px]" />}
                title="Social"
                description="Used by the site footer when the Footer section in the homepage builder has no social links of its own."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Facebook" error={show("facebookUrl")}>
                    <Input type="url" inputMode="url" {...bind("facebookUrl")} placeholder="https://facebook.com/yourpage" />
                  </Field>
                  <Field label="X (Twitter)" error={show("twitterUrl")}>
                    <Input type="url" inputMode="url" {...bind("twitterUrl")} placeholder="https://x.com/yourhandle" />
                  </Field>
                </div>
              </SectionCard>
            </form>
          </div>
        )}
      </PageContainer>

      {!loading && !error && (
        <SaveBar
          dirty={dirty}
          saving={saving}
          errorCount={submitted || Object.keys(touched).length > 0 ? errorCount : 0}
          onSave={save}
          onDiscard={discard}
          saveLabel="Save settings"
          savedLabel="All settings saved"
        />
      )}
    </div>
  );
}

function FeeField({
  label,
  hint,
  currency,
  error,
  inputProps,
  suffix,
}: {
  label: string;
  hint: string;
  currency: string;
  error?: string;
  inputProps: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: () => void };
  suffix?: string;
}) {
  const preview = !error ? previewMoney(inputProps.value, currency) : "";
  return (
    <Field label={label} error={error} hint={preview ? `${hint} Charged as ${preview}${suffix ? ` ${suffix}` : ""}.` : hint}>
      <Input inputMode="decimal" {...inputProps} placeholder="0.00" className="tabular-nums" />
    </Field>
  );
}
