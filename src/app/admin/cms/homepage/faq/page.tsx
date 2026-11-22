"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Field, Input, Switch, Textarea } from "@/components/admin/ui/Form";
import { AddButton, EditorCard, EmptyList, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

export default function HomepageFaqPage() {
  const { data, updateFaq } = useCMS();
  const confirm = useConfirm();
  // data.faq is loaded from the database by the layout; the fallback is only
  // for a brand-new install with no FAQ row yet.
  const [localData, setLocalData] = useState<any>(data.faq || { title: "", description: "", items: [] });
  const { saving, publish } = useSectionPublisher("faq", "/api/admin/cms/faq", "FAQ");

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateFaq(updated);
  };

  const items: any[] = Array.isArray(localData.items) ? localData.items : [];
  const updateItem = (index: number, key: string, value: any) =>
    handleChange("items", items.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  const addItem = () => handleChange("items", [...items, { question: "New question", answer: "New answer" }]);
  const removeItem = async (index: number) => {
    const ok = await confirm({
      title: "Remove this question?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    handleChange("items", items.filter((_, i) => i !== index));
  };

  const errors = collect([
    ["title", required(localData.title, "Title") ?? maxLen(localData.title, 255)],
    ["description", maxLen(localData.description, 5000)],
  ]);
  const itemErrors: Errors[] = items.map((it) =>
    collect([
      ["question", required(it.question, "Question")],
      ["answer", required(it.answer, "Answer")],
    ])
  );
  const errorCount = Object.keys(errors).length + itemErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="faq"
      icon={HelpCircle}
      title="FAQ"
      description="Answers to the questions people ask most."
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
          <Input value={localData.title || ""} onChange={(e) => handleChange("title", e.target.value)} placeholder="Frequently asked questions" />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea
            rows={3}
            value={localData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Find answers to common questions…"
          />
        </Field>
      </EditorCard>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">
          Questions <span className="font-normal text-slate-400">({items.length})</span>
        </h2>
        <div className="space-y-4">
          {items.length === 0 && <EmptyList>No questions yet. Add the first one below.</EmptyList>}
          {items.map((item, i) => (
            <RepeaterItem
              key={i}
              label={`Question ${i + 1}`}
              index={i}
              count={items.length}
              onMove={(from, to) => handleChange("items", move(items, from, to))}
              onRemove={() => removeItem(i)}
              invalid={Object.keys(itemErrors[i]).length > 0}
            >
              <Field label="Question" required error={itemErrors[i].question}>
                <Input value={item.question || ""} onChange={(e) => updateItem(i, "question", e.target.value)} />
              </Field>
              <Field label="Answer" required error={itemErrors[i].answer}>
                <Textarea rows={3} value={item.answer || ""} onChange={(e) => updateItem(i, "answer", e.target.value)} />
              </Field>
            </RepeaterItem>
          ))}
          <AddButton onClick={addItem}>Add question</AddButton>
        </div>
      </div>
    </SectionEditor>
  );
}
