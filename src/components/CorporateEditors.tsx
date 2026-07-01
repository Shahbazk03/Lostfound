"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Upload } from "lucide-react";
import { 
  FounderContent, defaultFounder,
  AboutContent, defaultAbout,
  CareersContent, defaultCareers,
  PressContent, defaultPress,
  ContactContent, defaultContact,
  PartnersContent, defaultPartners
} from "@/lib/content-constants";

export function FounderEditor({ data, onChange, onSave }: { data?: FounderContent, onChange: (data: FounderContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<FounderContent>(data || defaultFounder);
  const [isDragging, setIsDragging] = useState(false);

  const updateField = (field: keyof FounderContent, value: any) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
    onChange(newContent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateField("image", event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Founder Profile</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Founder Name</label>
            <input type="text" value={content.name} onChange={(e) => updateField("name", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Designation</label>
            <input type="text" value={content.designation} onChange={(e) => updateField("designation", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none text-slate-900 dark:text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Profile Image</label>
          <div className="flex items-center gap-4">
            {content.image && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 relative group">
                <img src={content.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging 
                  ? "border-emerald-500 bg-emerald-500/10" 
                  : "border-slate-200 dark:border-slate-700/50 hover:border-emerald-500 hover:bg-emerald-500/5 bg-slate-50 dark:bg-slate-900/50"
              }`}
            >
              <Upload className={`w-5 h-5 mb-1 ${isDragging ? "text-emerald-500" : "text-slate-400"}`} />
              <span className={`text-sm ${isDragging ? "text-emerald-500 font-medium" : "text-slate-500"}`}>
                {isDragging ? "Drop here!" : "Upload Image"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Details (Quote or Bio)</label>
        <textarea rows={3} value={content.details} onChange={(e) => updateField("details", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none text-slate-900 dark:text-white" />
      </div>
      
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20">
            <Save className="w-4 h-4" /> Save Founder Profile
          </button>
        </div>
      )}
    </div>
  );
}

export function AboutEditor({ data, onChange, onSave }: { data?: AboutContent, onChange: (data: AboutContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<AboutContent>(data || defaultAbout);

  const updateField = (field: keyof AboutContent, value: any) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
    onChange(newContent);
  };

  const updateValue = (index: number, key: string, value: string) => {
    const newValues = [...content.values];
    newValues[index] = { ...newValues[index], [key]: value };
    updateField("values", newValues);
  };

  const addValue = () => {
    updateField("values", [...content.values, { title: "New Value", desc: "Description here...", iconName: "Star", color: "emerald" }]);
  };

  const removeValue = (index: number) => {
    updateField("values", content.values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Title</label>
        <input type="text" value={content.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Subtitle</label>
        <textarea rows={3} value={content.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Core Values</label>
          <button type="button" onClick={addValue} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-200">
            <Plus className="w-4 h-4" /> Add Value
          </button>
        </div>
        <div className="space-y-4">
          {content.values.map((val, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex gap-3">
              <div className="flex-1 space-y-3">
                <input type="text" value={val.title} onChange={(e) => updateValue(i, "title", e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm font-semibold" placeholder="Title" />
                <textarea rows={2} value={val.desc} onChange={(e) => updateValue(i, "desc", e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm" placeholder="Description" />
              </div>
              <button onClick={() => removeValue(i)} className="text-slate-400 hover:text-red-500 transition-colors h-fit p-2"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>

      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20">
            <Save className="w-4 h-4" /> Save About Us
          </button>
        </div>
      )}
    </div>
  );
}

export function CareersEditor({ data, onChange, onSave }: { data?: CareersContent, onChange: (data: CareersContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<CareersContent>(data || defaultCareers);

  const updateField = (field: keyof CareersContent, value: any) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
    onChange(newContent);
  };

  const updateRole = (index: number, key: string, value: string) => {
    const newRoles = [...content.roles];
    newRoles[index] = { ...newRoles[index], [key]: value };
    updateField("roles", newRoles);
  };

  const addRole = () => {
    updateField("roles", [...content.roles, { title: "New Role", team: "Engineering", location: "Remote", type: "Full-time" }]);
  };

  const removeRole = (index: number) => {
    updateField("roles", content.roles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Title</label>
        <input type="text" value={content.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Subtitle</label>
        <textarea rows={2} value={content.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Open Roles</label>
          <button type="button" onClick={addRole} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>
        <div className="space-y-4">
          {content.roles.map((role, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl p-4 flex gap-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input type="text" value={role.title} onChange={(e) => updateRole(i, "title", e.target.value)} className="col-span-2 px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm font-semibold" placeholder="Job Title" />
                <input type="text" value={role.team} onChange={(e) => updateRole(i, "team", e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm" placeholder="Team" />
                <input type="text" value={role.location} onChange={(e) => updateRole(i, "location", e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm" placeholder="Location" />
              </div>
              <button onClick={() => removeRole(i)} className="text-slate-400 hover:text-red-500 transition-colors h-fit p-2"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>

      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Careers
          </button>
        </div>
      )}
    </div>
  );
}

export function PressEditor({ data, onChange, onSave }: { data?: PressContent, onChange: (data: PressContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<PressContent>(data || defaultPress);

  const updateField = (field: keyof PressContent, value: any) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
    onChange(newContent);
  };

  const updateRelease = (index: number, key: string, value: string) => {
    const newReleases = [...content.releases];
    newReleases[index] = { ...newReleases[index], [key]: value };
    updateField("releases", newReleases);
  };

  const addRelease = () => {
    updateField("releases", [{ date: "New Date", title: "New Release Title" }, ...content.releases]);
  };

  const removeRelease = (index: number) => {
    updateField("releases", content.releases.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Title</label>
        <input type="text" value={content.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Subtitle</label>
        <textarea rows={2} value={content.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">Press Releases</label>
          <button type="button" onClick={addRelease} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Release
          </button>
        </div>
        <div className="space-y-3">
          {content.releases.map((release, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={release.date} onChange={(e) => updateRelease(i, "date", e.target.value)} className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm" placeholder="Date" />
              <input type="text" value={release.title} onChange={(e) => updateRelease(i, "title", e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-lg text-sm font-semibold" placeholder="Release Title" />
              <button onClick={() => removeRelease(i)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>

      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Press Kit
          </button>
        </div>
      )}
    </div>
  );
}

// Minimal versions for Contact and Partners
export function ContactEditor({ data, onChange, onSave }: { data?: ContactContent, onChange: (data: ContactContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<ContactContent>(data || defaultContact);
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Title</label>
        <input type="text" value={content.title} onChange={(e) => { const nc = {...content, title: e.target.value}; setContent(nc); onChange(nc); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Subtitle</label>
        <textarea rows={2} value={content.subtitle} onChange={(e) => { const nc = {...content, subtitle: e.target.value}; setContent(nc); onChange(nc); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Contact
          </button>
        </div>
      )}
    </div>
  );
}

export function PartnersEditor({ data, onChange, onSave }: { data?: PartnersContent, onChange: (data: PartnersContent) => void, onSave?: () => void }) {
  const [content, setContent] = useState<PartnersContent>(data || defaultPartners);
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Title</label>
        <input type="text" value={content.title} onChange={(e) => { const nc = {...content, title: e.target.value}; setContent(nc); onChange(nc); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1.5">Hero Subtitle</label>
        <textarea rows={2} value={content.subtitle} onChange={(e) => { const nc = {...content, subtitle: e.target.value}; setContent(nc); onChange(nc); }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 dark:border-slate-700/50 rounded-xl outline-none" />
      </div>
      {onSave && (
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end">
          <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Partners
          </button>
        </div>
      )}
    </div>
  );
}
