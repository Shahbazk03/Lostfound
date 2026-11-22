"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Checkbox, Field, Input } from "@/components/admin/ui/Form";
import { iconButton } from "@/components/admin/ui/styles";
import { cn, formatCurrency } from "@/lib/utils";
import { AddButton, EmptyList, InlineAdd, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

const MAX_PRICE = 100_000_000; // cents, same cap as the API

function priceError(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return "Enter 0 or more";
  if (!Number.isInteger(n)) return "Whole cents only (e.g. 499 for $4.99)";
  if (n > MAX_PRICE) return "That price is too high";
  return null;
}

function money(cents: unknown) {
  const n = Number(cents);
  return Number.isFinite(n) && n >= 0 ? formatCurrency(Math.round(n), "USD") : "—";
}

export default function PremiumPricingPage() {
  const { data, updatePricing } = useCMS();
  const confirm = useConfirm();
  const [localList, setLocalList] = useState<any[]>(data.pricingPlansList || []);
  const { saving, publish } = useSectionPublisher("pricingPlansList", "/api/admin/cms/pricing", "pricing plans");

  const commit = (newList: any[]) => {
    setLocalList(newList);
    updatePricing(newList);
  };

  const handleUpdate = (index: number, key: string, value: any) =>
    commit(localList.map((p, i) => (i === index ? { ...p, [key]: value } : p)));

  const handleAdd = () =>
    commit([
      ...localList,
      { name: "New plan", description: "Describe plan", monthlyPrice: 0, yearlyPrice: 0, benefits: ["Benefit 1"], isPopular: false, isActive: true },
    ]);

  const handleRemove = async (index: number) => {
    const ok = await confirm({
      title: "Remove this pricing plan?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    commit(localList.filter((_, i) => i !== index));
  };

  const benefitsOf = (plan: any): string[] => (Array.isArray(plan.benefits) ? plan.benefits : []);
  const setBenefits = (planIndex: number, benefits: string[]) => handleUpdate(planIndex, "benefits", benefits);

  /** Number inputs: keep what was typed while editing ("" stays ""), store a number otherwise. */
  const parsePrice = (raw: string) => (raw === "" ? "" : Number(raw));

  const rowErrors: Errors[] = localList.map((p) =>
    collect([
      ["name", required(p.name, "Plan name") ?? maxLen(p.name, 100)],
      ["description", maxLen(p.description, 2000)],
      ["monthlyPrice", p.monthlyPrice === "" ? "Enter a price (0 for free)" : priceError(p.monthlyPrice ?? 0)],
      ["yearlyPrice", p.yearlyPrice === "" ? "Enter a price (0 for free)" : priceError(p.yearlyPrice ?? 0)],
      ["benefits", benefitsOf(p).some((b) => b.length > 500) ? "Keep each benefit under 500 characters" : null],
    ])
  );
  const errorCount = rowErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="pricingPlansList"
      icon={CreditCard}
      title="Premium plans"
      description="Subscription plans shown in the pricing section. Prices are in cents."
      errorCount={errorCount}
      saving={saving}
      onPublish={() => publish({ pricing: localList }, localList)}
    >
      {localList.length === 0 && <EmptyList>No plans yet.</EmptyList>}
      {localList.map((plan, i) => {
        const benefits = benefitsOf(plan);
        return (
          <RepeaterItem
            key={plan.id ?? `new-${i}`}
            label={plan.name?.trim() || `Plan ${i + 1}`}
            index={i}
            count={localList.length}
            onMove={(from, to) => commit(move(localList, from, to))}
            onRemove={() => handleRemove(i)}
            invalid={Object.keys(rowErrors[i]).length > 0}
            muted={plan.isActive === false}
          >
            <Field label="Plan name" required error={rowErrors[i].name}>
              <Input value={plan.name || ""} onChange={(e) => handleUpdate(i, "name", e.target.value)} placeholder="Premium" />
            </Field>
            <Field label="Description" error={rowErrors[i].description}>
              <Input value={plan.description || ""} onChange={(e) => handleUpdate(i, "description", e.target.value)} placeholder="For people who want results fast" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Monthly price (cents)"
                error={rowErrors[i].monthlyPrice}
                hint={`Shown as ${money(plan.monthlyPrice ?? 0)} / month`}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={plan.monthlyPrice ?? 0}
                  onChange={(e) => handleUpdate(i, "monthlyPrice", parsePrice(e.target.value))}
                />
              </Field>
              <Field
                label="Yearly price (cents)"
                error={rowErrors[i].yearlyPrice}
                hint={`Shown as ${money(plan.yearlyPrice ?? 0)} / year`}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={plan.yearlyPrice ?? 0}
                  onChange={(e) => handleUpdate(i, "yearlyPrice", parsePrice(e.target.value))}
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Benefits</span>
                <InlineAdd onClick={() => setBenefits(i, [...benefits, "New benefit"])}>Add benefit</InlineAdd>
              </div>
              {benefits.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No benefits listed.</p>
              ) : (
                <ul className="space-y-2">
                  {benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => setBenefits(i, benefits.map((b, k) => (k === j ? e.target.value : b)))}
                        aria-label={`Benefit ${j + 1}`}
                        aria-invalid={benefit.length > 500 || undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setBenefits(i, benefits.filter((_, k) => k !== j))}
                        className={cn(iconButton, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
                        aria-label={`Remove benefit ${j + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {rowErrors[i].benefits && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{rowErrors[i].benefits}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Checkbox checked={plan.isPopular === true} onChange={(v) => handleUpdate(i, "isPopular", v)} label="Highlight as “Popular”" />
              <Checkbox checked={plan.isActive !== false} onChange={(v) => handleUpdate(i, "isActive", v)} label="Visible on homepage" />
            </div>
          </RepeaterItem>
        );
      })}
      <AddButton onClick={handleAdd}>Add pricing plan</AddButton>
    </SectionEditor>
  );
}
