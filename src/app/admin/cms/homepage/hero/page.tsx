"use client";

import { useState } from "react";
import { LayoutTemplate, X } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { CharCount, Field, Input, Select, Textarea } from "@/components/admin/ui/Form";
import { iconButton } from "@/components/admin/ui/styles";
import { cn } from "@/lib/utils";
import { EditorCard, InlineAdd, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { buttonLinkError, collect, maxLen, required } from "../_components/validation";

export default function HeroPage() {
  const { data, updateHero } = useCMS();
  const [localData, setLocalData] = useState<any>(data.hero || {});
  const { saving, publish } = useSectionPublisher("hero", "/api/admin/cms/hero", "hero section");

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateHero(updated); // Update live preview immediately
  };

  const badges: string[] = Array.isArray(localData.trustBadges) ? localData.trustBadges : [];
  const setBadge = (index: number, value: string) => handleChange("trustBadges", badges.map((b, i) => (i === index ? value : b)));
  const addBadge = () => handleChange("trustBadges", [...badges, "New badge"]);
  const removeBadge = (index: number) => handleChange("trustBadges", badges.filter((_, i) => i !== index));

  const errors = collect([
    ["headline", required(localData.headline, "Headline") ?? maxLen(localData.headline, 500)],
    ["subheading", required(localData.subheading, "Subheading") ?? maxLen(localData.subheading, 2000)],
    ["primaryButtonText", maxLen(localData.primaryButtonText, 50)],
    ["primaryButtonLink", buttonLinkError(localData.primaryButtonText, localData.primaryButtonLink)],
    ["secondaryButtonText", maxLen(localData.secondaryButtonText, 50)],
    ["secondaryButtonLink", buttonLinkError(localData.secondaryButtonText, localData.secondaryButtonLink)],
  ]);

  return (
    <SectionEditor
      sectionKey="hero"
      icon={LayoutTemplate}
      title="Hero"
      description="The first thing visitors see. Changes show in the preview as you type."
      errorCount={Object.keys(errors).length}
      saving={saving}
      onPublish={() => publish(localData, localData)}
    >
      <EditorCard title="Text">
        <Field label="Headline" required error={errors.headline} hint="Press Enter for a line break." aside={<CharCount value={localData.headline} max={500} />}>
          <Textarea
            rows={3}
            value={localData.headline || ""}
            onChange={(e) => handleChange("headline", e.target.value)}
            placeholder={"Find What Matters.\nReconnect With Confidence."}
          />
        </Field>
        <Field label="Highlighted words" hint="Comma separated. These words get the accent colour.">
          <Input
            value={localData.highlightedWords || ""}
            onChange={(e) => handleChange("highlightedWords", e.target.value)}
            placeholder="Reconnect, Confidence"
          />
        </Field>
        <Field label="Subheading" required error={errors.subheading}>
          <Textarea
            rows={3}
            value={localData.subheading || ""}
            onChange={(e) => handleChange("subheading", e.target.value)}
            placeholder="LostFound helps people recover lost belongings…"
          />
        </Field>
      </EditorCard>

      <EditorCard title="Buttons" description="Leave a button's text empty to hide it.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary text" error={errors.primaryButtonText}>
            <Input value={localData.primaryButtonText || ""} onChange={(e) => handleChange("primaryButtonText", e.target.value)} placeholder="Browse lost items" />
          </Field>
          <Field label="Primary link" error={errors.primaryButtonLink}>
            <Input value={localData.primaryButtonLink || ""} onChange={(e) => handleChange("primaryButtonLink", e.target.value)} placeholder="/browse" />
          </Field>
          <Field label="Secondary text" error={errors.secondaryButtonText}>
            <Input value={localData.secondaryButtonText || ""} onChange={(e) => handleChange("secondaryButtonText", e.target.value)} placeholder="Report lost item" />
          </Field>
          <Field label="Secondary link" error={errors.secondaryButtonLink}>
            <Input value={localData.secondaryButtonLink || ""} onChange={(e) => handleChange("secondaryButtonLink", e.target.value)} placeholder="/report" />
          </Field>
        </div>
      </EditorCard>

      <EditorCard title="Images">
        <ImageUpload
          label="Illustration"
          value={localData.illustrationImage || ""}
          onChange={(url) => handleChange("illustrationImage", url)}
        />
        <Field label="Illustration animation">
          <Select value={localData.illustrationAnimation || "float"} onChange={(e) => handleChange("illustrationAnimation", e.target.value)}>
            <option value="none">None</option>
            <option value="float">Float</option>
            <option value="pulse">Pulse</option>
            <option value="bounce">Bounce</option>
          </Select>
        </Field>
        <ImageUpload
          label="Background pattern (optional)"
          value={localData.backgroundImage || ""}
          onChange={(url) => handleChange("backgroundImage", url)}
        />
      </EditorCard>

      <EditorCard
        title="Trust badges"
        description="Short reassurance points under the buttons."
        action={<InlineAdd onClick={addBadge}>Add badge</InlineAdd>}
      >
        {badges.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No badges yet.</p>
        ) : (
          <ul className="space-y-2">
            {badges.map((badge, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input
                  value={badge}
                  onChange={(e) => setBadge(i, e.target.value)}
                  aria-label={`Badge ${i + 1}`}
                  aria-invalid={badge.trim() === "" || undefined}
                />
                <button
                  type="button"
                  onClick={() => removeBadge(i)}
                  className={cn(iconButton, "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
                  aria-label={`Remove badge ${i + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </EditorCard>
    </SectionEditor>
  );
}
