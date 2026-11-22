"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { useConfirm } from "@/components/admin/AdminFeedback";
import { Checkbox, Field, Input } from "@/components/admin/ui/Form";
import { AddButton, EmptyList, RepeaterItem, SectionEditor, useSectionPublisher } from "../_components/SectionEditor";
import { collect, maxLen, move, required, type Errors } from "../_components/validation";

export default function CategoriesPage() {
  const { data, updateCategories } = useCMS();
  const confirm = useConfirm();
  const [localList, setLocalList] = useState<any[]>(data.categoriesList || []);
  const { saving, publish } = useSectionPublisher("categoriesList", "/api/admin/cms/categories", "categories");

  const commit = (newList: any[]) => {
    setLocalList(newList);
    updateCategories(newList);
  };

  const handleUpdate = (index: number, key: string, value: any) =>
    commit(localList.map((c, i) => (i === index ? { ...c, [key]: value } : c)));

  const handleAdd = () => commit([...localList, { name: "New category", icon: "Package", isActive: true }]);

  const handleRemove = async (index: number) => {
    const ok = await confirm({
      title: "Remove this category?",
      message: "It will be removed from the homepage when you publish.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    commit(localList.filter((_, i) => i !== index));
  };

  const rowErrors: Errors[] = localList.map((c) =>
    collect([
      ["name", required(c.name, "Name") ?? maxLen(c.name, 100)],
      ["icon", maxLen(c.icon, 200)],
    ])
  );
  const errorCount = rowErrors.reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="categoriesList"
      icon={LayoutGrid}
      title="Categories"
      description="The categories visitors can jump into from the homepage."
      errorCount={errorCount}
      saving={saving}
      onPublish={() => publish({ categories: localList }, localList)}
    >
      {localList.length === 0 && <EmptyList>No categories yet.</EmptyList>}
      {localList.map((cat, i) => (
        <RepeaterItem
          key={cat.id ?? `new-${i}`}
          label={cat.name?.trim() || `Category ${i + 1}`}
          index={i}
          count={localList.length}
          onMove={(from, to) => commit(move(localList, from, to))}
          onRemove={() => handleRemove(i)}
          invalid={Object.keys(rowErrors[i]).length > 0}
          muted={cat.isActive === false}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={rowErrors[i].name}>
              <Input value={cat.name || ""} onChange={(e) => handleUpdate(i, "name", e.target.value)} placeholder="Phones" />
            </Field>
            <Field
              label="Icon"
              error={rowErrors[i].icon}
              hint={
                <>
                  A{" "}
                  <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
                    Lucide icon
                  </a>{" "}
                  name, e.g. Smartphone
                </>
              }
            >
              <Input value={cat.icon || ""} onChange={(e) => handleUpdate(i, "icon", e.target.value)} placeholder="Smartphone" />
            </Field>
          </div>
          <Checkbox checked={cat.isActive !== false} onChange={(v) => handleUpdate(i, "isActive", v)} label="Visible on homepage" />
        </RepeaterItem>
      ))}
      <AddButton onClick={handleAdd}>Add category</AddButton>
    </SectionEditor>
  );
}
