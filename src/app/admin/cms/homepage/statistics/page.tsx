"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Checkbox, Field, Input, Select } from "@/components/admin/ui/Form";
import { AddButton, EmptyList, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

const COLORS = ["emerald", "blue", "purple", "orange", "slate"];

export default function StatisticsPage() {
  const { data, updateStatistics } = useCMS();
  const confirm = useConfirm();
  const [localList, setLocalList] = useState<any[]>(data.statisticsList || []);
  const { saving, publish } = useSectionPublisher("statisticsList", "/api/admin/cms/statistics", "statistics");

  const commit = (newList: any[]) => {
    setLocalList(newList);
    updateStatistics(newList);
  };

  const handleUpdate = (index: number, key: string, value: any) =>
    commit(localList.map((s, i) => (i === index ? { ...s, [key]: value } : s)));

  const handleAdd = () => commit([...localList, { label: "New stat", numberValue: "0", color: "emerald", isActive: true }]);

  const handleRemove = async (index: number) => {
    const ok = await confirm({
      title: "Remove this statistic?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    commit(localList.filter((_, i) => i !== index));
  };

  const rowErrors: Errors[] = localList.map((s) =>
    collect([
      ["numberValue", required(s.numberValue, "Value") ?? maxLen(String(s.numberValue ?? ""), 50)],
      ["label", required(s.label, "Label") ?? maxLen(s.label, 100)],
    ])
  );
  const errorCount = rowErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="statisticsList"
      icon={PieChart}
      title="Statistics"
      description="Headline numbers shown below the hero."
      errorCount={errorCount}
      saving={saving}
      onPublish={() => publish({ statistics: localList }, localList)}
    >
      {localList.length === 0 && <EmptyList>No statistics yet. Add one to show it on the homepage.</EmptyList>}
      {localList.map((stat, i) => (
        <RepeaterItem
          key={stat.id ?? `new-${i}`}
          label={stat.label?.trim() || `Statistic ${i + 1}`}
          index={i}
          count={localList.length}
          onMove={(from, to) => commit(move(localList, from, to))}
          onRemove={() => handleRemove(i)}
          invalid={Object.keys(rowErrors[i]).length > 0}
          muted={stat.isActive === false}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Value" required error={rowErrors[i].numberValue}>
              <Input value={stat.numberValue ?? ""} onChange={(e) => handleUpdate(i, "numberValue", e.target.value)} placeholder="15,000+" />
            </Field>
            <Field label="Label" required error={rowErrors[i].label}>
              <Input value={stat.label || ""} onChange={(e) => handleUpdate(i, "label", e.target.value)} placeholder="Recovered items" />
            </Field>
            <Field label="Colour">
              <Select value={stat.color || "emerald"} onChange={(e) => handleUpdate(i, "color", e.target.value)}>
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end pb-2.5">
              <Checkbox checked={stat.isActive !== false} onChange={(v) => handleUpdate(i, "isActive", v)} label="Visible on homepage" />
            </div>
          </div>
        </RepeaterItem>
      ))}
      <AddButton onClick={handleAdd}>Add statistic</AddButton>
    </SectionEditor>
  );
}
