"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, Edit3 } from "lucide-react";
import { 
  HelpCategory, 
  SafetyPrinciple, 
  ScamFlag, 
  FAQCategory, 
  BlogStory,
  defaultHelpCategories,
  defaultSafetyPrinciples,
  defaultScamFlags,
  defaultFaqs,
  defaultStories
} from "@/lib/content-constants";

export function HelpEditor({ data, onChange, onSave }: { data?: HelpCategory[], onChange: (data: HelpCategory[]) => void, onSave?: () => void }) {
  const [items, setItems] = useState<HelpCategory[]>(data?.length ? data : defaultHelpCategories);

  const updateItem = (index: number, key: keyof HelpCategory, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    setItems(newItems);
    onChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { title: "New Category", description: "Description here...", iconName: "Book", link: "/help/new" }];
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white dark:text-white">Help Center Categories</h3>
        <button type="button" onClick={addItem} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} className="font-bold bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-1/2" />
            <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
          <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Description" className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full" />
          <div className="flex gap-4">
            <input value={item.iconName} onChange={e => updateItem(i, "iconName", e.target.value)} placeholder="Lucide Icon Name" className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-1/3" />
            <input value={item.link} onChange={e => updateItem(i, "link", e.target.value)} placeholder="Link URL" className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-2/3" />
          </div>
        </div>
      ))}
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Save Help Categories
          </button>
        </div>
      )}
    </div>
  );
}

export function SafetyEditor({ principles, flags, onChange, onSave }: { principles?: SafetyPrinciple[], flags?: ScamFlag[], onChange: (p: SafetyPrinciple[], f: ScamFlag[]) => void, onSave?: () => void }) {
  const [pItems, setPItems] = useState<SafetyPrinciple[]>(principles?.length ? principles : defaultSafetyPrinciples);
  const [fItems, setFItems] = useState<ScamFlag[]>(flags?.length ? flags : defaultScamFlags);

  const updateP = (index: number, key: keyof SafetyPrinciple, value: string) => {
    const newItems = [...pItems];
    newItems[index] = { ...newItems[index], [key]: value };
    setPItems(newItems);
    onChange(newItems, fItems);
  };
  const addP = () => {
    const newItems = [...pItems, { title: "New Principle", description: "...", iconName: "Shield" }];
    setPItems(newItems);
    onChange(newItems, fItems);
  };

  const updateF = (index: number, key: keyof ScamFlag, value: string) => {
    const newItems = [...fItems];
    newItems[index] = { ...newItems[index], [key]: value };
    setFItems(newItems);
    onChange(pItems, newItems);
  };
  const addF = () => {
    const newItems = [...fItems, { title: "New Scam Flag", description: "..." }];
    setFItems(newItems);
    onChange(pItems, newItems);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white dark:text-white">Core Safety Principles</h3>
          <button type="button" onClick={addP} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200"><Plus className="w-4 h-4" /> Add Principle</button>
        </div>
        <div className="space-y-4">
          {pItems.map((item, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
              <input value={item.title} onChange={e => updateP(i, "title", e.target.value)} className="font-bold bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full" />
              <textarea value={item.description} onChange={e => updateP(i, "description", e.target.value)} className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full h-20" />
              <input value={item.iconName} onChange={e => updateP(i, "iconName", e.target.value)} placeholder="Lucide Icon" className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-1/3" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white dark:text-white">Scam Prevention Flags</h3>
          <button type="button" onClick={addF} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200"><Plus className="w-4 h-4" /> Add Flag</button>
        </div>
        <div className="space-y-4">
          {fItems.map((item, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
              <input value={item.title} onChange={e => updateF(i, "title", e.target.value)} className="font-bold bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full" />
              <textarea value={item.description} onChange={e => updateF(i, "description", e.target.value)} className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full h-16" />
            </div>
          ))}
        </div>
      </div>
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Save Safety Tips
          </button>
        </div>
      )}
    </div>
  );
}

export function FAQEditor({ data, onChange, onSave }: { data?: FAQCategory[], onChange: (data: FAQCategory[]) => void, onSave?: () => void }) {
  const [cats, setCats] = useState<FAQCategory[]>(data?.length ? data : defaultFaqs);

  const notify = (c: FAQCategory[]) => {
    setCats(c);
    onChange(c);
  };

  const addCat = () => notify([...cats, { category: "New Category", questions: [] }]);
  const updateCat = (i: number, val: string) => { const n = [...cats]; n[i].category = val; notify(n); };
  const removeCat = (i: number) => notify(cats.filter((_, idx) => idx !== i));

  const addQ = (ci: number) => { const n = [...cats]; n[ci].questions.push({ q: "New Q", a: "New A" }); notify(n); };
  const updateQ = (ci: number, qi: number, key: "q" | "a", val: string) => { const n = [...cats]; n[ci].questions[qi][key] = val; notify(n); };
  const removeQ = (ci: number, qi: number) => { const n = [...cats]; n[ci].questions.splice(qi, 1); notify(n); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white dark:text-white">FAQ Categories & Questions</h3>
        <button type="button" onClick={addCat} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200"><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      
      {cats.map((cat, ci) => (
        <div key={ci} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4">
          <div className="flex gap-4 mb-4">
            <input value={cat.category} onChange={e => updateCat(ci, e.target.value)} className="font-bold bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 flex-1" />
            <button type="button" onClick={() => removeCat(ci)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
          
          <div className="space-y-3 pl-4 border-l-2 border-emerald-200">
            {cat.questions.map((q, qi) => (
              <div key={qi} className="flex flex-col gap-2 relative">
                <input value={q.q} onChange={e => updateQ(ci, qi, "q", e.target.value)} className="font-semibold bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full" />
                <textarea value={q.a} onChange={e => updateQ(ci, qi, "a", e.target.value)} className="text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full h-16" />
                <button type="button" onClick={() => removeQ(ci, qi)} className="absolute -left-10 top-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => addQ(ci)} className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Question</button>
          </div>
        </div>
      ))}
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Save FAQs
          </button>
        </div>
      )}
    </div>
  );
}

export function BlogEditor({ data, onChange, onSave }: { data?: BlogStory[], onChange: (data: BlogStory[]) => void, onSave?: () => void }) {
  const [items, setItems] = useState<BlogStory[]>(data?.length ? data : defaultStories);

  const notify = (n: BlogStory[]) => {
    setItems(n);
    onChange(n);
  };

  const updateItem = (index: number, key: keyof BlogStory, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    notify(newItems);
  };

  const addItem = () => {
    notify([...items, { id: Date.now().toString(), title: "New Story", excerpt: "Excerpt", date: "Jan 1, 2024", readTime: "5 min", category: "Category", image: "https://images.unsplash.com/photo-1599643478524-fb66f70a00ba?q=80&w=800&auto=format&fit=crop" }]);
  };

  const removeItem = (index: number) => {
    notify(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white dark:text-white">Success Stories</h3>
        <button type="button" onClick={addItem} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200"><Plus className="w-4 h-4" /> Add Story</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} className="font-bold text-sm bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full mr-2" placeholder="Title" />
              <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-50 p-1 rounded shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea value={item.excerpt} onChange={e => updateItem(i, "excerpt", e.target.value)} className="text-xs bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1 w-full h-16" placeholder="Excerpt" />
            <div className="grid grid-cols-2 gap-2">
              <input value={item.date} onChange={e => updateItem(i, "date", e.target.value)} className="text-xs bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1" placeholder="Date" />
              <input value={item.readTime} onChange={e => updateItem(i, "readTime", e.target.value)} className="text-xs bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1" placeholder="Read Time" />
              <input value={item.category} onChange={e => updateItem(i, "category", e.target.value)} className="text-xs bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1" placeholder="Category" />
              <input value={item.image} onChange={e => updateItem(i, "image", e.target.value)} className="text-xs bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded px-2 py-1" placeholder="Image URL" />
            </div>
          </div>
        ))}
      </div>
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Save className="w-4 h-4" /> Save Success Stories
          </button>
        </div>
      )}
    </div>
  );
}
