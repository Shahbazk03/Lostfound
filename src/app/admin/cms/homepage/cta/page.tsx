"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { CharCount, Field, Input, Switch, Textarea } from "@/components/admin/ui/Form";
import { EditorCard, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { buttonLinkError, collect, maxLen, required } from "../_components/validation";

export default function HomepageCtaPage() {
  const { data, updateCta } = useCMS();
  // data.cta is loaded from the database by the layout; the defaults are only
  // for a brand-new install with no CTA row yet.
  const [localData, setLocalData] = useState<any>(
    data.cta || {
      headline: "Ready to Find What You've Lost?",
      subheading: "",
      primaryButtonText: "Browse Items",
      primaryButtonLink: "/browse",
      secondaryButtonText: "Report Item",
      secondaryButtonLink: "/report",
      isActive: true,
    }
  );
  const { saving, publish } = useSectionPublisher("cta", "/api/admin/cms/cta", "call to action");

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateCta(updated);
  };

  const errors = collect([
    ["headline", required(localData.headline, "Headline") ?? maxLen(localData.headline, 255)],
    ["subheading", maxLen(localData.subheading, 2000)],
    ["primaryButtonText", maxLen(localData.primaryButtonText, 50)],
    ["primaryButtonLink", buttonLinkError(localData.primaryButtonText, localData.primaryButtonLink)],
    ["secondaryButtonText", maxLen(localData.secondaryButtonText, 50)],
    ["secondaryButtonLink", buttonLinkError(localData.secondaryButtonText, localData.secondaryButtonLink)],
  ]);

  return (
    <SectionEditor
      sectionKey="cta"
      icon={Megaphone}
      title="Call to action"
      description="The closing banner that nudges visitors to act."
      errorCount={Object.keys(errors).length}
      saving={saving}
      onPublish={() => publish(localData, localData)}
    >
      <EditorCard>
        <Switch
          checked={localData.isActive !== false}
          onChange={(v) => handleChange("isActive", v)}
          label="Show this section"
          description="Hidden sections stay saved but don't appear on the homepage."
        />
        <Field label="Headline" required error={errors.headline} aside={<CharCount value={localData.headline} max={255} />}>
          <Input value={localData.headline || ""} onChange={(e) => handleChange("headline", e.target.value)} placeholder="Ready to find what you've lost?" />
        </Field>
        <Field label="Subheading" error={errors.subheading}>
          <Textarea
            rows={2}
            value={localData.subheading || ""}
            onChange={(e) => handleChange("subheading", e.target.value)}
            placeholder="Join thousands of people…"
          />
        </Field>
      </EditorCard>

      <EditorCard title="Primary button" description="Leave the text empty to hide the button.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Text" error={errors.primaryButtonText}>
            <Input value={localData.primaryButtonText || ""} onChange={(e) => handleChange("primaryButtonText", e.target.value)} placeholder="Browse items" />
          </Field>
          <Field label="Link" error={errors.primaryButtonLink}>
            <Input value={localData.primaryButtonLink || ""} onChange={(e) => handleChange("primaryButtonLink", e.target.value)} placeholder="/browse" />
          </Field>
        </div>
      </EditorCard>

      <EditorCard title="Secondary button" description="Leave the text empty to hide the button.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Text" error={errors.secondaryButtonText}>
            <Input value={localData.secondaryButtonText || ""} onChange={(e) => handleChange("secondaryButtonText", e.target.value)} placeholder="Report item" />
          </Field>
          <Field label="Link" error={errors.secondaryButtonLink}>
            <Input value={localData.secondaryButtonLink || ""} onChange={(e) => handleChange("secondaryButtonLink", e.target.value)} placeholder="/report" />
          </Field>
        </div>
      </EditorCard>
    </SectionEditor>
  );
}
