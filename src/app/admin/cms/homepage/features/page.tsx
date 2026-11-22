"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Checkbox, Field, Input, Textarea } from "@/components/admin/ui/Form";
import { AddButton, EmptyList, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

export default function FeaturesPage() {
  const { data, updateFeatures } = useCMS();
  const confirm = useConfirm();
  const [localList, setLocalList] = useState<any[]>(data.featuresList || []);
  const { saving, publish } = useSectionPublisher("featuresList", "/api/admin/cms/features", "features");

  const commit = (newList: any[]) => {
    setLocalList(newList);
    updateFeatures(newList);
  };

  const handleUpdate = (index: number, key: string, value: any) =>
    commit(localList.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const handleAdd = () =>
    commit([...localList, { title: "New feature", description: "Describe your feature here", icon: "Star", isActive: true }]);

  const handleRemove = async (index: number) => {
    const ok = await confirm({
      title: "Remove this feature?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    commit(localList.filter((_, i) => i !== index));
  };

  const rowErrors: Errors[] = localList.map((f) =>
    collect([
      ["title", required(f.title, "Title") ?? maxLen(f.title, 255)],
      ["description", maxLen(f.description, 5000)],
    ])
  );
  const errorCount = rowErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="featuresList"
      icon={Star}
      title="Features"
      description="Why people should trust and use LostFound."
      errorCount={errorCount}
      saving={saving}
      onPublish={() => publish({ features: localList }, localList)}
    >
      {localList.length === 0 && <EmptyList>No features yet.</EmptyList>}
      {localList.map((feature, i) => (
        <RepeaterItem
          key={feature.id ?? `new-${i}`}
          label={feature.title?.trim() || `Feature ${i + 1}`}
          index={i}
          count={localList.length}
          onMove={(from, to) => commit(move(localList, from, to))}
          onRemove={() => handleRemove(i)}
          invalid={Object.keys(rowErrors[i]).length > 0}
          muted={feature.isActive === false}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required error={rowErrors[i].title}>
              <Input value={feature.title || ""} onChange={(e) => handleUpdate(i, "title", e.target.value)} placeholder="AI smart matching" />
            </Field>
            <Field label="Icon" hint="Lucide icon name, e.g. Zap">
              <Input value={feature.icon || ""} onChange={(e) => handleUpdate(i, "icon", e.target.value)} placeholder="Zap" />
            </Field>
          </div>
          <Field label="Description" error={rowErrors[i].description}>
            <Textarea
              rows={3}
              value={feature.description || ""}
              onChange={(e) => handleUpdate(i, "description", e.target.value)}
              placeholder="Describe this feature…"
            />
          </Field>
          <Checkbox checked={feature.isActive !== false} onChange={(v) => handleUpdate(i, "isActive", v)} label="Visible on homepage" />
        </RepeaterItem>
      ))}
      <AddButton onClick={handleAdd}>Add feature</AddButton>
    </SectionEditor>
  );
}
