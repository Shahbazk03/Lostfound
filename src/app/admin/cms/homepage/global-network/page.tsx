"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Field, Input, Switch, Textarea } from "@/components/admin/ui/Form";
import { AddButton, EditorCard, EmptyList, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

export default function GlobalNetworkPage() {
  const { data, updateGlobalNetwork } = useCMS();
  const confirm = useConfirm();
  const [localData, setLocalData] = useState<any>(data.globalNetwork || { title: "", description: "", statistics: [] });
  const { saving, publish } = useSectionPublisher("globalNetwork", "/api/admin/cms/global-network", "global network");

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateGlobalNetwork(updated);
  };

  const stats: any[] = Array.isArray(localData.statistics) ? localData.statistics : [];
  const updateStat = (index: number, key: string, value: any) =>
    handleChange("statistics", stats.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  const addStat = () => handleChange("statistics", [...stats, { label: "New stat", value: "0" }]);
  const removeStat = async (index: number) => {
    const ok = await confirm({
      title: "Remove this stat?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    handleChange("statistics", stats.filter((_, i) => i !== index));
  };

  const errors = collect([
    ["title", required(localData.title, "Title") ?? maxLen(localData.title, 255)],
    ["description", maxLen(localData.description, 5000)],
  ]);
  const statErrors: Errors[] = stats.map((s) =>
    collect([
      ["label", required(s.label, "Label")],
      ["value", required(s.value === undefined || s.value === null ? "" : String(s.value), "Value")],
    ])
  );
  const errorCount = Object.keys(errors).length + statErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="globalNetwork"
      icon={Globe2}
      title="Global network"
      description="The map section showing how far the community reaches."
      errorCount={errorCount}
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
        <Field label="Title" required error={errors.title}>
          <Input value={localData.title || ""} onChange={(e) => handleChange("title", e.target.value)} placeholder="Global recovery network" />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea
            rows={4}
            value={localData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Our platform operates across borders…"
          />
        </Field>
      </EditorCard>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">Map statistics</h2>
        <div className="space-y-4">
          {stats.length === 0 && <EmptyList>No map statistics yet.</EmptyList>}
          {stats.map((stat, i) => (
            <RepeaterItem
              key={i}
              label={stat.label?.trim() || `Stat ${i + 1}`}
              index={i}
              count={stats.length}
              onMove={(from, to) => handleChange("statistics", move(stats, from, to))}
              onRemove={() => removeStat(i)}
              invalid={Object.keys(statErrors[i]).length > 0}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label" required error={statErrors[i].label}>
                  <Input value={stat.label || ""} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Active users" />
                </Field>
                <Field label="Value" required error={statErrors[i].value}>
                  <Input value={stat.value ?? ""} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="1M+" />
                </Field>
              </div>
            </RepeaterItem>
          ))}
          <AddButton onClick={addStat}>Add stat</AddButton>
        </div>
      </div>
    </SectionEditor>
  );
}
